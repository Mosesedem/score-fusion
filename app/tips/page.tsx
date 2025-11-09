"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lock, Calendar, Target } from "lucide-react";

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
  ticketSnapshots: string[];
  isVIP: boolean;
  featured: boolean;
  status: string;
  result?: string;
  successRate?: number;
  createdAt: string;
  authorName?: string;
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "vip">("all");

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const res = await fetch("/api/tips");
      if (res.ok) {
        const data = await res.json();
        setTips(data.data?.tips || data.tips || []);
      }
    } catch (error) {
      console.error("Failed to fetch tips:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTips = tips.filter((tip) => {
    if (filter === "all") return true;
    if (filter === "free") return !tip.isVIP;
    if (filter === "vip") return tip.isVIP;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Expert Sports Predictions
            </h1>
            <p className="text-base md:text-xl text-muted-foreground">
              Data-driven analysis and predictions from professional analysts.
              Get free predictions and premium VIP tips.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <Target className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-lg md:text-xl font-bold">
                {tips.filter((t) => !t.isVIP).length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Free Predictions
              </div>
            </div>
            <div className="text-center">
              <Lock className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-lg md:text-xl font-bold">
                {tips.filter((t) => t.isVIP).length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                VIP Predictions
              </div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-lg md:text-xl font-bold">
                {tips.filter((t) => t.result === "won").length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Winning Predictions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips List */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="text-sm md:text-base"
              size="sm"
            >
              All Predictions
            </Button>
            <Button
              variant={filter === "free" ? "default" : "outline"}
              onClick={() => setFilter("free")}
              className="text-sm md:text-base"
              size="sm"
            >
              Free Predictions
            </Button>
            <Button
              variant={filter === "vip" ? "default" : "outline"}
              onClick={() => setFilter("vip")}
              className="text-sm md:text-base"
              size="sm"
            >
              <Lock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              VIP Predictions
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm md:text-base">
                Loading predictions...
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredTips.map((tip) => (
                <Card
                  key={tip.id}
                  className={`border-2 ${
                    tip.isVIP ? "border-primary" : "border-border"
                  } hover:border-primary transition-colors`}
                >
                  <CardHeader className="pb-3 p-4 md:p-6 md:pb-3">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <Badge className="bg-secondary text-xs">
                        {tip.sport}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        {tip.isVIP && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            <Lock className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {tip.featured && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Featured
                          </Badge>
                        )}
                        {tip.result && (
                          <Badge
                            className={`text-xs ${
                              tip.result === "won"
                                ? "bg-green-500 text-white"
                                : tip.result === "lost"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {tip.result.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base md:text-lg line-clamp-2">
                      {tip.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 md:pt-0">
                    {/* Team Match Display */}
                    {(tip.homeTeam || tip.awayTeam) && (
                      <div className="flex items-center justify-between mb-4 p-2 md:p-3 bg-secondary rounded-md">
                        <div className="flex-1 text-center min-w-0">
                          {tip.homeTeam && (
                            <>
                              {tip.homeTeam.logoUrl && (
                                <img
                                  src={tip.homeTeam.logoUrl}
                                  alt={tip.homeTeam.name}
                                  className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                                />
                              )}
                              <p className="text-xs md:text-sm font-medium line-clamp-1">
                                {tip.homeTeam.shortName || tip.homeTeam.name}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="px-2 md:px-3 text-muted-foreground font-bold text-xs md:text-sm shrink-0">
                          VS
                        </div>
                        <div className="flex-1 text-center min-w-0">
                          {tip.awayTeam && (
                            <>
                              {tip.awayTeam.logoUrl && (
                                <img
                                  src={tip.awayTeam.logoUrl}
                                  alt={tip.awayTeam.name}
                                  className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                                />
                              )}
                              <p className="text-xs md:text-sm font-medium line-clamp-1">
                                {tip.awayTeam.shortName || tip.awayTeam.name}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prediction Summary */}
                    <p className="text-xs md:text-sm text-muted-foreground mb-4 line-clamp-3">
                      {tip.isVIP && !tip.result
                        ? "🔒 Unlock VIP access to view full analysis and ticket snapshots"
                        : tip.summary || tip.content}
                    </p>

                    {/* Odds and Prediction */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {tip.odds && (
                          <>
                            <div className="text-xl md:text-2xl font-bold text-primary">
                              {tip.odds}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Odds
                            </div>
                          </>
                        )}
                      </div>
                      {tip.predictedOutcome && (
                        <div className="text-right">
                          <div className="text-xs md:text-sm font-bold">
                            {tip.predictedOutcome}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Prediction
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {new Date(tip.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {tip.authorName && (
                        <span className="truncate">By {tip.authorName}</span>
                      )}
                    </div>

                    {/* Ticket Snapshots Indicator */}
                    {!tip.isVIP &&
                      tip.ticketSnapshots &&
                      tip.ticketSnapshots.length > 0 && (
                        <div className="mb-4 text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>
                            {tip.ticketSnapshots.length} ticket snapshot(s)
                            available
                          </span>
                        </div>
                      )}

                    <Link href={`/tips/${tip.id}`}>
                      <Button
                        className="w-full text-xs md:text-sm"
                        variant="outline"
                        size="sm"
                      >
                        {tip.isVIP && !tip.result ? (
                          <>
                            <Lock className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                            Unlock Full Analysis
                          </>
                        ) : (
                          "View Full Analysis"
                        )}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredTips.length === 0 && (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  No predictions available at the moment. Check back soon!
                </p>
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            Want Premium Predictions?
          </h2>
          <p className="text-base md:text-xl text-muted-foreground mb-6 px-2">
            Upgrade to VIP for exclusive expert analysis, ticket snapshots, and
            premium predictions
          </p>
          <Link href="/vip">
            <Button size="lg">
              <Lock className="h-4 w-4 mr-2" />
              Get VIP Access
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
