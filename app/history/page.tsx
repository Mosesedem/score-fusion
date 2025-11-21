"use client";

import { useSession } from "next-auth/react";
import { useApiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface Tip {
  id: string;
  title: string;
  summary?: string;
  content: string;
  odds?: number;
  oddsSource?: string;
  sport: string;
  league?: string;
  matchDate?: string;
  homeTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  };
  awayTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  };
  predictionType?: string;
  predictedOutcome?: string;
  confidenceLevel?: number;
  ticketSnapshots: string[];
  isVIP: boolean;
  featured: boolean;
  status: string;
  result?: string;
  successRate?: number;
  createdAt: string;
  authorName?: string;
  matchResult?: string;
  tipResult?: {
    id: string;
    settledAt: string;
    outcome: string;
    payout?: number;
    createdAt: string;
  };
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const api = useApiClient();
  const [allPredictions, setAllPredictions] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "vip">("all");
  const [hasVIPAccess, setHasVIPAccess] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all historical predictions
      const response = await api.get<{ predictions: Tip[] }>(
        "/predictions?history=true"
      );
      const historical = response.data?.predictions || [];
      historical.sort((a, b) => {
        const aDate = a.matchDate ? new Date(a.matchDate).getTime() : -Infinity;
        const bDate = b.matchDate ? new Date(b.matchDate).getTime() : -Infinity;
        return bDate - aDate;
      });

      setAllPredictions(historical);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (session) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [session, fetchHistory]);

  useEffect(() => {
    const checkVIPAccess = async () => {
      try {
        const res = await api.get("/vip/status");
        if (res.success) {
          const data = res.data as { hasAccess: boolean };
          setHasVIPAccess(data.hasAccess);
        }
      } catch (error) {
        console.error("Failed to check VIP access:", error);
      }
    };

    checkVIPAccess();
  }, [api]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
            Predictions History
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-8">
            View all completed predictions and their outcomes
          </p>

          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-8">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="text-xs md:text-sm"
              size="sm"
            >
              All Predictions
            </Button>
            <Button
              variant={filter === "free" ? "default" : "outline"}
              onClick={() => setFilter("free")}
              className="text-xs md:text-sm"
              size="sm"
            >
              Free Predictions
            </Button>
            <Button
              variant={filter === "vip" ? "default" : "outline"}
              onClick={() => setFilter("vip")}
              className="text-xs md:text-sm flex items-center gap-1"
              size="sm"
            >
              <Crown className="h-3 w-3 md:h-4 md:w-4" />
              VIP Predictions
            </Button>
          </div>

          <Card>
            <CardHeader className="p-3 md:p-4 lg:p-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                Completed Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
                  <p className="text-sm">Loading history...</p>
                </div>
              ) : allPredictions.filter((t) =>
                  filter === "all"
                    ? true
                    : filter === "free"
                    ? !t.isVIP
                    : t.isVIP
                ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {[...allPredictions]
                    .filter((t) =>
                      filter === "all"
                        ? true
                        : filter === "free"
                        ? !t.isVIP
                        : t.isVIP
                    )
                    .map((tip) => (
                      <Link
                        key={tip.id}
                        href={`/tips/${tip.id}`}
                        className="block"
                      >
                        <Card className="hover:shadow-lg transition-all hover:border-primary/50">
                          <CardContent className="p-3 sm:p-4">
                            {/* Match Teams with Logos */}
                            {tip.homeTeam && tip.awayTeam ? (
                              <div className="mb-3">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {tip.homeTeam.logoUrl && (
                                      <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                        <img
                                          src={tip.homeTeam.logoUrl}
                                          alt={tip.homeTeam.name}
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                    <span className="font-semibold text-sm sm:text-base truncate">
                                      {tip.homeTeam.name}
                                    </span>
                                  </div>
                                  <div className="px-2 py-1 bg-muted rounded text-xs font-bold">
                                    VS
                                  </div>
                                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                    <span className="font-semibold text-sm sm:text-base truncate">
                                      {tip.awayTeam.name}
                                    </span>
                                    {tip.awayTeam.logoUrl && (
                                      <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                        <img
                                          src={tip.awayTeam.logoUrl}
                                          alt={tip.awayTeam.name}
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <h3 className="font-semibold text-sm sm:text-base mb-2">
                                {tip.title}
                              </h3>
                            )}

                            {/* League & Sport */}
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2">
                              <span className="px-2 py-0.5 bg-secondary rounded">
                                {tip.sport}
                              </span>
                              {tip.league && (
                                <span className="truncate">{tip.league}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-[14px] sm:text-xs text-muted-foreground mb-2">
                              {tip.matchDate && (
                                <span className="truncate">
                                  {new Date(tip.matchDate).toLocaleString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    }
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Prediction Summary */}
                            {tip.summary && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                                {tip.summary}
                              </p>
                            )}

                            {/* Tip Result Details */}
                            {tip.tipResult && (
                              <details className="mb-3">
                                <summary className="text-[10px] md:text-xs lg:text-sm font-medium cursor-pointer text-primary hover:text-primary/80">
                                  Tip Result Details
                                </summary>
                                <div className="mt-1 space-y-1 text-[10px] md:text-xs lg:text-sm pl-2 border-l-2 border-primary/20">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Settled At:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {new Date(
                                        tip.tipResult.settledAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Outcome:{" "}
                                    </span>
                                    <span className="font-medium capitalize">
                                      {tip.tipResult.outcome}
                                    </span>
                                  </div>
                                  {tip.tipResult.payout && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Payout:{" "}
                                      </span>
                                      <span className="font-medium">
                                        €{tip.tipResult.payout}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}

                            {/* Footer - Odds & Prediction */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              {tip.predictedOutcome && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    Prediction:
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-primary">
                                    {tip.predictedOutcome}
                                  </span>
                                </div>
                              )}
                              {tip.odds && (
                                <div className="px-2 py-1 bg-primary/10 text-primary rounded font-bold text-xs sm:text-sm">
                                  Odds: {Number(tip.odds).toFixed(2)}
                                </div>
                              )}
                              {tip.isVIP && (
                                <Crown className="h-4 w-4 text-amber-500" />
                              )}
                              {tip.result === "won" && (
                                <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                                  Won
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base lg:text-lg">
                    No completed predictions yet
                  </p>
                  <p className="text-xs md:text-sm mt-2">
                    Completed predictions will appear here after matches
                    conclude
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
