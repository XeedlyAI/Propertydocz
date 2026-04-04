import { Suspense } from "react";
import { getPlatformUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/platform/onboarding-wizard";
import { Loader2 } from "lucide-react";

export default async function OnboardPage() {
  const user = await getPlatformUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Onboard New Tenant
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up a new management company in 8 steps
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <OnboardingWizard platformUserId={user.id} />
      </Suspense>
    </div>
  );
}
