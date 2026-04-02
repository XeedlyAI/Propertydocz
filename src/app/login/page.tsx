import { LoginForm } from "@/components/admin/login-form";
import { FileStack } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <FileStack className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PropertyDocz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your admin account
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
