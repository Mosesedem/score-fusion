import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Analytics query schema
const analyticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'all']).default('month'),
  type: z.enum(['overview', 'revenue', 'users', 'tips', 'engagement', 'referrals']).default('overview'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sport: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional()
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
    const validatedQuery = analyticsQuerySchema.parse(query)

    // Calculate date range
    const now = new Date()
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : getDateForPeriod(validatedQuery.period, now)
    const endDate = validatedQuery.endDate
      ? new Date(validatedQuery.endDate)
      : now

    // Get analytics based on type
    switch (validatedQuery.type) {
      case 'overview':
        return await getOverviewAnalytics(startDate, endDate, validatedQuery)
      case 'revenue':
        return await getRevenueAnalytics(startDate, endDate, validatedQuery)
      case 'users':
        return await getUserAnalytics(startDate, endDate, validatedQuery)
      case 'tips':
        return await getTipsAnalytics(startDate, endDate, validatedQuery)
      case 'engagement':
        return await getEngagementAnalytics(startDate, endDate, validatedQuery)
      case 'referrals':
        return await getReferralAnalytics(startDate, endDate, validatedQuery)
      default:
        return await getOverviewAnalytics(startDate, endDate, validatedQuery)
    }

  } catch (error) {
    console.error('Admin analytics GET error:', error)

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

async function getOverviewAnalytics(startDate: Date, endDate: Date, query: any) {
  const [
    userStats,
    tipStats,
    subscriptionStats,
    revenueStats,
    engagementStats
  ] = await Promise.all([
    // User metrics
    prisma.user.aggregate({
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        guest: false,
        deletedAt: null
      }
    }),

    // Tip metrics
    prisma.tip.aggregate({
      _count: { id: true },
      _count: { isVIP: true },
      _avg: { successRate: true },
      _sum: { viewCount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'published'
      }
    }),

    // Subscription metrics
    prisma.subscription.aggregate({
      _count: { id: true },
      _sum: { currentPeriodEnd: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'active'
      }
    }),

    // Revenue metrics
    prisma.wallet.aggregate({
      _sum: { totalEarned: true, totalWithdrawn: true }
    }),

    // Engagement metrics
    prisma.analyticsEvent.aggregate({
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    })
  ])

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate, endDate },
      metrics: {
        users: {
          new: userStats._count.id,
          total: await prisma.user.count({ where: { guest: false, deletedAt: null } })
        },
        tips: {
          created: tipStats._count.id,
          vip: tipStats._count.isVIP,
          totalViews: tipStats._sum.viewCount || 0,
          avgSuccessRate: Number(tipStats._avg.successRate || 0)
        },
        subscriptions: {
          active: subscriptionStats._count.id,
          new: subscriptionStats._count.id
        },
        revenue: {
          totalEarned: Number(revenueStats._sum.totalEarned || 0),
          totalWithdrawn: Number(revenueStats._sum.totalWithdrawn || 0),
          netRevenue: Number((revenueStats._sum.totalEarned || 0) - (revenueStats._sum.totalWithdrawn || 0))
        },
        engagement: {
          totalEvents: engagementStats._count.id
        }
      }
    }
  })
}

async function getRevenueAnalytics(startDate: Date, endDate: Date, query: any) {
  const [
    walletStats,
    subscriptionRevenue,
    referralEarnings,
    tokenConversions,
    withdrawals
  ] = await Promise.all([
    // Overall wallet stats
    prisma.wallet.aggregate({
      _sum: { totalEarned: true, totalWithdrawn: true },
      _avg: { balance: true }
    }),

    // Subscription revenue
    prisma.subscription.groupBy({
      by: ['plan'],
      _count: { id: true },
      _sum: { currentPeriodEnd: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'active'
      }
    }),

    // Referral earnings
    prisma.referralEarning.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'confirmed'
      }
    }),

    // Token conversions
    prisma.tokenConversion.aggregate({
      _sum: { amountEarned: true, tokensConverted: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      }
    }),

    // Withdrawals
    prisma.withdrawal.aggregate({
      _sum: { amount: true, fee: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      }
    })
  ])

  // Daily revenue breakdown
  const dailyRevenue = await prisma.$queryRaw`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(CASE WHEN type = 'referral_bonus' THEN amount ELSE 0 END), 0) as referral,
      COALESCE(SUM(CASE WHEN type = 'token_conversion' THEN amount ELSE 0 END), 0) as conversions,
      COALESCE(SUM(CASE WHEN type = 'bet_won' THEN amount ELSE 0 END), 0) as winnings
    FROM earnings
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  ` as any[]

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate, endDate },
      totals: {
        totalEarned: Number(walletStats._sum.totalEarned || 0),
        totalWithdrawn: Number(walletStats._sum.totalWithdrawn || 0),
        netRevenue: Number((walletStats._sum.totalEarned || 0) - (walletStats._sum.totalWithdrawn || 0)),
        averageBalance: Number(walletStats._avg.balance || 0)
      },
      breakdown: {
        subscriptions: subscriptionRevenue.map(sub => ({
          plan: sub.plan,
          count: sub._count.id,
          revenue: Number(sub._sum.currentPeriodEnd || 0)
        })),
        referrals: {
          total: Number(referralEarnings._sum.amount || 0),
          count: referralEarnings._count.id
        },
        conversions: {
          totalAmount: Number(tokenConversions._sum.amountEarned || 0),
          totalTokens: tokenConversions._sum.tokensConverted || 0,
          count: tokenConversions._count.id
        },
        withdrawals: {
          totalAmount: Number(withdrawals._sum.amount || 0),
          totalFees: Number(withdrawals._sum.fee || 0),
          count: withdrawals._count.id
        }
      },
      dailyBreakdown: dailyRevenue
    }
  })
}

async function getUserAnalytics(startDate: Date, endDate: Date, query: any) {
  const [
    userAcquisition,
    userRetention,
    userEngagement,
    userSegmentation,
    topUsers
  ] = await Promise.all([
    // User acquisition over time
    prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        guest: false,
        deletedAt: null
      }
    }),

    // User retention (users who returned after signup)
    prisma.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        guest: false,
        deletedAt: null,
        lastLoginAt: { not: null }
      },
      select: {
        id: true,
        createdAt: true,
        lastLoginAt: true
      }
    }),

    // User engagement metrics
    prisma.analyticsEvent.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { _count: { id: 'desc' } },
      take: 100
    }),

    // User segmentation
    Promise.all([
      prisma.user.count({ where: { guest: false, deletedAt: null, isAdmin: false } }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { guest: false, deletedAt: null, lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
    ]),

    // Top users by earnings
    prisma.wallet.findMany({
      where: {
        totalEarned: { gt: 0 }
      },
      select: {
        userId: true,
        totalEarned: true,
        balance: true
      },
      orderBy: { totalEarned: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            createdAt: true
          }
        }
      }
    })
  ])

  const [totalUsers, vipUsers, activeUsers] = userSegmentation

  const retentionRate = userAcquisition.length > 0
    ? ((userRetention.length / userAcquisition.length) * 100).toFixed(1)
    : '0'

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate, endDate },
      acquisition: {
        totalNew: userAcquisition.length,
        dailyBreakdown: userAcquisition.map(day => ({
          date: day.createdAt,
          count: day._count.id
        }))
      },
      retention: {
        rate: `${retentionRate}%`,
        retainedUsers: userRetention.length,
        returningUsers: activeUsers
      },
      segmentation: {
        total: totalUsers,
        vip: vipUsers,
        active: activeUsers,
        vipRate: totalUsers > 0 ? ((vipUsers / totalUsers) * 100).toFixed(1) : '0',
        activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0'
      },
      engagement: {
        topUsers: userEngagement.slice(0, 20).map(user => ({
          userId: user.userId,
          events: user._count.id
        }))
      },
      topEarners: topUsers.map(wallet => ({
        user: wallet.user,
        totalEarned: Number(wallet.totalEarned),
        currentBalance: Number(wallet.balance)
      }))
    }
  })
}

async function getTipsAnalytics(startDate: Date, endDate: Date, query: any) {
  const [
    tipStats,
    tipPerformance,
    sportAnalytics,
    authorPerformance,
    vipTipsStats
  ] = await Promise.all([
    // Overall tip statistics
    prisma.tip.aggregate({
      _count: { id: true },
      _count: { isVIP: true },
      _avg: { successRate: true },
      _sum: { viewCount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),

    // Tip performance by status
    prisma.tip.groupBy({
      by: ['status'],
      _count: { id: true },
      _avg: { successRate: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),

    // Analytics by sport
    prisma.tip.groupBy({
      by: ['sport'],
      _count: { id: true },
      _avg: { successRate: true },
      _sum: { viewCount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),

    // Author performance
    prisma.tip.groupBy({
      by: ['authorName'],
      _count: { id: true },
      _avg: { successRate: true },
      _sum: { viewCount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        authorName: { not: null }
      }
    }),

    // VIP tips performance
    prisma.tip.aggregate({
      _count: { id: true },
      _avg: { successRate: true },
      _sum: { viewCount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isVIP: true
      }
    })
  ])

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate, endDate },
      overview: {
        total: tipStats._count.id,
        vip: tipStats._count.isVIP,
        avgSuccessRate: Number(tipStats._avg.successRate || 0),
        totalViews: tipStats._sum.viewCount || 0
      },
      performance: tipPerformance.map(perf => ({
        status: perf.status,
        count: perf._count.id,
        avgSuccessRate: Number(perf._avg.successRate || 0)
      })),
      sports: sportAnalytics.map(sport => ({
        sport: sport.sport,
        count: sport._count.id,
        avgSuccessRate: Number(sport._avg.successRate || 0),
        totalViews: sport._sum.viewCount || 0
      })),
      authors: authorPerformance.map(author => ({
        name: author.authorName,
        count: author._count.id,
        avgSuccessRate: Number(author._avg.successRate || 0),
        totalViews: author._sum.viewCount || 0
      })),
      vip: {
        total: vipTipsStats._count.id,
        avgSuccessRate: Number(vipTipsStats._avg.successRate || 0),
        totalViews: vipTipsStats._sum.viewCount || 0,
        performanceVsFree: vipTipsStats._avg.successRate && tipStats._avg.successRate
          ? ((Number(vipTipsStats._avg.successRate) - Number(tipStats._avg.successRate)) / Number(tipStats._avg.successRate) * 100
          : 0
      }
    }
  })
}

async function getEngagementAnalytics(startDate: Date, endDate: Date, query: any) {
  const eventTypes = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    _count: { id: true },
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    orderBy: { _count: { id: 'desc' }
  })

  const dailyEvents = await prisma.$queryRaw`
    SELECT
      DATE(created_at) as date,
      type,
      COUNT(*) as count
    FROM analytics_events
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE(created_at), type
    ORDER BY date DESC
  ` as any[]

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate, endDate },
      eventTypes: eventTypes.map(event => ({
        type: event.type,
        count: event._count.id
      })),
      dailyBreakdown: dailyEvents
    }
  })
}

async function getReferralAnalytics(startDate: Date, endDate: Date, query: any) {
  const [
    referralStats,
    referralPerformance,
    topReferrers,
    referralFunnel
  ] = await Promise.all([
    // Overall referral statistics
    prisma.referral.aggregate({
      _count: { id: true },
      _sum: { rewardAmount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),

    // Referral performance by status
    prisma.referral.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { rewardAmount: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),

    // Top referrers
    prisma.user.findMany({
      where: {
        referredUsers: {
          some: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }
      },
      include: {
        referredUsers: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        },
        referralEarnings: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          },
          select: {
            amount: true,
            status: true
          }
        }
      },
      orderBy: {
        referredUsers: {
          _count: 'desc'
        }
      },
      take: 10
    }),

    // Referral funnel metrics
    Promise.all([
      prisma.user.count({ where: { referredBy: { not: null }, createdAt: { gte: startDate, lte: endDate } } }),
      prisma.referral.count({ where: { status: 'confirmed', createdAt: { gte: startDate, lte: endDate } } }),
      prisma.subscription.count({
        where: {
          userId: {
            in: prisma.$queryRaw`
              SELECT DISTINCT user_id
              FROM referrals
              WHERE status = 'confirmed'
              AND created_at >= ${startDate}
              AND created_at <= ${endDate}
            ` as any
          }
        }
      })
    ])
  ])

  const [referredUsers, confirmedReferrals, convertedSubscriptions] = referralFunnel

  return NextResponse.json({
    success: true,
    data: {
      period: { startDate, endDate },
      overview: {
        total: referralStats._count.id,
        totalRewards: Number(referralStats._sum.rewardAmount || 0),
        averageReward: referralStats._count.id > 0
          ? Number(referralStats._sum.rewardAmount || 0) / referralStats._count.id
          : 0
      },
      performance: referralPerformance.map(perf => ({
        status: perf.status,
        count: perf._count.id,
        totalRewards: Number(perf._sum.rewardAmount || 0)
      })),
      funnel: {
        referred: referredUsers,
        confirmed: confirmedReferrals,
        converted: convertedSubscriptions,
        confirmationRate: referredUsers > 0 ? ((confirmedReferrals / referredUsers) * 100).toFixed(1) : '0',
        conversionRate: confirmedReferrals > 0 ? ((convertedSubscriptions / confirmedReferrals) * 100).toFixed(1) : '0'
      },
      topReferrers: topReferrers.map(referrer => ({
        user: {
          displayName: referrer.displayName,
          email: referrer.email
        },
        referrals: referrer.referredUsers.length,
        earnings: referrer.referralEarnings
          .filter(e => e.status === 'confirmed')
          .reduce((sum, e) => sum + Number(e.amount), 0)
      }))
    }
  })
}

// Helper function to get date for period
function getDateForPeriod(period: string, now: Date): Date {
  const date = new Date(now)

  switch (period) {
    case 'today':
      date.setHours(0, 0, 0, 0)
      break
    case 'week':
      date.setDate(date.getDate() - 7)
      break
    case 'month':
      date.setMonth(date.getMonth() - 1)
      break
    case 'quarter':
      date.setMonth(date.getMonth() - 3)
      break
    case 'year':
      date.setFullYear(date.getFullYear() - 1)
      break
    case 'all':
      // Return a very old date
      date.setFullYear(date.getFullYear() - 10)
      break
  }

  return date
}