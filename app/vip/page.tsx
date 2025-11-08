"use client";

import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Lock, Star, TrendingUp, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function VIPAreaPage() {
  const { user } = useAuth();
  const [hasVIPAccess, setHasVIPAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenCode, setTokenCode] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    checkVIPAccess();
  }, [user]);

  const checkVIPAccess = async () => {
    try {
      // Check if user has active subscription or valid token
      const res = await fetch("/api/vip/status");
      if (res.ok) {
        const data = await res.json();
        setHasVIPAccess(data.hasAccess);
      }
    } catch (error) {
      console.error("Failed to check VIP access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError("");

    try {
      const res = await fetch("/api/vip/tokens/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tokenCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setHasVIPAccess(true);
        setTokenCode("");
      } else {
        setTokenError(data.error || "Invalid token code");
      }
    } catch (error) {
      setTokenError("Failed to redeem token. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!hasVIPAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-3xl mb-2">
                  VIP Access Required
                </CardTitle>
                <p className="text-muted-foreground">
                  Unlock premium betting tips with proven success rates
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 border border-border">
                    <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold mb-1">Exclusive Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      Premium predictions from expert analysts
                    </p>
                  </div>
                  <div className="p-4 border border-border">
                    <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold mb-1">Higher Success</h3>
                    <p className="text-sm text-muted-foreground">
                      Average 75%+ win rate on VIP tips
                    </p>
                  </div>
                  <div className="p-4 border border-border">
                    <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold mb-1">Advanced Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Deep insights and trend analysis
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="bg-secondary p-6 space-y-4">
                    <h3 className="font-bold text-lg">Subscription Plans</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border-2 border-border p-4 space-y-2">
                        <h4 className="font-bold">Monthly</h4>
                        <p className="text-2xl font-bold text-primary">
                          $29.99/mo
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>✓ All VIP tips</li>
                          <li>✓ Priority support</li>
                          <li>✓ Cancel anytime</li>
                        </ul>
                        <Button className="w-full mt-4">
                          Subscribe Monthly
                        </Button>
                      </div>
                      <div className="border-2 border-primary p-4 space-y-2">
                        <div className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 mb-2">
                          BEST VALUE
                        </div>
                        <h4 className="font-bold">Yearly</h4>
                        <p className="text-2xl font-bold text-primary">
                          $249.99/yr
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Save $110 per year
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>✓ All VIP tips</li>
                          <li>✓ Priority support</li>
                          <li>✓ 2 months free</li>
                        </ul>
                        <Button className="w-full mt-4">
                          Subscribe Yearly
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!user && (
                  <Card className="border-2 border-primary">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-bold text-lg mb-2">
                        Sign up or log in to subscribe
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Create an account to access VIP features
                      </p>
                      <Button>Get Started</Button>
                    </CardContent>
                  </Card>
                )}

                <div className="border-2 border-border p-6">
                  <h3 className="font-bold text-lg mb-4 text-center">
                    Have a VIP Token?
                  </h3>
                  <form onSubmit={handleTokenRedeem} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Enter your VIP token code"
                        value={tokenCode}
                        onChange={(e) => setTokenCode(e.target.value)}
                        className="text-center font-mono"
                        required
                      />
                      {tokenError && (
                        <p className="text-sm text-destructive mt-2">
                          {tokenError}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Redeem Token
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Tokens provide instant VIP access without subscription
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // VIP content (shown when user has access)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">VIP Area</h1>
          </div>
          <p className="text-muted-foreground">
            Premium tips and exclusive content
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Premium Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No VIP tips available yet</p>
              <p className="text-sm mt-2">
                Check back soon for premium predictions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
