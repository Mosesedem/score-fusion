"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lock, Calendar, Target } from "lucide-react";

interface Tip {
  id: string;
  title: string;
  description: string;
  odds: number;
  confidence: string;
  sport: string;
  isVIP: boolean;
  status: string;
  createdAt: string;
  author?: {
    username: string;
  };
  result?: {
    outcome: string;
    settledAt: string;
  };
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
        setTips(data.tips || []);
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

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return "border-primary text-primary";
      case "medium":
        return "border-border text-muted-foreground";
      case "low":
        return "border-border text-muted-foreground";
      default:
        return "border-border text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Expert Betting Tips</h1>
            <p className="text-xl text-muted-foreground">
              Data-driven predictions from professional analysts. Free and VIP
              tips available.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">
                {tips.filter((t) => !t.isVIP).length}
              </div>
              <div className="text-sm text-muted-foreground">Free Tips</div>
            </div>
            <div className="text-center">
              <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">
                {tips.filter((t) => t.isVIP).length}
              </div>
              <div className="text-sm text-muted-foreground">VIP Tips</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">
                {tips.filter((t) => t.result?.outcome === "WON").length}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All Tips
            </Button>
            <Button
              variant={filter === "free" ? "default" : "outline"}
              onClick={() => setFilter("free")}
            >
              Free Tips
            </Button>
            <Button
              variant={filter === "vip" ? "default" : "outline"}
              onClick={() => setFilter("vip")}
            >
              <Lock className="h-4 w-4 mr-1" />
              VIP Tips
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading tips...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTips.map((tip) => (
                <Card
                  key={tip.id}
                  className={`border-2 ${
                    tip.isVIP ? "border-primary" : "border-border"
                  } hover:border-primary transition-colors`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-secondary">{tip.sport}</Badge>
                      <div className="flex items-center gap-1">
                        {tip.isVIP && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {tip.result && (
                          <Badge
                            className={
                              tip.result.outcome === "WON"
                                ? "bg-primary text-primary-foreground"
                                : "bg-destructive"
                            }
                          >
                            {tip.result.outcome}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tip.isVIP && !tip.result
                        ? "Unlock VIP access to view full analysis"
                        : tip.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {tip.odds}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Odds
                        </div>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 border ${getConfidenceColor(
                          tip.confidence
                        )}`}
                      >
                        {tip.confidence} Confidence
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tip.createdAt).toLocaleDateString()}
                      </div>
                      {tip.author && <span>By {tip.author.username}</span>}
                    </div>
                    <Link href={`/tips/${tip.id}`}>
                      <Button className="w-full" variant="outline">
                        {tip.isVIP && !tip.result ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Unlock Details
                          </>
                        ) : (
                          "View Details"
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
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No tips available at the moment. Check back soon!
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
      <section className="border-t border-border bg-secondary py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Want More Winning Tips?</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Upgrade to VIP for exclusive predictions and higher success rates
          </p>
          <Link href="/vip">
            <Button size="lg">
              <Lock className="h-4 w-4 mr-2" />
              Unlock VIP Access
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
