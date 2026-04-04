import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ForManagementCompaniesPage } from "@/components/marketing/for-management-companies-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "For Management Companies",
  description:
    "Keep your document revenue in-house. Branded portal, AI-powered generation, revenue share on every document order.",
  path: "/for-management-companies",
});

export default function Page() {
  return (
    <MarketingLayout>
      <ForManagementCompaniesPage />
    </MarketingLayout>
  );
}
