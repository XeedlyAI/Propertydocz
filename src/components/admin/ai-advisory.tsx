"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface AdvisoryInsight {
  type: "urgent" | "warning" | "info" | "positive";
  title: string;
  detail: string;
}

const TYPE_CONFIG = {
  urgent: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  positive: {
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

export function AiAdvisory() {
  const [insights, setInsights] = useState<AdvisoryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async (force = false) => {
    try {
      const url = force ? "/api/ai/advisory?refresh=1" : "/api/ai/advisory";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch {
      // Silent fail — advisory is non-critical
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  function handleRefresh() {
    setRefreshing(true);
    fetchInsights(true);
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#38b6ff] via-[#7C3AED] to-[#38b6ff]" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-[#38b6ff]/20 to-[#7C3AED]/20">
            <Sparkles className="size-3.5 text-[#38b6ff]" />
          </div>
          AI Advisory
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="size-7"
        >
          {refreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Generating insights...
            </div>
          </div>
        ) : insights.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No insights available right now.
          </p>
        ) : (
          <div className="space-y-2.5">
            {insights.map((insight, i) => {
              const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.info;
              const IconComponent = config.icon;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${config.bg} ${config.border}`}
                >
                  <IconComponent
                    className={`size-4 mt-0.5 shrink-0 ${config.color}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {insight.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {insight.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
