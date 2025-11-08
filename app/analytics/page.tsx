"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Percent,
  Award,
  Clock,
} from "lucide-react";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: string;
  minute?: number;
  scheduledAt: string;
  league?: {
    name: string;
    country: string;
  };
  statistics?: {
    possession?: { home: number; away: number };
    shots?: { home: number; away: number };
    shotsOnTarget?: { home: number; away: number };
    corners?: { home: number; away: number };
    fouls?: { home: number; away: number };
    yellowCards?: { home: number; away: number };
    redCards?: { home: number; away: number };
  };
}

interface Tip {
  id: string;
  title: string;
  sport: string;
  result?: "won" | "lost" | "void" | "pending";
  successRate?: number;
  odds?: number;
}

interface Analytics {
  totalMatches: number;
  liveMatches: number;
  completedToday: number;
  tipPerformance: {
    total: number;
    won: number;
    lost: number;
    pending: number;
    successRate: number;
  };
  leagueStats: {
    league: string;
    matches: number;
    avgGoals: number;
  }[];
  trendingTeams: {
    team: string;
    wins: number;
    draws: number;
    losses: number;
    form: string;
  }[];
}

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMatches: 0,
    liveMatches: 0,
    completedToday: 0,
    tipPerformance: {
      total: 0,
      won: 0,
      lost: 0,
      pending: 0,
      successRate: 0,
    },
    leagueStats: [],
    trendingTeams: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch real-time data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all matches for today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [matchesRes, liveMatchesRes, tipsRes] = await Promise.all([
        fetch(
          `/api/livescores/matches?sport=football&dateFrom=${today.toISOString()}&dateTo=${tomorrow.toISOString()}&limit=50`
        ),
        fetch("/api/livescores/matches?status=live&sport=football&limit=20"),
        fetch("/api/tips?sport=football&limit=50"),
      ]);

      let allMatches: Match[] = [];
      let live: Match[] = [];
      let allTips: Tip[] = [];

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        if (matchesData.success && matchesData.data?.matches) {
          allMatches = matchesData.data.matches;
        }
      }

      if (liveMatchesRes.ok) {
        const liveData = await liveMatchesRes.json();
        if (liveData.success && liveData.data?.matches) {
          live = liveData.data.matches;
        }
      }

      if (tipsRes.ok) {
        const tipsData = await tipsRes.json();
        if (tipsData.success && tipsData.data?.tips) {
          allTips = tipsData.data.tips;
        }
      }

      setMatches(allMatches);
      setLiveMatches(live);

      // Calculate analytics
      calculateAnalytics(allMatches, live, allTips);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    allMatches: Match[],
    live: Match[],
    allTips: Tip[]
  ) => {
    // Match analytics
    const completedMatches = allMatches.filter(
      (m) => m.status === "finished"
    ).length;

    // Tip performance
    const wonTips = allTips.filter((t) => t.result === "won").length;
    const lostTips = allTips.filter((t) => t.result === "lost").length;
    const pendingTips = allTips.filter((t) => t.result === "pending").length;
    const totalTips = allTips.length;
    const successRate =
      wonTips + lostTips > 0 ? (wonTips / (wonTips + lostTips)) * 100 : 0;

    // League statistics
    const leagueMap = new Map<
      string,
      { matches: number; totalGoals: number }
    >();
    allMatches.forEach((match) => {
      if (match.league?.name && match.status === "finished") {
        const league = match.league.name;
        const goals = (match.homeTeamScore || 0) + (match.awayTeamScore || 0);
        const existing = leagueMap.get(league) || { matches: 0, totalGoals: 0 };
        leagueMap.set(league, {
          matches: existing.matches + 1,
          totalGoals: existing.totalGoals + goals,
        });
      }
    });

    const leagueStats = Array.from(leagueMap.entries())
      .map(([league, data]) => ({
        league,
        matches: data.matches,
        avgGoals: data.matches > 0 ? data.totalGoals / data.matches : 0,
      }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5);

    // Team form analysis (mock data for demonstration)
    const trendingTeams = [
      { team: "Manchester City", wins: 8, draws: 1, losses: 1, form: "WWWDW" },
      { team: "Liverpool", wins: 7, draws: 2, losses: 1, form: "WDWWW" },
      { team: "Arsenal", wins: 7, draws: 2, losses: 1, form: "WWDWW" },
      { team: "Real Madrid", wins: 9, draws: 0, losses: 1, form: "WWWWW" },
      { team: "Barcelona", wins: 8, draws: 1, losses: 1, form: "WWWWD" },
    ];

    setAnalytics({
      totalMatches: allMatches.length,
      liveMatches: live.length,
      completedToday: completedMatches,
      tipPerformance: {
        total: totalTips,
        won: wonTips,
        lost: lostTips,
        pending: pendingTips,
        successRate,
      },
      leagueStats,
      trendingTeams,
    });
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-green-500";
      case "D":
        return "bg-yellow-500";
      case "L":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Football Analytics</h1>
              <p className="text-muted-foreground">
                Real-time match statistics, performance metrics, and insights
              </p>
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Filters and Last Update */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("today")}
                size="sm"
              >
                Today
              </Button>
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("week")}
                size="sm"
              >
                This Week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("month")}
                size="sm"
              >
                This Month
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Matches
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalMatches}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Live Matches
              </CardTitle>
              <Activity className="h-4 w-4 text-primary animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analytics.liveMatches}
              </div>
              <p className="text-xs text-muted-foreground">Currently playing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Today
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.completedToday}
              </div>
              <p className="text-xs text-muted-foreground">Finished matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tip Success Rate
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {analytics.tipPerformance.successRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.tipPerformance.won}W /{" "}
                {analytics.tipPerformance.lost}L
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Live Matches with Stats */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary animate-pulse" />
                  Live Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading live matches...
                  </div>
                ) : liveMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No live matches at the moment
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liveMatches.map((match) => (
                      <div
                        key={match.id}
                        className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
                      >
                        {/* Match Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">
                              {match.league?.name || "Unknown League"}
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">
                                {match.homeTeam}
                              </span>
                              <span className="text-2xl font-bold">
                                {match.homeTeamScore ?? 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {match.awayTeam}
                              </span>
                              <span className="text-2xl font-bold">
                                {match.awayTeamScore ?? 0}
                              </span>
                            </div>
                          </div>
                          <div className="ml-6 text-center">
                            <div className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full mb-1">
                              LIVE
                            </div>
                            {match.minute && (
                              <div className="text-sm font-medium">
                                {match.minute}&apos;
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Match Statistics */}
                        {match.statistics && (
                          <div className="space-y-2 pt-4 border-t border-border">
                            {match.statistics.possession && (
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Possession</span>
                                  <span className="font-medium">
                                    {match.statistics.possession.home}% -{" "}
                                    {match.statistics.possession.away}%
                                  </span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-full transition-all"
                                    style={{
                                      width: `${match.statistics.possession.home}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 text-xs">
                              {match.statistics.shots && (
                                <div className="text-center">
                                  <div className="text-muted-foreground mb-1">
                                    Shots
                                  </div>
                                  <div className="font-semibold">
                                    {match.statistics.shots.home} -{" "}
                                    {match.statistics.shots.away}
                                  </div>
                                </div>
                              )}
                              {match.statistics.shotsOnTarget && (
                                <div className="text-center">
                                  <div className="text-muted-foreground mb-1">
                                    On Target
                                  </div>
                                  <div className="font-semibold">
                                    {match.statistics.shotsOnTarget.home} -{" "}
                                    {match.statistics.shotsOnTarget.away}
                                  </div>
                                </div>
                              )}
                              {match.statistics.corners && (
                                <div className="text-center">
                                  <div className="text-muted-foreground mb-1">
                                    Corners
                                  </div>
                                  <div className="font-semibold">
                                    {match.statistics.corners.home} -{" "}
                                    {match.statistics.corners.away}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* League Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  League Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.leagueStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No league data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.leagueStats.map((league, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{league.league}</span>
                          <span className="text-sm text-muted-foreground">
                            {league.matches} matches
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${(league.avgGoals / 5) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-16 text-right">
                            {league.avgGoals.toFixed(1)} goals/match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tip Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Tip Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Won</span>
                    <span className="font-semibold text-green-500">
                      {analytics.tipPerformance.won}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lost</span>
                    <span className="font-semibold text-red-500">
                      {analytics.tipPerformance.lost}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-yellow-500">
                      {analytics.tipPerformance.pending}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {analytics.tipPerformance.successRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate
                    </div>
                  </div>
                </div>

                <Link href="/tips">
                  <Button className="w-full" variant="outline">
                    View All Tips
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Trending Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Form Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.trendingTeams.map((team, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award
                            className={`h-4 w-4 ${
                              index === 0
                                ? "text-yellow-500"
                                : index === 1
                                ? "text-gray-400"
                                : index === 2
                                ? "text-orange-600"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">
                            {team.team}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {team.form.split("").map((result, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold text-white ${getFormColor(
                                result
                              )}`}
                            >
                              {result}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {team.wins}W {team.draws}D {team.losses}L
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/tips?sport=football">
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Football Tips
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
                <Link href="/vip">
                  <Button className="w-full justify-start" variant="outline">
                    <Trophy className="h-4 w-4 mr-2" />
                    VIP Access
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Matches Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today&apos;s Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading matches...
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No matches scheduled
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Time
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        League
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Match
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Score
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.slice(0, 15).map((match) => (
                      <tr
                        key={match.id}
                        className="border-b border-border hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm">
                          {new Date(match.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {match.league?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>{match.homeTeam}</div>
                          <div className="text-muted-foreground">
                            {match.awayTeam}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {match.status === "finished" ||
                          match.status === "live" ? (
                            <div>
                              {match.homeTeamScore ?? 0} -{" "}
                              {match.awayTeamScore ?? 0}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">vs</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              match.status === "live"
                                ? "bg-primary text-primary-foreground"
                                : match.status === "finished"
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {match.status === "live" && match.minute
                              ? `${match.minute}&apos;`
                              : match.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
