"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Bet {
  id: string;
  amount: number;
  odds: number;
  status: string;
  result?: string;
  createdAt: string;
  tip: {
    title: string;
    sport: string;
  };
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBets();
  }, [user]);

  const fetchBets = async () => {
    try {
      const res = await fetch("/api/bets");
      if (res.ok) {
        const data = await res.json();
        setBets(data.bets || []);
      }
    } catch (error) {
      console.error("Failed to fetch bets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Betting History</h1>
          <p className="text-muted-foreground mb-8">
            Track all your bets and their outcomes
          </p>

          {!user && (
            <Card className="mb-8 border-2 border-primary">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-2">
                  Sign in to view your betting history
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create an account or log in to track your bets
                </p>
                <Link href="/login">
                  <Button size="lg">Log In</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Bets</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading history...
                </div>
              ) : bets.length > 0 ? (
                <div className="space-y-4">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="border-2 border-border p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">{bet.tip.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {bet.tip.sport} •{" "}
                          {new Date(bet.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          ${bet.amount} @ {bet.odds}
                        </div>
                        <div className="text-sm">
                          {bet.result ? (
                            <span
                              className={
                                bet.result === "WON"
                                  ? "text-primary"
                                  : "text-destructive"
                              }
                            >
                              {bet.result}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {bet.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No betting history yet</p>
                  <p className="text-sm mt-2">
                    Your bet history will appear here once you start placing
                    bets
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
