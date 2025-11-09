"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";

interface Sport {
  id: string;
  name: string;
  displayName: string;
}

interface Team {
  id: string;
  name: string;
  shortName?: string;
  sportId: string;
  league?: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
  sport: Sport;
  createdAt: string;
}

export default function AdminTeamsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    sportId: "",
    league: "",
    country: "",
    logoUrl: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchSports();
      fetchTeams();
    }
  }, [user]);

  const fetchSports = async () => {
    try {
      // Fetch available sports - you'll need to create this endpoint or use existing one
      const res = await fetch("/api/livescores/matches");
      if (res.ok) {
        // For now, use default sports
        setSports([
          { id: "1", name: "FOOTBALL", displayName: "Football" },
          { id: "2", name: "BASKETBALL", displayName: "Basketball" },
          { id: "3", name: "TENNIS", displayName: "Tennis" },
          { id: "4", name: "CRICKET", displayName: "Cricket" },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch sports:", error);
      // Set default sports
      setSports([
        { id: "1", name: "FOOTBALL", displayName: "Football" },
        { id: "2", name: "BASKETBALL", displayName: "Basketball" },
        { id: "3", name: "TENNIS", displayName: "Tennis" },
        { id: "4", name: "CRICKET", displayName: "Cricket" },
      ]);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTeam ? `/api/admin/teams` : "/api/admin/teams";
      const method = editingTeam ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingTeam && { id: editingTeam.id }),
          ...formData,
        }),
      });

      if (res.ok) {
        fetchTeams();
        setShowForm(false);
        setEditingTeam(null);
        setFormData({
          name: "",
          shortName: "",
          sportId: "",
          league: "",
          country: "",
          logoUrl: "",
          isActive: true,
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save team");
      }
    } catch (error) {
      console.error("Failed to save team:", error);
      alert("Failed to save team");
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      shortName: team.shortName || "",
      sportId: team.sportId,
      league: team.league || "",
      country: team.country || "",
      logoUrl: team.logoUrl || "",
      isActive: team.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const res = await fetch(`/api/admin/teams?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTeams();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete team");
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
      alert("Failed to delete team");
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
            <h1 className="text-3xl font-bold">Teams Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage teams for sports predictions
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingTeam ? "Edit Team" : "Create New Team"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Team Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shortName">Short Name</Label>
                    <Input
                      id="shortName"
                      value={formData.shortName}
                      onChange={(e) =>
                        setFormData({ ...formData, shortName: e.target.value })
                      }
                      placeholder="e.g., MAN UTD"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sportId">Sport *</Label>
                    <select
                      id="sportId"
                      className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                      value={formData.sportId}
                      onChange={(e) =>
                        setFormData({ ...formData, sportId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Sport</option>
                      {sports.map((sport) => (
                        <option key={sport.id} value={sport.id}>
                          {sport.displayName}
                        </option>
                      ))}
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
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="e.g., England"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, logoUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingTeam ? "Update" : "Create"} Team
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTeam(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-secondary flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{team.name}</h3>
                      {team.shortName && (
                        <p className="text-sm text-muted-foreground">
                          {team.shortName}
                        </p>
                      )}
                    </div>
                  </div>
                  {!team.isActive && (
                    <Badge variant="outline" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <p>
                    <span className="font-medium">Sport:</span>{" "}
                    {team.sport.displayName}
                  </p>
                  {team.league && (
                    <p>
                      <span className="font-medium">League:</span> {team.league}
                    </p>
                  )}
                  {team.country && (
                    <p>
                      <span className="font-medium">Country:</span>{" "}
                      {team.country}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(team)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {teams.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No teams found</p>
                <p className="text-sm">Create your first team to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
