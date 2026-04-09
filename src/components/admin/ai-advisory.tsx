"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Send,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Insight types ── */

interface AdvisoryInsight {
  type: "urgent" | "warning" | "info" | "positive";
  title: string;
  detail: string;
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

/* ── Chat types ── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ── Component ── */

export function AiAdvisory() {
  const [insights, setInsights] = useState<AdvisoryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleRefresh() {
    setRefreshing(true);
    fetchInsights(true);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10), // last 10 messages for context
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process that. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // Group insights
  const needsAttention = insights.filter(
    (i) => i.type === "urgent" || i.type === "warning"
  );
  const onTrack = insights.filter(
    (i) => i.type === "positive" || i.type === "info"
  );

  return (
    <Card className="dash-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex size-6 items-center justify-center rounded-md bg-brand-50 dark:bg-accent">
            <Sparkles className="size-3.5 text-brand-400" />
          </div>
          AI Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="size-7"
          title="Refresh insights"
        >
          {refreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Briefing ── */}
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
          <div className="space-y-3">
            {/* Needs Attention */}
            {needsAttention.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Needs attention
                </p>
                {needsAttention.map((insight, i) => (
                  <InsightRow key={`attn-${i}`} insight={insight} />
                ))}
              </div>
            )}

            {/* On Track */}
            {onTrack.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  On track
                </p>
                {onTrack.map((insight, i) => (
                  <InsightRow key={`track-${i}`} insight={insight} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Chat Thread ── */}
        {messages.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-[#38b6ff] text-white"
                    : "mr-auto bg-muted text-foreground"
                )}
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="mr-auto flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* ── Chat Input ── */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about your requests, associations, revenue..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            disabled={chatLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            title="Voice coming soon"
            disabled
          >
            <Mic className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            disabled={chatLoading || !chatInput.trim()}
          >
            <Send className="size-3.5 text-brand-400" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Insight Row (left-border accent) ── */

function InsightRow({ insight }: { insight: AdvisoryInsight }) {
  const IconComponent = TYPE_ICON[insight.type] || Info;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border-l-[3px] bg-card px-3 py-2.5",
        BORDER_COLOR[insight.type] || BORDER_COLOR.info
      )}
    >
      <IconComponent
        className={cn(
          "size-4 mt-0.5 shrink-0",
          ICON_COLOR[insight.type] || ICON_COLOR.info
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight text-foreground">
          {insight.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {insight.detail}
        </p>
      </div>
    </div>
  );
}
