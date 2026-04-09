import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSubscriptionReport } from "@/lib/email/send";
import { getTierName, TIER_ORDER, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * GET /api/cron/subscription-report
 * Monthly cron (1st of month at 8 AM UTC): Generates and sends a subscription
 * health report to platform admins.
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
        job_name: "subscription-report",
        status: "running",
      })
      .select("id")
      .single();

    const cronRunId = cronRun?.id;

    // Calculate report month (previous month)
    const now = new Date();
    const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const reportMonth = reportDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const monthStart = reportDate.toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // ── Fetch all subscriptions ──
    const { data: allSubs } = await serviceClient
      .from("customer_subscription")
      .select("id, tier, status, monthly_price, packages_included, packages_used, created_at, cancelled_at");

    const subs = allSubs || [];

    // Active subscribers
    const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");
    const activeSubscribers = activeSubs.length;

    // MRR
    const totalMrr = activeSubs.reduce((sum, s) => sum + Number(s.monthly_price || 0), 0);

    // New subscribers this month
    const newSubscribers = subs.filter(
      (s) => s.created_at >= monthStart && s.created_at <= monthEnd
    ).length;

    // Churned this month
    const churned = subs.filter(
      (s) => s.cancelled_at && s.cancelled_at >= monthStart && s.cancelled_at <= monthEnd
    ).length;

    // Usage stats
    const totalPackagesUsed = activeSubs.reduce((sum, s) => sum + (s.packages_used || 0), 0);
    const totalPackagesIncluded = activeSubs.reduce((sum, s) => sum + (s.packages_included || 0), 0);

    // Revenue breakdown by tier
    const revenueBreakdown = TIER_ORDER
      .filter((t) => t !== "free")
      .map((tierKey) => {
        const tierSubs = activeSubs.filter((s) => s.tier === tierKey);
        return {
          tier: getTierName(tierKey),
          mrr: tierSubs.reduce((sum, s) => sum + Number(s.monthly_price || 0), 0),
          count: tierSubs.length,
        };
      })
      .filter((r) => r.count > 0);

    // Top tier
    const topTierEntry = revenueBreakdown.reduce(
      (best, r) => (r.count > best.count ? r : best),
      { tier: "None", count: 0, mrr: 0 }
    );

    // ── Send report to platform admins ──
    const platformEmail = process.env.PLATFORM_ADMIN_EMAIL || "admin@propertydocz.com";

    await sendSubscriptionReport({
      to: platformEmail,
      reportMonth,
      totalMrr,
      activeSubscribers,
      newSubscribers,
      churned,
      usageStats: { totalPackagesUsed, totalPackagesIncluded },
      topTier: { name: topTierEntry.tier, count: topTierEntry.count },
      revenueBreakdown,
    });

    // Log success
    if (cronRunId) {
      await serviceClient
        .from("cron_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          records_processed: 1,
          metadata: {
            report_month: reportMonth,
            mrr: totalMrr,
            active_subscribers: activeSubscribers,
            new_subscribers: newSubscribers,
            churned,
          },
        })
        .eq("id", cronRunId);
    }

    return NextResponse.json({
      success: true,
      reportMonth,
      totalMrr,
      activeSubscribers,
      newSubscribers,
      churned,
    });
  } catch (error) {
    console.error("Subscription report cron error:", error);

    try {
      const serviceClient = await createServiceClient();
      await serviceClient.from("cron_runs").insert({
        job_name: "subscription-report",
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
    } catch {
      // Best effort logging
    }

    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
