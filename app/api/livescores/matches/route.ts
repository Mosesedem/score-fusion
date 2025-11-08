import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LiveScoreService } from '@/lib/livescores'

// Query schema for matches
const matchesQuerySchema = z.object({
  sport: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled']).optional(),
  league: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  featured: z.string().transform(val => val === 'true').optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

// Initialize the live score service
const liveScoreService = LiveScoreService.getInstance()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validatedQuery = matchesQuerySchema.parse(query)

    // Build where clause for database filtering
    let matches = []

    if (validatedQuery.sport || validatedQuery.status) {
      // If filtering by sport or status, query from database
      const where: any = {}

      if (validatedQuery.status) {
        where.status = validatedQuery.status
      }

      // Get sport ID if sport name provided
      if (validatedQuery.sport) {
        const sport = await prisma.sport.findFirst({
          where: {
            OR: [
              { name: { mode: 'insensitive', equals: validatedQuery.sport.toLowerCase() } },
              { displayName: { mode: 'insensitive', equals: validatedQuery.sport } }
            ]
          }
        })

        if (sport) {
          where.sportId = sport.id
        }
      }

      matches = await prisma.match.findMany({
        where,
        include: {
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true
            }
          },
          league: {
            select: {
              id: true,
              name: true,
              country: true,
              logo: true
            }
          },
          matchEvents: {
            take: 5,
            orderBy: { minute: 'desc' },
            select: {
              id: true,
              type: true,
              team: true,
              minute: true,
              player: true,
              description: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          scheduledAt: validatedQuery.status === 'scheduled' ? 'asc' : 'desc'
        },
        take: Math.min(validatedQuery.limit, 100)
      })
    } else {
      // If no filtering, get from live score service
      matches = await liveScoreService.getLiveMatches()
    }

    // Additional filtering
    if (validatedQuery.league) {
      matches = matches.filter(match =>
        match.league?.name?.toLowerCase().includes(validatedQuery.league.toLowerCase())
      )
    }

    if (validatedQuery.dateFrom) {
      const fromDate = new Date(validatedQuery.dateFrom)
      matches = matches.filter(match =>
        new Date(match.scheduledAt) >= fromDate
      )
    }

    if (validatedQuery.dateTo) {
      const toDate = new Date(validatedQuery.dateTo)
      matches = matches.filter(match =>
        new Date(match.scheduledAt) <= toDate
      )
    }

    if (validatedQuery.featured) {
      matches = matches.filter(match => {
        // Simple logic for featured matches - in real implementation, this would be a database field
        const hoursSinceStart = (Date.now() - new Date(match.scheduledAt).getTime()) / (1000 * 60 * 60)
        return hoursSinceStart >= -2 && hoursSinceStart <= 24 // Matches starting within last 24 hours or next 2 hours
      })
    }

    // Format response
    const formattedMatches = matches.map(match => ({
      id: match.id,
      sport: match.sport,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeTeamLogo: match.homeTeamLogo,
      awayTeamLogo: match.awayTeamLogo,
      homeTeamScore: match.homeTeamScore,
      awayTeamScore: match.awayScore,
      venue: match.venue,
      scheduledAt: match.scheduledAt,
      status: match.status,
      period: match.period,
      minute: match.minute,
      odds: match.odds,
      statistics: match.statistics,
      lastUpdatedAt: match.lastUpdatedAt,
      recentEvents: match.matchEvents,
      live: match.status === 'live',
      canBet: ['scheduled', 'live'].includes(match.status),
      timeUntilStart: match.status === 'scheduled' ? Math.max(0, new Date(match.scheduledAt).getTime() - Date.now()) : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        matches: formattedMatches,
        filters: {
          sport: validatedQuery.sport,
          status: validatedQuery.status,
          league: validatedQuery.league,
          featured: validatedQuery.featured
        },
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: formattedMatches.length,
          hasMore: false
        }
      }
    })

  } catch (error) {
    console.error('Live scores GET error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch live scores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body for actions
    const { action, sportId, leagueId, matchId } = body

    switch (action) {
      case 'refresh':
        await liveScoreService.updateAllMatches()
        return NextResponse.json({
          success: true,
          message: 'Live scores refreshed successfully'
        })

      case 'start':
        await liveScoreService.startUpdates()
        return NextResponse.json({
          success: true,
          message: 'Live score updates started'
        })

      case 'stop':
        await liveScoreService.stopUpdates()
        return NextResponse.json({
          success: true,
          message: 'Live score updates stopped'
        })

      case 'status':
        const isRunning = (liveScoreService as any).isRunning
        return NextResponse.json({
          success: true,
          data: {
            isRunning,
            lastUpdate: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Live scores POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}