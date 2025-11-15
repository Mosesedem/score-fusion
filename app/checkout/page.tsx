"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  CreditCard,
  Banknote,
  Bitcoin,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "weekly",
    name: "Weekly VIP",
    price: 100,
    period: "week",
    features: [
      "All VIP tips & updates",
      "Correct score predictions",
      "Winning ticket screenshots",
      "Priority support",
      "7-day access",
    ],
  },
  {
    id: "biweekly",
    name: "2 Weeks VIP",
    price: 200,
    period: "2 weeks",
    features: [
      "All VIP tips & updates",
      "Correct score predictions",
      "Winning ticket screenshots",
      "Priority support",
      "Advanced analytics",
      "Telegram VIP group",
      "Cancel anytime",
    ],
  },
  {
    id: "monthly",
    name: "Monthly VIP",
    price: 400,
    period: "month",
    features: [
      "All VIP tips & updates",
      "Correct score predictions",
      "Winning ticket screenshots",
      "Priority support",
      "Advanced analytics",
      "Telegram VIP group",
      "Personal betting consultant",
      "Exclusive webinars",
      "4 months FREE",
    ],
  },
];

const paymentMethods = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Banknote,
    description: "Direct bank transfer (recommended)",
    details:
      "Account Name: Score Fusion Ltd\nBank: [Your Bank]\nAccount Number: [Account Number]\nIBAN: [IBAN]\nSWIFT: [SWIFT Code]",
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: Bitcoin,
    description: "Bitcoin, Ethereum, USDT",
    details:
      "BTC: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\nETH: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\nUSDT (ERC20): 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: CreditCard,
    description: "PayPal payment",
    details:
      "Send to: payments@scorefusion.com\nNote: Include your username in payment reference",
  },
  {
    id: "mobile_money",
    name: "Mobile Money",
    icon: Smartphone,
    description: "MTN Mobile Money, Airtel Money",
    details:
      "MTN: +256 700 000 000\nAirtel: +256 750 000 000\nName: Score Fusion",
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    transactionId: "",
    amount: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const planId = searchParams.get("plan");
    if (planId) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setFormData((prev) => ({ ...prev, amount: plan.price.toString() }));
      }
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan || !selectedPaymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please select a plan and payment method.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fullName || !formData.email || !formData.transactionId) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pay/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: selectedPaymentMethod,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast({
          title: "Payment Submitted",
          description:
            "Your payment details have been sent to our admin. We'll process your VIP access shortly.",
        });
      } else {
        throw new Error(data.error || "Failed to submit payment");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your payment. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">
              Payment Submitted Successfully!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your payment details have been sent to our admin team. We&apos;ll
              verify your payment and activate your VIP access within 24 hours.
            </p>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Our admin will verify your payment</li>
                  <li>• You&apos;ll receive a confirmation email</li>
                  <li>• VIP access will be activated automatically</li>
                  <li>• Access the VIP section from your dashboard</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => (window.location.href = "/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/vip")}
                >
                  View VIP Section
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Complete Your VIP Purchase
          </h1>
          <p className="text-muted-foreground">
            Secure checkout process - All payments are manually verified by our
            admin team
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Selected Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlan ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">
                          {selectedPlan.name}
                        </h3>
                        <p className="text-muted-foreground">
                          €{selectedPlan.price} for {selectedPlan.period}
                        </p>
                      </div>
                      <Badge variant="secondary">Selected</Badge>
                    </div>
                    <ul className="space-y-2">
                      {selectedPlan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      No plan selected. Choose a plan:
                    </p>
                    <div className="space-y-2">
                      {plans.map((plan: Plan) => {
                        const isSelected = selectedPlan
                          ? (selectedPlan as Plan).id === plan.id
                          : false;
                        return (
                          <Button
                            key={plan.id}
                            variant={isSelected ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setFormData((prev) => ({
                                ...prev,
                                amount: plan.price.toString(),
                              }));
                            }}
                          >
                            {plan.name} - €{plan.price}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div className="flex-1">
                            <h4 className="font-medium">{method.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                          {selectedPaymentMethod === method.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <div className="mt-3 p-3 bg-muted rounded text-sm">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {method.details}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fill in your payment information. Our admin will verify and
                  activate your VIP access.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (€) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                          handleInputChange("amount", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transactionId">
                      Transaction ID / Reference *
                    </Label>
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) =>
                        handleInputChange("transactionId", e.target.value)
                      }
                      placeholder="Enter your payment reference number"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is usually found in your bank statement or payment
                      confirmation
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      placeholder="Any additional information about your payment..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Important:</p>
                        <ul className="text-blue-700 mt-1 space-y-1">
                          <li>
                            • Make sure to include your username in the payment
                            reference
                          </li>
                          <li>• Keep your payment confirmation safe</li>
                          <li>• Processing usually takes 1-24 hours</li>
                          <li>
                            • You&apos;ll receive an email confirmation once
                            activated
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isSubmitting || !selectedPlan || !selectedPaymentMethod
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Submit Payment Details
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">admin@scorefusion.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">
                      Telegram: @ScoreFusionSupport
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Contact us if you have any questions about the payment
                  process.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-primary text-xl">Loading...</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
