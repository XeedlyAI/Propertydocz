import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { DocumentTypePage } from "@/components/marketing/document-type-page";
import { DocumentProductJsonLd } from "@/components/marketing/json-ld";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "HOA Governing Documents",
  description:
    "Order HOA governing documents online. CC&Rs, bylaws, rules and regulations, and meeting minutes — delivered digitally.",
  path: "/documents/governing-documents",
});

export default function Page() {
  return (
    <MarketingLayout>
      <DocumentProductJsonLd
        name="HOA Governing Documents"
        description="Complete set of HOA governing documents including CC&Rs, bylaws, rules and regulations, and recent meeting minutes for property transactions and due diligence."
        price="150.00"
        path="/documents/governing-documents"
      />
      <DocumentTypePage
        title="Governing Documents"
        subtitle="CC&Rs, bylaws, rules, and meeting minutes in one package"
        price="$150.00"
        turnaround="Typically 1-2 business days"
        description="Governing documents are the foundational legal documents that define how a homeowners association or condominium operates. They include the Declaration of Covenants, Conditions, and Restrictions (CC&Rs), bylaws, articles of incorporation, rules and regulations, and recent meeting minutes. Buyers, attorneys, and lenders review these documents to understand the rights, obligations, and restrictions that come with owning a property in the community."
        whoNeeds={[
          "Buyers performing due diligence before purchase",
          "Real estate attorneys reviewing transaction documents",
          "Title companies needing complete association records",
          "Lenders requiring governance documentation",
          "Homeowners wanting a copy of current rules",
          "Investors evaluating rental or resale restrictions",
        ]}
        whatsIncluded={[
          "Declaration of CC&Rs (Covenants, Conditions & Restrictions)",
          "Association bylaws",
          "Articles of incorporation",
          "Current rules and regulations",
          "Architectural guidelines (if applicable)",
          "Recent board meeting minutes",
          "Current year budget and financial statements",
          "Any amendments to the above documents",
        ]}
        faqs={[
          {
            q: "What are CC&Rs?",
            a: "CC&Rs (Covenants, Conditions, and Restrictions) are the primary governing document for an HOA. They outline property use restrictions, maintenance responsibilities, assessment obligations, and the association's enforcement powers. CC&Rs are recorded with the county and run with the land.",
          },
          {
            q: "Why do buyers need governing documents?",
            a: "Governing documents reveal critical information about living in the community — including pet policies, rental restrictions, architectural review requirements, assessment amounts, and planned amenities. Buyers should review these before committing to purchase.",
          },
          {
            q: "Are governing documents public record?",
            a: "The Declaration (CC&Rs) and amendments are typically recorded with the county. However, bylaws, rules, budgets, and minutes are usually only available from the association or management company.",
          },
          {
            q: "How often are governing documents updated?",
            a: "CC&Rs and bylaws are amended infrequently (requiring owner vote). Rules and regulations can be updated by the board more frequently. We always provide the most current versions available.",
          },
        ]}
      />
    </MarketingLayout>
  );
}
