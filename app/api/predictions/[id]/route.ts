import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const auth = await getAuthenticatedUser(request);

    // Fetch the prediction
    const tip = await prisma.tip.findUnique({
      where: { id },
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
        confidenceLevel: true,
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
    });

    if (!tip) {
      return NextResponse.json(
        { success: false, error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Check if prediction is published
    if (tip.status !== "published" || tip.publishAt > new Date()) {
      return NextResponse.json(
        { success: false, error: "Prediction not available" },
        { status: 403 }
      );
    }

    // Check VIP access if needed
    let hasVipAccess = false;
    if (tip.isVIP) {
      if (!auth.user || auth.user.guest) {
        // Return limited info for non-authenticated or guest users
        return NextResponse.json({
          success: true,
          data: {
            prediction: {
              ...tip,
              content: "🔒 VIP content - Sign in and subscribe to unlock",
              ticketSnapshots: [],
            },
            hasVipAccess: false,
          },
        });
      }

      // Check VIP subscription or tokens
      hasVipAccess = await checkVipAccess(auth.user.id, id);

      if (!hasVipAccess) {
        return NextResponse.json({
          success: true,
          data: {
            prediction: {
              ...tip,
              content: "🔒 VIP content - Upgrade to VIP to unlock",
              ticketSnapshots: [],
            },
            hasVipAccess: false,
          },
        });
      }
    }

    // Increment view count
    await prisma.tip.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Track analytics
    if (auth.user) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            userId: auth.user.guest ? undefined : auth.user.id,
            type: "prediction_viewed",
            payload: {
              tipId: id,
              isVIP: tip.isVIP,
              hasAccess: hasVipAccess || !tip.isVIP,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error("Failed to track prediction view:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        prediction: tip,
        hasVipAccess: hasVipAccess || !tip.isVIP,
      },
    });
  } catch (error) {
    console.error("Prediction fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function checkVipAccess(userId: string, tipId: string): Promise<boolean> {
  try {
    // Check active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
    });
    if (activeSubscription) return true;

    // Check general VIP tokens
    const generalToken = await prisma.vIPToken.findFirst({
      where: {
        userId,
        type: "general",
        expiresAt: { gte: new Date() },
        used: { lt: prisma.vIPToken.fields.quantity },
      },
    });
    if (generalToken) return true;

    // Check specific tip token
    const specificToken = await prisma.vIPToken.findFirst({
      where: {
        userId,
        tipId,
        expiresAt: { gte: new Date() },
        used: { lt: prisma.vIPToken.fields.quantity },
      },
    });
    return !!specificToken;
  } catch (error) {
    console.error("Error checking VIP access:", error);
    return false;
  }
}
