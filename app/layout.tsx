import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AppNavbar } from "@/components/layout/app-navbar";
import { Toaster } from "@/components/ui/toaster";
import AuthShell from "@/components/layout/auth-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: "/images/2.png",
  },

  title: "ScoreFusion - Premium Betting Tips & Predictions",
  description:
    "Get exclusive betting tips, VIP predictions, and earn rewards with ScoreFusion. Join thousands of winners today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AppNavbar />
          <AuthShell>
            <main className="pt-16">{children}</main>
          </AuthShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
