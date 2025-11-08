"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  isAdmin: boolean;
  guest: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  guestLogin: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  displayName: string;
  country?: string;
  dob?: string;
  referralCode?: string;
  consents?: {
    analytics: boolean;
    marketing: boolean;
    essential: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, rememberMe }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        setUser(data.user);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${
            data.user.displayName || data.user.email
          }`,
        });
        router.push("/tips");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        toast({
          variant: "destructive",
          title: "Login failed",
          description: message,
        });
        throw error;
      }
    },
    [router]
  );

  const signup = useCallback(
    async (data: SignupData) => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Signup failed");
        }

        setUser(result.user);

        let welcomeMessage = `Welcome, ${result.user.displayName}!`;
        if (result.referralApplied) {
          welcomeMessage += ` You received ${result.referralApplied.welcomeBonus} bonus tokens!`;
        }

        toast({
          title: "Account created!",
          description: welcomeMessage,
        });
        router.push("/tips");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Signup failed";
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: message,
        });
        throw error;
      }
    },
    [router]
  );

  const guestLogin = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Guest login failed");
      }

      setUser(data.user);
      toast({
        title: "Guest access enabled",
        description: "You have limited access. Sign up for more features!",
      });
      router.push("/tips");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Guest login failed";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        guestLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
