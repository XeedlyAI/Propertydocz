"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface CreateAccountPromptProps {
  email: string;
}

export function CreateAccountPrompt({ email }: CreateAccountPromptProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (success) {
    return (
      <Card className="mt-6 w-full border-l-[3px] border-l-[#14b8a6]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-[#14b8a6]" />
            <p className="text-sm font-medium">Account created!</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You can now sign in at any tenant portal to track orders and use subscriptions.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleCreate() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customer/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6 w-full">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#38b6ff]/10">
            <Sparkles className="size-4 text-[#38b6ff]" />
          </div>
          <div>
            <p className="text-sm font-medium">Save time on your next order</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a free account to track orders, pre-fill your info, and subscribe to save up to 30%.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-password" className="text-xs">
            Choose a password for {email}
          </Label>
          <Input
            id="create-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            disabled={loading || !password}
            className="text-white"
            style={{ backgroundColor: "#38b6ff" }}
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin" /> Creating...</>
            ) : (
              "Create Account"
            )}
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
