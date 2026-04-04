import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ForAgentsPage } from "@/components/marketing/for-agents-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "For Agents & Lenders",
  description:
    "Order HOA documents in minutes. Resale certificates, payoff statements, lender questionnaires — delivered digitally.",
  path: "/for-agents",
});

export default function Page() {
  return (
    <MarketingLayout>
      <ForAgentsPage />
    </MarketingLayout>
  );
}
