"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/logo";

export default function SignupPage() {
  const { signup } = useAuth();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    country: "",
    dob: "",
    referralCode: referralCode || "",
  });
  const [consents, setConsents] = useState({
    analytics: true,
    marketing: false,
    essential: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate age if DOB provided
    if (formData.dob) {
      const dob = new Date(formData.dob);
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) {
        setError("You must be at least 18 years old to register");
        return;
      }
    }

    setIsLoading(true);

    try {
      await signup({
        ...formData,
        consents,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Icon />
          </div>
          <CardTitle className="text-2xl text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up to access exclusive betting tips and VIP content
          </CardDescription>
          {referralCode && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
              🎁 Referral code applied! You&apos;ll get bonus tokens on signup.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth (Optional)</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => updateField("dob", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country (Optional)</Label>
              <Input
                id="country"
                type="text"
                placeholder="United States"
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                disabled={isLoading}
              />
            </div>
            {!referralCode && (
              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Enter referral code"
                  value={formData.referralCode}
                  onChange={(e) => updateField("referralCode", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={consents.analytics}
                  onChange={(e) =>
                    setConsents((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 mt-1"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="analytics"
                  className="text-sm font-normal cursor-pointer"
                >
                  Allow analytics to help improve the platform
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={consents.marketing}
                  onChange={(e) =>
                    setConsents((prev) => ({
                      ...prev,
                      marketing: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 mt-1"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="marketing"
                  className="text-sm font-normal cursor-pointer"
                >
                  Receive tips, promotions, and updates via email
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
