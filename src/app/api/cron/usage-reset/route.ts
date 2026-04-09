import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendUsageAlert, sendRenewalConfirmation } from "@/lib/email/send";

/**
 * GET /api/cron/usage-reset
 * Daily cron (3 AM UTC): Safety net for subscription lifecycle management.
 *
 * 1. Resets customer_subscription packages_used when billing cycle has rolled over
 *    (fallback for Stripe invoice.paid webhook).
 * 2. Checks for agent_accounts where current_period_end has passed and
 *    subscription_status is still 'active' — marks them as past_due.
 * 3. Sends usage alerts (80% and 100% usage thresholds).
 * 4. Cleans up old cron_runs records (older than 90 days).
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
    const now = new Date();
    const nowISO = now.toISOString();
    const today = nowISO.split("T")[0]; // YYYY-MM-DD
    let recordsProcessed = 0;
    let subscriptionsReset = 0;
    let usageAlertsSent = 0;

    // ── 1. Reset customer_subscription usage for expired billing cycles ──
    // This is the safety net for missed Stripe invoice.paid webhooks.
    // Finds active subscriptions where billing_cycle_end < today AND packages_used > 0.
    const { data: expiredSubs, error: expiredSubsError } = await serviceClient
      .from("customer_subscription")
      .select("id, customer_id, tier, packages_included, packages_used, billing_cycle_end, stripe_subscription_id")
      .in("status", ["active", "trialing"])
      .lt("billing_cycle_end", today)
      .gt("packages_used", 0);

    if (expiredSubsError) {
      console.error("Expired subscriptions query failed:", expiredSubsError.message);
    } else if (expiredSubs && expiredSubs.length > 0) {
      for (const sub of expiredSubs) {
        // Calculate new billing cycle (advance by 1 month from the end date)
        const oldEnd = new Date(sub.billing_cycle_end);
        const newStart = new Date(oldEnd);
        const newEnd = new Date(oldEnd);
        newEnd.setMonth(newEnd.getMonth() + 1);

        const { error: resetError } = await serviceClient
          .from("customer_subscription")
          .update({
            packages_used: 0,
            billing_cycle_start: newStart.toISOString().split("T")[0],
            billing_cycle_end: newEnd.toISOString().split("T")[0],
            updated_at: nowISO,
          })
          .eq("id", sub.id);

        if (resetError) {
          console.error(`Failed to reset subscription ${sub.id}:`, resetError);
        } else {
          subscriptionsReset++;
          recordsProcessed++;

          // Send renewal confirmation email
          try {
            const { data: customer } = await serviceClient
              .from("customer_account")
              .select("email, full_name")
              .eq("id", sub.customer_id)
              .single();

            if (customer?.email) {
              await sendRenewalConfirmation({
                to: customer.email,
                customerName: customer.full_name,
                tier: sub.tier,
                packagesIncluded: sub.packages_included,
                billingCycleEnd: newEnd.toISOString().split("T")[0],
              });
            }
          } catch (emailErr) {
            console.error("Failed to send renewal email:", emailErr);
          }
        }
      }
    }

    // ── 2. Usage alerts for customer_subscriptions approaching limits ──
    const { data: activeSubs } = await serviceClient
      .from("customer_subscription")
      .select("id, customer_id, tier, packages_included, packages_used")
      .eq("status", "active")
      .gt("packages_included", 0);

    if (activeSubs) {
      for (const sub of activeSubs) {
        const usagePct = sub.packages_included > 0
          ? (sub.packages_used / sub.packages_included) * 100
          : 0;

        // Send alerts at 80% and 100% thresholds
        if (usagePct >= 80) {
          try {
            const { data: customer } = await serviceClient
              .from("customer_account")
              .select("email, full_name")
              .eq("id", sub.customer_id)
              .single();

            if (customer?.email) {
              const threshold = usagePct >= 100 ? 100 : 80;
              await sendUsageAlert({
                to: customer.email,
                customerName: customer.full_name,
                tier: sub.tier,
                packagesUsed: sub.packages_used,
                packagesIncluded: sub.packages_included,
                threshold,
              });
              usageAlertsSent++;
            }
          } catch (emailErr) {
            console.error("Failed to send usage alert:", emailErr);
          }
        }
      }
    }

    // ── 3. Legacy: Check agent accounts with expired periods ──
    const { data: expiredAccounts, error: expiredError } = await serviceClient
      .from("agent_accounts")
      .select("id, user_id, current_period_end, subscription_status")
      .eq("subscription_status", "active")
      .lt("current_period_end", nowISO)
      .eq("is_active", true);

    if (expiredError) {
      console.error("Expired accounts query failed:", expiredError.message);
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

    // ── 4. Clean up old cron_runs (older than 90 days) ──
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
            subscriptions_reset: subscriptionsReset,
            usage_alerts_sent: usageAlertsSent,
            expired_agent_accounts: expiredAccounts?.length || 0,
            old_cron_runs_deleted: deletedCount || 0,
          },
        })
        .eq("id", cronRunId);
    }

    return NextResponse.json({
      success: true,
      subscriptionsReset,
      usageAlertsSent,
      expiredAgentAccounts: expiredAccounts?.length || 0,
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
