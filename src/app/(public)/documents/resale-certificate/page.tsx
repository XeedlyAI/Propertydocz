import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { DocumentTypePage } from "@/components/marketing/document-type-page";
import { DocumentProductJsonLd } from "@/components/marketing/json-ld";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "HOA Resale Certificate",
  description:
    "Order an HOA resale certificate online. Required for most condo and HOA property sales. Digital delivery, transparent pricing, AI-powered generation.",
  path: "/documents/resale-certificate",
});

export default function Page() {
  return (
    <MarketingLayout>
      <DocumentProductJsonLd
        name="HOA Resale Certificate"
        description="Official resale certificate for HOA and condominium property transactions. Includes assessment status, special assessments, violations, insurance details, and financial health of the association."
        price="99.00"
        path="/documents/resale-certificate"
      />
      <DocumentTypePage
        title="Resale Certificate"
        subtitle="The essential document for every HOA property sale"
        price="$99.00"
        turnaround="Typically 1-3 business days"
        description="A resale certificate (also called a resale package or Section 7 disclosure) is a legally required document for the sale of properties within a homeowners association or condominium. It discloses the financial and legal status of the association, including assessment amounts, special assessments, pending litigation, insurance coverage, and any outstanding violations on the unit. Buyers, lenders, and title companies rely on this document to close transactions."
        whoNeeds={[
          "Real estate agents listing or selling HOA properties",
          "Buyers purchasing a condo or townhome",
          "Title companies preparing for closing",
          "Lenders underwriting HOA property loans",
          "Attorneys handling real estate transactions",
          "Property managers facilitating sales",
        ]}
        whatsIncluded={[
          "Current monthly and special assessment amounts",
          "Outstanding balance and payment history for the unit",
          "Association reserve fund balance and adequacy",
          "Pending or anticipated special assessments",
          "Active litigation involving the association",
          "Insurance coverage summary (master policy)",
          "Recorded violations or compliance issues for the unit",
          "Capital improvement plans and budgets",
        ]}
        faqs={[
          {
            q: "Is a resale certificate legally required?",
            a: "In most states, yes. The seller is required to provide a resale certificate or disclosure package before closing. Requirements vary by state — common statutes include Virginia's POA Act, Pennsylvania's Uniform Planned Community Act, and similar laws in most states with HOA/condo communities.",
          },
          {
            q: "How long does it take to receive?",
            a: "Standard turnaround is 1-3 business days. Rush delivery is available for an additional $50 fee if you need it faster.",
          },
          {
            q: "Who pays for the resale certificate?",
            a: "This varies by local custom and contract terms. In many markets, the seller pays; in others, it may be split or paid by the buyer. Check your purchase agreement.",
          },
          {
            q: "How is the document delivered?",
            a: "All documents are delivered digitally via secure download link sent to your email. No waiting for physical mail.",
          },
        ]}
      />
    </MarketingLayout>
  );
}
