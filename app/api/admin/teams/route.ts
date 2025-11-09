import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Team create/update schema
const teamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  shortName: z.string().optional(),
  sportId: z.string().uuid(),
  league: z.string().optional(),
  country: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  externalId: z.string().optional(),
  metadata: z.any().optional(),
});

const teamQuerySchema = z.object({
  sportId: z.string().uuid().optional(),
  league: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("50"),
});

// GET - List teams
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = teamQuerySchema.parse(query);

    const where: any = {};

    if (validatedQuery.sportId) {
      where.sportId = validatedQuery.sportId;
    }

    if (validatedQuery.league) {
      where.league = { mode: "insensitive", contains: validatedQuery.league };
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { mode: "insensitive", contains: validatedQuery.search } },
        { shortName: { mode: "insensitive", contains: validatedQuery.search } },
      ];
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        include: {
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      }),
      prisma.team.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        teams,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    });
  } catch (error) {
    console.error("Teams fetch error:", error);

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

// POST - Create team
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const body = await request.json();
    const validatedData = teamSchema.parse(body);

    // Check if sport exists
    const sport = await prisma.sport.findUnique({
      where: { id: validatedData.sportId },
    });

    if (!sport) {
      return NextResponse.json(
        { success: false, error: "Sport not found" },
        { status: 404 }
      );
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: validatedData.name,
        shortName: validatedData.shortName,
        sportId: validatedData.sportId,
        league: validatedData.league,
        country: validatedData.country,
        logoUrl: validatedData.logoUrl,
        isActive: validatedData.isActive,
        externalId: validatedData.externalId,
        metadata: validatedData.metadata,
      },
      include: {
        sport: true,
      },
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "create_team",
        resource: team.id,
        details: {
          teamName: team.name,
          sport: sport.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("Team creation error:", error);

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

// PATCH - Update team
export async function PATCH(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const body = await request.json();
    const validatedData = teamSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { success: false, error: "Team ID required for update" },
        { status: 400 }
      );
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Update team
    const team = await prisma.team.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        shortName: validatedData.shortName,
        sportId: validatedData.sportId,
        league: validatedData.league,
        country: validatedData.country,
        logoUrl: validatedData.logoUrl,
        isActive: validatedData.isActive,
        externalId: validatedData.externalId,
        metadata: validatedData.metadata,
      },
      include: {
        sport: true,
      },
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "update_team",
        resource: team.id,
        details: {
          teamName: team.name,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("Team update error:", error);

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

// DELETE - Delete team
export async function DELETE(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("id");

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "Team ID required" },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Delete team
    await prisma.team.delete({
      where: { id: teamId },
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "delete_team",
        resource: teamId,
        details: {
          teamName: team.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Team deletion error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
