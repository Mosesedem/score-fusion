"use client";

import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Wallet, Crown, Activity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

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
  const api = useApiClient();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isVIP, setIsVIP] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        let vipStatus = false;
        // Fetch VIP status if user is logged in and not a guest
        if (user && !user.guest) {
          const vipRes = await api.get("/vip/status");
          if (vipRes.success) {
            const vipData = vipRes.data as VIPStatus;
            setIsVIP(vipData.hasAccess);
            vipStatus = vipData.hasAccess;
          }
        }

        // Fetch predictions - VIP if user has access, otherwise free
        const predictionsRes = await api.get(
          `/predictions?vip=${vipStatus}&limit=3`
        );

        if (predictionsRes.success) {
          const predictionsData = predictionsRes.data as {
            predictions: Prediction[];
          };
          setPredictions(predictionsData.predictions);
        } else if (vipStatus && !user?.guest) {
          // If VIP predictions fail, fallback to free predictions
          const freeRes = await api.get("/predictions?vip=false&limit=3");
          if (freeRes.success) {
            const freeData = freeRes.data as { predictions: Prediction[] };
            setPredictions(freeData.predictions);
          }
        }

        // Fetch live matches
        const matchesRes = await api.get(
          "/livescores/matches?status=live&limit=5"
        );
        if (matchesRes.success) {
          const matchesData = matchesRes.data as { matches: Match[] };
          setLiveMatches(matchesData.matches);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, api]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header - Compact for mobile */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
            Hey, {user?.displayName || "Punter"}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your winning predictions start here
          </p>
        </div>

        {/* Stats Grid - 2x2 on mobile with actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Link href="/history">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-0.5">0%</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Win Rate
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/referral">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-0.5">$0</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Earned
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tips">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-0.5">
                  {predictions.length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Tips Today
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/livescores">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-0.5">
                  {liveMatches.length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Live Now
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Latest Predictions */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                {isVIP && <Crown className="h-4 w-4 text-amber-500" />}
                {isVIP ? "VIP Tips" : "Today's Tips"}
              </h2>
              <Link
                href="/tips"
                className="text-xs sm:text-sm text-primary hover:underline font-medium"
              >
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-sm">Loading tips...</p>
              </div>
            ) : predictions.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {predictions.map((pred) => (
                  <Link
                    key={pred.id}
                    href={`/tips/${pred.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-lg transition-all hover:border-primary/50">
                      <CardContent className="p-3 sm:p-4">
                        {/* Match Teams with Logos */}
                        {pred.homeTeam && pred.awayTeam ? (
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {pred.homeTeam.logoUrl && (
                                  <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                    <img
                                      src={pred.homeTeam.logoUrl}
                                      alt={pred.homeTeam.name}
                                      // fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <span className="font-semibold text-sm sm:text-base truncate">
                                  {pred.homeTeam.name}
                                </span>
                              </div>
                              <div className="px-2 py-1 bg-muted rounded text-xs font-bold">
                                VS
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                <span className="font-semibold text-sm sm:text-base truncate">
                                  {pred.awayTeam.name}
                                </span>
                                {pred.awayTeam.logoUrl && (
                                  <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                    <img
                                      src={pred.awayTeam.logoUrl}
                                      alt={pred.awayTeam.name}
                                      // fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-sm sm:text-base mb-2">
                            {pred.title}
                          </h3>
                        )}

                        {/* League & Sport */}
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2">
                          <span className="px-2 py-0.5 bg-secondary rounded">
                            {pred.sport}
                          </span>
                          {pred.league && (
                            <span className="truncate">{pred.league}</span>
                          )}
                        </div>

                        {/* Prediction Summary */}
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                          {pred.summary}
                        </p>

                        {/* Footer - Odds & Prediction */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          {pred.predictedOutcome && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                Prediction:
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-primary">
                                {pred.predictedOutcome}
                              </span>
                            </div>
                          )}
                          {pred.odds && (
                            <div className="px-2 py-1 bg-primary/10 text-primary rounded font-bold text-xs sm:text-sm">
                              {pred.odds}
                            </div>
                          )}
                          {pred.isVIP && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-medium">No tips available</p>
                  <p className="text-xs mt-1">Check back soon for new tips</p>
                </CardContent>
              </Card>
            )}

            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    Live Now
                  </h2>
                  <Link
                    href="/livescores"
                    className="text-xs sm:text-sm text-primary hover:underline font-medium"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {liveMatches.slice(0, 3).map((match) => (
                    <Link
                      key={match.id}
                      href={`/livescores?match=${match.id}`}
                      className="block"
                    >
                      <Card className="hover:shadow-lg transition-all hover:border-red-500/50">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate flex-1">
                              {match.league.name}
                            </div>
                            {match.minute && (
                              <div className="flex items-center gap-1 text-xs font-bold text-red-500 ml-2">
                                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                                {match.minute}&apos;
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm sm:text-base font-medium truncate flex-1">
                                {match.homeTeam}
                              </span>
                              <span className="text-lg sm:text-xl font-bold ml-2">
                                {match.homeTeamScore}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm sm:text-base font-medium truncate flex-1">
                                {match.awayTeam}
                              </span>
                              <span className="text-lg sm:text-xl font-bold ml-2">
                                {match.awayTeamScore}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* VIP Access Card */}
            {!isVIP && (
              <Card className="border-primary">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Crown className="h-6 w-6 sm:h-8 sm:w-8shrink-0" />
                    <div>
                      <h3 className="font-bold text-base sm:text-lg mb-1">
                        Go VIP
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Get exclusive premium tips with proven results
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4 text-xs sm:text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Higher win rates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Expert analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>VIP Updates & correct scores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span>Winning ticket proof</span>
                    </li>
                  </ul>
                  <Link href="/vip" className="block">
                    <button className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all text-sm">
                      Upgrade Now
                    </button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions - Simplified for mobile */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/tips" className="block">
                  <button className="w-full text-left border-2 border-border py-2.5 px-3 rounded-lg hover:bg-accent transition-colors text-xs sm:text-sm font-medium">
                    📊 All Tips
                  </button>
                </Link>
                <Link href="/referral" className="block">
                  <button className="w-full text-left border-2 border-border py-2.5 px-3 rounded-lg hover:bg-accent transition-colors text-xs sm:text-sm font-medium">
                    � Earn Money
                  </button>
                </Link>
                <Link href="/livescores" className="block">
                  <button className="w-full text-left border-2 border-border py-2.5 px-3 rounded-lg hover:bg-accent transition-colors text-xs sm:text-sm font-medium">
                    ⚡ Live Scores
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tip */}
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <h3 className="font-bold text-xs sm:text-sm">Pro Tip</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Consistent tracking improves your prediction skills. Start
                  following tips today!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
