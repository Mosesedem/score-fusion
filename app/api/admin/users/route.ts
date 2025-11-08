import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Query schemas
const usersQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  status: z.enum(['active', 'banned', 'self_excluded', 'vip']).optional(),
  sport: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'totalEarned', 'balance']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// User update schema
const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().optional(),
  status: z.enum(['active', 'banned', 'self_excluded']).optional(),
  walletAdjustment: z.object({
    amount: z.number(),
    reason: z.string(),
    type: z.enum(['bonus', 'penalty', 'refund'])
  }).optional(),
  profile: z.object({
    country: z.string().optional(),
    selfExclusionUntil: z.string().datetime().optional(),
    depositLimits: z.object({
      daily: z.number().optional(),
      weekly: z.number().optional(),
      monthly: z.number().optional()
    }).optional()
  }).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await requireAdmin(request)

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Admin access required' },
        { status: auth.error ? 401 : 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validatedQuery = usersQuerySchema.parse(query)

    // Build where clause
    const where: any = {
      guest: false,
      deletedAt: null
    }

    if (validatedQuery.search) {
      where.OR = [
        { displayName: { mode: 'insensitive', contains: validatedQuery.search } },
        { email: { mode: 'insensitive', contains: validatedQuery.search } }
      ]
    }

    if (validatedQuery.status) {
      switch (validatedQuery.status) {
        case 'banned':
          where.lockedUntil = { gt: new Date() }
          break
        case 'self_excluded':
          where.profile = {
            selfExclusionUntil: { gt: new Date() }
          }
          break
        case 'vip':
          where.subscriptions = {
            some: {
              status: 'active',
              currentPeriodEnd: { gte: new Date() }
            }
          }
          break
      }
    }

    // Get pagination info
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    const take = Math.min(validatedQuery.limit, 100)

    // Build order by
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder

    // Query users with detailed information
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          profile: {
            select: {
              country: true,
              selfExclusionUntil: true,
              marketingConsent: true,
              analyticsConsent: true
            }
          },
          wallet: {
            select: {
              balance: true,
              tokens: true,
              bonusTokens: true,
              totalEarned: true,
              totalWithdrawn: true
            }
          },
          subscriptions: {
            where: {
              status: 'active',
              currentPeriodEnd: { gte: new Date() }
            },
            select: {
              plan: true,
              currentPeriodEnd: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          bets: {
            select: {
              amount: true,
              status: true
            }
          },
          referralEarnings: {
            select: {
              amount: true,
              status: true
            }
          },
          referredUsers: {
            select: {
              id: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              bets: true,
              referredUsers: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    const hasMore = skip + users.length < total

    // Calculate additional metrics for each user
    const usersWithMetrics = users.map(user => ({
      ...user,
      totalBets: user._count.bets,
      totalReferrals: user._count.referredUsers,
      betWinRate: calculateWinRate(user.bets),
      totalEarnings: user.referralEarnings
        .filter(e => e.status === 'confirmed')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      vipStatus: user.subscriptions.length > 0,
      subscriptionPlan: user.subscriptions[0]?.plan || null
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithMetrics,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / validatedQuery.limit)
        }
      }
    })

  } catch (error) {
    console.error('Admin users GET error:', error)

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

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await requireAdmin(request)

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Admin access required' },
        { status: auth.error ? 401 : 403 }
      )
    }

    const body = await request.json()

    // Determine the action based on request body
    const { action, userId, data } = body

    if (action === 'ban' && userId) {
      return await banUser(userId, data.reason, auth.user.id)
    }

    if (action === 'unban' && userId) {
      return await unbanUser(userId, auth.user.id)
    }

    if (action === 'update_wallet' && userId) {
      return await updateUserWallet(userId, data, auth.user.id)
    }

    if (action === 'self_exclude' && userId) {
      return await setSelfExclusion(userId, data.days, auth.user.id)
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Admin users POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await requireAdmin(request)

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Admin access required' },
        { status: auth.error ? 401 : 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateUserSchema.parse(body)

    // Update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update basic user info
      const updateData: any = {}
      if (validatedData.displayName) updateData.displayName = validatedData.displayName
      if (validatedData.email) updateData.email = validatedData.email.toLowerCase()
      if (validatedData.isAdmin !== undefined) updateData.isAdmin = validatedData.isAdmin

      // Handle status changes
      if (validatedData.status) {
        switch (validatedData.status) {
          case 'banned':
            updateData.lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            break
          case 'active':
            updateData.lockedUntil = null
            break
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          profile: true,
          wallet: true
        }
      })

      // Update profile if provided
      if (validatedData.profile) {
        await tx.profile.upsert({
          where: { userId },
          update: validatedData.profile,
          create: {
            userId,
            ...validatedData.profile
          }
        })
      }

      // Handle wallet adjustments
      if (validatedData.walletAdjustment) {
        const { amount, reason, type } = validatedData.walletAdjustment

        const wallet = await tx.wallet.findUnique({
          where: { userId }
        })

        if (!wallet) {
          throw new Error('User wallet not found')
        }

        let newBalance = Number(wallet.balance)
        let newTokens = wallet.tokens

        switch (type) {
          case 'bonus':
            newBalance += amount
            break
          case 'penalty':
            newBalance = Math.max(0, newBalance - Math.abs(amount))
            break
          case 'refund':
            newBalance += amount
            newTokens += Math.floor(amount * 100) // Add tokens equivalent to amount
            break
        }

        await tx.wallet.update({
          where: { userId },
          data: {
            balance: newBalance,
            tokens: newTokens
          }
        })

        // Create earning record
        await tx.earning.create({
          data: {
            userId,
            type: `admin_${type}`,
            amount: type === 'penalty' ? -Math.abs(amount) : amount,
            currency: 'USD',
            tokens: type === 'refund' ? Math.floor(amount * 100) : 0,
            status: 'confirmed',
            description: `Admin ${type}: ${reason}`,
            confirmedAt: new Date()
          }
        })
      }

      return updatedUser
    })

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.id,
        action: 'update_user',
        resource: userId,
        details: {
          updatedFields: Object.keys(validatedData),
          updatedBy: auth.user.displayName
        },
        ipAddress: request.ip || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: result
      }
    })

  } catch (error) {
    console.error('Admin users PUT error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateWinRate(bets: any[]): number {
  if (!bets || bets.length === 0) return 0

  const wonBets = bets.filter(bet => bet.status === 'won').length
  return (wonBets / bets.length) * 100
}

async function banUser(userId: string, reason: string, adminId: string) {
  const result = await prisma.$transaction(async (tx) => {
    // Lock user account
    await tx.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        loginAttempts: 5
      }
    })

    // Revoke all active sessions
    // TODO: Implement session revocation

    // Create audit log
    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: 'ban_user',
        resource: userId,
        details: {
          reason,
          bannedAt: new Date()
        }
      }
    })
  })

  return {
    success: true,
    message: 'User banned successfully'
  }
}

async function unbanUser(userId: string, adminId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        loginAttempts: 0
      }
    })

    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: 'unban_user',
        resource: userId,
        details: {
          unbannedAt: new Date()
        }
      }
    })
  })

  return {
    success: true,
    message: 'User unbanned successfully'
  }
}

async function updateUserWallet(userId: string, adjustment: any, adminId: string) {
  const { amount, reason, type } = adjustment

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      throw new Error('User wallet not found')
    }

    const newBalance = Number(wallet.balance) + amount
    if (newBalance < 0) {
      throw new Error('Insufficient balance for penalty')
    }

    await tx.wallet.update({
      where: { userId },
      data: {
        balance: newBalance
      }
    })

    await tx.earning.create({
      data: {
        userId,
        type: `admin_${type}`,
        amount,
        currency: 'USD',
        status: 'confirmed',
        description: `Admin ${type}: ${reason}`,
        confirmedAt: new Date()
      }
    })

    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: 'adjust_wallet',
        resource: userId,
        details: {
          amount,
          type,
          reason,
          newBalance
        }
      }
    })
  })

  return {
    success: true,
    message: 'Wallet adjusted successfully'
  }
}

async function setSelfExclusion(userId: string, days: number, adminId: string) {
  const exclusionDate = new Date()
  exclusionDate.setDate(exclusionDate.getDate() + days)

  await prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { userId },
      update: {
        selfExclusionUntil: exclusionDate
      },
      create: {
        userId,
        selfExclusionUntil: exclusionDate
      }
    })

    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: 'self_exclude_user',
        resource: userId,
        details: {
          days,
          exclusionUntil: exclusionDate
        }
      }
    })
  })

  return {
    success: true,
    message: `Self-exclusion set for ${days} days`
  }
}