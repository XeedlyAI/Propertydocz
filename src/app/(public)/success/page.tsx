import { CheckCircle2, FileText, Clock, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateAccountPrompt } from "./create-account-prompt";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string; guest?: string; email?: string }>;
}) {
  const { request_id, guest, email } = await searchParams;
  const isGuest = guest === "true";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-[#38b6ff]/10">
        <CheckCircle2 className="size-8 text-[#38b6ff]" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Order Submitted</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Your document request has been received and is being processed.
      </p>

      {request_id && (
        <p className="mt-2 text-sm text-muted-foreground">
          Reference:{" "}
          <span className="font-data font-medium text-foreground">
            {request_id.slice(0, 8)}
          </span>
        </p>
      )}

      <Card className="mt-8 w-full">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#38b6ff]/10">
              <FileText className="size-4 text-[#38b6ff]" />
            </div>
            <div>
              <p className="text-sm font-medium">Order Review</p>
              <p className="text-xs text-muted-foreground">
                The management company will review your request and prepare the
                required data.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#38b6ff]/10">
              <Clock className="size-4 text-[#38b6ff]" />
            </div>
            <div>
              <p className="text-sm font-medium">Document Preparation</p>
              <p className="text-xs text-muted-foreground">
                Documents will be generated with current, verified data and
                reviewed for accuracy.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#38b6ff]/10">
              <Mail className="size-4 text-[#38b6ff]" />
            </div>
            <div>
              <p className="text-sm font-medium">Delivery</p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll receive an email with a secure download link once
                your documents are ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest-to-account conversion */}
      {isGuest && email && (
        <CreateAccountPrompt email={email} />
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Questions? Contact the management company directly or reply to your
        confirmation email.
      </p>
    </main>
  );
}
