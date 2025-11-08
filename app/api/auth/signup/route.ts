import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/redis'

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters long'),
  country: z.string().optional(),
  dob: z.string().optional().transform((val) => {
    if (!val) return undefined
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date of birth')
    }
    return date
  }),
  referralCode: z.string().optional(),
  consents: z.object({
    analytics: z.boolean().default(true),
    marketing: z.boolean().default(false),
    essential: z.boolean().default(true),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.ip || 'unknown'
    const rateLimitResult = await rateLimit.check(`signup:ip:${ip}`, 10, 900000) // 10 per 15 min

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    // Age verification
    if (validatedData.dob) {
      const ageMs = Date.now() - validatedData.dob.getTime()
      const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25)
      if (ageYears < 18) {
        return NextResponse.json(
          { success: false, error: 'You must be at least 18 years old to register' },
          { status: 400 }
        )
      }
    }

    // Create user
    const result = await AuthService.signup({
      email: validatedData.email,
      password: validatedData.password,
      displayName: validatedData.displayName,
      country: validatedData.country,
      dob: validatedData.dob,
      consents: validatedData.consents,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('already') ? 400 : 500 }
      )
    }

    // Track signup analytics
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: result.user?.id,
          type: 'signup',
          payload: {
            email: validatedData.email,
            country: validatedData.country,
            consents: validatedData.consents,
            timestamp: new Date().toISOString(),
          },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (error) {
      console.error('Failed to track signup analytics:', error)
    }

    // Set HTTP-only cookie with the token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      sessionId: result.sessionId,
    })

    if (result.token) {
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
    }

    return response

  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}