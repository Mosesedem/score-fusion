"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Ban, CheckCircle, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
  status: string;
  isGuest: boolean;
  createdAt: string;
  _count?: {
    bets: number;
    tips: number;
  };
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status: ban ? "BANNED" : "ACTIVE",
        }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to make this user an admin?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: "ADMIN",
        }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "all") return true;
    if (filter === "active") return u.status === "ACTIVE";
    if (filter === "banned") return u.status === "BANNED";
    return true;
  });

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Users Management</h1>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All ({users.length})
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
            >
              Active ({users.filter((u) => u.status === "ACTIVE").length})
            </Button>
            <Button
              variant={filter === "banned" ? "default" : "outline"}
              onClick={() => setFilter("banned")}
            >
              Banned ({users.filter((u) => u.status === "BANNED").length})
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">
                        {u.username || u.email}
                      </h3>
                      {u.role === "ADMIN" && (
                        <Badge className="bg-primary text-primary-foreground">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {u.isGuest && (
                        <Badge className="bg-secondary">Guest</Badge>
                      )}
                      <Badge
                        className={
                          u.status === "ACTIVE"
                            ? "bg-secondary"
                            : u.status === "BANNED"
                            ? "bg-destructive"
                            : "bg-border"
                        }
                      >
                        {u.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      {u.email}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>ID: {u.id.slice(0, 8)}</span>
                      <span>
                        Joined: {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                      {u._count && (
                        <>
                          <span>{u._count.bets} bets</span>
                          <span>{u._count.tips} tips</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {u.role !== "ADMIN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMakeAdmin(u.id)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Make Admin
                      </Button>
                    )}
                    {u.status === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBanUser(u.id, true)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBanUser(u.id, false)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No users found with the selected filter.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
