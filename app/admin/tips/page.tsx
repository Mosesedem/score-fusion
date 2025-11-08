"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Tip {
  id: string;
  title: string;
  description: string;
  odds: number;
  confidence: string;
  sport: string;
  matchId?: string;
  isVIP: boolean;
  status: string;
  createdAt: string;
}

export default function AdminTipsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    odds: "",
    confidence: "MEDIUM",
    sport: "FOOTBALL",
    isVIP: false,
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchTips();
    }
  }, [user]);

  const fetchTips = async () => {
    try {
      const res = await fetch("/api/admin/tips");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTip ? `/api/admin/tips` : "/api/admin/tips";
      const method = editingTip ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingTip && { id: editingTip.id }),
          ...formData,
          odds: parseFloat(formData.odds),
        }),
      });

      if (res.ok) {
        fetchTips();
        setShowForm(false);
        setEditingTip(null);
        setFormData({
          title: "",
          description: "",
          odds: "",
          confidence: "MEDIUM",
          sport: "FOOTBALL",
          isVIP: false,
        });
      }
    } catch (error) {
      console.error("Failed to save tip:", error);
    }
  };

  const handleEdit = (tip: Tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      description: tip.description,
      odds: tip.odds.toString(),
      confidence: tip.confidence,
      sport: tip.sport,
      isVIP: tip.isVIP,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tip?")) return;

    try {
      const res = await fetch("/api/admin/tips", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchTips();
      }
    } catch (error) {
      console.error("Failed to delete tip:", error);
    }
  };

  const handleSettle = async (id: string, outcome: "WON" | "LOST") => {
    try {
      const res = await fetch("/api/admin/tips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "SETTLED", outcome }),
      });

      if (res.ok) {
        fetchTips();
      }
    } catch (error) {
      console.error("Failed to settle tip:", error);
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
          <h1 className="text-3xl font-bold">Tips Management</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Tip
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingTip ? "Edit Tip" : "Create New Tip"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="odds">Odds</Label>
                    <Input
                      id="odds"
                      type="number"
                      step="0.01"
                      value={formData.odds}
                      onChange={(e) =>
                        setFormData({ ...formData, odds: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] px-3 py-2 bg-background border-2 border-border text-foreground"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sport">Sport</Label>
                    <select
                      id="sport"
                      className="w-full px-3 py-2 bg-background border-2 border-border text-foreground"
                      value={formData.sport}
                      onChange={(e) =>
                        setFormData({ ...formData, sport: e.target.value })
                      }
                    >
                      <option value="FOOTBALL">Football</option>
                      <option value="BASKETBALL">Basketball</option>
                      <option value="TENNIS">Tennis</option>
                      <option value="CRICKET">Cricket</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence</Label>
                    <select
                      id="confidence"
                      className="w-full px-3 py-2 bg-background border-2 border-border text-foreground"
                      value={formData.confidence}
                      onChange={(e) =>
                        setFormData({ ...formData, confidence: e.target.value })
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isVIP"
                      checked={formData.isVIP}
                      onChange={(e) =>
                        setFormData({ ...formData, isVIP: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isVIP">VIP Only</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingTip ? "Update" : "Create"} Tip
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTip(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tips.map((tip) => (
            <Card key={tip.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{tip.title}</h3>
                      {tip.isVIP && (
                        <Badge className="bg-primary text-primary-foreground">
                          VIP
                        </Badge>
                      )}
                      <Badge
                        className={
                          tip.status === "ACTIVE"
                            ? "bg-secondary"
                            : tip.status === "SETTLED"
                            ? "bg-primary"
                            : "bg-border"
                        }
                      >
                        {tip.status}
                      </Badge>
                      <Badge className="bg-secondary">{tip.confidence}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {tip.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-primary font-bold">
                        Odds: {tip.odds}
                      </span>
                      <span className="text-muted-foreground">{tip.sport}</span>
                      <span className="text-muted-foreground">
                        {new Date(tip.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {tip.status === "ACTIVE" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSettle(tip.id, "WON")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSettle(tip.id, "LOST")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Lost
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tip)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(tip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {tips.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No tips found. Create your first tip to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
