"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  RefreshCw,
  Filter,
  Clock,
  Trophy,
  Play,
  Pause,
} from "lucide-react";

interface Match {
  id: string;
  sport?: {
    name: string;
    displayName: string;
    icon?: string;
  };
  league?: {
    name: string;
    country?: string;
    logo?: string;
  };
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: string;
  period?: string;
  minute?: number;
  scheduledAt: string;
  venue?: string;
  odds?: Record<string, number>;
  live: boolean;
  canBet: boolean;
  recentEvents?: MatchEvent[];
}

interface MatchEvent {
  id: string;
  type: string;
  team: string;
  minute: number;
  player?: string;
  description?: string;
  createdAt: string;
}

type FilterStatus = "all" | "live" | "scheduled" | "finished";

export default function LiveScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMatches = async (status?: FilterStatus) => {
    try {
      const statusParam = status && status !== "all" ? `&status=${status}` : "";
      const response = await fetch(
        `/api/livescores/matches?limit=50${statusParam}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.matches) {
          setMatches(data.data.matches);
        }
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches(filterStatus);
  };

  useEffect(() => {
    fetchMatches(filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMatches(filterStatus);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filterStatus]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "destructive" | "outline" | "secondary";
        label: string;
      }
    > = {
      live: { variant: "destructive", label: "LIVE" },
      scheduled: { variant: "outline", label: "Scheduled" },
      finished: { variant: "secondary", label: "Finished" },
      postponed: { variant: "outline", label: "Postponed" },
      cancelled: { variant: "outline", label: "Cancelled" },
    };

    const config = statusConfig[status] || {
      variant: "outline",
      label: status,
    };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatMatchTime = (
    scheduledAt: string,
    status: string,
    minute?: number
  ) => {
    if (status === "live" && minute) {
      return `${minute}'`;
    }
    if (status === "finished") {
      return "FT";
    }
    const date = new Date(scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const liveMatches = matches.filter((m) => m.status === "live");
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Live Scores
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Real-time match updates and scores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              {autoRefresh ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-destructive">
                {liveMatches.length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Activity className="h-3 w-3 md:h-4 md:w-4" />
                Live Now
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-primary">
                {scheduledMatches.length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                Upcoming
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold">
                {finishedMatches.length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                Finished
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {(["all", "live", "scheduled", "finished"] as FilterStatus[]).map(
            (status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize shrink-0"
              >
                {status}
              </Button>
            )
          )}
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-sm text-muted-foreground">
                {filterStatus === "all"
                  ? "No matches available at the moment"
                  : `No ${filterStatus} matches at the moment`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {matches.map((match) => (
              <Card
                key={match.id}
                className={`${
                  match.live ? "border-destructive border-2" : ""
                } hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-4">
                  {/* League Info */}
                  {match.league && (
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      {match.league.logo && (
                        <Image
                          src={match.league.logo}
                          alt={match.league.name}
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span className="text-xs md:text-sm font-medium">
                        {match.league.name}
                      </span>
                      {match.league.country && (
                        <span className="text-xs text-muted-foreground">
                          • {match.league.country}
                        </span>
                      )}
                      <div className="ml-auto">
                        {getStatusBadge(match.status)}
                      </div>
                    </div>
                  )}

                  {/* Match Details */}
                  <div className="flex items-center gap-4">
                    {/* Teams */}
                    <div className="flex-1">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 mb-2">
                        {match.homeTeamLogo && (
                          <Image
                            src={match.homeTeamLogo}
                            alt={match.homeTeam}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        )}
                        <span className="font-medium text-sm md:text-base">
                          {match.homeTeam}
                        </span>
                      </div>
                      {/* Away Team */}
                      <div className="flex items-center gap-2">
                        {match.awayTeamLogo && (
                          <Image
                            src={match.awayTeamLogo}
                            alt={match.awayTeam}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        )}
                        <span className="font-medium text-sm md:text-base">
                          {match.awayTeam}
                        </span>
                      </div>
                    </div>

                    {/* Score/Time */}
                    <div className="text-center min-w-20">
                      {match.status === "live" ||
                      match.status === "finished" ? (
                        <>
                          <div className="text-2xl md:text-3xl font-bold mb-1">
                            {match.homeTeamScore ?? 0}
                          </div>
                          <div className="text-2xl md:text-3xl font-bold">
                            {match.awayTeamScore ?? 0}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm md:text-base font-medium text-muted-foreground">
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {formatMatchTime(
                            match.scheduledAt,
                            match.status,
                            match.minute
                          )}
                        </div>
                      )}
                    </div>

                    {/* Match Time/Status */}
                    <div className="text-right min-w-[60px]">
                      <div className="text-xs md:text-sm font-medium">
                        {formatMatchTime(
                          match.scheduledAt,
                          match.status,
                          match.minute
                        )}
                      </div>
                      {match.venue && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {match.venue}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Events for Live Matches */}
                  {match.live &&
                    match.recentEvents &&
                    match.recentEvents.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-2">
                          Recent Events:
                        </div>
                        <div className="space-y-1">
                          {match.recentEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs flex items-center gap-2"
                            >
                              <span className="font-mono text-muted-foreground">
                                {event.minute}&apos;
                              </span>
                              <span className="capitalize">{event.type}</span>
                              {event.player && (
                                <span className="text-muted-foreground">
                                  - {event.player}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
