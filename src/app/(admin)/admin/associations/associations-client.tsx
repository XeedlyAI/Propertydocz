"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CSVImportModal } from "@/components/admin/csv-import-modal";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  PageKpiTickerResponsive,
  type KpiCell,
} from "@/components/shared/PageKpiTicker";
import { FadeUp } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";

export interface EnrichedAssociation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  totalUnits: number | null;
  projectType: string | null;
  propertyCount: number;
  health: number;
  missingFields: string[];
  activeRequests: number;
  pendingRevenue: number;
}

interface AssociationsClientProps {
  associations: EnrichedAssociation[];
  kpiCells: KpiCell[];
  tenantId: string;
  tenantName: string;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function healthColor(health: number) {
  if (health >= 80) return { bar: "#10b981", border: "border-l-green-500" };
  if (health >= 50) return { bar: "#f59e0b", border: "border-l-amber-400" };
  return { bar: "#ef4444", border: "border-l-red-400" };
}

function statusBadge(health: number) {
  if (health >= 80)
    return {
      label: "Ready",
      className: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
  if (health >= 50)
    return {
      label: "Needs Data",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
  return {
    label: "Incomplete",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
}

function projectTypeBadge(type: string | null) {
  if (!type) return null;
  const colors: Record<string, string> = {
    condo: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    townhome: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    pud: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    "co-op": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  return colors[type] || "bg-muted text-muted-foreground";
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

export function AssociationsClient({
  associations,
  kpiCells,
  tenantId,
  tenantName,
}: AssociationsClientProps) {
  const [showImport, setShowImport] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Associations"
        subtitle={`Manage HOA communities for ${tenantName}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-[6px]"
              onClick={() => setShowImport(true)}
            >
              <Upload className="size-4" />
              Import CSV
            </Button>
            <Link href="/admin/associations/new">
              <Button
                size="sm"
                className="rounded-[6px] bg-[#38b6ff] text-white font-medium hover:bg-[#1DA8F0]"
              >
                <Plus className="size-4" />
                Add Association
              </Button>
            </Link>
          </div>
        }
      />

      <PageKpiTickerResponsive cells={kpiCells} />

      <FadeUp>
        <div className="dash-card bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Association
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Units
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Properties
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Data Health
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Active Requests
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                    Pending Revenue
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {associations.map((assoc, i) => {
                  const colors = healthColor(assoc.health);
                  const badge = statusBadge(assoc.health);
                  const typeBadgeClass = projectTypeBadge(assoc.projectType);
                  const addressLine = [
                    assoc.address,
                    assoc.city,
                    assoc.state,
                    assoc.zip,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <motion.tr
                      key={assoc.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={rowVariants}
                      className={cn(
                        "border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                        colors.border
                      )}
                      onClick={() =>
                        router.push(`/admin/associations/${assoc.id}`)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {assoc.name}
                        </div>
                        {addressLine && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">
                            {addressLine}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assoc.projectType && typeBadgeClass && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                              typeBadgeClass
                            )}
                          >
                            {assoc.projectType}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {assoc.totalUnits ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {assoc.propertyCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${assoc.health}%`,
                                backgroundColor: colors.bar,
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground w-8 text-right">
                            {assoc.health}%
                          </span>
                        </div>
                        {assoc.missingFields.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
                            Missing: {assoc.missingFields.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {assoc.activeRequests > 0 ? (
                          <Link
                            href={`/admin/requests?association_id=${assoc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#38b6ff] font-semibold underline-offset-2 hover:underline"
                          >
                            {assoc.activeRequests}
                          </Link>
                        ) : (
                          assoc.activeRequests
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {assoc.pendingRevenue > 0
                          ? formatCents(assoc.pendingRevenue)
                          : "$0"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      {showImport && (
        <CSVImportModal
          tenantId={tenantId}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
