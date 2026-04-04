import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { HowItWorksPage } from "@/components/marketing/how-it-works-page";
import { HowToJsonLd } from "@/components/marketing/json-ld";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "How It Works",
  description:
    "See how PropertyDocz streamlines HOA document ordering — from request to delivery in minutes.",
  path: "/how-it-works",
});

export default function Page() {
  return (
    <MarketingLayout>
      <HowToJsonLd />
      <HowItWorksPage />
    </MarketingLayout>
  );
}
