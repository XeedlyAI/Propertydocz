"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
} from "lucide-react";

interface PlatformAlert {
  type: "urgent" | "warning" | "info" | "positive";
  title: string;
  detail: string;
}

interface PlatformAlertsProps {
  alerts: PlatformAlert[];
}

const BORDER_COLOR: Record<string, string> = {
  urgent: "border-l-[#ef4444]",
  warning: "border-l-[#f59e0b]",
  positive: "border-l-[#14b8a6]",
  info: "border-l-[#38b6ff]",
};

const ICON_COLOR: Record<string, string> = {
  urgent: "text-[#ef4444]",
  warning: "text-[#f59e0b]",
  positive: "text-[#14b8a6]",
  info: "text-[#38b6ff]",
};

const TYPE_ICON: Record<string, typeof AlertCircle> = {
  urgent: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  positive: TrendingUp,
};

export function PlatformAlerts({ alerts }: PlatformAlertsProps) {
  if (alerts.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No alerts — all systems healthy.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const IconComponent = TYPE_ICON[alert.type] || Info;
        return (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-lg border-l-[3px] bg-card px-3 py-2.5",
              BORDER_COLOR[alert.type] || BORDER_COLOR.info
            )}
          >
            <IconComponent
              className={cn(
                "size-4 mt-0.5 shrink-0",
                ICON_COLOR[alert.type] || ICON_COLOR.info
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight text-foreground">
                {alert.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {alert.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
