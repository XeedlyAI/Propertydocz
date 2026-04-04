"use client";

import Link from "next/link";
import {
  FileText,
  Clock,
  Shield,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";

interface DocumentTypePageProps {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  turnaround: string;
  whoNeeds: string[];
  whatsIncluded: string[];
  faqs: { q: string; a: string }[];
}

export function DocumentTypePage({
  title,
  subtitle,
  description,
  price,
  turnaround,
  whoNeeds,
  whatsIncluded,
  faqs,
}: DocumentTypePageProps) {
  return (
    <div className="space-y-16 px-4 py-16 sm:px-6 sm:py-24">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#38b6ff]/10">
          <FileText className="size-8 text-[#38b6ff]" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 text-[#38b6ff]" />
            {turnaround}
          </div>
          <div className="text-2xl font-bold text-[#38b6ff]">{price}</div>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#38b6ff] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#38b6ff]/90"
          >
            Order Now
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-3xl">
        <p className="text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      </section>

      {/* Who Needs This */}
      <section className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">
          Who Needs This Document?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {whoNeeds.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="size-6 text-[#38b6ff]" />
          <h2 className="text-2xl font-bold tracking-tight">
            What&apos;s Included
          </h2>
        </div>
        <div className="grid gap-3">
          {whatsIncluded.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <Zap className="mt-0.5 size-4 shrink-0 text-[#38b6ff]" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-border">
          {faqs.map(({ q, a }) => (
            <div key={q} className="py-5">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8">
          <h2 className="text-xl font-bold">Ready to Order?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get your {title.toLowerCase()} delivered digitally — fast and secure.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#38b6ff] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 transition-all hover:bg-[#38b6ff]/90"
          >
            Order {title}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
