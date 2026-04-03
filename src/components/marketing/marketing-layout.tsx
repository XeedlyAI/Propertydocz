import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
