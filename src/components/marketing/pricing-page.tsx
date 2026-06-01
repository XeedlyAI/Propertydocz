"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  DollarSign,
  ClipboardList,
  BookOpen,
  Zap,
  CheckCircle2,
  Minus,
  ChevronDown,
  Building2,
  ArrowRight,
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
    <section className="relative overflow-hidden pt-32 pb-20">
      <MeshGradient />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <FadeUp>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Transparent per-document pricing. No hidden fees, no surprises.
          </p>
        </FadeUp>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFBFC] to-transparent" />
    </section>
  );
}

/* ───────── PER-DOCUMENT PRICING ───────── */
const DOCUMENTS = [
  { icon: FileText, name: "Resale Certificate", standard: "$250", rush: "$300", desc: "Full financial disclosure per Utah Code \u00A757-8a-227" },
  { icon: DollarSign, name: "Payoff Statement", standard: "$50", rush: null, desc: "Itemized amounts owed with per diem (fee capped by Utah \u00A757-8a-106)" },
  { icon: ClipboardList, name: "Lender Questionnaire", standard: "$195", rush: "$245", desc: "Fannie Mae 1076 / Freddie Mac 476" },
  { icon: BookOpen, name: "Governing Documents", standard: "$150", rush: "$200", desc: "CC&Rs, bylaws, rules, budget, reserve study" },
];

function PerDocumentSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Per-Document Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Pay only for what you need
            </h2>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-gray-100 bg-[#F4F5F7] px-6 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Document</span>
              <span className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Standard</span>
              <span className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Zap className="size-3 text-amber-500" /> Rush
                </span>
              </span>
            </div>
            {/* Rows */}
            {DOCUMENTS.map((doc, i) => (
              <div
                key={doc.name}
                className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-4 ${
                  i < DOCUMENTS.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#38b6ff]/10">
                    <doc.icon className="size-4 text-[#38b6ff]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A2E]">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.desc}</p>
                  </div>
                </div>
                <div className="w-24 text-center font-mono text-sm font-bold text-[#1A1A2E]">
                  {doc.standard}
                </div>
                <div className="w-24 text-center font-mono text-sm font-bold text-amber-600">
                  {doc.rush ?? <span className="text-xs font-normal text-gray-400">N/A</span>}
                </div>
              </div>
            ))}
            {/* Rush note */}
            <div className="bg-amber-50 px-6 py-3 text-center">
              <p className="text-xs text-amber-700">
                <Zap className="mr-1 inline size-3" />
                Rush fee of $50 is applied once per order, not per document.
                Rush orders target same-day delivery. Payoff statements are exempt from
                rush fees per Utah §57-8a-106 fee cap.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── MEMBERSHIP TIERS ───────── */
const TIERS = [
  {
    name: "Pay-Per-Order",
    price: "Free",
    monthly: null,
    packages: 0,
    overage: "Standard pricing",
    features: ["No commitment", "Pay per document", "Digital delivery", "Email support"],
    highlight: false,
  },
  {
    name: "Agent Pro",
    price: "$149",
    monthly: true,
    packages: 3,
    overage: "20% off overage",
    features: ["3 document packages/mo", "20% off additional orders", "Priority processing", "Email support"],
    highlight: false,
  },
  {
    name: "Broker Office",
    price: "$399",
    monthly: true,
    packages: 10,
    overage: "25% off overage",
    features: ["10 document packages/mo", "25% off additional orders", "Priority processing", "Multi-agent access", "Phone support"],
    highlight: true,
  },
  {
    name: "Title Partner",
    price: "$799",
    monthly: true,
    packages: 25,
    overage: "30% off overage",
    features: ["25 document packages/mo", "30% off additional orders", "Same-day rush included", "Dedicated account manager", "Bill-to-closing", "API access"],
    highlight: false,
  },
];

function MembershipSection() {
  return (
    <section className="bg-[#F4F5F7] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              Membership Plans
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Volume discounts — coming soon
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500">
              We&apos;re building membership plans for agents, brokerages, and title
              companies who order frequently. Get included document packages each
              month and discounted overage rates.
            </p>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="relative mt-16 overflow-hidden rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/60 to-white pointer-events-none z-10" />
            <div className="relative z-0 grid gap-6 sm:grid-cols-3 opacity-40 blur-[2px]">
              {TIERS.filter((t) => t.monthly).map((tier) => (
                <div key={tier.name} className="rounded-xl border border-gray-100 p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{tier.name}</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#1A1A2E]">{tier.price}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                </div>
              ))}
            </div>
            <div className="relative z-20 -mt-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#38b6ff]/10 px-5 py-2 text-sm font-semibold text-[#38b6ff]">
                Coming Soon
              </span>
              <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
                Interested in volume pricing? Leave your email and we&apos;ll notify
                you when membership plans launch.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── FEATURE COMPARISON ───────── */
const COMPARISON_ROWS = [
  { feature: "Digital delivery", free: true, pro: true, broker: true, title: true },
  { feature: "Included packages/mo", free: "0", pro: "3", broker: "10", title: "25" },
  { feature: "Overage discount", free: "—", pro: "20%", broker: "25%", title: "30%" },
  { feature: "Priority processing", free: false, pro: true, broker: true, title: true },
  { feature: "Rush included", free: false, pro: false, broker: false, title: true },
  { feature: "Multi-agent access", free: false, pro: false, broker: true, title: true },
  { feature: "Bill-to-closing", free: false, pro: false, broker: false, title: true },
  { feature: "Dedicated account manager", free: false, pro: false, broker: false, title: true },
  { feature: "Phone support", free: false, pro: false, broker: true, title: true },
  { feature: "API access", free: false, pro: false, broker: false, title: true },
];

function ComparisonSection() {
  return null;
}

/* ───────── MANAGEMENT COMPANY REVENUE SHARE ───────── */
function RevenueShareSection() {
  return (
    <section className="bg-[#1A1A2E] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp>
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#38b6ff]/15">
              <Building2 className="size-6 text-[#38b6ff]" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
              Management Companies: Keep Your Revenue
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/60">
              PropertyDocz is free to set up. You keep 90% of every document
              order through your branded portal. We handle the platform, payment
              processing, and AI generation — you keep the relationship and the
              revenue.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3 w-full max-w-3xl">
              {[
                { label: "Setup Cost", value: "$0" },
                { label: "Monthly Fee", value: "$0" },
                { label: "You Keep", value: "90%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 text-center"
                >
                  <p className="text-xs font-medium text-white/40">{item.label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-[#38b6ff]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/for-management-companies"
              className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#38b6ff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#1DA8F0]"
            >
              Learn More <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
const FAQS = [
  {
    q: "What is a \"document package\"?",
    a: "A document package covers all the documents needed for a single property transaction. For example, if you order a resale certificate and a payoff statement for the same property, that counts as one package.",
  },
  {
    q: "Will there be volume discounts?",
    a: "Yes! We're building membership plans with included document packages and discounted overage rates. Sign up for updates and we'll notify you when they launch.",
  },
  {
    q: "How fast is rush delivery?",
    a: "Rush orders target same-day delivery. Standard orders are typically fulfilled within 24-48 business hours.",
  },
  {
    q: "Can I bill the document fee to closing?",
    a: "Bill-to-closing is available for standalone payoff statements. We accept credit card and ACH payment at time of order for all other documents.",
  },
  {
    q: "Are the documents legally compliant?",
    a: "Yes. All documents are generated in compliance with Utah Code \u00A757-8a-227, \u00A757-8a-106, \u00A757-8a-311, and HB 217. Our AI validates every document before delivery.",
  },
];

function FAQSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <FadeUp>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#38b6ff]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A2E] sm:text-4xl">
              Common questions
            </h2>
          </div>
        </FadeUp>
        <div className="mt-12 space-y-3">
          {FAQS.map((faq, i) => (
            <FadeUp key={faq.q} delay={i * 0.05}>
              <FAQItem question={faq.q} answer={faq.a} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold text-[#1A1A2E] pr-4">{question}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm leading-relaxed text-gray-500">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ───────── PAGE EXPORT ───────── */
export function PricingPage() {
  return (
    <>
      <HeroSection />
      <PerDocumentSection />
      <MembershipSection />
      <ComparisonSection />
      <RevenueShareSection />
      <FAQSection />
    </>
  );
}
