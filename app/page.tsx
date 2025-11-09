"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
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
import Footer from "@/components/footer";
import Image from "next/image";
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
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [featuredTips, setFeaturedTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState({
    activeUsers: 0,
    todayWins: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

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

  // Show nothing while checking auth to prevent flash
  if (isLoading) {
    return null;
  }

  // If user is authenticated, they will be redirected
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">
              Win More with{" "}
              <span className="text-primary">Expert Predictions</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
              Data-driven betting tips, live scores, and proven strategies
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 sm:px-0">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/tips" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View Free Tips
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-xl md:text-2xl font-bold">
                {stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-xl md:text-2xl font-bold">
                {stats.todayWins}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Today&apos;s Wins
              </div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-xl md:text-2xl font-bold">
                {stats.successRate}%
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Success Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Scores + Featured Tips */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Live Scores */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  Live Matches
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary animate-pulse" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Live
                  </span>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                    Loading live matches...
                  </div>
                ) : liveMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                    No live matches at the moment
                  </div>
                ) : (
                  liveMatches.map((match) => (
                    <Card key={match.id}>
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm md:text-base truncate pr-2">
                                {match.homeTeam}
                              </span>
                              <span className="text-xl md:text-2xl font-bold shrink-0">
                                {match.homeTeamScore ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm md:text-base truncate pr-2">
                                {match.awayTeam}
                              </span>
                              <span className="text-xl md:text-2xl font-bold shrink-0">
                                {match.awayTeamScore ?? 0}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 md:ml-6 text-center shrink-0">
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
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Featured Tips
              </h2>

              <div className="space-y-3 md:space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                    Loading tips...
                  </div>
                ) : featuredTips.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
                    No featured tips available
                  </div>
                ) : (
                  featuredTips.map((tip) => (
                    <Card
                      key={tip.id}
                      className="border-2 hover:border-primary transition-colors"
                    >
                      <CardHeader className="pb-3 p-3 md:p-6 md:pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm md:text-base line-clamp-2">
                            {tip.title}
                          </CardTitle>
                          <div
                            className={`text-xs px-2 py-1 border shrink-0 ${
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
                      <CardContent className="p-3 md:p-6 md:pt-0">
                        <div className="text-xs md:text-sm mb-2 text-muted-foreground line-clamp-2">
                          {tip.summary || tip.content.substring(0, 100) + "..."}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg md:text-xl font-bold text-primary">
                            {tip.odds ? tip.odds.toFixed(2) : "N/A"}
                          </span>
                          <Link href={`/tips/${tip.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs md:text-sm"
                            >
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
                <Button
                  className="w-full mt-4 text-sm md:text-base"
                  variant="outline"
                >
                  View All Tips
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 md:py-12 border-t border-border bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            Why ScoreFusion?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <Target className="h-7 w-7 md:h-8 md:w-8 text-primary mb-2" />
                <CardTitle className="text-base md:text-lg">
                  Expert Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 pt-0">
                AI-powered predictions from professional analysts with proven
                records
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <Trophy className="h-7 w-7 md:h-8 md:w-8 text-primary mb-2" />
                <CardTitle className="text-base md:text-lg">
                  High Success
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 pt-0">
                Over 75% success rate on VIP predictions with detailed analysis
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <Activity className="h-7 w-7 md:h-8 md:w-8 text-primary mb-2" />
                <CardTitle className="text-base md:text-lg">
                  Live Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 pt-0">
                Real-time scores, match events, and betting odds all in one
                place
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <Crown className="h-7 w-7 md:h-8 md:w-8 text-primary mb-2" />
                <CardTitle className="text-base md:text-lg">
                  VIP Access
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 pt-0">
                Premium tips, advanced analytics, and priority support for
                members
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Download Now Section */}
      <section className="py-8 md:py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">
                Download ScoreFusion App
              </h2>
              <p className="text-base md:text-xl text-muted-foreground px-2 md:px-4">
                Get instant access to live scores, expert tips, and betting
                insights on the go
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
              {/* App Preview */}
              <div className="relative order-2 md:order-1 flex justify-center">
                <Image
                  src="/images/download.png"
                  alt="ScoreFusion App Interface"
                  height={40}
                  width={40}
                  className="rounded-lg md:rounded-2xl shadow-2xl w-full max-w-[280px] sm:max-w-xs md:max-w-sm object-cover"
                />
                <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg px-3 md:px-4 py-1.5 md:py-2 shadow-lg flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
                  <Activity className="h-3 w-3 md:h-4 md:w-4 text-primary animate-pulse" />
                  <span className="font-medium">Live on iOS & Android</span>
                </div>
              </div>

              {/* Download Options */}
              <div className="space-y-4 md:space-y-6 order-1 md:order-2">
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                    Available On
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    {/* iOS Download */}
                    <Button
                      className="h-12 md:h-16 flex-1 justify-start px-3 md:px-6 gap-2 md:gap-3"
                      variant="outline"
                    >
                      <svg
                        className="h-6 w-6 md:h-8 md:w-8 shrink-0"
                        fill="#ffffff"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g
                          id="SVGRepo_tracerCarrier"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></g>
                        <g id="SVGRepo_iconCarrier">
                          {" "}
                          <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"></path>{" "}
                        </g>
                      </svg>{" "}
                      <div className="text-left min-w-0">
                        <div className="text-[10px] md:text-xs opacity-80 leading-tight">
                          Download on the
                        </div>
                        <div className="text-sm md:text-lg font-semibold leading-tight truncate">
                          App Store
                        </div>
                      </div>
                    </Button>

                    {/* Android Download */}
                    <Button
                      variant="outline"
                      className="h-12 md:h-16 flex-1 justify-start px-3 md:px-6 gap-2 md:gap-3"
                    >
                      <svg
                        className="h-6 w-6 md:h-8 md:w-8 shrink-0"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g
                          id="SVGRepo_tracerCarrier"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></g>
                        <g id="SVGRepo_iconCarrier">
                          {" "}
                          <mask
                            id="mask0_87_8320"
                            maskUnits="userSpaceOnUse"
                            x="7"
                            y="3"
                            width="24"
                            height="26"
                          >
                            {" "}
                            <path
                              d="M30.0484 14.4004C31.3172 15.0986 31.3172 16.9014 30.0484 17.5996L9.75627 28.7659C8.52052 29.4459 7 28.5634 7 27.1663L7 4.83374C7 3.43657 8.52052 2.55415 9.75627 3.23415L30.0484 14.4004Z"
                              fill="#C4C4C4"
                            ></path>{" "}
                          </mask>{" "}
                          <g mask="url(#mask0_87_8320)">
                            {" "}
                            <path
                              d="M7.63473 28.5466L20.2923 15.8179L7.84319 3.29883C7.34653 3.61721 7 4.1669 7 4.8339V27.1664C7 27.7355 7.25223 28.2191 7.63473 28.5466Z"
                              fill="url(#paint0_linear_87_8320)"
                            ></path>{" "}
                            <path
                              d="M30.048 14.4003C31.3169 15.0985 31.3169 16.9012 30.048 17.5994L24.9287 20.4165L20.292 15.8175L24.6923 11.4531L30.048 14.4003Z"
                              fill="url(#paint1_linear_87_8320)"
                            ></path>{" "}
                            <path
                              d="M24.9292 20.4168L20.2924 15.8179L7.63477 28.5466C8.19139 29.0232 9.02389 29.1691 9.75635 28.766L24.9292 20.4168Z"
                              fill="url(#paint2_linear_87_8320)"
                            ></path>{" "}
                            <path
                              d="M7.84277 3.29865L20.2919 15.8177L24.6922 11.4533L9.75583 3.23415C9.11003 2.87878 8.38646 2.95013 7.84277 3.29865Z"
                              fill="url(#paint3_linear_87_8320)"
                            ></path>{" "}
                          </g>{" "}
                          <defs>
                            {" "}
                            <linearGradient
                              id="paint0_linear_87_8320"
                              x1="15.6769"
                              y1="10.874"
                              x2="7.07106"
                              y2="19.5506"
                              gradientUnits="userSpaceOnUse"
                            >
                              {" "}
                              <stop stopColor="#00C3FF"></stop>{" "}
                              <stop offset="1" stopColor="#1BE2FA"></stop>{" "}
                            </linearGradient>{" "}
                            <linearGradient
                              id="paint1_linear_87_8320"
                              x1="20.292"
                              y1="15.8176"
                              x2="31.7381"
                              y2="15.8176"
                              gradientUnits="userSpaceOnUse"
                            >
                              {" "}
                              <stop stopColor="#FFCE00"></stop>{" "}
                              <stop offset="1" stopColor="#FFEA00"></stop>{" "}
                            </linearGradient>{" "}
                            <linearGradient
                              id="paint2_linear_87_8320"
                              x1="7.36932"
                              y1="30.1004"
                              x2="22.595"
                              y2="17.8937"
                              gradientUnits="userSpaceOnUse"
                            >
                              {" "}
                              <stop stopColor="#DE2453"></stop>{" "}
                              <stop offset="1" stopColor="#FE3944"></stop>{" "}
                            </linearGradient>{" "}
                            <linearGradient
                              id="paint3_linear_87_8320"
                              x1="8.10725"
                              y1="1.90137"
                              x2="22.5971"
                              y2="13.7365"
                              gradientUnits="userSpaceOnUse"
                            >
                              {" "}
                              <stop stopColor="#11D574"></stop>{" "}
                              <stop offset="1" stopColor="#01F176"></stop>{" "}
                            </linearGradient>{" "}
                          </defs>{" "}
                        </g>
                      </svg>{" "}
                      <div className="text-left min-w-0">
                        <div className="text-[10px] md:text-xs opacity-80 leading-tight">
                          GET IT ON
                        </div>
                        <div className="text-sm md:text-lg font-semibold leading-tight truncate">
                          Google Play
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-4 md:pt-6">
                  <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">
                    App Features:
                  </h4>
                  <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary mt-0.5 shrink-0" />
                      <span>Push notifications for live matches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary mt-0.5 shrink-0" />
                      <span>Personalized tip recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary mt-0.5 shrink-0" />
                      <span>Track your betting history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary mt-0.5 shrink-0" />
                      <span>Offline access to saved tips</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary mt-0.5 shrink-0" />
                      <span>Secure wallet management</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-secondary rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs md:text-sm font-bold">
                        4.8
                      </div>
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/40 border-2 border-background" />
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/60 border-2 border-background" />
                    </div>
                    <div className="text-xs md:text-sm min-w-0">
                      <div className="font-semibold">Rated 4.8/5</div>
                      <div className="text-muted-foreground truncate">
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
      <section className="py-12 md:py-16 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            Ready to Start Winning?
          </h2>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
            Join thousands of successful bettors. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-6 px-4 sm:px-0">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/vip" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Upgrade to VIP
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
