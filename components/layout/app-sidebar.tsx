"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Crown,
  Trophy,
  Bell,
  Gift,
  Wallet,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vip", label: "VIP", icon: Crown },
  { href: "/history", label: "History", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/referral", label: "Refer & Earn", icon: Gift },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.guest) return null;

  return (
    <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={active ? "default" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
