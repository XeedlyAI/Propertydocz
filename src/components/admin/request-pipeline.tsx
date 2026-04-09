"use client";

import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

interface PipelineStage {
  label: string;
  count: number;
  color: string;
}

interface RequestPipelineProps {
  stages: PipelineStage[];
}

const STAGE_COLORS: Record<string, { bar: string; dot: string }> = {
  slate: { bar: "bg-slate-300 dark:bg-slate-600", dot: "bg-slate-400" },
  blue: { bar: "bg-[#38b6ff]/30", dot: "bg-[#38b6ff]" },
  amber: { bar: "bg-amber-200 dark:bg-amber-800/40", dot: "bg-[#f59e0b]" },
  sky: { bar: "bg-sky-200 dark:bg-sky-800/40", dot: "bg-sky-500" },
  violet: { bar: "bg-violet-200 dark:bg-violet-800/40", dot: "bg-violet-500" },
  teal: { bar: "bg-teal-200 dark:bg-teal-800/40", dot: "bg-[#14b8a6]" },
};

function AnimatedCount({ value }: { value: number }) {
  const animated = useCountUp({ end: value, duration: 600 });
  return <span className="font-mono text-lg font-semibold">{animated}</span>;
}

export function RequestPipeline({ stages }: RequestPipelineProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const colors = STAGE_COLORS[stage.color] || STAGE_COLORS.slate;
        const widthPercent = Math.max((stage.count / maxCount) * 100, 8);

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", colors.dot)} />
                <span className="text-xs text-muted-foreground">
                  {stage.label}
                </span>
              </div>
              <AnimatedCount value={stage.count} />
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", colors.bar)}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
