import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PricingPage } from "@/components/marketing/pricing-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Pricing",
  description:
    "Transparent per-document pricing for HOA resale certificates, payoff statements, lender questionnaires, and governing documents.",
  path: "/pricing",
});

export default function Page() {
  return (
    <MarketingLayout>
      <PricingPage />
    </MarketingLayout>
  );
}
