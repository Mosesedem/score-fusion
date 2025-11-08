import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/utils";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit.check(`login:ip:${ip}`, 20, 900000); // 20 per 15 min

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Authenticate user
    const result = await AuthService.login({
      email: validatedData.email,
      password: validatedData.password,
      rememberMe: validatedData.rememberMe,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!result.success) {
      // Track failed login attempt
      try {
        await prisma.analyticsEvent.create({
          data: {
            type: "login_failed",
            payload: {
              email: validatedData.email,
              error: result.error,
              timestamp: new Date().toISOString(),
            },
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
      } catch (error) {
        console.error("Failed to track failed login:", error);
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes("locked") ? 423 : 401 }
      );
    }

    // Track successful login analytics
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: result.user?.id,
          type: "login_success",
          payload: {
            email: validatedData.email,
            rememberMe: validatedData.rememberMe,
            timestamp: new Date().toISOString(),
          },
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to track login analytics:", error);
    }

    // Set HTTP-only cookie with the token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      sessionId: result.sessionId,
    });

    if (result.token) {
      const maxAge = validatedData.rememberMe
        ? 30 * 24 * 60 * 60
        : 24 * 60 * 60; // 30 days or 24 hours
      response.cookies.set("auth-token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);

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
