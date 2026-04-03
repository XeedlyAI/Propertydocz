import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PricingPage } from "@/components/marketing/pricing-page";

export const metadata = {
  title: "Pricing | PropertyDocz",
  description:
    "Transparent per-document pricing and membership plans for agents, lenders, and title companies.",
};

export default function Page() {
  return (
    <MarketingLayout>
      <PricingPage />
    </MarketingLayout>
  );
}
