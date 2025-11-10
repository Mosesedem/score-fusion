"use client";

import { useSession } from "next-auth/react";
import { useApiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, TrendingUp, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface Bet {
  id: string;
  amount: number;
  odds: number;
  status: string;
  result?: string;
  createdAt: string;
  tip: {
    id: string;
    title: string;
    sport: string;
    isVIP: boolean;
    matchDate?: string;
    predictedOutcome?: string;
  };
}

interface Tip {
  id: string;
  title: string;
  sport: string;
  league?: string;
  isVIP: boolean;
  matchDate?: string;
  result?: string;
  predictedOutcome?: string;
  odds?: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const api = useApiClient();
  const [bets, setBets] = useState<Bet[]>([]);
  const [vipPredictions, setVipPredictions] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bets" | "predictions">(
    "predictions"
  );

  const fetchBets = useCallback(async () => {
    try {
      const response = await api.get<{ bets: Bet[] }>("/bets");
      setBets(response.data?.bets || []);
    } catch (error) {
      console.error("Failed to fetch bets:", error);
    }
  }, [api]);

  const fetchVIPHistory = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch VIP predictions that have ended (older than 2 hours from match date)
      const response = await api.get<{ predictions: Tip[] }>(
        "/predictions?vip=true"
      );
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Filter VIP predictions that are older than 2 hours from match date
      const historicalVIP = (response.data?.predictions || []).filter(
        (tip: Tip) => {
          if (!tip.matchDate) return false;
          const matchDate = new Date(tip.matchDate);
          return matchDate < twoHoursAgo;
        }
      );

      setVipPredictions(historicalVIP);
    } catch (error) {
      console.error("Failed to fetch VIP history:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (session) {
      fetchBets();
      fetchVIPHistory();
    } else {
      setLoading(false);
    }
  }, [session, fetchBets, fetchVIPHistory]);

  const getResultBadge = (result?: string) => {
    if (!result) return null;
    const colors = {
      won: "bg-green-500 text-white",
      lost: "bg-red-500 text-white",
      void: "bg-gray-500 text-white",
      pending: "bg-blue-500 text-white",
    };
    return (
      <Badge
        className={`${
          colors[result as keyof typeof colors] || colors.pending
        } text-[10px] md:text-xs px-1.5 md:px-2 py-0.5`}
      >
        {result.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
            {session ? "Your History" : "Betting History"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-8">
            {session
              ? "Track all your bets and view completed VIP predictions"
              : "Track all your bets and their outcomes"}
          </p>

          {!session && (
            <Card className="mb-4 md:mb-8 border-2 border-primary">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center">
                <h3 className="text-base md:text-lg lg:text-xl font-bold mb-2">
                  Sign in to view your betting history
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  Create an account or log in to track your bets
                </p>
                <Link href="/login">
                  <Button size="sm" className="text-xs md:text-sm">
                    Log In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {session && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4 md:mb-6 border-b border-border">
                <Button
                  variant={activeTab === "bets" ? "default" : "ghost"}
                  onClick={() => setActiveTab("bets")}
                  className="text-xs md:text-sm rounded-b-none"
                  size="sm"
                  disabled
                >
                  My Bets ({bets.length})
                </Button>
                <Button
                  variant={activeTab === "predictions" ? "default" : "ghost"}
                  onClick={() => setActiveTab("predictions")}
                  className="text-xs md:text-sm rounded-b-none"
                  size="sm"
                >
                  <Lock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  VIP History ({vipPredictions.length})
                </Button>
              </div>
            </>
          )}

          {/* Bets Tab */}
          {activeTab === "bets" && (
            <Card>
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="text-base md:text-lg">All Bets</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                {loading ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground text-xs md:text-sm">
                    Loading history...
                  </div>
                ) : bets.length > 0 ? (
                  <div className="space-y-2 md:space-y-4">
                    {bets.map((bet) => (
                      <div
                        key={bet.id}
                        className="border-2 border-border rounded-lg p-3 md:p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                              <Badge className="bg-secondary text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                {bet.tip.sport}
                              </Badge>
                              {bet.tip.isVIP && (
                                <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                  <Lock className="h-2 w-2 md:h-2.5 md:w-2.5 mr-0.5 md:mr-1" />
                                  VIP
                                </Badge>
                              )}
                              {bet.result &&
                                getResultBadge(bet.result.toLowerCase())}
                            </div>
                            <h4 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">
                              {bet.tip.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                              <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span>
                                {new Date(bet.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {bet.tip.predictedOutcome && (
                              <div className="mt-1 md:mt-2 text-[10px] md:text-xs">
                                <span className="text-muted-foreground">
                                  Prediction:{" "}
                                </span>
                                <span className="font-medium">
                                  {bet.tip.predictedOutcome}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base md:text-lg lg:text-xl font-bold text-primary">
                              ${bet.amount}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              @ {bet.odds}
                            </div>
                            {bet.result && (
                              <div className="text-xs md:text-sm font-medium mt-1">
                                {bet.result === "WON" ? (
                                  <span className="text-green-500">
                                    +${(bet.amount * (bet.odds - 1)).toFixed(2)}
                                  </span>
                                ) : bet.result === "LOST" ? (
                                  <span className="text-red-500">
                                    -${bet.amount}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {bet.status}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Link href={`/tips/${bet.tip.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] md:text-xs"
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-50" />
                    <p className="text-sm md:text-base lg:text-lg">
                      No betting history yet
                    </p>
                    <p className="text-xs md:text-sm mt-2">
                      Your bet history will appear here once you start placing
                      bets
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* VIP Predictions History Tab */}
          {activeTab === "predictions" && session && (
            <Card>
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5" />
                  Completed VIP Predictions
                </CardTitle>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  VIP predictions that have concluded (2+ hours after match
                  time)
                </p>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                {loading ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground text-xs md:text-sm">
                    Loading VIP history...
                  </div>
                ) : vipPredictions.length > 0 ? (
                  <div className="space-y-2 md:space-y-4">
                    {vipPredictions.map((tip) => (
                      <div
                        key={tip.id}
                        className="border-2 border-primary/50 rounded-lg p-3 md:p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                              <Badge className="bg-secondary text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                {tip.sport}
                              </Badge>
                              {tip.league && (
                                <Badge className="bg-secondary text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                  {tip.league}
                                </Badge>
                              )}
                              {tip.result && getResultBadge(tip.result)}
                            </div>
                            <h4 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">
                              {tip.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mb-1">
                              <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span>
                                Match:{" "}
                                {tip.matchDate
                                  ? new Date(tip.matchDate).toLocaleString()
                                  : "N/A"}
                              </span>
                            </div>
                            {tip.predictedOutcome && (
                              <div className="text-[10px] md:text-xs">
                                <span className="text-muted-foreground">
                                  Prediction:{" "}
                                </span>
                                <span className="font-medium">
                                  {tip.predictedOutcome}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {tip.odds && (
                              <>
                                <div className="text-base md:text-lg lg:text-xl font-bold text-primary">
                                  {tip.odds}
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">
                                  Odds
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <Link href={`/tips/${tip.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] md:text-xs"
                          >
                            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <Lock className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-50" />
                    <p className="text-sm md:text-base lg:text-lg">
                      No completed VIP predictions yet
                    </p>
                    <p className="text-xs md:text-sm mt-2">
                      Completed VIP predictions will appear here after matches
                      conclude
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
