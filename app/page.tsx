"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  TrendingUp,
  Users,
  Activity,
  Crown,
  Target,
  CheckCircle,
  Smartphone,
  Apple,
  PlayCircle,
} from "lucide-react";
import Footer from "@/components/footer";
interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: string;
  minute?: number;
}

interface Tip {
  id: string;
  title: string;
  summary?: string;
  content: string;
  odds?: number;
  successRate?: number;
}

export default function Home() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [featuredTips, setFeaturedTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState({
    activeUsers: 0,
    todayWins: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real-time data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch live matches
        const matchesResponse = await fetch(
          "/api/livescores/matches?status=live&limit=3"
        );
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          if (matchesData.success && matchesData.data?.matches) {
            setLiveMatches(matchesData.data.matches);
          }
        }

        // Fetch featured tips
        const tipsResponse = await fetch("/api/tips?featured=true&limit=3");
        if (tipsResponse.ok) {
          const tipsData = await tipsResponse.json();
          if (tipsData.success && tipsData.data?.tips) {
            setFeaturedTips(tipsData.data.tips);
          }
        }

        // Fetch platform stats (you can create a dedicated endpoint for this)
        // For now, we'll use mock data but structured for real data
        setStats({
          activeUsers: 1247,
          todayWins: 89,
          successRate: 75,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh live matches every 30 seconds
    const interval = setInterval(() => {
      fetch("/api/livescores/matches?status=live&limit=3")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.matches) {
            setLiveMatches(data.data.matches);
          }
        })
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">
              Win More with{" "}
              <span className="text-primary">Expert Predictions</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Data-driven betting tips, live scores, and proven strategies
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/tips">
                <Button size="lg" variant="outline">
                  View Free Tips
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.todayWins}</div>
              <div className="text-sm text-muted-foreground">
                Today&apos;s Wins
              </div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Scores + Featured Tips */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Live Scores */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  Live Matches
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Live</span>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading live matches...
                  </div>
                ) : liveMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No live matches at the moment
                  </div>
                ) : (
                  liveMatches.map((match) => (
                    <Card key={match.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">
                                {match.homeTeam}
                              </span>
                              <span className="text-2xl font-bold">
                                {match.homeTeamScore ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {match.awayTeam}
                              </span>
                              <span className="text-2xl font-bold">
                                {match.awayTeamScore ?? 0}
                              </span>
                            </div>
                          </div>
                          <div className="ml-6 text-center">
                            <div className="text-xs bg-primary text-primary-foreground px-2 py-1 mb-1 uppercase">
                              {match.status}
                            </div>
                            {match.minute && (
                              <div className="text-xs text-muted-foreground">
                                {match.minute}&apos;
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Featured Tips */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Featured Tips
              </h2>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading tips...
                  </div>
                ) : featuredTips.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No featured tips available
                  </div>
                ) : (
                  featuredTips.map((tip) => (
                    <Card
                      key={tip.id}
                      className="border-2 hover:border-primary transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{tip.title}</CardTitle>
                          <div
                            className={`text-xs px-2 py-1 border ${
                              tip.successRate && tip.successRate > 70
                                ? "border-primary text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {tip.successRate
                              ? `${tip.successRate.toFixed(0)}%`
                              : "New"}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm mb-2 text-muted-foreground">
                          {tip.summary || tip.content.substring(0, 100) + "..."}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-primary">
                            {tip.odds ? tip.odds.toFixed(2) : "N/A"}
                          </span>
                          <Link href={`/tips/${tip.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Link href="/tips">
                <Button className="w-full mt-4" variant="outline">
                  View All Tips
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-t border-border bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why ScoreFusion?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Expert Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                AI-powered predictions from professional analysts with proven
                records
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <CardTitle>High Success</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Over 75% success rate on VIP predictions with detailed analysis
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Activity className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Live Updates</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Real-time scores, match events, and betting odds all in one
                place
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Crown className="h-8 w-8 text-primary mb-2" />
                <CardTitle>VIP Access</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Premium tips, advanced analytics, and priority support for
                members
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Download Now Section */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Download ScoreFusion App
              </h2>
              <p className="text-xl text-muted-foreground">
                Get instant access to live scores, expert tips, and betting
                insights on the go
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* App Preview */}
              <div className="relative">
                <div className="bg-linear-to-br from-primary/20 to-primary/5 rounded-3xl p-8 aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <Smartphone className="h-32 w-32 text-primary mx-auto mb-4" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                        <span>Real-time Updates</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Expert Predictions</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-primary" />
                        <span>VIP Exclusive Content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Available On</h3>

                  {/* iOS Download */}
                  <button className="w-full bg-black hover:bg-black/90 text-white rounded-lg p-4 mb-3 flex items-center gap-4 transition-colors">
                    <Apple className="h-10 w-10" />
                    <div className="text-left">
                      <div className="text-xs opacity-80">Download on the</div>
                      <div className="text-lg font-semibold">App Store</div>
                    </div>
                  </button>

                  {/* Android Download */}
                  <button className="w-full bg-black hover:bg-black/90 text-white rounded-lg p-4 flex items-center gap-4 transition-colors">
                    <PlayCircle className="h-10 w-10" />
                    <div className="text-left">
                      <div className="text-xs opacity-80">GET IT ON</div>
                      <div className="text-lg font-semibold">Google Play</div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="font-semibold mb-3">App Features:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Push notifications for live matches</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Personalized tip recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Track your betting history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Offline access to saved tips</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Secure wallet management</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold">
                        4.8
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/40 border-2 border-background" />
                      <div className="h-8 w-8 rounded-full bg-primary/60 border-2 border-background" />
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold">Rated 4.8/5</div>
                      <div className="text-muted-foreground">
                        Over 10,000+ downloads
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Winning?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of successful bettors. No credit card required.
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/vip">
              <Button size="lg" variant="outline">
                Upgrade to VIP
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
