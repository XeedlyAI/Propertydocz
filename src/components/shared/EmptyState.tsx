import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Headline text */
  title: string;
  /** Description text (1-2 lines) */
  description: string;
  /** Optional CTA button */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4 max-w-sm mx-auto",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 dark:bg-accent mb-4">
        <Icon className="w-6 h-6 text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
