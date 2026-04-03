"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  ArrowRight,
  DollarSign,
  Palette,
  FolderSync,
  Brain,
  Shield,
  BarChart3,
  CheckCircle2,
  Users,
  FileText,
  Settings,
  Rocket,
  Phone,
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
            <Building2 className="size-3.5 text-[#38b6ff]" />
            <span className="text-xs font-medium text-white/70">
              For HOA Management Companies
            </span>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            Your Properties.
            <br />
            <span className="text-[#38b6ff]">Your Revenue.</span>
            <br />
            Our Platform.
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Stop losing document revenue to CondoCerts and third-party services.
            PropertyDocz gives you a branded portal, AI-powered generation, and a
            revenue share on every document your properties produce.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="mailto:partners@propertydocz.com"
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#38b6ff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0] hover:scale-[1.02]"
            >
              <Phone className="size-4" />
              Schedule a Demo
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#revenue-calculator"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <DollarSign className="size-4" />
              Calculate Your Revenue
            </Link>
          </div>
        </FadeUp>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFBFC] to-transparent" />
    </section>
  );
}

/* ───────── PROBLEM / SOLUTION ───────── */
function ProblemSolutionSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <FadeUp>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                The Problem
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#1A1A2E] sm:text-3xl">
                You&apos;re leaving money on the table
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  "Third-party services like CondoCerts charge $200+ per resale certificate — and keep all of it",
                  "Your staff spends hours manually assembling documents that AI can generate in minutes",
                  "Agents and title companies are frustrated by slow turnaround and opaque processes",
                  "You have no visibility into document volume, revenue, or fulfillment performance",
                ].map((problem) => (
                  <div key={problem} className="flex gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 shrink-0 text-red-400">&#x2715;</span>
                    {problem}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-500">
                The Solution
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#1A1A2E] sm:text-3xl">
                Keep your revenue. Delight your clients.
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  "Branded portal at yourcompany.propertydocz.com — agents order directly from you",
                  "AI generates compliant documents in minutes, not days — you review and approve",
                  "Revenue share on every document sold through your portal",
                  "Real-time dashboard with volume, revenue, and turnaround analytics",
                ].map((solution) => (
                  <div key={solution} className="flex gap-3 text-sm text-gray-600">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {solution}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ───────── REVENUE CALCULATOR ───────── */
function RevenueCalculator() {
  const [properties, setProperties] = useState(50);
  // Assume ~15% of properties transact per year, ~1.5 docs per transaction
  const estimatedOrders = Math.round(properties * 0.15 * 1.5);
  const avgRevPerDoc = 75; // average revenue share per document
  const annualRevenue = estimatedOrders * avgRevPerDoc;

  return (
    <section id="revenue-calculator" className="bg-[#F4F5F7] py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Revenue Calculator
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Estimate your annual document revenue
            </h2>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="mt-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#1A1A2E]">
                  Properties Managed
                </label>
                <span className="font-mono text-2xl font-bold text-[#38b6ff]">
                  {properties}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={5}
                value={properties}
                onChange={(e) => setProperties(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#38b6ff]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10</span>
                <span>500</span>
              </div>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F4F5F7] p-5 text-center">
                <p className="text-xs font-medium text-gray-500">Est. Annual Orders</p>
                <p className="mt-1 font-mono text-3xl font-bold text-[#1A1A2E]">
                  {estimatedOrders}
                </p>
              </div>
              <div className="rounded-xl bg-[#F4F5F7] p-5 text-center">
                <p className="text-xs font-medium text-gray-500">Avg. Revenue / Doc</p>
                <p className="mt-1 font-mono text-3xl font-bold text-[#1A1A2E]">
                  ${avgRevPerDoc}
                </p>
              </div>
              <div className="rounded-xl bg-[#38b6ff]/10 p-5 text-center border border-[#38b6ff]/20">
                <p className="text-xs font-medium text-[#38b6ff]">Est. Annual Revenue</p>
                <p className="mt-1 font-mono text-3xl font-bold text-[#1A1A2E]">
                  ${annualRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-gray-400">
              Based on ~15% annual turnover rate and 1.5 documents per transaction.
              Actual revenue depends on your portfolio and market conditions.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── FEATURES GRID ───────── */
const FEATURES = [
  {
    icon: Palette,
    title: "Branded Portal",
    desc: "Your logo, your domain, your brand. Agents see your company, not ours.",
  },
  {
    icon: FolderSync,
    title: "Dropbox Sync",
    desc: "Connect your Dropbox and governing documents stay automatically in sync.",
  },
  {
    icon: Brain,
    title: "AI Generation",
    desc: "Claude AI generates compliant documents from your association data in minutes.",
  },
  {
    icon: Shield,
    title: "Utah Compliance",
    desc: "Every document validated against Utah Code requirements automatically.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track orders, revenue, turnaround times, and fulfillment performance.",
  },
  {
    icon: DollarSign,
    title: "Revenue Share",
    desc: "Earn on every document. Your properties, your revenue — we just power the platform.",
  },
];

function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Platform Features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Everything you need to run document fulfillment
            </h2>
          </div>
        </FadeUp>
        <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <StaggerItem key={feat.title}>
              <div className="group rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#38b6ff]/10 group-hover:bg-[#38b6ff]/15 transition-colors">
                  <feat.icon className="size-5 text-[#38b6ff]" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-[#1A1A2E]">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feat.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ───────── ONBOARDING TIMELINE ───────── */
const ONBOARDING = [
  { num: 1, icon: Phone, title: "Schedule a Demo", desc: "See the platform in action and discuss your portfolio." },
  { num: 2, icon: Users, title: "Sign Partnership Agreement", desc: "Simple terms — revenue share, no long-term lock-in." },
  { num: 3, icon: Settings, title: "We Configure Your Portal", desc: "Branded subdomain, logo, association data import." },
  { num: 4, icon: FolderSync, title: "Connect Your Data", desc: "Sync Dropbox folders, import association records." },
  { num: 5, icon: Rocket, title: "Go Live", desc: "Share your portal link with agents. Orders start flowing." },
];

function OnboardingSection() {
  return (
    <section className="bg-[#F4F5F7] py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Getting Started
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Live in 5 steps
            </h2>
          </div>
        </FadeUp>
        <div className="mt-16 space-y-0">
          {ONBOARDING.map((step, i) => (
            <FadeUp key={step.num} delay={i * 0.08}>
              <div className="relative flex gap-6 pb-10 last:pb-0">
                {/* Timeline line */}
                {i < ONBOARDING.length - 1 && (
                  <div className="absolute left-[23px] top-12 bottom-0 w-px bg-[#38b6ff]/20" />
                )}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#38b6ff] text-white shadow-lg shadow-[#38b6ff]/20">
                  <step.icon className="size-5" />
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-semibold text-[#1A1A2E]">
                    <span className="text-[#38b6ff] mr-1">Step {step.num}.</span>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FINAL CTA ───────── */
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#1A1A2E] py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#0C0F14] to-[#1A1A2E]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-[#38b6ff]/5 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <FadeUp>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Start earning from your document orders
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
            No upfront cost, no long-term commitment. We set up your branded portal
            and you start earning from day one.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="mailto:partners@propertydocz.com"
              className="rounded-xl bg-[#38b6ff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0]"
            >
              Schedule a Demo
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── PAGE EXPORT ───────── */
export function ForManagementCompaniesPage() {
  return (
    <>
      <HeroSection />
      <ProblemSolutionSection />
      <RevenueCalculator />
      <FeaturesSection />
      <OnboardingSection />
      <CTASection />
    </>
  );
}
