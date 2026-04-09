"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface PlatformHealthProps {
  revenueThisMonth: number;
  revenueLastMonth: number;
  avgTurnaroundDays: number | null;
  deliveredCount: number;
  totalCount: number;
}

function AnimatedDollar({ cents }: { cents: number }) {
  const dollars = cents / 100;
  const animated = useCountUp({ end: dollars, duration: 600, decimals: 2 });
  return (
    <span className="font-mono text-lg font-semibold">
      ${animated.toFixed(2)}
    </span>
  );
}

function AnimatedNum({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useCountUp({ end: value, duration: 600, decimals: value % 1 !== 0 ? 1 : 0 });
  return (
    <span className="font-mono text-lg font-semibold">
      {value % 1 !== 0 ? animated.toFixed(1) : animated}
      {suffix}
    </span>
  );
}

export function PlatformHealth({
  revenueThisMonth,
  revenueLastMonth,
  avgTurnaroundDays,
  deliveredCount,
  totalCount,
}: PlatformHealthProps) {
  const revenueDelta =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0
        ? 100
        : 0;
  const completionRate = totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Revenue comparison */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Revenue (MTD)</span>
          <AnimatedDollar cents={revenueThisMonth} />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[10px] font-medium",
              revenueDelta >= 0 ? "text-[#14b8a6]" : "text-[#ef4444]"
            )}
          >
            {revenueDelta >= 0 ? "+" : ""}
            {revenueDelta.toFixed(0)}% vs last month
          </span>
          <span className="text-[10px] text-muted-foreground">
            (${(revenueLastMonth / 100).toFixed(2)})
          </span>
        </div>
      </div>

      {/* Avg Turnaround */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Avg Turnaround
          </span>
          {avgTurnaroundDays !== null ? (
            <AnimatedNum value={avgTurnaroundDays} suffix=" days" />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Completion Rate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Completion Rate
          </span>
          <AnimatedNum value={completionRate} suffix="%" />
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#14b8a6] transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {deliveredCount} delivered / {totalCount} total
        </p>
      </div>
    </div>
  );
}
