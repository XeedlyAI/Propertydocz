"use client";

import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { formatCents } from "@/lib/pricing";

interface TenantHealthItem {
  id: string;
  name: string;
  slug: string;
  requestsThisMonth: number;
  deliveredThisMonth: number;
  avgTurnaroundDays: number | null;
  status: "healthy" | "attention" | "inactive";
}

interface TenantHealthProps {
  tenants: TenantHealthItem[];
}

const STATUS_CONFIG = {
  healthy: { dot: "bg-[#14b8a6]", label: "Healthy" },
  attention: { dot: "bg-[#f59e0b]", label: "Attention" },
  inactive: { dot: "bg-slate-400", label: "Inactive" },
};

function AnimatedNum({ value }: { value: number }) {
  const animated = useCountUp({ end: value, duration: 600 });
  return <span className="font-mono">{animated}</span>;
}

export function TenantHealth({ tenants }: TenantHealthProps) {
  if (tenants.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No tenants yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tenants.map((t) => {
        const config = STATUS_CONFIG[t.status];
        const completionRate =
          t.requestsThisMonth > 0
            ? Math.round((t.deliveredThisMonth / t.requestsThisMonth) * 100)
            : 0;

        return (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5"
          >
            <div className={cn("size-2 rounded-full shrink-0", config.dot)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                <span>
                  <AnimatedNum value={t.requestsThisMonth} /> requests
                </span>
                <span>
                  <AnimatedNum value={completionRate} />% delivered
                </span>
                {t.avgTurnaroundDays !== null && (
                  <span>{t.avgTurnaroundDays.toFixed(1)}d avg</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
