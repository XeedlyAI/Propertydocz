import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { HowItWorksPage } from "@/components/marketing/how-it-works-page";

export const metadata = {
  title: "How It Works | PropertyDocz",
  description:
    "See how PropertyDocz streamlines HOA document ordering — from request to delivery in minutes.",
};

export default function Page() {
  return (
    <MarketingLayout>
      <HowItWorksPage />
    </MarketingLayout>
  );
}
