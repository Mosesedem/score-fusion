"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, CheckCircle } from "lucide-react";

interface VIPToken {
  id: string;
  code: string;
  duration: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminVIPTokensPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tokens, setTokens] = useState<VIPToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    duration: "30",
    maxUses: "1",
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      // TODO: Create endpoint to list VIP tokens
      // For now, using placeholder
      setTokens([]);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/vip-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: parseInt(formData.duration),
          maxUses: parseInt(formData.maxUses),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTokens([data.token, ...tokens]);
        setShowForm(false);
        setFormData({ duration: "30", maxUses: "1" });
      }
    } catch (error) {
      console.error("Failed to generate token:", error);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this token?")) return;

    try {
      const res = await fetch("/api/admin/vip-tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: false }),
      });

      if (res.ok) {
        fetchTokens();
      }
    } catch (error) {
      console.error("Failed to deactivate token:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this token?")) return;

    try {
      const res = await fetch("/api/admin/vip-tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchTokens();
      }
    } catch (error) {
      console.error("Failed to delete token:", error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">VIP Tokens</h1>
            <p className="text-muted-foreground">
              Generate and manage VIP access tokens
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Token
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate New VIP Token</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How long the VIP access lasts after redemption
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="maxUses">Max Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      value={formData.maxUses}
                      onChange={(e) =>
                        setFormData({ ...formData, maxUses: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many times the token can be redeemed
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Generate Token</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tokens.map((token) => (
            <Card key={token.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-lg font-mono font-bold bg-secondary px-3 py-1">
                        {token.code}
                      </code>
                      {token.isActive ? (
                        <Badge className="bg-secondary">Active</Badge>
                      ) : (
                        <Badge className="bg-destructive">Inactive</Badge>
                      )}
                      {token.usedCount >= token.maxUses && (
                        <Badge className="bg-border">Fully Used</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Duration: {token.duration} days</span>
                      <span>
                        Uses: {token.usedCount}/{token.maxUses}
                      </span>
                      {token.expiresAt && (
                        <span>
                          Expires:{" "}
                          {new Date(token.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        Created:{" "}
                        {new Date(token.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(token.code)}
                    >
                      {copiedCode === token.code ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    {token.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeactivate(token.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(token.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {tokens.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No VIP tokens found. Generate your first token to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
