"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
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
} from "lucide-react";

export default function Home() {
  const [liveMatches] = useState([
    {
      id: 1,
      home: "Man City",
      away: "Liverpool",
      score: "2-1",
      status: "LIVE",
      minute: 78,
    },
    {
      id: 2,
      home: "Real Madrid",
      away: "Barcelona",
      score: "1-1",
      status: "LIVE",
      minute: 62,
    },
    {
      id: 3,
      home: "Bayern",
      away: "Dortmund",
      score: "3-0",
      status: "LIVE",
      minute: 85,
    },
  ]);

  const [featuredTips] = useState([
    {
      id: 1,
      title: "Man City vs Liverpool",
      prediction: "Over 2.5 Goals",
      odds: "1.85",
      confidence: "High",
    },
    {
      id: 2,
      title: "Lakers vs Celtics",
      prediction: "Lakers to Win",
      odds: "2.10",
      confidence: "Medium",
    },
    {
      id: 3,
      title: "Nadal vs Djokovic",
      prediction: "Nadal Win Set 1",
      odds: "1.95",
      confidence: "High",
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm text-muted-foreground">
                Today&apos;s Wins
              </div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">75%</div>
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
                {liveMatches.map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{match.home}</span>
                            <span className="text-2xl font-bold">
                              {match.score.split("-")[0]}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{match.away}</span>
                            <span className="text-2xl font-bold">
                              {match.score.split("-")[1]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-6 text-center">
                          <div className="text-xs bg-primary text-primary-foreground px-2 py-1 mb-1">
                            {match.status}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.minute}&apos;
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Featured Tips */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Featured Tips
              </h2>

              <div className="space-y-4">
                {featuredTips.map((tip) => (
                  <Card
                    key={tip.id}
                    className="border-2 hover:border-primary transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{tip.title}</CardTitle>
                        <div
                          className={`text-xs px-2 py-1 border ${
                            tip.confidence === "High"
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {tip.confidence}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm mb-2 text-muted-foreground">
                        {tip.prediction}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {tip.odds}
                        </span>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">ScoreFusion</span>
              </div>
              <p className="text-muted-foreground">
                Your trusted platform for expert sports predictions and betting
                insights.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="/tips" className="hover:text-primary">
                    Free Tips
                  </Link>
                </li>
                <li>
                  <Link href="/vip" className="hover:text-primary">
                    VIP Area
                  </Link>
                </li>
                <li>
                  <Link href="/earnings" className="hover:text-primary">
                    Earn Rewards
                  </Link>
                </li>
                <li>
                  <Link href="/referral" className="hover:text-primary">
                    Referrals
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>
              &copy; 2025 ScoreFusion. All rights reserved. For entertainment
              purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
