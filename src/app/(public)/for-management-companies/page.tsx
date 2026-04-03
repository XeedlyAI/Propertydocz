import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ForManagementCompaniesPage } from "@/components/marketing/for-management-companies-page";

export const metadata = {
  title: "For Management Companies | PropertyDocz",
  description:
    "Keep your document revenue in-house. Branded portal, AI-powered generation, revenue share on every document order.",
};

export default function Page() {
  return (
    <MarketingLayout>
      <ForManagementCompaniesPage />
    </MarketingLayout>
  );
}
