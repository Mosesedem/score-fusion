"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  TrendingUp,
  Wallet,
  Target,
  Activity,
  Crown,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Prediction {
  id: string;
  title: string;
  summary: string;
  odds?: number;
  sport: string;
  league?: string;
  matchDate?: string;
  homeTeam?: { name: string; logoUrl?: string };
  awayTeam?: { name: string; logoUrl?: string };
  predictedOutcome?: string;
  result?: string;
  isVIP: boolean;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore: number;
  awayTeamScore: number;
  status: string;
  minute?: number;
  league: { name: string };
  sport: { displayName: string };
}

interface VIPStatus {
  success: boolean;
  hasAccess: boolean;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  tokenAccess?: {
    expiresAt: string;
    remaining: number;
  } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isVIP, setIsVIP] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch VIP status if user is logged in and not a guest
        if (user && !user.guest) {
          const vipRes = await fetch("/api/vip/status");
          const vipData: VIPStatus = await vipRes.json();
          if (vipData.success) {
            setIsVIP(vipData.hasAccess);
          }
        }

        // Fetch predictions - VIP if user has access, otherwise free
        const predictionsRes = await fetch(
          `/api/predictions?vip=${isVIP}&limit=3`
        );
        const predictionsData = await predictionsRes.json();

        if (predictionsData.success) {
          setPredictions(predictionsData.data.predictions);
        } else if (isVIP && !user?.guest) {
          // If VIP predictions fail, fallback to free predictions
          const freeRes = await fetch("/api/predictions?vip=false&limit=3");
          const freeData = await freeRes.json();
          if (freeData.success) {
            setPredictions(freeData.data.predictions);
          }
        }

        // Fetch live matches
        const matchesRes = await fetch(
          "/api/livescores/matches?status=live&limit=5"
        );
        const matchesData = await matchesRes.json();
        if (matchesData.success) {
          setLiveMatches(matchesData.data.matches);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, isVIP]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.displayName || "Punter"}!
          </h1>
          <p className="text-muted-foreground">
            Your personalized sports prediction dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Predictions Tracked
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Track your predictions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Your prediction accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Referral Earnings
              </CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                From referrals & achievements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Predictions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending outcomes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Latest Predictions & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Predictions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {isVIP
                      ? "Latest VIP Predictions"
                      : "Latest Free Predictions"}
                  </CardTitle>
                  <Link
                    href="/tips"
                    className="text-sm text-primary hover:underline"
                  >
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Loading predictions...</p>
                  </div>
                ) : predictions.length > 0 ? (
                  <div className="space-y-4">
                    {predictions.map((pred) => (
                      <Link
                        key={pred.id}
                        href={`/tips?id=${pred.id}`}
                        className="block"
                      >
                        <div className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {pred.title}
                              </h3>
                              {pred.homeTeam && pred.awayTeam && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  {pred.homeTeam.name} vs {pred.awayTeam.name}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {pred.summary}
                              </p>
                            </div>
                            {pred.isVIP && (
                              <Crown className="h-5 w-5 text-amber-500 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{pred.sport}</span>
                            {pred.odds && <span>Odds: {pred.odds}</span>}
                            {pred.predictedOutcome && (
                              <span className="text-primary font-medium">
                                {pred.predictedOutcome}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No predictions available yet</p>
                    <p className="text-sm mt-2">
                      New predictions will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Prediction Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Your Prediction Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start tracking predictions to see analytics</p>
                  <p className="text-sm mt-2">
                    View your success rates, trends, and insights
                  </p>
                  <Link href="/analytics">
                    <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                      View Analytics
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Live Matches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Live Matches
                  </CardTitle>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    Real-time
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Loading live matches...</p>
                  </div>
                ) : liveMatches.length > 0 ? (
                  <div className="space-y-3">
                    {liveMatches.map((match) => (
                      <Link
                        key={match.id}
                        href={`/livescores?match=${match.id}`}
                        className="block"
                      >
                        <div className="border border-border rounded-lg p-3 hover:bg-accent transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-muted-foreground">
                              {match.league.name} • {match.sport.displayName}
                            </div>
                            {match.minute && (
                              <div className="flex items-center gap-1 text-xs font-medium text-red-500">
                                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                                {match.minute}&apos;
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {match.homeTeam}
                                </span>
                                <span className="text-xl font-bold">
                                  {match.homeTeamScore}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {match.awayTeam}
                                </span>
                                <span className="text-xl font-bold">
                                  {match.awayTeamScore}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No live matches at the moment</p>
                    <p className="text-sm mt-2">
                      Check back during match hours
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* VIP Access - Hide if user is VIP */}
            {!isVIP && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    VIP Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upgrade to VIP for premium predictions with expert analysis
                    and winning ticket snapshots
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Exclusive premium predictions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Expert analysis & insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Ticket snapshots for proof</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Higher success rates</span>
                    </li>
                  </ul>
                  <Link href="/vip">
                    <button className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                      Get VIP Access
                    </button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/tips">
                  <button className="w-full border-2 border-border py-2 px-4 rounded-md hover:bg-accent transition-colors text-sm text-left">
                    📊 View All Predictions
                  </button>
                </Link>
                <Link href="/history">
                  <button className="w-full border-2 border-border py-2 px-4 rounded-md hover:bg-accent transition-colors text-sm text-left">
                    📈 Prediction History
                  </button>
                </Link>
                <Link href="/referral">
                  <button className="w-full border-2 border-border py-2 px-4 rounded-md hover:bg-accent transition-colors text-sm text-left">
                    💰 Refer & Earn
                  </button>
                </Link>
                <Link href="/analytics">
                  <button className="w-full border-2 border-border py-2 px-4 rounded-md hover:bg-accent transition-colors text-sm text-left">
                    📉 View Analytics
                  </button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="text-sm">💡 Punter Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track predictions consistently to improve your analysis skills
                  and make better-informed decisions!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
