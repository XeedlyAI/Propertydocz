"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, FileStack } from "lucide-react";

const NAV_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "For Management Companies", href: "/for-management-companies" },
  { label: "For Agents", href: "/for-agents" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "#0f172a",
        backdropFilter: scrolled ? "blur(12px)" : undefined,
        boxShadow: scrolled
          ? "0 1px 3px rgba(0,0,0,0.06)"
          : undefined,
        borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#38b6ff]/10 group-hover:bg-[#38b6ff]/20 transition-colors">
            <FileStack className="size-4 text-[#38b6ff]" />
          </div>
          <span
            className="text-lg font-bold tracking-tight transition-colors"
            style={{ color: scrolled ? "#1A1A2E" : "#ffffff" }}
          >
            PropertyDocz
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-[#38b6ff]"
              style={{
                color: scrolled
                  ? "rgba(26,26,46,0.7)"
                  : "rgba(255,255,255,0.8)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium transition-colors hover:text-[#38b6ff]"
            style={{
              color: scrolled
                ? "rgba(26,26,46,0.7)"
                : "rgba(255,255,255,0.8)",
            }}
          >
            Log In
          </Link>
          <Link
            href="/for-agents"
            className="rounded-lg bg-[#38b6ff] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#38b6ff]/25 hover:bg-[#1DA8F0] transition-all hover:shadow-[#38b6ff]/40"
          >
            Order Documents
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{
            color: scrolled ? "#1A1A2E" : "#ffffff",
          }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden border-b border-gray-100"
            style={{ backgroundColor: scrolled ? "#ffffff" : "#0f172a" }}
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px] flex items-center"
                  style={{
                    color: scrolled
                      ? "rgba(26,26,46,0.8)"
                      : "rgba(255,255,255,0.8)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div
                className="pt-3 mt-3 space-y-2"
                style={{
                  borderTop: scrolled
                    ? "1px solid #e5e7eb"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] flex items-center"
                  style={{
                    color: scrolled
                      ? "rgba(26,26,46,0.7)"
                      : "rgba(255,255,255,0.7)",
                  }}
                >
                  Log In
                </Link>
                <Link
                  href="/for-agents"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg bg-[#38b6ff] px-3 py-3 text-center text-sm font-semibold text-white min-h-[44px]"
                >
                  Order Documents
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
