import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { DocumentTypePage } from "@/components/marketing/document-type-page";
import { DocumentProductJsonLd } from "@/components/marketing/json-ld";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "HOA Payoff Letter",
  description:
    "Order an HOA payoff statement online. Shows exact amount owed to the association at closing. Digital delivery, fast turnaround.",
  path: "/documents/payoff-letter",
});

export default function Page() {
  return (
    <MarketingLayout>
      <DocumentProductJsonLd
        name="HOA Payoff Letter"
        description="Official payoff statement showing the exact amount owed to the homeowners association, including assessments, fees, and any outstanding balances."
        price="15.00"
        path="/documents/payoff-letter"
      />
      <DocumentTypePage
        title="Payoff Letter"
        subtitle="Know exactly what's owed to the association at closing"
        price="$15.00"
        turnaround="Typically 1-2 business days"
        description="A payoff letter (also called a payoff statement or estoppel letter) provides an official accounting of all amounts owed by a homeowner to the association as of a specific date. This includes regular assessments, special assessments, late fees, fines, legal fees, and any other charges. Title companies and closing attorneys require this document to ensure all association debts are settled at closing."
        whoNeeds={[
          "Title companies preparing closing statements",
          "Closing attorneys calculating settlement figures",
          "Real estate agents coordinating transactions",
          "Sellers wanting to know their outstanding balance",
          "Lenders requiring payoff verification",
          "Property managers facilitating unit transfers",
        ]}
        whatsIncluded={[
          "Total amount due as of a specified payoff date",
          "Breakdown of regular and special assessments owed",
          "Late fees, fines, and interest charges",
          "Legal or collection fees if applicable",
          "Per diem rate for daily interest accrual",
          "Wire or payment instructions for the association",
          "Statement validity period",
        ]}
        faqs={[
          {
            q: "What's the difference between a payoff letter and a resale certificate?",
            a: "A payoff letter focuses solely on the financial balance owed to the association. A resale certificate is a broader disclosure document that includes the payoff amount plus association governance, insurance, legal, and financial health information.",
          },
          {
            q: "How long is a payoff letter valid?",
            a: "Most payoff letters are valid for 30 days from the date of issuance. After that, a new statement may be needed as additional assessments or fees may accrue.",
          },
          {
            q: "Can I order a payoff letter if I'm not the homeowner?",
            a: "Yes. Title companies, attorneys, real estate agents, and other authorized parties can order payoff letters on behalf of the homeowner with proper authorization.",
          },
          {
            q: "What if there's a discrepancy in the amount?",
            a: "Contact the management company directly to dispute any charges. The payoff letter reflects the association's records as of the date of preparation.",
          },
        ]}
      />
    </MarketingLayout>
  );
}
