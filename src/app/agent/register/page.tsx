"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileStack, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Tier {
  slug: string;
  name: string;
  price_cents: number;
  included_packages: number;
  overage_discount_percent: number;
  features: string[];
}

const DEFAULT_TIERS: Tier[] = [
  { slug: "pay_per_order", name: "Pay-Per-Order", price_cents: 0, included_packages: 0, overage_discount_percent: 0, features: ["No commitment", "Pay per document", "Digital delivery", "Email support"] },
  { slug: "agent_pro", name: "Agent Pro", price_cents: 14900, included_packages: 3, overage_discount_percent: 20, features: ["3 document packages/mo", "20% off additional orders", "Priority processing", "Email support"] },
  { slug: "broker_office", name: "Broker Office", price_cents: 39900, included_packages: 10, overage_discount_percent: 25, features: ["10 document packages/mo", "25% off additional orders", "Priority processing", "Multi-agent access", "Phone support"] },
  { slug: "title_partner", name: "Title Partner", price_cents: 79900, included_packages: 25, overage_discount_percent: 30, features: ["25 document packages/mo", "30% off additional orders", "Same-day rush included", "Dedicated account manager", "Bill-to-closing", "API access"] },
];

function AgentRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id") || "";

  const [step, setStep] = useState<"tier" | "details">("tier");
  const [selectedTier, setSelectedTier] = useState<string>("pay_per_order");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    company_name: "",
    license_number: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tiers] = useState<Tier[]>(DEFAULT_TIERS);

  // Auto-sign-in after registration
  useEffect(() => {
    if (success && form.email && form.password) {
      const signIn = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        router.push("/agent/dashboard");
        router.refresh();
      };
      const timer = setTimeout(signIn, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, form.email, form.password, router]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tenant_id: tenantId,
          tier_slug: selectedTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!tenantId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Invalid registration link. Please contact your management company for a valid registration URL.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto size-12 text-green-500" />
            <h2 className="text-xl font-bold">Account Created!</h2>
            <p className="text-sm text-muted-foreground">
              Signing you in and redirecting to your dashboard...
            </p>
            <Loader2 className="mx-auto size-5 animate-spin text-[#38b6ff]" />
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentTier = tiers.find((t) => t.slug === selectedTier);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-[#38b6ff]/10">
            <FileStack className="size-6 text-[#38b6ff]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create Your Agent Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get instant access to order HOA documents
          </p>
        </div>

        {step === "tier" ? (
          /* Tier Selection */
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {tiers.map((tier) => (
                <button
                  key={tier.slug}
                  type="button"
                  onClick={() => setSelectedTier(tier.slug)}
                  className={`relative rounded-lg border p-4 text-left transition-all ${
                    selectedTier === tier.slug
                      ? "border-[#38b6ff] bg-[#38b6ff]/5 ring-1 ring-[#38b6ff]"
                      : "border-border hover:border-[#38b6ff]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{tier.name}</h3>
                    {tier.slug === "broker_office" && (
                      <span className="rounded-full bg-[#38b6ff]/10 px-2 py-0.5 text-[10px] font-semibold text-[#38b6ff]">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-bold">
                    {tier.price_cents === 0
                      ? "Free"
                      : `$${(tier.price_cents / 100).toFixed(0)}`}
                    {tier.price_cents > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        /mo
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tier.included_packages > 0
                      ? `${tier.included_packages} packages included`
                      : "Pay per document"}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {tier.features.slice(0, 3).map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="size-3 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("details")}
              className="w-full rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0] active:bg-[#0A8FD4]"
            >
              Continue with {currentTier?.name}
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-[#38b6ff] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          /* Account Details */
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Details</CardTitle>
              <CardDescription>
                Creating account with{" "}
                <button
                  type="button"
                  onClick={() => setStep("tier")}
                  className="text-[#38b6ff] hover:underline"
                >
                  {currentTier?.name}
                </button>{" "}
                plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("full_name", e.target.value)
                      }
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("email", e.target.value)
                      }
                      placeholder="jane@realty.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange("password", e.target.value)
                    }
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={form.company_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("company_name", e.target.value)
                      }
                      placeholder="ABC Realty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={form.license_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange("license_number", e.target.value)
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange("phone", e.target.value)
                    }
                    placeholder="(555) 555-5555"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("tier")}
                    className="rounded-[6px]"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0] active:bg-[#0A8FD4]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#38b6ff] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default function AgentRegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#38b6ff]" />
        </main>
      }
    >
      <AgentRegisterContent />
    </Suspense>
  );
}
