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
  TrendingUp,
  BarChart3,
  HelpCircle,
  Mail,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tips", label: "Tips", icon: TrendingUp },
  { href: "/vip", label: "VIP", icon: Crown },
  { href: "/history", label: "History", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/referral", label: "Refer & Earn", icon: Gift },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/help", label: "Help", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Guest users have access to all features like basic users
const guestItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tips", label: "Tips", icon: TrendingUp },
  { href: "/vip", label: "VIP", icon: Crown },
  { href: "/history", label: "History", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/help", label: "Help", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  // Guest users now have access to sidebar with limited items
  const menuItems = user.guest ? guestItems : items;

  return (
    <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-30">
      <nav className="p-3 space-y-1 overflow-y-auto h-full">
        {menuItems.map((item) => {
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
