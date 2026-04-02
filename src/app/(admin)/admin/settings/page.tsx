import { getAdminUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const user = await getAdminUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and tenant configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company</span>
            <span className="font-medium">{user.tenantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subdomain</span>
            <span className="font-medium">{user.tenantSlug}.propertydocz.com</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-8 text-center">
          <Settings className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-semibold">
            More settings coming soon
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Stripe Connect, Dropbox integration, email templates, and branding
            options will be available in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
