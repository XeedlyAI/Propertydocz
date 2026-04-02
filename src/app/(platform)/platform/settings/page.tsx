import { getPlatformUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Shield } from "lucide-react";

export default async function PlatformSettingsPage() {
  const user = await getPlatformUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          XeedlyAI platform configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-[#38b6ff]" />
            Platform Admin Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user.fullName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Email</span>
            <span className="font-data font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Role</span>
            <span className="inline-flex items-center rounded-full bg-[#38b6ff]/10 px-2 py-0.5 text-xs font-medium text-[#38b6ff]">
              Platform Admin
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 text-center">
          <Settings className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-xs text-muted-foreground">
            Default fee percentages, Stripe Connect platform settings, email
            templates, and global branding options coming in Phase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
