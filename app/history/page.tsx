"use client";

import { useSession } from "next-auth/react";
import { useApiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Crown, Lock } from "lucide-react";
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
                <div className="text-center py-8 md:py-12 text-muted-foreground text-xs md:text-sm">
                  Loading history...
                </div>
              ) : allPredictions.filter((t) =>
                  filter === "all"
                    ? true
                    : filter === "free"
                    ? !t.isVIP
                    : t.isVIP
                ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                  {[...allPredictions]
                    .filter((t) =>
                      filter === "all"
                        ? true
                        : filter === "free"
                        ? !t.isVIP
                        : t.isVIP
                    )
                    .map((tip) => (
                      <div
                        key={tip.id}
                        className={`border-2 ${
                          tip.result === "won"
                            ? "border-emerald-500"
                            : tip.isVIP
                            ? "border-primary/50"
                            : "border-muted"
                        } rounded-lg p-3 md:p-4 hover:border-primary transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mb-1.5">
                              <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span>
                                {tip.matchDate
                                  ? new Date(tip.matchDate).toLocaleString(
                                      "en-NG",
                                      { timeZone: "Africa/Lagos" }
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                            <h4 className="text-muted-foreground text-sm md:text-base mb-1 md:mb-2 line-clamp-2">
                              {tip.title}
                            </h4>
                            <div className="space-y-1 text-[10px] md:text-xs">
                              {tip.predictedOutcome && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Prediction:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {tip.predictedOutcome}
                                  </span>
                                </div>
                              )}
                              {tip.confidenceLevel && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Confidence Level:{" "}
                                  </span>
                                  <span className="font-medium">
                                    {tip.confidenceLevel}%
                                  </span>
                                </div>
                              )}
                              {tip.result && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Result:{" "}
                                  </span>
                                  <span
                                    className={`font-medium capitalize ${
                                      tip.result === "won"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : tip.result === "lost"
                                        ? "text-red-500"
                                        : ""
                                    }`}
                                  >
                                    {tip.result}
                                  </span>
                                </div>
                              )}
                            </div>
                            {tip.tipResult && (
                              <details className="mt-2">
                                <summary className="text-[10px] md:text-xs font-medium cursor-pointer text-primary hover:text-primary/80">
                                  Tip Result Details
                                </summary>
                                <div className="mt-1 space-y-1 text-[10px] md:text-xs pl-2 border-l-2 border-primary/20">
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
                            {(tip.homeTeam || tip.awayTeam) && (
                              <div className="flex items-center gap-2 text-sm md:text-base font-bold mb-2">
                                {tip.homeTeam && (
                                  <div className="flex items-center gap-1">
                                    {tip.homeTeam.logoUrl && (
                                      <img
                                        src={tip.homeTeam.logoUrl}
                                        alt={tip.homeTeam.name}
                                        className="h-4 w-4 md:h-5 md:w-5 object-contain"
                                      />
                                    )}
                                    <span>
                                      {tip.homeTeam.shortName ||
                                        tip.homeTeam.name}
                                    </span>
                                  </div>
                                )}
                                <span className="text-muted-foreground font-normal text-sm md:text-base">
                                  vs
                                </span>
                                {tip.awayTeam && (
                                  <div className="flex items-center gap-1">
                                    {tip.awayTeam.logoUrl && (
                                      <img
                                        src={tip.awayTeam.logoUrl}
                                        alt={tip.awayTeam.name}
                                        className="h-4 w-4 md:h-5 md:w-5 object-contain"
                                      />
                                    )}
                                    <span>
                                      {tip.awayTeam.shortName ||
                                        tip.awayTeam.name}
                                    </span>
                                  </div>
                                )}
                                {tip.matchResult && (
                                  <span
                                    className={`text-xs md:text-sm font-medium ml-2 ${
                                      tip.result === "won"
                                        ? "text-emerald-700 dark:text-emerald-400"
                                        : "text-primary"
                                    }`}
                                  >
                                    {tip.matchResult}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {tip.odds && (
                              <>
                                <div className="text-base md:text-lg lg:text-xl font-bold text-primary">
                                  {/* {tip.odds} */}
                                  {Number(tip.odds).toFixed(2)}
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
                            {tip.isVIP &&
                            !hasVIPAccess &&
                            tip.matchDate &&
                            new Date() <
                              new Date(
                                new Date(tip.matchDate).getTime() +
                                  8 * 60 * 60 * 1000
                              ) ? (
                              <>
                                <Lock className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                                Unlock Full Analysis
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                                View Details
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
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
