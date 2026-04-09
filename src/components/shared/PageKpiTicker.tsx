"use client";

import Link from "next/link";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

export interface KpiCell {
  /** The numeric value to display */
  value: number;
  /** Short label displayed below the number */
  label: string;
  /** Optional context line (e.g. "+12% vs last week") */
  context?: string;
  /** Context line color: "good" | "attention" | "urgent" | "info" | "muted" */
  contextColor?: "good" | "attention" | "urgent" | "info" | "muted";
  /** Prefix before the number (e.g. "$") */
  prefix?: string;
  /** Suffix after the number (e.g. "%") */
  suffix?: string;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Optional link href — makes the cell clickable */
  href?: string;
}

interface PageKpiTickerProps {
  cells: KpiCell[];
  className?: string;
}

const contextColorMap: Record<string, string> = {
  good: "text-[#14b8a6]",
  attention: "text-[#f59e0b]",
  urgent: "text-[#ef4444]",
  info: "text-[#38b6ff]",
  muted: "text-muted-foreground",
};

function KpiCellContent({ cell }: { cell: KpiCell }) {
  const animatedValue = useCountUp({
    end: cell.value,
    decimals: cell.decimals ?? 0,
    duration: 600,
  });

  const formattedValue =
    cell.decimals && cell.decimals > 0
      ? animatedValue.toFixed(cell.decimals)
      : animatedValue.toLocaleString();

  return (
    <div className="px-3 py-2 flex flex-col items-start justify-center min-w-0">
      <span className="font-mono text-lg font-semibold leading-tight text-foreground truncate">
        {cell.prefix}
        {formattedValue}
        {cell.suffix}
      </span>
      <span className="text-[11px] uppercase tracking-normal text-muted-foreground leading-tight mt-0.5 truncate">
        {cell.label}
      </span>
      {cell.context && (
        <span
          className={cn(
            "text-[10px] leading-tight mt-0.5 truncate",
            contextColorMap[cell.contextColor ?? "muted"]
          )}
        >
          {cell.context}
        </span>
      )}
    </div>
  );
}

export function PageKpiTicker({ cells, className }: PageKpiTickerProps) {
  if (cells.length === 0) return null;

  return (
    <div
      className={cn(
        "dash-card bg-card p-0 overflow-hidden",
        // Desktop: single row
        "hidden sm:flex sm:flex-nowrap sm:divide-x sm:divide-border",
        className
      )}
    >
      {cells.map((cell, i) => {
        const content = <KpiCellContent key={i} cell={cell} />;
        if (cell.href) {
          return (
            <Link
              key={i}
              href={cell.href}
              className="flex-1 min-w-0 hover:bg-muted/50 transition-colors"
            >
              {content}
            </Link>
          );
        }
        return (
          <div key={i} className="flex-1 min-w-0">
            {content}
          </div>
        );
      })}
    </div>
  );
}

/** Mobile variant: 2-col grid, shown only on small screens */
export function PageKpiTickerMobile({ cells, className }: PageKpiTickerProps) {
  if (cells.length === 0) return null;

  return (
    <div
      className={cn(
        "dash-card bg-card p-0 overflow-hidden",
        "grid grid-cols-2 divide-x divide-y divide-border sm:hidden",
        className
      )}
    >
      {cells.map((cell, i) => {
        const content = <KpiCellContent key={i} cell={cell} />;
        if (cell.href) {
          return (
            <Link
              key={i}
              href={cell.href}
              className="min-w-0 hover:bg-muted/50 transition-colors"
            >
              {content}
            </Link>
          );
        }
        return (
          <div key={i} className="min-w-0">
            {content}
          </div>
        );
      })}
    </div>
  );
}

/** Combined component that renders desktop and mobile variants */
export function PageKpiTickerResponsive(props: PageKpiTickerProps) {
  return (
    <>
      <PageKpiTicker {...props} />
      <PageKpiTickerMobile {...props} />
    </>
  );
}
