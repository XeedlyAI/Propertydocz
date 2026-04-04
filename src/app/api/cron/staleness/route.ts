import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendAdminNotification } from "@/lib/email/send";

/**
 * GET /api/cron/staleness
 * Weekly cron: Find stale requests (paid but not progressed in 5+ days)
 * and send alert emails to tenant admins.
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
        job_name: "staleness",
        status: "running",
      })
      .select("id")
      .single();

    const cronRunId = cronRun?.id;

    // Find requests that are in actionable statuses but haven't been updated in 5+ days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const staleStatuses = ["paid", "awaiting_data", "ready_for_generation"];

    const { data: staleRequests, error: queryError } = await serviceClient
      .from("document_requests")
      .select(
        "id, tenant_id, requester_name, property_address, document_types, status, updated_at"
      )
      .in("status", staleStatuses)
      .lt("updated_at", fiveDaysAgo.toISOString());

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`);
    }

    const stale = staleRequests || [];
    let emailsSent = 0;

    // Group by tenant_id to send one email per tenant
    const byTenant = new Map<
      string,
      typeof stale
    >();

    for (const req of stale) {
      const tid = req.tenant_id;
      if (!byTenant.has(tid)) byTenant.set(tid, []);
      byTenant.get(tid)!.push(req);
    }

    // For each tenant, find admin email and send alert
    for (const [tenantId, requests] of byTenant) {
      const { data: tenant } = await serviceClient
        .from("tenants")
        .select("name, contact_email")
        .eq("id", tenantId)
        .single();

      if (!tenant?.contact_email) continue;

      // Also check for tenant_admin profiles
      const { data: admins } = await serviceClient
        .from("profiles")
        .select("email")
        .eq("tenant_id", tenantId)
        .in("role", ["tenant_admin"])
        .limit(3);

      const recipients = new Set<string>();
      if (tenant.contact_email) recipients.add(tenant.contact_email);
      for (const admin of admins || []) {
        if (admin.email) recipients.add(admin.email);
      }

      // Send a summary notification for each stale request
      for (const req of requests) {
        const daysStale = Math.floor(
          (Date.now() - new Date(req.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        for (const email of recipients) {
          try {
            await sendAdminNotification({
              to: email,
              tenantName: tenant.name,
              requesterName: req.requester_name,
              requestId: req.id,
              propertyAddress: req.property_address,
              documentTypes: req.document_types as string[],
              reason: `Stale Request — ${daysStale} days without progress`,
            });
            emailsSent++;
          } catch (emailErr) {
            console.error(`Failed to send staleness email to ${email}:`, emailErr);
          }
        }
      }
    }

    // Log success
    if (cronRunId) {
      await serviceClient
        .from("cron_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          records_processed: stale.length,
          metadata: {
            emails_sent: emailsSent,
            tenants_affected: byTenant.size,
          },
        })
        .eq("id", cronRunId);
    }

    return NextResponse.json({
      success: true,
      staleRequests: stale.length,
      emailsSent,
    });
  } catch (error) {
    console.error("Staleness cron error:", error);

    // Try to log failure
    try {
      const serviceClient = await createServiceClient();
      await serviceClient.from("cron_runs").insert({
        job_name: "staleness",
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
