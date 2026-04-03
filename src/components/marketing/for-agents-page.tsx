"use client";

import Link from "next/link";
import {
  FileText,
  DollarSign,
  ClipboardList,
  BookOpen,
  ArrowRight,
  Clock,
  Eye,
  Frown,
  CheckCircle2,
  Zap,
  Mail,
  CreditCard,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MeshGradient } from "./mesh-gradient";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
} from "./animated";

/* ───────── HERO ───────── */
function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      <MeshGradient />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32">
        <FadeUp>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <Users className="size-3.5 text-[#38b6ff]" />
            <span className="text-xs font-medium text-white/70">
              For Agents, Lenders &amp; Title Companies
            </span>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            Get HOA Documents
            <br />
            in <span className="text-[#38b6ff]">Minutes</span>, Not Days
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            No more calling management companies, waiting on hold, or tracking
            faxes. Order resale certificates, payoff statements, and more — all
            online, all delivered digitally.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/for-agents"
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#38b6ff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0] hover:scale-[1.02]"
            >
              Order Now
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </FadeUp>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFBFC] to-transparent" />
    </section>
  );
}

/* ───────── PAIN POINTS ───────── */
const PAIN_POINTS = [
  {
    icon: Clock,
    title: "Painfully Slow",
    desc: "3-5 business days for a resale certificate? Your closing timeline can't wait.",
  },
  {
    icon: Frown,
    title: "Fragmented Process",
    desc: "Every management company has a different process. Some use fax. In 2026.",
  },
  {
    icon: Eye,
    title: "Zero Transparency",
    desc: "No tracking, no status updates. You send a request into the void and hope.",
  },
];

function PainPointsSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Sound Familiar?
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              HOA documents shouldn&apos;t be this hard
            </h2>
          </div>
        </FadeUp>
        <StaggerContainer className="mt-16 grid gap-8 md:grid-cols-3">
          {PAIN_POINTS.map((point) => (
            <StaggerItem key={point.title}>
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8">
                <div className="flex size-11 items-center justify-center rounded-xl bg-red-100">
                  <point.icon className="size-5 text-red-500" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#1A1A2E]">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {point.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────── ORDER PROCESS ───────── */
const ORDER_STEPS = [
  { icon: Search, title: "Find Your Property", desc: "Search by address or select the HOA from our directory." },
  { icon: FileText, title: "Choose Documents", desc: "Select the documents you need — resale cert, payoff, lender questionnaire, or governing docs." },
  { icon: CreditCard, title: "Pay Securely", desc: "Stripe-powered checkout. Bill-to-closing available for title companies." },
  { icon: Mail, title: "Receive Digitally", desc: "Documents delivered to your email. Standard in 24-48hrs, rush same-day." },
];

function OrderProcessSection() {
  return (
    <section className="bg-[#F4F5F7] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Simple Process
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Four steps. Two minutes. Done.
            </h2>
          </div>
        </FadeUp>
        <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER_STEPS.map((step, i) => (
            <StaggerItem key={step.title}>
              <div className="relative rounded-2xl bg-white p-7 shadow-sm border border-gray-100 h-full">
                <span className="absolute -top-3 -left-1 font-mono text-5xl font-bold text-[#38b6ff]/10">
                  {i + 1}
                </span>
                <div className="relative flex size-11 items-center justify-center rounded-xl bg-[#38b6ff]/10">
                  <step.icon className="size-5 text-[#38b6ff]" />
                </div>
                <h3 className="mt-5 text-sm font-semibold text-[#1A1A2E]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────── MEMBERSHIP TIERS ───────── */
const TIERS = [
  { name: "Pay-Per-Order", price: "Free", packages: "0", saving: "—", desc: "Pay as you go. No commitment." },
  { name: "Agent Pro", price: "$149", packages: "3", saving: "20%", desc: "For individual agents with regular volume.", highlight: false },
  { name: "Broker Office", price: "$399", packages: "10", saving: "25%", desc: "For offices with multiple agents.", highlight: true },
  { name: "Title Partner", price: "$799", packages: "25", saving: "30%", desc: "For title companies with high volume.", highlight: false },
];

function MembershipSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Membership Plans
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Order frequently? Save with a membership.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              Included document packages each month, plus discounted overage rates.
            </p>
          </div>
        </FadeUp>
        <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <StaggerItem key={tier.name}>
              <div
                className={`relative flex h-full flex-col rounded-2xl p-7 transition-all hover:-translate-y-1 ${
                  tier.highlight
                    ? "bg-[#1A1A2E] text-white shadow-xl border-2 border-[#38b6ff]/30"
                    : "bg-white border border-gray-100 shadow-sm"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#38b6ff] px-3 py-0.5 text-[10px] font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <p className={`text-xs font-semibold uppercase tracking-wider ${tier.highlight ? "text-[#38b6ff]" : "text-gray-400"}`}>
                  {tier.name}
                </p>
                <p className="mt-3 font-mono text-3xl font-bold">
                  {tier.price}
                  {tier.price !== "Free" && (
                    <span className={`text-sm font-normal ${tier.highlight ? "text-white/50" : "text-gray-400"}`}>
                      /mo
                    </span>
                  )}
                </p>
                <p className={`mt-2 text-xs ${tier.highlight ? "text-white/60" : "text-gray-500"}`}>
                  {tier.desc}
                </p>
                <div className={`mt-5 space-y-2.5 border-t pt-5 flex-1 ${tier.highlight ? "border-white/10" : "border-gray-100"}`}>
                  <div className={`flex items-center gap-2 text-xs ${tier.highlight ? "text-white/80" : "text-gray-600"}`}>
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                    {tier.packages === "0" ? "No included packages" : `${tier.packages} document packages/mo`}
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${tier.highlight ? "text-white/80" : "text-gray-600"}`}>
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                    {tier.saving === "—" ? "Standard pricing" : `${tier.saving} off overage`}
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${tier.highlight ? "text-white/80" : "text-gray-600"}`}>
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                    Digital delivery
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                    tier.highlight
                      ? "bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
                      : "bg-[#F4F5F7] text-[#1A1A2E] hover:bg-gray-200"
                  }`}
                >
                  {tier.price === "Free" ? "Get Started" : "Choose Plan"}
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────── DOCUMENT TYPES WITH CONTEXT ───────── */
const DOCS_CONTEXT = [
  { icon: FileText, title: "Resale Certificate", price: "$99", when: "When selling a property in an HOA community. Required by Utah law for most resale transactions." },
  { icon: DollarSign, title: "Payoff Statement", price: "$15", when: "When closing on a property to determine exact amounts owed to the HOA." },
  { icon: ClipboardList, title: "Lender Questionnaire", price: "$95", when: "When a buyer's lender needs HOA financial and project data for underwriting (Fannie Mae 1076)." },
  { icon: BookOpen, title: "Governing Documents", price: "$35", when: "When a buyer or lender needs CC&Rs, bylaws, rules, budget, reserve study, and insurance certificates." },
];

function DocumentContextSection() {
  return (
    <section className="bg-[#F4F5F7] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Document Types
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Know what you need
            </h2>
          </div>
        </FadeUp>
        <div className="mt-16 space-y-4">
          {DOCS_CONTEXT.map((doc, i) => (
            <FadeUp key={doc.title} delay={i * 0.08}>
              <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#38b6ff]/10">
                  <doc.icon className="size-5 text-[#38b6ff]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-[#1A1A2E]">
                      {doc.title}
                    </h3>
                    <span className="font-mono text-sm font-bold text-[#38b6ff]">
                      {doc.price}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{doc.when}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-3 text-amber-500" />
                  <span className="text-xs text-gray-400">Rush +$50</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── CTA ───────── */
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#1A1A2E] py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#0C0F14] to-[#1A1A2E]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-[#38b6ff]/5 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <FadeUp>
          <ShieldCheck className="mx-auto size-12 text-[#38b6ff]/50" />
          <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to order?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
            Get your HOA documents delivered digitally. No account required for
            one-time orders, or sign up for membership savings.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/for-agents"
              className="rounded-xl bg-[#38b6ff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0]"
            >
              Order Documents
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Compare Plans
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── PAGE EXPORT ───────── */
export function ForAgentsPage() {
  return (
    <>
      <HeroSection />
      <PainPointsSection />
      <OrderProcessSection />
      <MembershipSection />
      <DocumentContextSection />
      <CTASection />
    </>
  );
}
