import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/usage-reset
 * Daily cron: Safety net to ensure agent subscription periods are current.
 * Checks for agent_accounts where current_period_end has passed and
 * subscription_status is still 'active'. In production, Stripe webhooks
 * handle this — this cron catches any missed events.
 *
 * Also cleans up old cron_runs records (older than 90 days).
 *
 * Vercel cron calls this with Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Log cron start
    const { data: cronRun } = await serviceClient
      .from("cron_runs")
      .insert({
        job_name: "usage-reset",
        status: "running",
      })
      .select("id")
      .single();

    const cronRunId = cronRun?.id;
    const now = new Date().toISOString();
    let recordsProcessed = 0;

    // 1. Find agent accounts with expired periods that still show 'active'
    const { data: expiredAccounts, error: expiredError } = await serviceClient
      .from("agent_accounts")
      .select("id, user_id, current_period_end, subscription_status")
      .eq("subscription_status", "active")
      .lt("current_period_end", now)
      .eq("is_active", true);

    if (expiredError) {
      throw new Error(`Expired accounts query failed: ${expiredError.message}`);
    }

    // Mark expired accounts as past_due so they get attention
    if (expiredAccounts && expiredAccounts.length > 0) {
      const { error: updateError } = await serviceClient
        .from("agent_accounts")
        .update({ subscription_status: "past_due" })
        .in(
          "id",
          expiredAccounts.map((a) => a.id)
        );

      if (updateError) {
        console.error("Failed to update expired accounts:", updateError);
      } else {
        recordsProcessed += expiredAccounts.length;
      }
    }

    // 2. Clean up old cron_runs (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: deletedCount } = await serviceClient
      .from("cron_runs")
      .delete({ count: "exact" })
      .lt("started_at", ninetyDaysAgo.toISOString());

    // Log success
    if (cronRunId) {
      await serviceClient
        .from("cron_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          records_processed: recordsProcessed,
          metadata: {
            expired_accounts: expiredAccounts?.length || 0,
            old_cron_runs_deleted: deletedCount || 0,
          },
        })
        .eq("id", cronRunId);
    }

    return NextResponse.json({
      success: true,
      expiredAccounts: expiredAccounts?.length || 0,
      recordsProcessed,
      oldCronRunsDeleted: deletedCount || 0,
    });
  } catch (error) {
    console.error("Usage reset cron error:", error);

    // Try to log failure
    try {
      const serviceClient = await createServiceClient();
      await serviceClient.from("cron_runs").insert({
        job_name: "usage-reset",
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
    } catch {
      // Best effort logging
    }

    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
