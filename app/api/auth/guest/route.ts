import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import { safeParseRequestJson, getClientIp } from "@/lib/utils";

// Validation schema
const guestSchema = z
  .object({
    deviceId: z.string().optional(),
    platform: z.string().optional(),
  })
  .optional();

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit.check(
      `guest:ip:${ip}`,
      50,
      3600000
    ); // 50 per hour

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many guest session requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = (await safeParseRequestJson(request)) || {};

    // Validate input (optional schema allows empty body)
    const validatedData = guestSchema.parse(body);

    // Create guest session
    const result = await AuthService.createGuestSession({
      deviceId: validatedData?.deviceId,
      platform: validatedData?.platform,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Track guest session creation analytics
    try {
      await prisma.analyticsEvent.create({
        data: {
          type: "guest_session_created",
          payload: {
            deviceId: validatedData?.deviceId,
            platform: validatedData?.platform,
            timestamp: new Date().toISOString(),
          },
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to track guest session analytics:", error);
    }

    // Set HTTP-only cookie with the token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      sessionId: result.sessionId,
    });

    if (result.token) {
      response.cookies.set("auth-token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 hours for guest sessions
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Guest session error:", error);

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
