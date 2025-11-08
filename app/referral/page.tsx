"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, CheckCircle, DollarSign, TrendingUp } from "lucide-react";

interface ReferralData {
  code: string;
  referralCount: number;
  earnings: number;
  pendingEarnings: number;
  referrals: Array<{
    id: string;
    username: string;
    status: string;
    earnings: number;
    joinedAt: string;
  }>;
}

export default function ReferralPage() {
  const { user, isLoading } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      fetchReferralData();
    }
  }, [isLoading, user]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/referral");
      if (res.ok) {
        const data = await res.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (referralData?.code) {
      const url = `${window.location.origin}/signup?ref=${referralData.code}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCodeOnly = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Referral Program</h1>
            <p className="text-xl text-muted-foreground">
              Earn 20% commission on every friend who subscribes to VIP
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {!user && !isLoading && (
            <Card className="mb-8 border-2 border-primary">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Sign up to start referring
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to get your unique referral code and start
                  earning
                </p>
                <Link href="/signup">
                  <Button size="lg">Create Account</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {user && referralData && (
            <>
              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">
                        {referralData.referralCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Total Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">
                        ${referralData.earnings.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">
                        ${referralData.pendingEarnings.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Code Card */}
              <Card className="mb-12 border-2 border-primary">
                <CardHeader>
                  <CardTitle>Your Referral Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Referral Link
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={`${
                          typeof window !== "undefined"
                            ? window.location.origin
                            : ""
                        }/signup?ref=${referralData.code}`}
                        readOnly
                        className="font-mono"
                      />
                      <Button onClick={handleCopyCode}>
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Referral Code Only
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={referralData.code}
                        readOnly
                        className="font-mono font-bold text-xl"
                      />
                      <Button onClick={handleCopyCodeOnly} variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral List */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Referrals</h2>

                {referralData.referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referralData.referrals.map((referral) => (
                      <Card key={referral.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                {referral.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold">
                                  {referral.username}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Joined{" "}
                                  {new Date(
                                    referral.joinedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">
                                ${referral.earnings.toFixed(2)}
                              </div>
                              <Badge
                                className={
                                  referral.status === "ACTIVE"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary"
                                }
                              >
                                {referral.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No referrals yet. Share your code to start earning!
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {loading && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading referral data...
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-secondary py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-2">
                  1
                </div>
                <CardTitle>Share Your Code</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Copy your unique referral link and share it with friends
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-2">
                  2
                </div>
                <CardTitle>They Sign Up</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Your friends create an account using your referral code
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-2">
                  3
                </div>
                <CardTitle>You Earn</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Get 20% commission when they subscribe to VIP
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
