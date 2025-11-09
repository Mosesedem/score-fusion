import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";

const searchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  sport: z.string().optional().default("football"),
});

const API_FOOTBALL_KEY =
  process.env.API_FOOTBALL_KEY || "905056470a8b00773b981385d25bfc6a";

/**
 * Search for teams using API-Football
 * Comprehensive football database with team logos and metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { query: searchQuery } = searchSchema.parse(query);

    // Use API-Football for team search
    const apiUrl = `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(
      searchQuery
    )}`;

    // Using the direct API-Sports endpoint requires the 'x-apisports-key' header (not RapidAPI headers)
    const response = await fetch(apiUrl, {
      headers: {
        "x-apisports-key": API_FOOTBALL_KEY,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch teams from API-Football");
    }

    const data = await response.json();
    const teams = data.response || [];

    interface ApiFootballTeam {
      team: {
        id: number;
        name: string;
        code?: string;
        country?: string;
        founded?: number;
        national?: boolean;
        logo?: string;
      };
      venue?: {
        name?: string;
        address?: string;
        city?: string;
        capacity?: number;
      };
    }

    // Format response from API-Football
    const filteredTeams = teams
      .map((item: ApiFootballTeam) => ({
        externalId: item.team.id.toString(),
        name: item.team.name,
        shortName: item.team.code,
        logoUrl: item.team.logo,
        sport: "Football",
        league: "", // Will be empty from team search
        country: item.team.country,
        stadium: item.venue?.name,
        founded: item.team.founded?.toString(),
        metadata: {
          national: item.team.national,
          venue: item.venue,
        },
      }))
      .slice(0, 20); // Limit to top 20 results

    return NextResponse.json({
      success: true,
      data: {
        teams: filteredTeams,
        count: filteredTeams.length,
      },
    });
  } catch (error) {
    console.error("Team search error:", error);

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

/**
 * Create team from external API data
 */
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const body = await request.json();
    const {
      externalId,
      name,
      shortName,
      logoUrl,
      sport,
      league,
      country,
      metadata,
    } = body;

    // Import prisma here to avoid circular dependencies
    const { prisma } = await import("@/lib/db");

    // Find or create sport
    let sportRecord = await prisma.sport.findFirst({
      where: {
        name: {
          mode: "insensitive",
          equals: sport.toLowerCase() === "soccer" ? "football" : sport,
        },
      },
    });

    if (!sportRecord) {
      sportRecord = await prisma.sport.create({
        data: {
          name:
            sport.toLowerCase() === "soccer" ? "football" : sport.toLowerCase(),
          displayName: sport,
          isActive: true,
          sortOrder: 0,
        },
      });
    }

    // Check if team already exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { externalId },
          {
            name: { mode: "insensitive", equals: name },
            sportId: sportRecord.id,
          },
        ],
      },
    });

    if (existingTeam) {
      return NextResponse.json({
        success: true,
        data: { team: existingTeam },
        message: "Team already exists",
      });
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        shortName,
        sportId: sportRecord.id,
        league,
        country,
        logoUrl,
        isActive: true,
        externalId,
        metadata,
      },
      include: {
        sport: true,
      },
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "create_team_from_api",
        resource: team.id,
        details: {
          teamName: team.name,
          sport: sport,
          externalId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { team },
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
