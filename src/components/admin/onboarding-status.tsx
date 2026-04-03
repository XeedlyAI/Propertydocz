"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface OnboardingStatusProps {
  associationId: string;
  onboardingStatus: string | null;
  hasDropboxFolder: boolean;
  fieldsPopulated: number;
  fieldsTotal: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  },
  harvesting: {
    label: "Harvesting...",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Loader2,
  },
  review: {
    label: "In Review",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertCircle,
  },
  complete: {
    label: "Complete",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
};

export function OnboardingStatus({
  associationId,
  onboardingStatus,
  hasDropboxFolder,
  fieldsPopulated,
  fieldsTotal,
}: OnboardingStatusProps) {
  const router = useRouter();
  const [harvesting, setHarvesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = onboardingStatus || "pending";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  async function handleHarvest() {
    setHarvesting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ association_id: associationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Harvest failed");
        return;
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setHarvesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4 text-[#38b6ff]" />
          Data Onboarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}
          >
            <StatusIcon
              className={`size-3.5 ${status === "harvesting" ? "animate-spin" : ""}`}
            />
            {config.label}
          </span>
        </div>

        {/* Status-specific content */}
        {status === "pending" && (
          <div className="space-y-3">
            {hasDropboxFolder ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Ready to harvest data from documents. This will scan the
                  mapped Dropbox folder, extract data using AI, and pre-fill
                  association fields.
                </p>
                <Button
                  onClick={handleHarvest}
                  disabled={harvesting}
                  className="w-full bg-[#38b6ff] hover:bg-[#38b6ff]/90"
                >
                  {harvesting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Processing documents...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-2" />
                      Harvest Data from Documents
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Map a Dropbox folder first, then you can harvest data from
                governing documents.
              </p>
            )}
          </div>
        )}

        {status === "harvesting" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-[#38b6ff]" />
            Processing documents... This may take a few minutes.
          </div>
        )}

        {status === "review" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Harvest complete. Review and confirm extracted data.
            </p>
            <Link href={`/admin/associations/${associationId}/onboarding`}>
              <Button className="w-full bg-[#38b6ff] hover:bg-[#38b6ff]/90">
                Review Extracted Data
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {status === "complete" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              {fieldsPopulated} of {fieldsTotal} fields populated
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/associations/${associationId}/onboarding`}>
                <Button variant="outline" size="sm">
                  View Data
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHarvest}
                disabled={harvesting}
              >
                {harvesting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Re-harvest"
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
