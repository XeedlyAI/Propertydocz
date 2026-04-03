"use client";

import Link from "next/link";
import {
  Search,
  FileText,
  CreditCard,
  Brain,
  Shield,
  FileCheck,
  Mail,
  PartyPopper,
  Phone,
  Handshake,
  Settings,
  FolderSync,
  Rocket,
  ArrowRight,
  Building2,
  Users,
} from "lucide-react";
import { MeshGradient } from "./mesh-gradient";
import {
  FadeUp,
} from "./animated";

/* ───────── HERO ───────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <MeshGradient />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <FadeUp>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            How PropertyDocz Works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            From order to delivery — see the complete workflow for document
            requesters and management company partners.
          </p>
        </FadeUp>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFBFC] to-transparent" />
    </section>
  );
}

/* ───────── ORDERING FLOW ───────── */
const ORDER_STEPS = [
  {
    icon: Search,
    title: "Find Your Property",
    desc: "Enter the property address or select the HOA from our directory. We route your order to the correct management company automatically.",
  },
  {
    icon: FileText,
    title: "Select Documents",
    desc: "Choose which documents you need — resale certificate, payoff statement, lender questionnaire, governing documents, or any combination.",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    desc: "Pay with credit card through Stripe. Title companies can opt for bill-to-closing. Membership holders get automatic discounts applied.",
  },
  {
    icon: Brain,
    title: "AI Generation",
    desc: "Our AI engine pulls association data, merges live financial figures, and generates compliant documents using Typst templates. Validated against Utah Code.",
  },
  {
    icon: Shield,
    title: "Compliance Review",
    desc: "AI advisory validation checks financial accuracy, date ranges, legal references, and statutory requirements. Flagged concerns are reviewed by management staff.",
  },
  {
    icon: FileCheck,
    title: "Manager Approval",
    desc: "The management company reviews the generated documents, verifies live data, and approves for delivery. Quality assurance before every send.",
  },
  {
    icon: Mail,
    title: "Digital Delivery",
    desc: "Approved documents are delivered to your email as professional PDF files. Standard delivery: 24-48 hours. Rush: same-day.",
  },
  {
    icon: PartyPopper,
    title: "Transaction Ready",
    desc: "Use your documents for closing, lending, or resale. Each document includes preparation date, validity period, and manager certification.",
  },
];

function OrderingFlowSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <FadeUp>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#38b6ff]/10">
              <Users className="size-4 text-[#38b6ff]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              For Document Requesters
            </p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
            Ordering Documents
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Agents, lenders, and title companies — here&apos;s what happens from
            the moment you place an order.
          </p>
        </FadeUp>

        <div className="mt-14 space-y-0">
          {ORDER_STEPS.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.06}>
              <div className="relative flex gap-6 pb-10 last:pb-0">
                {/* Timeline line */}
                {i < ORDER_STEPS.length - 1 && (
                  <div className="absolute left-[23px] top-14 bottom-0 w-px bg-[#38b6ff]/15" />
                )}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#38b6ff] text-white shadow-lg shadow-[#38b6ff]/20">
                  <step.icon className="size-5" />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#38b6ff]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-semibold text-[#1A1A2E]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                    {step.desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="mt-12 text-center">
            <Link
              href="/for-agents"
              className="inline-flex items-center gap-2 rounded-xl bg-[#38b6ff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0]"
            >
              Order Documents <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── PARTNER FLOW ───────── */
const PARTNER_STEPS = [
  {
    icon: Phone,
    title: "Schedule a Demo",
    desc: "See PropertyDocz in action. We'll walk through the platform, discuss your portfolio, and answer questions about the revenue share model.",
  },
  {
    icon: Handshake,
    title: "Sign Partnership Agreement",
    desc: "Simple terms: revenue share on every document, no upfront cost, no long-term lock-in. Cancel anytime.",
  },
  {
    icon: Settings,
    title: "Portal Configuration",
    desc: "We create your branded subdomain (yourcompany.propertydocz.com), upload your logo, and configure your associations.",
  },
  {
    icon: FolderSync,
    title: "Data & Document Sync",
    desc: "Import your association records. Connect Dropbox to auto-sync governing documents. Set up financial data entry workflows.",
  },
  {
    icon: Rocket,
    title: "Go Live",
    desc: "Share your portal URL with agents and title companies in your market. Orders flow in, AI generates, you review and approve, revenue accumulates.",
  },
];

function PartnerFlowSection() {
  return (
    <section className="bg-[#F4F5F7] py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <FadeUp>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#1A1A2E]">
              <Building2 className="size-4 text-[#38b6ff]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              For Management Companies
            </p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
            Becoming a Partner
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Management companies — here&apos;s how to get your branded portal
            live and start earning.
          </p>
        </FadeUp>

        <div className="mt-14 space-y-0">
          {PARTNER_STEPS.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.08}>
              <div className="relative flex gap-6 pb-10 last:pb-0">
                {i < PARTNER_STEPS.length - 1 && (
                  <div className="absolute left-[23px] top-14 bottom-0 w-px bg-[#1A1A2E]/15" />
                )}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1A1A2E] text-white shadow-lg">
                  <step.icon className="size-5 text-[#38b6ff]" />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#1A1A2E]/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-semibold text-[#1A1A2E]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                    {step.desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="mt-12 text-center">
            <Link
              href="/for-management-companies"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A2E] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2A2A3E]"
            >
              Partner With Us <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </FadeUp>
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
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <FadeUp>
          <div className="grid gap-8 text-center sm:grid-cols-2 sm:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to get started?
              </h2>
              <p className="mt-3 text-sm text-white/60">
                Whether you&apos;re ordering documents or partnering as a
                management company — the platform is ready for you.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 sm:items-end">
              <Link
                href="/for-agents"
                className="w-full max-w-[240px] rounded-xl bg-[#38b6ff] px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0]"
              >
                Order Documents
              </Link>
              <Link
                href="/for-management-companies"
                className="w-full max-w-[240px] rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── PAGE EXPORT ───────── */
export function HowItWorksPage() {
  return (
    <>
      <HeroSection />
      <OrderingFlowSection />
      <PartnerFlowSection />
      <CTASection />
    </>
  );
}
