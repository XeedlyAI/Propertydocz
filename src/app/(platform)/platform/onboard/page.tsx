import { getPlatformUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/platform/onboarding-wizard";

export default async function OnboardPage() {
  const user = await getPlatformUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Onboard New Tenant
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up a new management company in 7 steps
        </p>
      </div>

      <OnboardingWizard platformUserId={user.id} />
    </div>
  );
}
