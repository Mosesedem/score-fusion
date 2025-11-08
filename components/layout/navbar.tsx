"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  TrendingUp,
  Gift,
  Wallet,
  Settings,
  LogOut,
  Trophy,
  Crown,
  LayoutDashboard,
  Bell,
  BarChart3,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ScoreFusion</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {user && !user.guest && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/dashboard")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </div>
              </Link>
            )}

            <Link
              href="/tips"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/tips") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>Tips</span>
              </div>
            </Link>

            <Link
              href="/analytics"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/analytics")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>
            </Link>

            {user && !user.guest && (
              <>
                <Link
                  href="/vip"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/vip") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Crown className="h-4 w-4" />
                    <span>VIP</span>
                  </div>
                </Link>

                <Link
                  href="/history"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/history")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4" />
                    <span>History</span>
                  </div>
                </Link>

                <Link
                  href="/notifications"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/notifications")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </div>
                </Link>

                <Link
                  href="/referral"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/referral")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Gift className="h-4 w-4" />
                    <span>Refer & Earn</span>
                  </div>
                </Link>

                <Link
                  href="/earnings"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/earnings")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Wallet className="h-4 w-4" />
                    <span>Earnings</span>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || "User"}
                      </p>
                      {user.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                      {user.guest && (
                        <p className="text-xs text-primary">Guest Account</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!user.guest && (
                    <>
                      <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/settings">
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {user.guest && (
                    <>
                      <Link href="/signup">
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Create Account</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
