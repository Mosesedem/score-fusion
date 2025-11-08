import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (optional for logout)
    const auth = await getAuthenticatedUser(request)

    // Get session ID from token or cookie
    let sessionId = null
    if (auth.session) {
      sessionId = auth.session.sessionId
    }

    if (sessionId) {
      // Logout from session store
      const logoutResult = await AuthService.logout(sessionId)

      if (!logoutResult.success) {
        console.error('Logout error:', logoutResult.error)
      }
    }

    // Track logout analytics if user was authenticated
    if (auth.user && !auth.user.guest) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            userId: auth.user.id,
            type: 'logout',
            payload: {
              timestamp: new Date().toISOString(),
            },
            ipAddress: request.ip || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          },
        })
      } catch (error) {
        console.error('Failed to track logout analytics:', error)
      }
    }

    // Clear the auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)

    // Still clear the cookie even if there's an error
    const response = NextResponse.json({
      success: true, // Don't expose the error to the user
      message: 'Logged out successfully',
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return response
  }
}