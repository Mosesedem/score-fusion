// import { NextRequest, NextResponse } from 'next/server'
// import { z } from 'zod'
// import { prisma } from '@/lib/db'
// import { getAuthenticatedUser } from '@/lib/auth'
// import { rateLimit } from '@/lib/redis'
// import Stripe from 'stripe'

// // Initialize Stripe
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-06-20',
// })

// // Define subscription plans
// const SUBSCRIPTION_PLANS = {
//   monthly: {
//     name: 'Monthly VIP',
//     priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
//     amount: 999, // $9.99 in cents
//     currency: 'usd',
//     interval: 'month',
//   },
//   yearly: {
//     name: 'Yearly VIP',
//     priceId: process.env.STRIPE_YEARLY_PRICE_ID,
//     amount: 9999, // $99.99 in cents
//     currency: 'usd',
//     interval: 'year',
//   },
//   trial: {
//     name: '7-Day Trial',
//     priceId: process.env.STRIPE_TRIAL_PRICE_ID,
//     amount: 0, // Free trial
//     currency: 'usd',
//     interval: 'week',
//     trialPeriodDays: 7,
//   },
// } as const

// // Validation schema
// const checkoutSchema = z.object({
//   planId: z.enum(['monthly', 'yearly', 'trial'], {
//     errorMap: () => ({ message: 'Invalid subscription plan' }),
//   }),
//   successUrl: z.string().url('Invalid success URL'),
//   cancelUrl: z.string().url('Invalid cancel URL'),
//   customerEmail: z.string().email('Invalid email').optional(),
//   metadata: z.record(z.string()).optional(),
// })

// export async function POST(request: NextRequest) {
//   try {
//     // Rate limiting
//     const ip = request.ip || 'unknown'
//     const rateLimitResult = await rateLimit.check(`checkout:ip:${ip}`, 10, 300000) // 10 per 5 min

//     if (!rateLimitResult.allowed) {
//       return NextResponse.json(
//         { success: false, error: 'Too many checkout attempts. Please try again later.' },
//         { status: 429 }
//       )
//     }

//     // Get authenticated user
//     const auth = await getAuthenticatedUser(request)

//     if (!auth.user || auth.user.guest) {
//       return NextResponse.json(
//         { success: false, error: 'Authentication required' },
//         { status: 401 }
//       )
//     }

//     const body = await request.json()

//     // Validate input
//     const validatedData = checkoutSchema.parse(body)

//     const plan = SUBSCRIPTION_PLANS[validatedData.planId]
//     if (!plan.priceId) {
//       return NextResponse.json(
//         { success: false, error: 'Selected plan is not available' },
//         { status: 400 }
//       )
//     }

//     // Check if user already has an active subscription
//     const existingSubscription = await prisma.subscription.findFirst({
//       where: {
//         userId: auth.user.id,
//         status: 'active',
//         currentPeriodEnd: { gte: new Date() },
//       },
//     })

//     if (existingSubscription) {
//       return NextResponse.json(
//         { success: false, error: 'You already have an active subscription' },
//         { status: 409 }
//       )
//     }

//     // Get or create Stripe customer
//     let customerId: string

//     // Check if user already has a Stripe customer ID
//     const existingCustomer = await prisma.subscription.findFirst({
//       where: { userId: auth.user.id },
//       select: { stripeCustomerId: true },
//     })

//     if (existingCustomer?.stripeCustomerId) {
//       customerId = existingCustomer.stripeCustomerId
//     } else {
//       // Create new customer
//       const customer = await stripe.customers.create({
//         email: validatedData.customerEmail || auth.user.email || undefined,
//         name: auth.user.displayName || undefined,
//         metadata: {
//           userId: auth.user.id,
//           source: 'betting_prediction_app',
//         },
//       })
//       customerId = customer.id
//     }

//     // Create checkout session
//     const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
//       customer: customerId,
//       billing_address_collection: 'required',
//       payment_method_collection: 'if_required',
//       line_items: [
//         {
//           price: plan.priceId,
//           quantity: 1,
//         },
//       ],
//       mode: 'subscription',
//       success_url: validatedData.successUrl,
//       cancel_url: validatedData.cancelUrl,
//       metadata: {
//         userId: auth.user.id,
//         planId: validatedData.planId,
//         ...validatedData.metadata,
//       },
//       subscription_data: plan.trialPeriodDays
//         ? {
//             trial_period_days: plan.trialPeriodDays,
//             metadata: {
//               userId: auth.user.id,
//               planId: validatedData.planId,
//             },
//           }
//         : {
//             metadata: {
//               userId: auth.user.id,
//               planId: validatedData.planId,
//             },
//           },
//       customer_update: {
//         address: 'auto',
//         name: 'auto',
//       },
//       allow_promotion_codes: true,
//       client_reference_id: auth.user.id,
//     }

//     const session = await stripe.checkout.sessions.create(checkoutSessionParams)

//     // Track checkout initiation
//     try {
//       await prisma.analyticsEvent.create({
//         data: {
//           userId: auth.user.id,
//           type: 'checkout_initiated',
//           payload: {
//             planId: validatedData.planId,
//             sessionId: session.id,
//             amount: plan.amount,
//             currency: plan.currency,
//             timestamp: new Date().toISOString(),
//           },
//           ipAddress: ip,
//           userAgent: request.headers.get('user-agent') || undefined,
//         },
//       })
//     } catch (error) {
//       console.error('Failed to track checkout analytics:', error)
//     }

//     return NextResponse.json({
//       success: true,
//       data: {
//         sessionId: session.id,
//         checkoutUrl: session.url,
//         plan: {
//           id: validatedData.planId,
//           name: plan.name,
//           amount: plan.amount,
//           currency: plan.currency,
//           interval: plan.interval,
//         },
//       },
//     })

//   } catch (error) {
//     console.error('Stripe checkout error:', error)

//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { success: false, error: error.errors[0].message },
//         { status: 400 }
//       )
//     }

//     if (error instanceof Stripe.errors.StripeError) {
//       return NextResponse.json(
//         { success: false, error: 'Payment service error' },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json(
//       { success: false, error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

// // GET endpoint to retrieve subscription plans
// export async function GET() {
//   try {
//     // Get prices from Stripe to ensure they're up to date
//     const priceIds = Object.values(SUBSCRIPTION_PLANS)
//       .map(plan => plan.priceId)
//       .filter(Boolean) as string[]

//     let prices: Stripe.Price[] = []

//     if (priceIds.length > 0) {
//       prices = await stripe.prices.list({
//         ids: priceIds,
//         active: true,
//       })
//     }

//     const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
//       const price = prices.data.find(p => p.id === plan.priceId)

//       return {
//         id: key,
//         name: plan.name,
//         amount: price?.unit_amount || plan.amount,
//         currency: price?.currency || plan.currency,
//         interval: price?.recurring?.interval || plan.interval,
//         trialPeriodDays: price?.recurring?.trial_period_days || plan.trialPeriodDays,
//         priceId: plan.priceId,
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       data: { plans },
//     })

//   } catch (error) {
//     console.error('Get subscription plans error:', error)

//     // Return static plans if Stripe is unavailable
//     const staticPlans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
//       id: key,
//       name: plan.name,
//       amount: plan.amount,
//       currency: plan.currency,
//       interval: plan.interval,
//       trialPeriodDays: plan.trialPeriodDays,
//       priceId: plan.priceId,
//     }))

//     return NextResponse.json({
//       success: true,
//       data: { plans: staticPlans },
//       warning: 'Prices may not be up to date',
//     })
//   }
// }

import { NextResponse } from "next/server";

// Server-Sent Events endpoint for real-time analytics
export async function GET() {
  // TODO: Verify admin auth

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      const send = (data: Record<string, unknown>) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      send({
        type: "connected",
        ts: Date.now(),
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        send({
          type: "heartbeat",
          ts: Date.now(),
        });
      }, 30000);

      // Mock analytics events (in production, subscribe to Redis pub/sub)
      const analyticsInterval = setInterval(() => {
        send({
          type: "analytics",
          data: {
            activeUsers: Math.floor(Math.random() * 100),
            newSignups: Math.floor(Math.random() * 10),
            activeTips: Math.floor(Math.random() * 50),
            revenue: Math.floor(Math.random() * 1000),
          },
          ts: Date.now(),
        });
      }, 5000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        clearInterval(analyticsInterval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
