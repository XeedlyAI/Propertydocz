import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { DocumentTypePage } from "@/components/marketing/document-type-page";
import { DocumentProductJsonLd } from "@/components/marketing/json-ld";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "HOA Lender Questionnaire",
  description:
    "Order an HOA lender questionnaire online. Required by mortgage lenders for condo and HOA loan approvals. Covers financials, insurance, litigation, and owner-occupancy.",
  path: "/documents/lender-questionnaire",
});

export default function Page() {
  return (
    <MarketingLayout>
      <DocumentProductJsonLd
        name="HOA Lender Questionnaire"
        description="Completed lender questionnaire providing association financial data, insurance coverage, litigation status, and owner-occupancy ratios required for mortgage underwriting."
        price="95.00"
        path="/documents/lender-questionnaire"
      />
      <DocumentTypePage
        title="Lender Questionnaire"
        subtitle="The data lenders need to approve HOA property loans"
        price="$95.00"
        turnaround="Typically 2-5 business days"
        description="A lender questionnaire is a standardized form that mortgage lenders require when underwriting loans for properties in HOA or condominium communities. It provides critical data about the association's financial health, insurance coverage, litigation status, owner-occupancy ratios, and governance structure. Without a completed lender questionnaire, most conventional and FHA/VA loans for condo units cannot be approved."
        whoNeeds={[
          "Mortgage lenders underwriting condo or HOA loans",
          "Loan officers processing purchase or refinance applications",
          "Buyers seeking financing for an HOA property",
          "Real estate agents helping buyers obtain financing",
          "Title companies coordinating loan closings",
          "Mortgage brokers working with multiple lenders",
        ]}
        whatsIncluded={[
          "Association financial statements and budget data",
          "Reserve fund balance and funding percentage",
          "Delinquency rates (percentage of owners past due)",
          "Owner-occupancy vs. investor-owned unit ratios",
          "Active or pending litigation details",
          "Master insurance policy coverage and expiration dates",
          "Fidelity bond / crime insurance coverage",
          "FHA/VA approval status if applicable",
          "Number of units, commercial space percentage",
          "Single-entity ownership concentration data",
        ]}
        faqs={[
          {
            q: "Why do lenders require this questionnaire?",
            a: "Fannie Mae, Freddie Mac, FHA, and VA all have guidelines for lending on HOA/condo properties. The questionnaire provides the data lenders need to verify the association meets these guidelines — including financial health, insurance adequacy, and owner-occupancy ratios.",
          },
          {
            q: "Is this different from a Fannie Mae 1076 form?",
            a: "The lender questionnaire typically provides the same information needed for Fannie Mae Form 1076 (formerly 1073) and similar forms. Some lenders use their own proprietary questionnaire format, which we can accommodate.",
          },
          {
            q: "What if the association doesn't meet lender guidelines?",
            a: "The questionnaire reports factual data about the association. If the data doesn't meet a lender's requirements (e.g., too many investor-owned units or insufficient reserves), the lender may decline the loan or require additional documentation.",
          },
          {
            q: "Can I use this for a refinance?",
            a: "Yes. Lender questionnaires are required for both purchase loans and refinances on HOA/condo properties.",
          },
        ]}
      />
    </MarketingLayout>
  );
}
