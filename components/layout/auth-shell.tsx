"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Guest users now have same privileges as basic users - show sidebar for both
  const hasSidebar = !!user;

  return (
    <div className={hasSidebar ? "lg:pl-64" : undefined}>
      <AppSidebar />
      {children}
    </div>
  );
}
