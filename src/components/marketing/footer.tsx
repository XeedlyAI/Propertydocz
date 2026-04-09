import Link from "next/link";
import { FileStack } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "For Agents", href: "/for-agents" },
    { label: "For Management Companies", href: "/for-management-companies" },
  ],
  Documents: [
    { label: "Resale Certificate", href: "/pricing" },
    { label: "Payoff Statement", href: "/pricing" },
    { label: "Lender Questionnaire", href: "/pricing" },
    { label: "Governing Documents", href: "/pricing" },
  ],
  Company: [
    { label: "About XeedlyAI", href: "https://xeedlyai.com" },
    { label: "Contact", href: "mailto:support@propertydocz.com" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#0f172a" }} className="text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#38b6ff]/15">
                <FileStack className="size-4 text-[#38b6ff]" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                PropertyDocz
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              The modern platform for HOA document ordering and fulfillment.
              AI-powered generation, instant delivery, built for Utah real
              estate professionals.
            </p>
            <p className="mt-6 text-xs text-white/30">
              A product by{" "}
              <a
                href="https://xeedlyai.com"
                className="text-[#38b6ff]/60 hover:text-[#38b6ff] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                XeedlyAI
              </a>
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-[#38b6ff] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} PropertyDocz by XeedlyAI. All
            rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Built for Utah HOA professionals
          </p>
        </div>
      </div>
    </footer>
  );
}
