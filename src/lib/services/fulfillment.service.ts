import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fulfillment Ledger Service
 *
 * Creates revenue split entries when document requests are delivered.
 * Three revenue types:
 * - pay_per_order: Customer paid full price → 50/50 split
 * - overage: Customer paid discounted price → 50/50 split
 * - subscription_fulfillment: Customer paid $0 → tenant earns $10/doc from XeedlyAI's sub revenue
 */

/** $10.00 flat fee per document fulfilled under a subscription */
const SUBSCRIPTION_FULFILLMENT_FEE_CENTS = 1000;

interface DocumentRequest {
  id: string;
  tenant_id: string;
  customer_id?: string | null;
  document_types: string[];
  total_price_cents: number;
  pricing_type?: string | null; // 'standard' | 'overage' | 'subscription'
}

/**
 * Create a fulfillment ledger entry when a document request is delivered.
 * Should be called from the status update API when status → 'delivered'.
 */
export async function createFulfillmentLedgerEntry(
  supabase: SupabaseClient,
  request: DocumentRequest
) {
  const docCount = request.document_types.length;
  const docTypeLabel = request.document_types.join(", ");
  const pricingType = request.pricing_type || "standard";

  if (pricingType === "standard" || pricingType === "overage") {
    // Pay-per-order or overage: 50/50 split of what the customer paid
    const orderAmountCents = request.total_price_cents || 0;
    const tenantShareCents = Math.round(orderAmountCents / 2);
    const platformShareCents = orderAmountCents - tenantShareCents;

    const { error } = await supabase.from("fulfillment_ledger").insert({
      tenant_id: request.tenant_id,
      document_request_id: request.id,
      customer_id: request.customer_id || null,
      revenue_type: pricingType === "overage" ? "overage" : "pay_per_order",
      document_type: docTypeLabel,
      document_count: docCount,
      order_amount: orderAmountCents / 100,
      tenant_share: tenantShareCents / 100,
      platform_share: platformShareCents / 100,
      settlement_status: "accrued",
    });

    if (error) {
      console.error("Failed to create fulfillment ledger entry:", error);
      throw error;
    }
  } else if (pricingType === "subscription") {
    // Subscription-covered: flat $10 per document fulfilled
    // This comes out of XeedlyAI's subscription revenue (negative platform share)
    const fulfillmentFeeDollars =
      (SUBSCRIPTION_FULFILLMENT_FEE_CENTS * docCount) / 100;

    const { error } = await supabase.from("fulfillment_ledger").insert({
      tenant_id: request.tenant_id,
      document_request_id: request.id,
      customer_id: request.customer_id || null,
      revenue_type: "subscription_fulfillment",
      document_type: docTypeLabel,
      document_count: docCount,
      order_amount: 0,
      tenant_share: fulfillmentFeeDollars,
      platform_share: -fulfillmentFeeDollars,
      settlement_status: "accrued",
    });

    if (error) {
      console.error("Failed to create fulfillment ledger entry:", error);
      throw error;
    }
  }
}

/**
 * Get accrued (unsettled) ledger entries for a tenant in a date range.
 */
export async function getAccruedEntries(
  supabase: SupabaseClient,
  tenantId: string,
  periodStart: string,
  periodEnd: string
) {
  const { data, error } = await supabase
    .from("fulfillment_ledger")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("settlement_status", "accrued")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  if (error) {
    console.error("Failed to fetch accrued entries:", error);
    throw error;
  }

  return data || [];
}

/**
 * Mark ledger entries as settled with a settlement ID.
 */
export async function settleEntries(
  supabase: SupabaseClient,
  entryIds: string[],
  settlementId: string
) {
  if (entryIds.length === 0) return;

  const { error } = await supabase
    .from("fulfillment_ledger")
    .update({
      settlement_status: "settled",
      settlement_id: settlementId,
      settled_at: new Date().toISOString(),
    })
    .in("id", entryIds);

  if (error) {
    console.error("Failed to settle entries:", error);
    throw error;
  }
}
