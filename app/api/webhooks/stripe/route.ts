import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Check for duplicate events (idempotency)
    const existingEvent = await prisma.analyticsEvent.findFirst({
      where: {
        type: 'stripe_webhook',
        payload: {
          path: ['eventId'],
          equals: event.id,
        },
      },
    })

    if (existingEvent) {
      console.log(`Duplicate webhook event received: ${event.id}`)
      return NextResponse.json({ received: true })
    }

    // Process the event
    const result = await processStripeEvent(event)

    // Track webhook processing
    await prisma.analyticsEvent.create({
      data: {
        type: 'stripe_webhook',
        payload: {
          eventId: event.id,
          eventType: event.type,
          processed: result.success,
          timestamp: new Date().toISOString(),
        },
      },
    })

    if (result.success) {
      return NextResponse.json({ received: true })
    } else {
      console.error('Webhook processing failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Webhook processing failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processStripeEvent(event: Stripe.Event): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)

      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)

      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)

      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event.data.object as Stripe.Subscription)

      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)

      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)

      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)

      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)

      default:
        console.log(`Unhandled event type: ${event.type}`)
        return { success: true }
    }
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<{ success: boolean; error?: string }> {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId

  if (!userId || !planId) {
    return { success: false, error: 'Missing metadata' }
  }

  // If this is a subscription checkout, the subscription will be created
  // and handled by the subscription.created event
  if (session.mode === 'subscription' && session.subscription) {
    // Track successful checkout
    await prisma.analyticsEvent.create({
      data: {
        userId,
        type: 'checkout_completed',
        payload: {
          sessionId: session.id,
          planId,
          subscriptionId: session.subscription,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return { success: true }
  }

  // Handle one-time payments if any
  return { success: true }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<{ success: boolean; error?: string }> {
  const customerId = subscription.customer as string
  const userId = subscription.metadata?.userId
  const planId = subscription.metadata?.planId

  if (!userId || !planId) {
    return { success: false, error: 'Missing subscription metadata' }
  }

  // Create subscription record in database
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      plan: planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  // Generate VIP tokens for new subscription
  await generateVipTokensForSubscription(userId, planId, subscription.id)

  // Track subscription creation
  await prisma.analyticsEvent.create({
    data: {
      userId,
      type: 'subscription_created',
      payload: {
        subscriptionId: subscription.id,
        planId,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        timestamp: new Date().toISOString(),
      },
    },
  })

  return { success: true }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<{ success: boolean; error?: string }> {
  // Update subscription record
  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
    },
  })

  return { success: true }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{ success: boolean; error?: string }> {
  // Update subscription record
  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'canceled',
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
      updatedAt: new Date(),
    },
  })

  return { success: true }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<{ success: boolean; error?: string }> {
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    })

    if (subscription) {
      // Track successful payment
      await prisma.analyticsEvent.create({
        data: {
          userId: subscription.userId,
          type: 'payment_succeeded',
          payload: {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            timestamp: new Date().toISOString(),
          },
        },
      })

      // Generate additional VIP tokens for renewal
      if (invoice.billing_reason === 'subscription_cycle') {
        await generateVipTokensForSubscription(
          subscription.userId,
          subscription.plan,
          invoice.subscription as string,
          true // is renewal
        )
      }
    }
  }

  return { success: true }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<{ success: boolean; error?: string }> {
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    })

    if (subscription) {
      // Track failed payment
      await prisma.analyticsEvent.create({
        data: {
          userId: subscription.userId,
          type: 'payment_failed',
          payload: {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_due,
            currency: invoice.currency,
            attemptCount: invoice.attempt_count,
            timestamp: new Date().toISOString(),
          },
        },
      })
    }
  }

  return { success: true }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; error?: string }> {
  // Handle one-time payments if needed
  return { success: true }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; error?: string }> {
  // Handle failed one-time payments if needed
  return { success: true }
}

async function generateVipTokensForSubscription(
  userId: string,
  planId: string,
  subscriptionId: string,
  isRenewal: boolean = false
): Promise<void> {
  try {
    // Generate different token quantities based on plan
    let tokenQuantity = 1
    let tokenType = 'general'

    switch (planId) {
      case 'monthly':
        tokenQuantity = 5
        break
      case 'yearly':
        tokenQuantity = 50
        break
      case 'trial':
        tokenQuantity = 2
        tokenType = 'trial'
        break
    }

    const batchId = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 365) // Tokens expire in 1 year

    // Create tokens
    const tokens = Array.from({ length: tokenQuantity }, () => ({
      token: uuidv4(),
      userId,
      type: tokenType,
      quantity: 1,
      expiresAt,
      batchId,
      metadata: {
        source: 'subscription',
        planId,
        subscriptionId,
        isRenewal,
      },
    }))

    await prisma.vIPToken.createMany({
      data: tokens,
    })

    // Track token generation
    await prisma.analyticsEvent.create({
      data: {
        userId,
        type: 'vip_tokens_generated',
        payload: {
          quantity: tokenQuantity,
          type: tokenType,
          planId,
          subscriptionId,
          batchId,
          isRenewal,
          expiresAt,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // TODO: Send email notification to user about new VIP tokens
    // This would be handled by a background job

    console.log(`Generated ${tokenQuantity} VIP tokens for user ${userId} (${planId} subscription)`)
  } catch (error) {
    console.error('Failed to generate VIP tokens:', error)
    throw error
  }
}