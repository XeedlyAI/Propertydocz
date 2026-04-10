"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DOCUMENT_PRICES,
  DOCUMENT_LABELS,
  RUSH_FEE_CENTS,
  calculateOrderTotal,
  formatCents,
} from "@/lib/pricing";
import type { DocumentType, RequesterType, Turnaround } from "@/lib/types";
import {
  FileText,
  Clock,
  Zap,
  User,
  Building2,
  Loader2,
  CheckCircle2,
  LogIn,
  ArrowRight,
  Sparkles,
  Info,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Association {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface OrderFormProps {
  tenantId: string;
  tenantName: string;
  associations: Association[];
  brandColor?: string;
}

interface CustomerSession {
  customerId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  customerType: RequesterType;
  subscriptionId: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  packagesUsed: number;
  packagesIncluded: number;
  overageDiscount: number;
  billingCycleEnd: string | null;
}

interface EmailLookupResult {
  exists: boolean;
  hasPassword: boolean;
  hasSubscription: boolean;
  subscriptionTier: string | null;
  hint: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  "resale_certificate",
  "payoff_statement",
  "governing_documents",
  "lender_questionnaire",
];

const REQUESTER_TYPE_OPTIONS: { value: RequesterType; label: string }[] = [
  { value: "agent", label: "Agent" },
  { value: "lender", label: "Lender" },
  { value: "title_company", label: "Title Co." },
  { value: "owner", label: "Homeowner" },
];

const DOCUMENT_DESCRIPTIONS: Record<DocumentType, string> = {
  resale_certificate:
    "Required for property sales — includes assessments, violations, insurance, and compliance details",
  payoff_statement: "Current balance and payoff amounts for a unit",
  governing_documents:
    "CC&Rs, bylaws, budgets, insurance certs, minutes, and more",
  lender_questionnaire: "Fannie Mae 1076 + Addendum 1076A + Addendum II",
};

// ─── Sign-In Modal ───

function SignInModal({
  onClose,
  onSuccess,
  brandColor,
}: {
  onClose: () => void;
  onSuccess: (session: CustomerSession) => void;
  brandColor: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Invalid email or password");
        return;
      }

      if (!data.user) {
        setError("Sign in failed. Please try again.");
        return;
      }

      // Fetch customer account + subscription
      const res = await fetch(`/api/customer/session?userId=${data.user.id}`);
      if (res.ok) {
        const session = await res.json();
        onSuccess(session);
      } else {
        // Auth succeeded but no customer account — still proceed
        onSuccess({
          customerId: "",
          userId: data.user.id,
          name: data.user.user_metadata?.full_name || "",
          email: data.user.email || email,
          phone: "",
          company: "",
          customerType: "agent",
          subscriptionId: null,
          subscriptionTier: null,
          subscriptionStatus: null,
          packagesUsed: 0,
          packagesIncluded: 0,
          overageDiscount: 0,
          billingCycleEnd: null,
        });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your account and subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: brandColor }}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="size-4" /> Sign In</>
              )}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Continue as guest
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Subscription Status Bar ───

function SubscriptionStatusBar({
  session,
  totalCents,
  brandColor,
}: {
  session: CustomerSession;
  totalCents: number;
  brandColor: string;
}) {
  const remaining = session.packagesIncluded - session.packagesUsed;
  const usagePct = session.packagesIncluded > 0
    ? (session.packagesUsed / session.packagesIncluded) * 100
    : 0;

  const tierLabels: Record<string, string> = {
    agent_pro: "Agent Pro",
    broker_office: "Broker Office",
    title_partner: "Title Partner",
  };
  const tierName = tierLabels[session.subscriptionTier || ""] || "Subscriber";

  return (
    <Card className="border-l-[3px] border-l-[#14b8a6]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#14b8a6]" />
            <span className="text-sm font-medium">
              Signed in as {session.name}
            </span>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: brandColor }}
          >
            {tierName}
          </span>
        </div>

        {/* Usage bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Packages this month</span>
            <span className="font-mono font-medium text-foreground">
              {session.packagesUsed} of {session.packagesIncluded} used
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePct > 100 ? "bg-[#ef4444]" : usagePct > 80 ? "bg-[#f59e0b]" : "bg-[#14b8a6]"
              }`}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
          {session.billingCycleEnd && (
            <p className="text-[10px] text-muted-foreground">
              Resets: {new Date(session.billingCycleEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Coverage message */}
        {remaining > 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/5 px-3 py-2 text-xs text-[#14b8a6]">
            <Info className="size-3.5 shrink-0" />
            {totalCents > 0
              ? "This order will be covered by your plan. No charge."
              : "Orders are covered by your plan."}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-2 text-xs text-[#f59e0b]">
            <AlertTriangle className="size-3.5 shrink-0" />
            All {session.packagesIncluded} packages used. Overage rate: {Math.round(session.overageDiscount * 100)}% off.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Order Form ───

export function OrderForm({
  tenantId,
  tenantName,
  associations,
  brandColor = "#38b6ff",
}: OrderFormProps) {
  const router = useRouter();

  // Customer identification state
  const [step, setStep] = useState<"identify" | "order">("identify");
  const [showSignIn, setShowSignIn] = useState(false);
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);

  // Guest fields
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterCompany, setRequesterCompany] = useState("");
  const [requesterType, setRequesterType] = useState<RequesterType>("agent");

  // Email lookup
  const [emailLookup, setEmailLookup] = useState<EmailLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupTimer = useRef<NodeJS.Timeout | null>(null);

  // Order fields
  const [associationId, setAssociationId] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<DocumentType[]>([]);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [ownerNames, setOwnerNames] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [turnaround, setTurnaround] = useState<Turnaround>("standard");
  const [rushNotes, setRushNotes] = useState("");
  const [billToClosing, setBillToClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isStandalonePayoff =
    selectedDocs.length === 1 && selectedDocs[0] === "payoff_statement";
  const showBillToClosing = isStandalonePayoff;
  const baseTotalCents = calculateOrderTotal(selectedDocs, turnaround === "rush");

  // ── Subscription pricing ──
  const hasActiveSubscription = customerSession?.subscriptionId &&
    customerSession.subscriptionStatus === "active" &&
    customerSession.subscriptionTier !== "free";

  const subscriptionRemaining = hasActiveSubscription
    ? (customerSession?.packagesIncluded || 0) - (customerSession?.packagesUsed || 0)
    : 0;

  const isCovered = hasActiveSubscription && subscriptionRemaining > 0;
  const isOverage = hasActiveSubscription && subscriptionRemaining <= 0;
  const overageDiscount = customerSession?.overageDiscount || 0;
  const discountAmount = isOverage ? Math.round(baseTotalCents * overageDiscount) : 0;
  const finalTotal = isCovered ? 0 : isOverage ? baseTotalCents - discountAmount : baseTotalCents;

  // ── Email lookup with debounce ──
  const handleEmailChange = useCallback(
    (value: string) => {
      setRequesterEmail(value);
      setEmailLookup(null);

      if (lookupTimer.current) clearTimeout(lookupTimer.current);

      if (!value || !value.includes("@") || value.length < 5) return;

      lookupTimer.current = setTimeout(async () => {
        setLookupLoading(true);
        try {
          const res = await fetch(
            `/api/customer/lookup?email=${encodeURIComponent(value.trim())}`
          );
          if (res.ok) {
            const data = await res.json();
            setEmailLookup(data);
          }
        } catch {
          // Silent fail
        } finally {
          setLookupLoading(false);
        }
      }, 300);
    },
    []
  );

  // Clean up timer
  useEffect(() => {
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, []);

  // ── Sign in success ──
  function handleSignInSuccess(session: CustomerSession) {
    setCustomerSession(session);
    setRequesterName(session.name);
    setRequesterEmail(session.email);
    setRequesterPhone(session.phone);
    setRequesterCompany(session.company);
    if (session.customerType) {
      setRequesterType(session.customerType as RequesterType);
    }
    setShowSignIn(false);
    setStep("order");
  }

  // ── Continue as guest ──
  function handleContinueAsGuest() {
    const errs: Record<string, string> = {};
    if (!requesterName.trim()) errs.requesterName = "Name is required";
    if (!requesterEmail.trim()) {
      errs.requesterEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      errs.requesterEmail = "Enter a valid email";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep("order");
  }

  // ── Doc toggle ──
  function toggleDoc(doc: DocumentType) {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
    if (doc !== "payoff_statement" || selectedDocs.length !== 1) {
      setBillToClosing(false);
    }
  }

  // ── Validation ──
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!associationId) newErrors.association = "Please select an association";
    if (selectedDocs.length === 0) newErrors.documents = "Select at least one document type";
    if (!propertyAddress.trim()) newErrors.propertyAddress = "Property address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          association_id: associationId,
          document_types: selectedDocs,
          property_address: propertyAddress,
          unit_number: unitNumber || undefined,
          owner_names: ownerNames || undefined,
          closing_date: closingDate || undefined,
          requester_name: requesterName,
          requester_email: requesterEmail,
          requester_phone: requesterPhone || undefined,
          requester_type: requesterType,
          turnaround,
          rush_notes: turnaround === "rush" ? rushNotes : undefined,
          bill_to_closing: billToClosing,
          // Subscription context
          customer_id: customerSession?.customerId || undefined,
          subscription_id: customerSession?.subscriptionId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ submit: data.error || "Something went wrong" });
        return;
      }

      const data = await response.json();

      // If checkout URL returned, redirect to Stripe
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      // Otherwise redirect to success
      const params = new URLSearchParams({ request_id: data.id });
      if (!customerSession) params.set("guest", "true");
      if (requesterEmail) params.set("email", requesterEmail);
      router.push(`/success?${params.toString()}`);
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  // Brand color utilities
  const bc = brandColor;
  const selectedStyle = {
    borderColor: bc,
    backgroundColor: `${bc}0D`,
    boxShadow: `0 0 0 1px ${bc}33`,
  };
  const hoverBorderColor = `${bc}66`;
  const focusRingStyle = {
    borderColor: bc,
    boxShadow: `0 0 0 2px ${bc}33`,
  };

  // ── Tier labels for upsell ──
  const tierLabels: Record<string, string> = {
    agent_pro: "Agent Pro",
    broker_office: "Broker Office",
    title_partner: "Title Partner",
  };

  // ═══════════════════════════════════════
  // STEP 1: Customer Identification
  // ═══════════════════════════════════════
  if (step === "identify") {
    return (
      <>
        {showSignIn && (
          <SignInModal
            onClose={() => setShowSignIn(false)}
            onSuccess={handleSignInSuccess}
            brandColor={bc}
          />
        )}

        <div className="space-y-6">
          {/* Sign In Prompt */}
          <Card>
            <CardContent className="p-5">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Returning customer?</p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowSignIn(true)}
                >
                  <LogIn className="size-4" />
                  Sign In with Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or continue as guest</span>
            </div>
          </div>

          {/* Guest Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" style={{ color: bc }} />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Full Name *</Label>
                  <Input
                    id="guestName"
                    placeholder="Jane Smith"
                    value={requesterName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRequesterName(e.target.value)
                    }
                    aria-invalid={!!errors.requesterName}
                  />
                  {errors.requesterName && (
                    <p className="text-sm text-destructive">{errors.requesterName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email *</Label>
                  <div className="relative">
                    <Input
                      id="guestEmail"
                      type="email"
                      placeholder="jane@example.com"
                      value={requesterEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleEmailChange(e.target.value)
                      }
                      aria-invalid={!!errors.requesterEmail}
                    />
                    {lookupLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {errors.requesterEmail && (
                    <p className="text-sm text-destructive">{errors.requesterEmail}</p>
                  )}
                  {/* Email lookup hint */}
                  {emailLookup?.exists && !errors.requesterEmail && (
                    <button
                      type="button"
                      onClick={() => setShowSignIn(true)}
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: bc }}
                    >
                      <Sparkles className="size-3" />
                      {emailLookup.hint}
                      <ArrowRight className="size-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    placeholder="(801) 555-0100"
                    value={requesterPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRequesterPhone(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestCompany">Company</Label>
                  <Input
                    id="guestCompany"
                    placeholder="Brokerage name"
                    value={requesterCompany}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRequesterCompany(e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Customer type pills */}
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="flex flex-wrap gap-2">
                  {REQUESTER_TYPE_OPTIONS.map((opt) => {
                    const isSelected = requesterType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRequesterType(opt.value)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "text-white"
                            : "border-border text-muted-foreground hover:border-border hover:bg-muted/50"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: bc, borderColor: bc }
                            : undefined
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue button */}
          <Button
            onClick={handleContinueAsGuest}
            size="lg"
            className="w-full h-11 rounded-[6px] text-white font-semibold gap-2"
            style={{ backgroundColor: bc }}
          >
            Continue to Order
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════
  // STEP 2: Order Form (with subscription context)
  // ═══════════════════════════════════════
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back to identification */}
      <button
        type="button"
        onClick={() => {
          setStep("identify");
          setCustomerSession(null);
        }}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Change requester info
      </button>

      {/* Subscription status bar (for signed-in subscribers) */}
      {hasActiveSubscription && customerSession && (
        <SubscriptionStatusBar
          session={customerSession}
          totalCents={baseTotalCents}
          brandColor={bc}
        />
      )}

      {/* Free tier upsell */}
      {customerSession && !hasActiveSubscription && (
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: `${bc}33`, backgroundColor: `${bc}08` }}>
          <Info className="size-4 shrink-0" style={{ color: bc }} />
          <p className="text-xs text-muted-foreground">
            You&apos;re on the Pay-Per-Order plan.{" "}
            <a href="/pricing" className="font-medium underline" style={{ color: bc }}>
              Upgrade to save →
            </a>
          </p>
        </div>
      )}

      {/* Association Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" style={{ color: bc }} />
            Association
          </CardTitle>
          <CardDescription>
            Select the HOA community for this document request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={associationId}
            onChange={(e) => setAssociationId(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors dark:bg-input/30"
            onFocus={(e) => Object.assign(e.target.style, focusRingStyle)}
            onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            aria-invalid={!!errors.association}
          >
            <option value="">Select an association...</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.city && a.state ? ` — ${a.city}, ${a.state}` : ""}
              </option>
            ))}
          </select>
          {errors.association && (
            <p className="mt-1.5 text-sm text-destructive">{errors.association}</p>
          )}
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" style={{ color: bc }} />
            Documents Requested
          </CardTitle>
          <CardDescription>
            Select the documents you need. Prices shown per document.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOCUMENT_TYPES.map((doc) => {
            const isSelected = selectedDocs.includes(doc);
            return (
              <label
                key={doc}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all duration-150 ${
                  isSelected ? "" : "border-border hover:bg-muted/50"
                }`}
                style={isSelected ? selectedStyle : undefined}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = hoverBorderColor; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = ""; }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleDoc(doc)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{DOCUMENT_LABELS[doc]}</span>
                    <span className="font-data text-sm font-semibold" style={{ color: bc }}>
                      {formatCents(DOCUMENT_PRICES[doc])}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {DOCUMENT_DESCRIPTIONS[doc]}
                  </p>
                </div>
              </label>
            );
          })}
          {errors.documents && (
            <p className="text-sm text-destructive">{errors.documents}</p>
          )}
        </CardContent>
      </Card>

      {/* Property Address */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyAddress">Property Address</Label>
            <Input
              id="propertyAddress"
              placeholder="123 Main Street"
              value={propertyAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPropertyAddress(e.target.value)}
              aria-invalid={!!errors.propertyAddress}
            />
            {errors.propertyAddress && (
              <p className="text-sm text-destructive">{errors.propertyAddress}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit / Lot Number (optional)</Label>
            <Input
              id="unitNumber"
              placeholder="Unit 101"
              value={unitNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitNumber(e.target.value)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="ownerNames">Owner Name(s)</Label>
            <Input
              id="ownerNames"
              placeholder="Current owner(s) of record"
              value={ownerNames}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwnerNames(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Providing this now speeds up fulfillment.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closingDate">Estimated Closing Date</Label>
            <Input
              id="closingDate"
              type="date"
              value={closingDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClosingDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Providing this now speeds up fulfillment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Turnaround */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" style={{ color: bc }} />
            Turnaround Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all duration-150 ${
                turnaround === "standard" ? "" : "border-border hover:bg-muted/50"
              }`}
              style={turnaround === "standard" ? selectedStyle : undefined}
              onMouseEnter={(e) => { if (turnaround !== "standard") e.currentTarget.style.borderColor = hoverBorderColor; }}
              onMouseLeave={(e) => { if (turnaround !== "standard") e.currentTarget.style.borderColor = ""; }}
            >
              <input
                type="radio"
                name="turnaround"
                value="standard"
                checked={turnaround === "standard"}
                onChange={() => setTurnaround("standard")}
                className="size-4"
                style={{ accentColor: bc }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Standard</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">3-5 business days</p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all duration-150 ${
                turnaround === "rush" ? "" : "border-border hover:bg-muted/50"
              }`}
              style={turnaround === "rush" ? selectedStyle : undefined}
              onMouseEnter={(e) => { if (turnaround !== "rush") e.currentTarget.style.borderColor = hoverBorderColor; }}
              onMouseLeave={(e) => { if (turnaround !== "rush") e.currentTarget.style.borderColor = ""; }}
            >
              <input
                type="radio"
                name="turnaround"
                value="rush"
                checked={turnaround === "rush"}
                onChange={() => setTurnaround("rush")}
                className="size-4"
                style={{ accentColor: bc }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  <span className="text-sm font-medium">Rush</span>
                  <span className="font-data rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    +{formatCents(RUSH_FEE_CENTS)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">1-2 business days</p>
              </div>
            </label>
          </div>

          {turnaround === "rush" && (
            <div className="space-y-2">
              <Label htmlFor="rushNotes">Rush Notes (closing date, urgency details)</Label>
              <Textarea
                id="rushNotes"
                placeholder="e.g., Closing date is April 15. Need documents by April 10."
                value={rushNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRushNotes(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill to Closing */}
      {showBillToClosing && (
        <Card>
          <CardContent className="pt-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={billToClosing}
                onCheckedChange={(checked) => setBillToClosing(checked as boolean)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">Bill to Closing</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  The payoff statement fee will be collected at closing instead of now.
                  Available for standalone payoff statements only.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════
          Order Summary — Subscription-Aware
          ═══════════════════════════════════ */}
      <div className="dark-accent-card rounded-xl p-6">
        <h3 className="text-base font-semibold text-white">Order Summary</h3>
        <p className="text-xs text-white/50">Review your order before submitting</p>
        <div className="mt-4 space-y-2.5">
          {selectedDocs.length === 0 ? (
            <p className="text-sm text-white/40">No documents selected yet.</p>
          ) : (
            <>
              {selectedDocs.map((doc) => (
                <div key={doc} className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{DOCUMENT_LABELS[doc]}</span>
                  <span className="font-data text-sm font-medium text-white">
                    {formatCents(DOCUMENT_PRICES[doc])}
                  </span>
                </div>
              ))}
              {turnaround === "rush" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Rush Processing</span>
                  <span className="font-data text-sm font-medium text-white">
                    {formatCents(RUSH_FEE_CENTS)}
                  </span>
                </div>
              )}

              {/* Subscription discount line */}
              {isCovered && (
                <>
                  <Separator className="!bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Subtotal</span>
                    <span className="font-data text-sm font-medium text-white">
                      {formatCents(baseTotalCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#14b8a6]">
                      {tierLabels[customerSession?.subscriptionTier || ""] || "Plan"} Coverage
                    </span>
                    <span className="font-data text-sm font-medium text-[#14b8a6]">
                      -{formatCents(baseTotalCents)}
                    </span>
                  </div>
                </>
              )}
              {isOverage && discountAmount > 0 && (
                <>
                  <Separator className="!bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Subtotal</span>
                    <span className="font-data text-sm font-medium text-white">
                      {formatCents(baseTotalCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#f59e0b]">
                      {tierLabels[customerSession?.subscriptionTier || ""] || "Plan"} Overage ({Math.round(overageDiscount * 100)}% off)
                    </span>
                    <span className="font-data text-sm font-medium text-[#f59e0b]">
                      -{formatCents(discountAmount)}
                    </span>
                  </div>
                </>
              )}

              <Separator className="!bg-white/10" />
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-semibold text-white">Total</span>
                <span className="font-data text-xl font-bold" style={{ color: bc }}>
                  {billToClosing
                    ? "Bill to Closing"
                    : isCovered
                      ? "$0.00"
                      : formatCents(finalTotal)}
                </span>
              </div>

              {/* Coverage/overage status banner */}
              {isCovered && !billToClosing && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#14b8a6]/10 px-3 py-2.5">
                  <CheckCircle2 className="size-4 text-[#14b8a6] shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-[#14b8a6]">Covered by your plan</p>
                    <p className="text-white/50 mt-0.5">
                      Package {(customerSession?.packagesUsed || 0) + 1} of {customerSession?.packagesIncluded} this month
                    </p>
                  </div>
                </div>
              )}
              {isOverage && !billToClosing && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f59e0b]/10 px-3 py-2.5">
                  <AlertTriangle className="size-4 text-[#f59e0b] shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-[#f59e0b]">Overage order</p>
                    <p className="text-white/50 mt-0.5">
                      All {customerSession?.packagesIncluded} packages used. Your {Math.round(overageDiscount * 100)}% discount saved {formatCents(discountAmount)}.
                    </p>
                  </div>
                </div>
              )}
              {/* Standard user upsell */}
              {!hasActiveSubscription && !billToClosing && selectedDocs.length > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5">
                  <Sparkles className="size-4 shrink-0" style={{ color: bc }} />
                  <p className="text-xs text-white/60">
                    Save up to 30% with a subscription.{" "}
                    <a href="/pricing" className="font-medium underline" style={{ color: bc }}>
                      Learn more →
                    </a>
                  </p>
                </div>
              )}

              {billToClosing && (
                <p className="text-xs text-white/40">
                  Fee will be collected at closing. No payment required now.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit */}
      {errors.submit && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || selectedDocs.length === 0}
        className="w-full h-11 rounded-[6px] text-white font-semibold transition-colors"
        style={{ backgroundColor: bc }}
      >
        {submitting ? (
          <><Loader2 className="size-4 animate-spin" /> Submitting...</>
        ) : billToClosing ? (
          <><CheckCircle2 className="size-4" /> Submit Order (Bill to Closing)</>
        ) : isCovered ? (
          <><CheckCircle2 className="size-4" /> Submit Order — No Charge</>
        ) : (
          <><CheckCircle2 className="size-4" /> {finalTotal > 0 ? `Submit Order — ${formatCents(finalTotal)}` : "Submit Order"}</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Managed by {tenantName} via PropertyDocz
      </p>
    </form>
  );
}
