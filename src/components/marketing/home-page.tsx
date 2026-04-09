"use client";

import Link from "next/link";
import {
  FileText,
  DollarSign,
  ClipboardList,
  BookOpen,
  Zap,
  Shield,
  Brain,
  Clock,
  ArrowRight,
  Building2,
  Users,
  CheckCircle2,
  BarChart3,
  Scale,
  Send,
} from "lucide-react";
import { MeshGradient } from "./mesh-gradient";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
} from "./animated";

/* ───────── HERO ───────── */
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <MeshGradient />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center">
        {/* Left column — content (~55%) */}
        <div className="md:col-span-7 text-center md:text-left">
          <FadeUp>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <Zap className="size-3.5 text-[#38b6ff]" />
              <span className="text-xs font-medium text-white/70">
                AI-Powered HOA Document Platform
              </span>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl">
              Property Documents.
              <br />
              <span className="text-[#38b6ff]">Ordered in Seconds.</span>
              <br />
              Delivered with Precision.
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl md:mx-0 mx-auto">
              The modern platform for HOA management companies, agents, and
              lenders. AI-generated resale certificates, payoff statements, and
              more — compliant with Utah law, delivered digitally.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:justify-start sm:justify-center">
              <Link
                href="/for-management-companies"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#1A1A2E] shadow-2xl transition-all hover:shadow-white/20 hover:scale-[1.02] min-h-[44px]"
              >
                <Building2 className="size-4" />
                I&apos;m a Management Company
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/for-agents"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#38b6ff]/30 bg-[#38b6ff]/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-[#38b6ff]/20 hover:border-[#38b6ff]/50 min-h-[44px]"
              >
                <FileText className="size-4" />
                I Need Documents
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </FadeUp>
        </div>

        {/* Right column — illustration (~45%) */}
        <div className="md:col-span-5 flex items-center justify-center min-h-[300px] md:min-h-[350px] lg:min-h-[450px]">
          <FadeUp delay={0.4}>
            <HeroIllustration className="w-full h-auto max-w-[600px] opacity-90 drop-shadow-2xl" />
          </FadeUp>
        </div>
      </div>
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFBFC] to-transparent" />
    </section>
  );
}

/* ───────── HOW IT WORKS ───────── */
const STEPS = [
  {
    num: "01",
    title: "Order Online",
    desc: "Select your document type, enter the property address, and submit your order in under 2 minutes.",
    icon: ClipboardList,
    color: "bg-[#38b6ff]/10 text-[#38b6ff]",
  },
  {
    num: "02",
    title: "AI Generates",
    desc: "Our AI engine pulls association data, validates against Utah code, and generates compliant documents.",
    icon: Brain,
    color: "bg-[#38b6ff]/10 text-[#38b6ff]",
  },
  {
    num: "03",
    title: "Delivered Digitally",
    desc: "Receive your documents via email — typically within hours, not days. Rush available for same-day.",
    icon: Send,
    color: "bg-[#38b6ff]/10 text-[#38b6ff]",
  },
];

function HowItWorksSection() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Topo background overlay */}
      <div className="topo-bg absolute inset-0 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Three steps to your documents
            </h2>
          </div>
        </FadeUp>
        <StaggerContainer className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <StaggerItem key={step.num}>
              <div className="group relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl ${step.color}`}
                  >
                    <step.icon className="size-5" />
                  </div>
                  <span className="font-mono text-3xl font-bold text-gray-100 group-hover:text-[#38b6ff]/20 transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-800">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
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

/* ───────── TWO AUDIENCE SPLIT ───────── */
function AudienceSplitSection() {
  return (
    <section
      className="py-24 sm:py-32"
      style={{ backgroundColor: "#f0f4f8" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Built for Everyone in the Transaction
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Two sides. One platform.
            </h2>
          </div>
        </FadeUp>
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <FadeUp delay={0.1}>
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 sm:p-10 shadow-sm border border-gray-100 transition-all hover:shadow-lg h-full">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#1A1A2E]">
                <Building2 className="size-6 text-[#38b6ff]" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-800">
                Management Companies
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Stop losing document revenue to third-party services. Fulfill
                orders through your own branded portal, keep a revenue share on
                every document, and let AI handle the heavy lifting.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Branded ordering portal",
                  "Revenue share on every document",
                  "AI-powered generation",
                  "Dropbox sync for governing docs",
                  "Analytics dashboard",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-sm text-gray-600"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-[#14b8a6]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/for-management-companies"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#38b6ff] hover:underline"
              >
                Learn more <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 sm:p-10 shadow-sm border border-gray-100 transition-all hover:shadow-lg h-full">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#38b6ff]/10">
                <Users className="size-6 text-[#38b6ff]" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-800">
                Agents, Lenders &amp; Title Companies
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Order the HOA documents you need in minutes, not days. No more
                chasing management companies, waiting on hold, or tracking faxes.
                Digital delivery, transparent pricing.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Order in under 2 minutes",
                  "Digital delivery via email",
                  "Rush and standard turnaround",
                  "Membership plans for volume",
                  "Bill-to-closing option",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-sm text-gray-600"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-[#14b8a6]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/for-agents"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#38b6ff] hover:underline"
              >
                Learn more <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ───────── DOCUMENT TYPES ───────── */
const DOC_TYPES = [
  {
    title: "Resale Certificate",
    price: "$99",
    icon: FileText,
    desc: "Complete financial disclosure for property resale transactions. Includes assessments, reserves, insurance, policies, and litigation status per Utah Code \u00A757-8a-227.",
  },
  {
    title: "Payoff Statement",
    price: "$15",
    icon: DollarSign,
    desc: "Itemized statement of all amounts owed to the HOA at closing. Includes per diem calculations, payment instructions, and HB 217 compliance.",
  },
  {
    title: "Lender Questionnaire",
    price: "$95",
    icon: ClipboardList,
    desc: "Fannie Mae 1076 / Freddie Mac 476 compliant questionnaire. Covers ownership distribution, financials, insurance, litigation, and environmental data.",
  },
  {
    title: "Governing Documents",
    price: "$35",
    icon: BookOpen,
    desc: "Complete CC&R, bylaws, amendments, rules, budget, reserve study, and insurance certificate package with cover sheet and document checklist.",
  },
];

function DocumentTypesSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="topo-bg absolute inset-0 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Document Types
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Everything you need for the transaction
            </h2>
          </div>
        </FadeUp>
        <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DOC_TYPES.map((doc) => (
            <StaggerItem key={doc.title}>
              <div className="group relative flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#38b6ff]/10">
                    <doc.icon className="size-5 text-[#38b6ff]" />
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-800">
                    {doc.price}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-800">
                  {doc.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                  {doc.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <FadeUp>
          <div className="mt-12 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#38b6ff] hover:underline"
            >
              View full pricing details <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── MEMBERSHIP TEASER ───────── */
function MembershipTeaser() {
  return (
    <section
      className="py-24 sm:py-32"
      style={{ backgroundColor: "#f5f5f0" }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1A2E] to-[#0C0F14] p-8 sm:p-14 shadow-2xl">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-[#38b6ff]/10 blur-[80px]" />
            <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
                  Membership Plans
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Order frequently? Save with a membership.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  Get included document packages each month, discounted overage
                  rates, and priority processing. Plans start at $149/month.
                </p>
                <Link
                  href="/pricing"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#38b6ff] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 hover:bg-[#1DA8F0] transition-all min-h-[44px]"
                >
                  View Plans <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { tier: "Agent Pro", price: "$149", packages: "3" },
                  { tier: "Broker Office", price: "$399", packages: "10" },
                  { tier: "Title Partner", price: "$799", packages: "25" },
                ].map((plan) => (
                  <div
                    key={plan.tier}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
                  >
                    <p className="text-xs font-medium text-white/40">
                      {plan.tier}
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-white">
                      {plan.price}
                    </p>
                    <p className="mt-0.5 text-xs text-[#38b6ff]">
                      {plan.packages} packages/mo
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── AI INTELLIGENCE ───────── */
const AI_FEATURES = [
  {
    icon: Scale,
    title: "Utah Code Compliance",
    desc: "Every document is validated against \u00A757-8a-227, \u00A757-8a-106, and HB 217 requirements automatically.",
  },
  {
    icon: Shield,
    title: "Data Validation",
    desc: "AI reviews financial figures, dates, and legal references for accuracy before generation.",
  },
  {
    icon: Clock,
    title: "Instant Generation",
    desc: "What used to take days now takes minutes. AI pulls data, generates, and delivers in one workflow.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "Management companies get insights into document volume, revenue, and fulfillment performance.",
  },
];

function AIIntelligenceSection() {
  return (
    <section
      className="py-24 sm:py-32"
      style={{ backgroundColor: "#f0f4f8" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 lg:items-center">
          <FadeUp>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
                AI Intelligence
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                Powered by AI that understands Utah HOA law
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Our AI engine doesn&apos;t just fill in templates — it validates
                data, checks compliance, flags anomalies, and ensures every
                document meets statutory requirements. Advisory warnings help
                your team catch issues before delivery.
              </p>
            </div>
          </FadeUp>
          <StaggerContainer className="grid gap-5 sm:grid-cols-2">
            {AI_FEATURES.map((feat) => (
              <StaggerItem key={feat.title}>
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#38b6ff]/10">
                    <feat.icon className="size-5 text-[#38b6ff]" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    {feat.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}

/* ───────── SOCIAL PROOF ───────── */
function SocialProofSection() {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="topo-bg absolute inset-0 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="grid gap-8 text-center grid-cols-2 sm:grid-cols-4">
            {[
              { stat: "500+", label: "Documents Generated" },
              { stat: "50+", label: "Properties Served" },
              { stat: "<2hr", label: "Avg. Turnaround" },
              { stat: "100%", label: "Utah Code Compliant" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-mono text-3xl sm:text-4xl font-bold text-slate-800">
                  {item.stat}
                </p>
                <p className="mt-2 text-sm text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── FINAL CTA ───────── */
function FinalCTASection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32" style={{ backgroundColor: "#0f172a" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0C0F14] to-[#0f172a]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-[#38b6ff]/5 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <FadeUp>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to modernize your document workflow?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
            Whether you&apos;re a management company looking to keep revenue in-house
            or an agent who needs documents fast — PropertyDocz has you covered.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/for-management-companies"
              className="w-full sm:w-auto rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#1A1A2E] shadow-2xl transition-all hover:scale-[1.02] text-center min-h-[44px]"
            >
              Partner With Us
            </Link>
            <Link
              href="/for-agents"
              className="w-full sm:w-auto rounded-xl border border-[#38b6ff]/30 bg-[#38b6ff]/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-[#38b6ff]/20 text-center min-h-[44px]"
            >
              Order Documents
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── HOME PAGE EXPORT ───────── */
export function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <AudienceSplitSection />
      <DocumentTypesSection />
      <MembershipTeaser />
      <AIIntelligenceSection />
      <SocialProofSection />
      <FinalCTASection />
    </>
  );
}
