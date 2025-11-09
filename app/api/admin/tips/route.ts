import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Tip creation/update schema
const tipSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().optional(),
  summary: z.string().optional(),
  odds: z.number().positive("Odds must be positive").optional(),
  oddsSource: z.enum(["manual", "api_auto"]).default("manual"),
  sport: z.string().min(1, "Sport is required"),
  league: z.string().optional(),
  matchId: z.string().uuid().optional(),
  matchDate: z.string().datetime().optional(),
  // Team relations for predictions
  homeTeamId: z.string().uuid().optional(),
  awayTeamId: z.string().uuid().optional(),
  predictionType: z.string().optional(), // winner, over_under, both_teams_score, etc.
  predictedOutcome: z.string().optional(), // home_win, draw, away_win, over, under, yes, no
  // Ticket snapshots (up to 10)
  ticketSnapshots: z
    .array(z.string().url())
    .max(10, "Maximum 10 ticket snapshots allowed")
    .default([]),
  publishAt: z.string().datetime().optional(),
  isVIP: z.boolean().default(false),
  featured: z.boolean().default(false),
  authorId: z.string().uuid().optional(),
  authorName: z.string().optional(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  status: z
    .enum(["draft", "scheduled", "published", "archived"])
    .default("draft"),
  result: z.enum(["won", "lost", "void", "pending"]).optional(),
});

// Query schema
const tipsQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("20"),
  search: z.string().optional(),
  sport: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  isVIP: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  authorId: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "publishAt", "viewCount", "successRate"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = tipsQuerySchema.parse(query);

    // Build where clause
    const where: any = {};

    if (validatedQuery.search) {
      where.OR = [
        { title: { mode: "insensitive", contains: validatedQuery.search } },
        { content: { mode: "insensitive", contains: validatedQuery.search } },
        { summary: { mode: "insensitive", contains: validatedQuery.search } },
      ];
    }

    if (validatedQuery.sport) {
      where.sport = { mode: "insensitive", equals: validatedQuery.sport };
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.isVIP !== undefined) {
      where.isVIP = validatedQuery.isVIP;
    }

    if (validatedQuery.featured !== undefined) {
      where.featured = validatedQuery.featured;
    }

    if (validatedQuery.authorId) {
      where.authorId = validatedQuery.authorId;
    }

    // Get pagination info
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = Math.min(validatedQuery.limit, 100);

    // Build order by
    const orderBy: any = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Query tips with detailed information
    const [tips, total] = await Promise.all([
      prisma.tip.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          match: {
            select: {
              id: true,
              homeTeam: true,
              awayTeam: true,
              homeTeamScore: true,
              awayTeamScore: true,
              status: true,
              scheduledAt: true,
            },
          },
          homeTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
              sport: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
              sport: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          },
          bets: {
            select: {
              id: true,
              amount: true,
              odds: true,
              status: true,
              placedAt: true,
            },
          },
          _count: {
            select: {
              bets: true,
            },
          },
        },
      }),
      prisma.tip.count({ where }),
    ]);

    const hasMore = skip + tips.length < total;

    // Calculate additional metrics for each tip
    const tipsWithMetrics = tips.map((tip) => ({
      ...tip,
      totalBets: tip._count.bets,
      betWinRate: calculateWinRate(tip.bets),
      totalStaked: tip.bets.reduce((sum, bet) => sum + Number(bet.amount), 0),
      matchInfo: tip.match
        ? {
            homeTeam: tip.match.homeTeam,
            awayTeam: tip.match.awayTeam,
            score: `${tip.match.homeTeamScore} - ${tip.match.awayTeam}`,
            status: tip.match.status,
            scheduledAt: tip.match.scheduledAt,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tips: tipsWithMetrics,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin tips GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const body = await request.json();

    // Validate input
    const validatedData = tipSchema.parse(body);

    // Create tip
    const tip = await prisma.tip.create({
      data: {
        ...validatedData,
        matchDate: validatedData.matchDate
          ? new Date(validatedData.matchDate)
          : undefined,
        publishAt: validatedData.publishAt
          ? new Date(validatedData.publishAt)
          : new Date(),
        authorId: validatedData.authorId || session.user.id,
        authorName: validatedData.authorName || session.user.displayName,
      },
      include: {
        match: true,
        homeTeam: true,
        awayTeam: true,
        _count: {
          select: {
            bets: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "create_tip",
        resource: tip.id,
        details: {
          title: tip.title,
          sport: tip.sport,
          isVIP: tip.isVIP,
          status: tip.status,
        },
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tip created successfully",
      data: { tip },
    });
  } catch (error) {
    console.error("Admin tips POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const tipId = searchParams.get("id");

    if (!tipId) {
      return NextResponse.json(
        { success: false, error: "Tip ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = tipSchema.parse(body);

    // Update tip
    const tip = await prisma.tip.update({
      where: { id: tipId },
      data: {
        ...validatedData,
        matchDate: validatedData.matchDate
          ? new Date(validatedData.matchDate)
          : undefined,
        publishAt: validatedData.publishAt
          ? new Date(validatedData.publishAt)
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        match: true,
        homeTeam: true,
        awayTeam: true,
        _count: {
          select: {
            bets: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "update_tip",
        resource: tip.id,
        details: {
          title: tip.title,
          sport: tip.sport,
          updatedFields: Object.keys(validatedData),
        },
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tip updated successfully",
      data: { tip },
    });
  } catch (error) {
    console.error("Admin tips PUT error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const tipId = searchParams.get("id");

    if (!tipId) {
      return NextResponse.json(
        { success: false, error: "Tip ID required" },
        { status: 400 }
      );
    }

    // Check if tip has associated bets
    const betCount = await prisma.bet.count({
      where: { tipId },
    });

    if (betCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete tip with associated bets" },
        { status: 400 }
      );
    }

    // Get tip details for audit log
    const tip = await prisma.tip.findUnique({
      where: { id: tipId },
    });

    if (!tip) {
      return NextResponse.json(
        { success: false, error: "Tip not found" },
        { status: 404 }
      );
    }

    // Delete tip
    await prisma.tip.delete({
      where: { id: tipId },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "delete_tip",
        resource: tipId,
        details: {
          title: tip.title,
          sport: tip.sport,
        },
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Tip deleted successfully",
    });
  } catch (error) {
    console.error("Admin tips DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function
function calculateWinRate(bets: any[]): number {
  if (!bets || bets.length === 0) return 0;

  const wonBets = bets.filter((bet) => bet.status === "won").length;
  return (wonBets / bets.length) * 100;
}
