import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ForAgentsPage } from "@/components/marketing/for-agents-page";

export const metadata = {
  title: "For Agents & Lenders | PropertyDocz",
  description:
    "Order HOA documents in minutes. Resale certificates, payoff statements, lender questionnaires — delivered digitally.",
};

export default function Page() {
  return (
    <MarketingLayout>
      <ForAgentsPage />
    </MarketingLayout>
  );
}
