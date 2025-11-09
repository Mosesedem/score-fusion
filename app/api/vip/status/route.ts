import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const auth = await getAuthenticatedUser(request);

    if (!auth.user) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        error: "Authentication required",
      });
    }

    if (auth.user.guest) {
      return NextResponse.json({
        success: true,
        hasAccess: false,
        subscription: null,
        tokenAccess: null,
      });
    }

    // Check for active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: auth.user.id,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
    });

    // Check for valid VIP tokens
    const validToken = await prisma.vIPToken.findFirst({
      where: {
        userId: auth.user.id,
        expiresAt: { gte: new Date() },
        OR: [{ used: 0 }, { used: { lt: prisma.vIPToken.fields.quantity } }],
      },
      orderBy: { expiresAt: "desc" },
    });

    const hasAccess = !!(activeSubscription || validToken);

    return NextResponse.json({
      success: true,
      hasAccess,
      subscription: activeSubscription
        ? {
            plan: activeSubscription.plan,
            status: activeSubscription.status,
            currentPeriodEnd: activeSubscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
          }
        : null,
      tokenAccess: validToken
        ? {
            expiresAt: validToken.expiresAt.toISOString(),
            remaining: validToken.quantity - validToken.used,
            type: validToken.type,
          }
        : null,
    });
  } catch (error) {
    console.error("VIP status check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check VIP status" },
      { status: 500 }
    );
  }
}
