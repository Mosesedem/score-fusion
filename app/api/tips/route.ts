import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { cacheHelpers } from "@/lib/redis";

// Query schema
const tipsQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("20"),
  sport: z.string().optional(),
  vip: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  search: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : undefined)),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = tipsQuerySchema.parse(query);

    // Check cache for public tips
    const cacheKey = `tips:${JSON.stringify({
      ...validatedQuery,
      vip: validatedQuery.vip ? "vip" : "public",
    })}`;

    if (!validatedQuery.vip) {
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Get authenticated user (optional)
    const auth = await getAuthenticatedUser(request);

    // Check VIP access for VIP tips
    if (validatedQuery.vip) {
      if (!auth.user) {
        return NextResponse.json(
          { success: false, error: "Authentication required for VIP content" },
          { status: 401 }
        );
      }

      if (auth.user.guest) {
        return NextResponse.json(
          {
            success: false,
            error: "VIP content not available for guest users",
          },
          { status: 403 }
        );
      }

      // Check if user has active subscription or valid VIP tokens
      const hasVipAccess = await checkVipAccess(auth.user.id);
      if (!hasVipAccess) {
        return NextResponse.json(
          { success: false, error: "VIP subscription required" },
          { status: 403 }
        );
      }
    }

    // For guest users, limit tip views
    let tipViewLimit = null;
    if (auth.user?.guest) {
      tipViewLimit = 10; // Limit to 10 tips per session for guests
    }

    // Build where clause
    const where: any = {
      status: "published",
      publishAt: { lte: new Date() },
    };

    if (validatedQuery.sport) {
      where.sport = { mode: "insensitive", equals: validatedQuery.sport };
    }

    if (validatedQuery.featured !== undefined) {
      where.featured = validatedQuery.featured;
    }

    if (validatedQuery.vip) {
      where.isVIP = true;
    } else {
      where.isVIP = false;
    }

    if (validatedQuery.search) {
      where.OR = [
        { title: { mode: "insensitive", contains: validatedQuery.search } },
        { content: { mode: "insensitive", contains: validatedQuery.search } },
        { summary: { mode: "insensitive", contains: validatedQuery.search } },
        { tags: { hasSome: [validatedQuery.search] } },
      ];
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      where.tags = { hasSome: validatedQuery.tags };
    }

    // Get pagination info
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = Math.min(
      validatedQuery.limit,
      tipViewLimit || validatedQuery.limit
    );

    // Query tips
    const [tips, total] = await Promise.all([
      prisma.tip.findMany({
        where,
        skip,
        take,
        orderBy: [
          { featured: "desc" },
          { publishAt: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          title: true,
          summary: true,
          content: true,
          odds: true,
          oddsSource: true,
          sport: true,
          league: true,
          matchId: true,
          matchDate: true,
          homeTeamId: true,
          awayTeamId: true,
          homeTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
            },
          },
          predictionType: true,
          predictedOutcome: true,
          ticketSnapshots: true,
          publishAt: true,
          isVIP: true,
          featured: true,
          authorName: true,
          status: true,
          attachments: true,
          tags: true,
          viewCount: true,
          successRate: true,
          result: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.tip.count({ where }),
    ]);

    // Track tip views for analytics
    if (auth.user && tips.length > 0) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            userId: auth.user.guest ? undefined : auth.user.id,
            type: "tips_viewed",
            payload: {
              tipIds: tips.map((t) => t.id),
              filters: validatedQuery,
              page: validatedQuery.page,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error("Failed to track tips view analytics:", error);
      }
    }

    const hasMore = skip + tips.length < total;

    const result = {
      success: true,
      data: {
        tips,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    };

    // Cache public tips for 5 minutes
    if (!validatedQuery.vip) {
      await cacheHelpers.set(cacheKey, result, 300);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tips fetch error:", error);

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

// Helper function to check VIP access
async function checkVipAccess(userId: string): Promise<boolean> {
  try {
    // Check for active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
    });

    if (activeSubscription) {
      return true;
    }

    // Check for valid VIP tokens
    const validToken = await prisma.vIPToken.findFirst({
      where: {
        userId,
        expiresAt: { gte: new Date() },
        OR: [{ used: 0 }, { used: { lt: prisma.vIPToken.fields.quantity } }],
      },
    });

    return !!validToken;
  } catch (error) {
    console.error("Error checking VIP access:", error);
    return false;
  }
}
