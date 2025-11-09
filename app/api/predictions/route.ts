import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { cacheHelpers } from "@/lib/redis";

// Public predictions (tips) query schema
const predictionsQuerySchema = z.object({
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
    const validatedQuery = predictionsQuerySchema.parse(query);

    const cacheKey = `predictions:${JSON.stringify({
      ...validatedQuery,
      vip: validatedQuery.vip ? "vip" : "public",
    })}`;

    if (!validatedQuery.vip) {
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const auth = await getAuthenticatedUser(request);

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
      const hasVipAccess = await checkVipAccess(auth.user.id);
      if (!hasVipAccess) {
        return NextResponse.json(
          { success: false, error: "VIP subscription required" },
          { status: 403 }
        );
      }
    }

    let tipViewLimit: number | null = null;
    if (auth.user?.guest) {
      tipViewLimit = 10;
    }

    interface Where {
      status: string;
      publishAt: { lte: Date };
      sport?: { mode: string; equals: string };
      featured?: boolean;
      isVIP: boolean;
      OR?: Array<
        | { title: { mode: string; contains: string } }
        | { content: { mode: string; contains: string } }
        | { summary: { mode: string; contains: string } }
        | { tags: { hasSome: string[] } }
      >;
      tags?: { hasSome: string[] };
    }

    const where: Where = {
      status: "published",
      publishAt: { lte: new Date() },
      isVIP: validatedQuery.vip ? true : false,
    };

    if (validatedQuery.sport) {
      where.sport = { mode: "insensitive", equals: validatedQuery.sport };
    }
    if (validatedQuery.featured !== undefined) {
      where.featured = validatedQuery.featured;
    }
    // isVIP already set in initial object

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

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = Math.min(
      validatedQuery.limit,
      tipViewLimit || validatedQuery.limit
    );

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
            select: { id: true, name: true, shortName: true, logoUrl: true },
          },
          awayTeam: {
            select: { id: true, name: true, shortName: true, logoUrl: true },
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

    if (auth.user && tips.length > 0) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            userId: auth.user.guest ? undefined : auth.user.id,
            type: "predictions_viewed",
            payload: {
              tipIds: tips.map((t: { id: string }) => t.id),
              filters: validatedQuery,
              page: validatedQuery.page,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error("Failed to track predictions view analytics:", error);
      }
    }

    const hasMore = skip + tips.length < total;

    const result = {
      success: true,
      data: {
        predictions: tips,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    };

    if (!validatedQuery.vip) {
      await cacheHelpers.set(cacheKey, result, 300);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Predictions fetch error:", error);
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

async function checkVipAccess(userId: string): Promise<boolean> {
  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
    });
    if (activeSubscription) return true;

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
