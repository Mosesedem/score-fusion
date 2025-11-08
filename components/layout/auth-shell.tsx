"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const hasSidebar = !!user && !user.guest;

  return (
    <div className={hasSidebar ? "lg:pl-64" : undefined}>
      <AppSidebar />
      {children}
    </div>
  );
}
