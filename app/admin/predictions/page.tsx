"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

interface Tip {
  id: string;
  title: string;
  content: string;
  summary?: string;
  odds?: number;
  oddsSource: string;
  sport: string;
  league?: string;
  matchDate?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  predictionType?: string;
  predictedOutcome?: string;
  ticketSnapshots: string[];
  isVIP: boolean;
  featured: boolean;
  status: string;
  result?: string;
  createdAt: string;
  publishAt: string;
  tags: string[];
}

export default function AdminPredictionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tips, setTips] = useState<Tip[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    odds: "",
    oddsSource: "manual" as "manual" | "api_auto",
    sport: "FOOTBALL",
    league: "",
    matchDate: "",
    homeTeamId: "",
    awayTeamId: "",
    predictionType: "winner",
    predictedOutcome: "",
    ticketSnapshots: [] as string[],
    isVIP: false,
    featured: false,
    status: "published" as "draft" | "scheduled" | "published" | "archived",
    publishAt: "",
    tags: "",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchTips();
      fetchTeams();
    }
  }, [user]);

  const fetchTips = async () => {
    try {
      const res = await fetch("/api/admin/tips");
      if (res.ok) {
        const data = await res.json();
        setTips(data.data.tips || []);
      }
    } catch (error) {
      console.error("Failed to fetch tips:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data.teams || []);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  };

  const handleAddTicketSnapshot = () => {
    if (formData.ticketSnapshots.length < 10) {
      const url = prompt("Enter ticket snapshot URL:");
      if (url) {
        setFormData({
          ...formData,
          ticketSnapshots: [...formData.ticketSnapshots, url],
        });
      }
    } else {
      alert("Maximum 10 ticket snapshots allowed");
    }
  };

  const handleRemoveTicketSnapshot = (index: number) => {
    setFormData({
      ...formData,
      ticketSnapshots: formData.ticketSnapshots.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTip
        ? `/api/admin/tips?id=${editingTip.id}`
        : "/api/admin/tips";
      const method = editingTip ? "PUT" : "POST";

      const payload = {
        ...formData,
        odds: formData.odds ? parseFloat(formData.odds) : undefined,
        matchDate: formData.matchDate || undefined,
        publishAt: formData.publishAt || new Date().toISOString(),
        homeTeamId: formData.homeTeamId || undefined,
        awayTeamId: formData.awayTeamId || undefined,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchTips();
        setShowForm(false);
        setEditingTip(null);
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save prediction");
      }
    } catch (error) {
      console.error("Failed to save prediction:", error);
      alert("Failed to save prediction");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      odds: "",
      oddsSource: "manual",
      sport: "FOOTBALL",
      league: "",
      matchDate: "",
      homeTeamId: "",
      awayTeamId: "",
      predictionType: "winner",
      predictedOutcome: "",
      ticketSnapshots: [],
      isVIP: false,
      featured: false,
      status: "published",
      publishAt: "",
      tags: "",
    });
  };

  const handleEdit = (tip: Tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      content: tip.content,
      summary: tip.summary || "",
      odds: tip.odds?.toString() || "",
      oddsSource: tip.oddsSource as "manual" | "api_auto",
      sport: tip.sport,
      league: tip.league || "",
      matchDate: tip.matchDate || "",
      homeTeamId: tip.homeTeam?.id || "",
      awayTeamId: tip.awayTeam?.id || "",
      predictionType: tip.predictionType || "winner",
      predictedOutcome: tip.predictedOutcome || "",
      ticketSnapshots: tip.ticketSnapshots || [],
      isVIP: tip.isVIP,
      featured: tip.featured,
      status: tip.status as "draft" | "scheduled" | "published" | "archived",
      publishAt: tip.publishAt,
      tags: tip.tags.join(", "),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;

    try {
      const res = await fetch(`/api/admin/tips?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTips();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete prediction");
      }
    } catch (error) {
      console.error("Failed to delete prediction:", error);
      alert("Failed to delete prediction");
    }
  };

  const handleSettle = async (id: string, result: string) => {
    try {
      const res = await fetch(`/api/admin/tips?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });

      if (res.ok) {
        fetchTips();
      }
    } catch (error) {
      console.error("Failed to settle prediction:", error);
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

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Sports Predictions Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your sports prediction tips
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prediction
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingTip ? "Edit Prediction" : "Create New Prediction"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Basic Information</h3>
                  <div>
                    <Label htmlFor="title">Prediction Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Manchester United vs Liverpool - Match Winner"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Short Summary</Label>
                    <Input
                      id="summary"
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData({ ...formData, summary: e.target.value })
                      }
                      placeholder="Brief description for preview"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Full Analysis *</Label>
                    <textarea
                      id="content"
                      className="w-full min-h-[200px] px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Detailed prediction analysis (supports markdown)"
                      required
                    />
                  </div>
                </div>

                {/* Match Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Match & Teams</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sport">Sport *</Label>
                      <select
                        id="sport"
                        className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
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
                      <Label htmlFor="league">League/Competition</Label>
                      <Input
                        id="league"
                        value={formData.league}
                        onChange={(e) =>
                          setFormData({ ...formData, league: e.target.value })
                        }
                        placeholder="e.g., Premier League"
                      />
                    </div>

                    <div>
                      <Label htmlFor="matchDate">Match Date</Label>
                      <Input
                        id="matchDate"
                        type="datetime-local"
                        value={formData.matchDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            matchDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="homeTeamId">Home Team</Label>
                      <select
                        id="homeTeamId"
                        className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                        value={formData.homeTeamId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            homeTeamId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Home Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="awayTeamId">Away Team</Label>
                      <select
                        id="awayTeamId"
                        className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                        value={formData.awayTeamId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            awayTeamId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Away Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Prediction Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Prediction Details</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="predictionType">Prediction Type</Label>
                      <select
                        id="predictionType"
                        className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                        value={formData.predictionType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            predictionType: e.target.value,
                          })
                        }
                      >
                        <option value="winner">Match Winner</option>
                        <option value="over_under">Over/Under Goals</option>
                        <option value="both_teams_score">
                          Both Teams to Score
                        </option>
                        <option value="correct_score">Correct Score</option>
                        <option value="handicap">Handicap</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="predictedOutcome">
                        Predicted Outcome
                      </Label>
                      <Input
                        id="predictedOutcome"
                        value={formData.predictedOutcome}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            predictedOutcome: e.target.value,
                          })
                        }
                        placeholder="e.g., Home Win, Over 2.5, Yes"
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
                        placeholder="e.g., 2.50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="oddsSource">Odds Source</Label>
                    <select
                      id="oddsSource"
                      className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                      value={formData.oddsSource}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          oddsSource: e.target.value as "manual" | "api_auto",
                        })
                      }
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="api_auto">API (Automatic)</option>
                    </select>
                  </div>
                </div>

                {/* Ticket Snapshots */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">
                      Ticket Snapshots ({formData.ticketSnapshots.length}/10)
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTicketSnapshot}
                      disabled={formData.ticketSnapshots.length >= 10}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Snapshot
                    </Button>
                  </div>

                  {formData.ticketSnapshots.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.ticketSnapshots.map((url, index) => (
                        <div
                          key={index}
                          className="relative border-2 border-border rounded-md overflow-hidden group"
                        >
                          <img
                            src={url}
                            alt={`Ticket ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTicketSnapshot(index)}
                            className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Publishing Options */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Publishing Options</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as any,
                          })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="publishAt">Publish Date/Time</Label>
                      <Input
                        id="publishAt"
                        type="datetime-local"
                        value={formData.publishAt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            publishAt: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) =>
                          setFormData({ ...formData, tags: e.target.value })
                        }
                        placeholder="e.g., football, premier-league"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featured: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="featured">Featured</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingTip ? "Update" : "Create"} Prediction
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTip(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tips List */}
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
                      {tip.featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                      <Badge className="bg-secondary">{tip.status}</Badge>
                      {tip.result && (
                        <Badge
                          className={
                            tip.result === "won"
                              ? "bg-green-500"
                              : tip.result === "lost"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }
                        >
                          {tip.result.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    {(tip.homeTeam || tip.awayTeam) && (
                      <div className="flex items-center gap-2 mb-2">
                        {tip.homeTeam && (
                          <span className="text-sm font-medium">
                            {tip.homeTeam.name}
                          </span>
                        )}
                        {tip.homeTeam && tip.awayTeam && (
                          <span className="text-sm text-muted-foreground">
                            vs
                          </span>
                        )}
                        {tip.awayTeam && (
                          <span className="text-sm font-medium">
                            {tip.awayTeam.name}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-muted-foreground mb-2 line-clamp-2">
                      {tip.summary || tip.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm mb-2">
                      {tip.odds && (
                        <span className="text-primary font-bold">
                          Odds: {tip.odds}
                        </span>
                      )}
                      <span className="text-muted-foreground">{tip.sport}</span>
                      {tip.league && (
                        <span className="text-muted-foreground">
                          {tip.league}
                        </span>
                      )}
                      {tip.predictedOutcome && (
                        <span className="text-muted-foreground">
                          Prediction: {tip.predictedOutcome}
                        </span>
                      )}
                    </div>

                    {tip.ticketSnapshots.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>
                          {tip.ticketSnapshots.length} ticket snapshot(s)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!tip.result && tip.status === "published" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSettle(tip.id, "won")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSettle(tip.id, "lost")}
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
              <CardContent className="p-12 text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No predictions found</p>
                <p className="text-sm">
                  Create your first sports prediction to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
