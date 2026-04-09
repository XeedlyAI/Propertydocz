import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

interface AdvisoryInsight {
  type: "urgent" | "warning" | "info" | "positive";
  title: string;
  detail: string;
}

/**
 * GET /api/ai/advisory
 * Generates AI-powered operational insights for the tenant admin dashboard.
 * Caches results for 1 hour per tenant.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Check cache
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select("name, advisory_cache, advisory_cached_at")
      .eq("id", profile.tenant_id)
      .single();

    if (tenant?.advisory_cache && tenant.advisory_cached_at) {
      const cachedAt = new Date(tenant.advisory_cached_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (cachedAt > oneHourAgo) {
        return NextResponse.json({
          insights: tenant.advisory_cache as AdvisoryInsight[],
          cached: true,
          cachedAt: tenant.advisory_cached_at,
        });
      }
    }

    // Gather context data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // All requests
    const { data: requests } = await serviceClient
      .from("document_requests")
      .select("id, created_at, updated_at, status, requester_name, property_address, document_types, turnaround, total_price_cents, payment_status")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(100);

    // Associations with key fields
    const { data: associations } = await serviceClient
      .from("associations")
      .select("id, name, reserve_study_date, master_policy_expiration, total_units")
      .eq("tenant_id", profile.tenant_id);

    // Staleness check — find fields past their staleness threshold
    const { data: staleFieldData } = await serviceClient
      .from("association_field_values")
      .select("association_id, field_key, value, last_verified_at, confidence")
      .eq("confidence", "ai_extracted")
      .not("value", "is", null)
      .in(
        "association_id",
        (associations || []).map((a) => a.id)
      );

    const { data: fieldDefs } = await serviceClient
      .from("field_definitions")
      .select("field_key, label, staleness_days, tier")
      .not("staleness_days", "is", null);

    // Build staleness alerts
    const stalenessAlerts: Array<{
      association_name: string;
      field_label: string;
      days_stale: number;
      threshold_days: number;
      current_value: string;
    }> = [];

    if (staleFieldData && fieldDefs) {
      const assocNameMap = new Map(
        (associations || []).map((a) => [a.id, a.name])
      );
      const fieldDefMap = new Map(
        fieldDefs.map((fd) => [fd.field_key, fd])
      );

      for (const fv of staleFieldData) {
        const def = fieldDefMap.get(fv.field_key);
        if (!def || !def.staleness_days) continue;

        const verifiedAt = fv.last_verified_at
          ? new Date(fv.last_verified_at).getTime()
          : 0;
        const daysSinceVerified = verifiedAt
          ? Math.floor((now.getTime() - verifiedAt) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceVerified > def.staleness_days) {
          stalenessAlerts.push({
            association_name: assocNameMap.get(fv.association_id) || "Unknown",
            field_label: def.label,
            days_stale: daysSinceVerified - def.staleness_days,
            threshold_days: def.staleness_days,
            current_value: fv.value || "",
          });
        }
      }
    }

    // Group staleness by association for cleaner context
    const stalenesssByAssoc = new Map<string, string[]>();
    for (const alert of stalenessAlerts) {
      const existing = stalenesssByAssoc.get(alert.association_name) || [];
      existing.push(
        `${alert.field_label} (${alert.days_stale}d past ${alert.threshold_days}d threshold)`
      );
      stalenesssByAssoc.set(alert.association_name, existing);
    }

    const allRequests = requests || [];
    const allAssociations = associations || [];

    // Compute context metrics
    const awaitingData = allRequests.filter((r) => r.status === "awaiting_data");
    const pendingReview = allRequests.filter((r) => r.status === "pending_review");
    const rushRequests = awaitingData.filter((r) => r.turnaround === "rush");

    const thisMonthRequests = allRequests.filter((r) => r.created_at >= startOfMonth);
    const lastMonthRequests = allRequests.filter(
      (r) => r.created_at >= startOfLastMonth && r.created_at < startOfMonth
    );

    const deliveredThisMonth = thisMonthRequests.filter((r) => r.status === "delivered");
    const deliveredLastMonth = lastMonthRequests.filter((r) => r.status === "delivered");

    // Average turnaround time (created → delivered)
    const deliveredWithTime = allRequests
      .filter((r) => r.status === "delivered" && r.updated_at)
      .map((r) => {
        const created = new Date(r.created_at).getTime();
        const delivered = new Date(r.updated_at).getTime();
        return (delivered - created) / (1000 * 60 * 60 * 24); // days
      });

    const avgTurnaround = deliveredWithTime.length > 0
      ? deliveredWithTime.reduce((a, b) => a + b, 0) / deliveredWithTime.length
      : null;

    // Expiring insurance
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const expiringInsurance = allAssociations.filter(
      (a) => a.master_policy_expiration && a.master_policy_expiration <= thirtyDaysFromNow
    );

    // Stale reserve studies (>3 years)
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    const staleReserves = allAssociations.filter(
      (a) => a.reserve_study_date && a.reserve_study_date < threeYearsAgo
    );

    const revenueThisMonth = thisMonthRequests
      .filter((r) => r.payment_status === "paid")
      .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

    // Build context for Claude
    const context = `
Tenant: ${tenant?.name || "Unknown"}
Current admin: ${profile.full_name}
Date: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

PENDING WORK:
- ${awaitingData.length} requests awaiting data input${rushRequests.length > 0 ? ` (${rushRequests.length} are RUSH)` : ""}
${awaitingData.slice(0, 5).map((r) => `  • ${r.requester_name} — ${r.property_address} (${r.turnaround})`).join("\n")}
- ${pendingReview.length} requests pending review

THIS MONTH:
- ${thisMonthRequests.length} total requests (vs ${lastMonthRequests.length} last month)
- ${deliveredThisMonth.length} delivered (vs ${deliveredLastMonth.length} last month)
- Revenue: $${(revenueThisMonth / 100).toFixed(2)}
${avgTurnaround !== null ? `- Average turnaround: ${avgTurnaround.toFixed(1)} days` : ""}

ASSOCIATIONS (${allAssociations.length} total):
${expiringInsurance.length > 0 ? `- ${expiringInsurance.length} with insurance expiring within 30 days: ${expiringInsurance.map((a) => a.name).join(", ")}` : "- No insurance expirations in next 30 days"}
${staleReserves.length > 0 ? `- ${staleReserves.length} with reserve studies older than 3 years: ${staleReserves.map((a) => a.name).join(", ")}` : "- All reserve studies are current"}
${stalenessAlerts.length > 0 ? `
DATA STALENESS ALERTS (${stalenessAlerts.length} stale fields across ${stalenesssByAssoc.size} associations):
${Array.from(stalenesssByAssoc.entries())
  .map(([name, fields]) => `- ${name}: ${fields.join("; ")}`)
  .join("\n")}` : ""}
`.trim();

    // Call Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        insights: [
          {
            type: "info",
            title: "AI Advisory Unavailable",
            detail: "Configure ANTHROPIC_API_KEY to enable AI-powered insights.",
          },
        ],
        cached: false,
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are an AI operations advisor for HOA management companies using PropertyDocz. Generate 3-5 concise, single-line insights based on the tenant's current operational state.

CRITICAL FORMAT RULES:
- Each insight is ONE sentence, max 120 characters
- Include specific names, numbers, and dates — never be vague
- No headlines or titles — just the single sentence in the "detail" field
- Set "title" to an empty string ""
- Examples of good insights:
  "3 rush requests from Jane Smith awaiting data input — oldest is 2 days overdue"
  "Revenue up 24% this month at $1,064 vs $858 last month"
  "Sunset Ridge HOA master policy expires June 15th — contact for renewal"
  "5 requests delivered this month with 1.8 day average turnaround"

Return JSON array with objects having:
- type: "urgent" | "warning" | "info" | "positive"
- title: "" (always empty string)
- detail: Single concise sentence with specific data (max 120 chars)

Prioritize: rush orders first, then data staleness alerts, then expiring docs, then performance metrics, then optimization suggestions. For stale data, recommend syncing Dropbox documents or manual verification. Do not invent data — only reference what's provided.`,
      messages: [
        {
          role: "user",
          content: `Generate operational insights based on this data:\n\n${context}`,
        },
      ],
    });

    // Parse response
    let insights: AdvisoryInsight[] = [];
    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      try {
        // Handle markdown code blocks
        let jsonStr = textBlock.text.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        insights = JSON.parse(jsonStr);
      } catch {
        insights = [
          {
            type: "info",
            title: "Advisory generated",
            detail: textBlock.text.slice(0, 200),
          },
        ];
      }
    }

    // Cache the result
    await serviceClient
      .from("tenants")
      .update({
        advisory_cache: insights,
        advisory_cached_at: now.toISOString(),
      })
      .eq("id", profile.tenant_id);

    return NextResponse.json({
      insights,
      cached: false,
      cachedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("AI advisory error:", error);
    return NextResponse.json(
      {
        insights: [
          {
            type: "info",
            title: "Advisory temporarily unavailable",
            detail: "We couldn't generate insights right now. Try again later.",
          },
        ],
        cached: false,
      },
      { status: 200 } // Don't fail the page
    );
  }
}
