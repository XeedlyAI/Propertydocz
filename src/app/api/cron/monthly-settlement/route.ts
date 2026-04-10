import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { settleEntries } from "@/lib/services/fulfillment.service";

/**
 * GET /api/cron/monthly-settlement
 * Monthly cron (1st of month at midnight UTC): Processes revenue settlements
 * for all tenants from the previous month.
 *
 * For each tenant:
 * 1. Queries accrued fulfillment_ledger entries from previous month
 * 2. Creates a monthly_settlement record with aggregated totals
 * 3. If tenant has Stripe Connect: creates a Stripe Transfer for their earnings
 * 4. Marks ledger entries as settled
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
        job_name: "monthly-settlement",
        status: "running",
      })
      .select("id")
      .single();

    const cronRunId = cronRun?.id;

    // Calculate previous month range
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month

    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];
    const periodStartISO = periodStart.toISOString();
    const periodEndISO = new Date(
      periodEnd.getFullYear(),
      periodEnd.getMonth(),
      periodEnd.getDate(),
      23,
      59,
      59
    ).toISOString();

    // Get all tenants with Stripe info
    const { data: tenants } = await serviceClient
      .from("tenants")
      .select("id, name, stripe_account_id");

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({ success: true, message: "No tenants to process" });
    }

    let settlementsCreated = 0;
    let transfersProcessed = 0;
    let transfersFailed = 0;

    for (const tenant of tenants) {
      // Get accrued ledger entries for this tenant from last month
      const { data: entries, error: entriesError } = await serviceClient
        .from("fulfillment_ledger")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("settlement_status", "accrued")
        .gte("created_at", periodStartISO)
        .lte("created_at", periodEndISO);

      if (entriesError) {
        console.error(`Failed to fetch entries for tenant ${tenant.name}:`, entriesError);
        continue;
      }

      if (!entries || entries.length === 0) continue;

      // Calculate totals
      const ppoEntries = entries.filter(
        (e) => e.revenue_type === "pay_per_order" || e.revenue_type === "overage"
      );
      const subEntries = entries.filter(
        (e) => e.revenue_type === "subscription_fulfillment"
      );

      const ppoGrossRevenue = ppoEntries.reduce(
        (sum, e) => sum + Number(e.order_amount || 0),
        0
      );
      const ppoTenantShare = ppoEntries.reduce(
        (sum, e) => sum + Number(e.tenant_share || 0),
        0
      );
      const ppoPlatformShare = ppoEntries.reduce(
        (sum, e) => sum + Number(e.platform_share || 0),
        0
      );
      const subFulfillmentFees = subEntries.reduce(
        (sum, e) => sum + Number(e.tenant_share || 0),
        0
      );
      const totalTenantEarnings = entries.reduce(
        (sum, e) => sum + Number(e.tenant_share || 0),
        0
      );
      const totalPlatformEarnings = entries.reduce(
        (sum, e) => sum + Number(e.platform_share || 0),
        0
      );
      const totalDocsFulfilled = entries.reduce(
        (sum, e) => sum + (e.document_count || 0),
        0
      );

      // Create settlement record
      const { data: settlement, error: settlementError } = await serviceClient
        .from("monthly_settlement")
        .insert({
          tenant_id: tenant.id,
          period_start: periodStartStr,
          period_end: periodEndStr,
          total_documents_fulfilled: totalDocsFulfilled,
          ppo_orders: ppoEntries.length,
          ppo_gross_revenue: ppoGrossRevenue,
          ppo_tenant_share: ppoTenantShare,
          ppo_platform_share: ppoPlatformShare,
          sub_fulfillments: subEntries.length,
          sub_fulfillment_fees: subFulfillmentFees,
          total_tenant_earnings: totalTenantEarnings,
          total_platform_earnings: totalPlatformEarnings,
          status: "pending",
        })
        .select("id")
        .single();

      if (settlementError || !settlement) {
        console.error(`Failed to create settlement for ${tenant.name}:`, settlementError);
        continue;
      }

      settlementsCreated++;

      // Process Stripe transfer if tenant has Connect account and positive earnings
      const stripeRequired = process.env.NEXT_PUBLIC_REQUIRE_STRIPE_FOR_FULFILLMENT !== 'false';
      if (stripeRequired && tenant.stripe_account_id && totalTenantEarnings > 0) {
        try {
          const stripe = getStripe();
          const transferAmountCents = Math.round(totalTenantEarnings * 100);

          const transfer = await stripe.transfers.create({
            amount: transferAmountCents,
            currency: "usd",
            destination: tenant.stripe_account_id,
            description: `PropertyDocz settlement: ${periodStartStr} to ${periodEndStr}`,
            metadata: {
              settlement_id: settlement.id,
              tenant_name: tenant.name,
              period: `${periodStartStr} to ${periodEndStr}`,
            },
          });

          // Update settlement as paid
          await serviceClient
            .from("monthly_settlement")
            .update({
              status: "paid",
              stripe_transfer_id: transfer.id,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", settlement.id);

          transfersProcessed++;
        } catch (stripeErr) {
          console.error(
            `Stripe transfer failed for ${tenant.name}:`,
            stripeErr
          );

          await serviceClient
            .from("monthly_settlement")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", settlement.id);

          transfersFailed++;
        }
      }

      // Mark ledger entries as settled
      const entryIds = entries.map((e) => e.id);
      await settleEntries(serviceClient, entryIds, settlement.id);
    }

    // Log success
    if (cronRunId) {
      await serviceClient
        .from("cron_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          records_processed: settlementsCreated,
          metadata: {
            period: `${periodStartStr} to ${periodEndStr}`,
            settlements_created: settlementsCreated,
            transfers_processed: transfersProcessed,
            transfers_failed: transfersFailed,
          },
        })
        .eq("id", cronRunId);
    }

    return NextResponse.json({
      success: true,
      period: `${periodStartStr} to ${periodEndStr}`,
      settlementsCreated,
      transfersProcessed,
      transfersFailed,
    });
  } catch (error) {
    console.error("Monthly settlement cron error:", error);

    try {
      const serviceClient = await createServiceClient();
      await serviceClient.from("cron_runs").insert({
        job_name: "monthly-settlement",
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
