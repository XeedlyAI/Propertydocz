/**
 * Seed script: inserts 4 test document_requests for tenant slug "corehoa"
 * Run with: npm run seed:test
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// 1. Parse .env.local (or fall back to process.env)
// ---------------------------------------------------------------------------
const env: Record<string, string> = {};
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Set them in .env.local or as environment variables."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function lookupOrCreateCustomer(
  email: string,
  fullName: string,
  customerType: string
): Promise<string | null> {
  // Try to find existing
  const { data: existing } = await supabase
    .from("customer_account")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) return existing.id;

  // Create new
  const { data: created, error } = await supabase
    .from("customer_account")
    .insert({
      email,
      full_name: fullName,
      customer_type: customerType,
    })
    .select("id")
    .single();

  if (error) {
    console.warn(`  Warning: could not create customer_account for ${email}: ${error.message}`);
    return null;
  }
  return created!.id;
}

async function insertActivityLog(
  tenantId: string,
  entityId: string
): Promise<void> {
  const { error } = await supabase.from("activity_log").insert({
    tenant_id: tenantId,
    entity_type: "request",
    entity_id: entityId,
    action: "created",
    details: { source: "seed" },
  });

  if (error) {
    console.warn(`  Warning: activity_log insert failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Seed script: inserting 3 test document_requests for corehoa\n");

  // 1. Look up tenant by slug
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "corehoa")
    .single();

  if (tenantErr || !tenant) {
    console.error(`Could not find tenant with slug "corehoa": ${tenantErr?.message}`);
    process.exit(1);
  }
  const tenantId: string = tenant.id;
  console.log(`Tenant "corehoa": ${tenantId}`);

  // 2. Real CoreHOA association UUIDs
  const ASSOCIATION_IDS = {
    wolfLodge: '6f6a8c14-f585-494f-b695-6e4a15c60ce2',
    pepperwood: '9082ddb3-8cc7-47e4-819c-57f57415c4bc',
    cottonwoodCanyon: 'd7933617-f07b-4d35-87dc-78367155eb1d',
  };

  console.log(`Wolf Lodge HOA: ${ASSOCIATION_IDS.wolfLodge}`);
  console.log(`Pepperwood Townhomes: ${ASSOCIATION_IDS.pepperwood}`);
  console.log(`Cottonwood Canyon Estates: ${ASSOCIATION_IDS.cottonwoodCanyon}\n`);

  // 3. Define 3 test requests
  const requests = [
    {
      label: "Request 1: Wolf Lodge — Resale + Payoff + Lender (multi-doc)",
      requester_name: "Sarah Johnson",
      requester_email: "sarah.johnson@remax.com",
      requester_type: "agent" as const,
      property_address: "8432 Wolf Lodge Dr, Unit 204",
      association_id: ASSOCIATION_IDS.wolfLodge,
      status: "awaiting_data" as const,
      payment_status: "paid" as const,
      document_types: ["resale_certificate", "payoff_statement", "lender_questionnaire"],
      total_price_cents: 49500,
      turnaround: "standard" as const,
      live_data: {
        owner_names: "Michael & Lisa Chen",
        closing_date: daysFromNow(44),
      },
    },
    {
      label: "Request 2: Pepperwood — Resale + Governing Docs (rush)",
      requester_name: "David Park",
      requester_email: "dpark@summittitle.com",
      requester_type: "title_company" as const,
      property_address: "1240 Pepperwood Ln, Unit 12",
      association_id: ASSOCIATION_IDS.pepperwood,
      status: "awaiting_data" as const,
      payment_status: "paid" as const,
      document_types: ["resale_certificate", "governing_documents"],
      total_price_cents: 45000,
      turnaround: "rush" as const,
      rush_notes: "Closing July 8 — need docs by July 5",
      live_data: {
        owner_names: "Jennifer Martinez",
        closing_date: daysFromNow(37),
        unit_lot_number: "12",
      },
    },
    {
      label: "Request 3: Cottonwood Canyon — Payoff only (bill to closing)",
      requester_name: "Amy Roberts",
      requester_email: "aroberts@guildmortgage.com",
      requester_type: "lender" as const,
      property_address: "2891 Cottonwood Canyon Rd",
      association_id: ASSOCIATION_IDS.cottonwoodCanyon,
      status: "awaiting_data" as const,
      payment_status: "bill_to_closing" as const,
      document_types: ["payoff_statement"],
      total_price_cents: 5000,
      turnaround: "standard" as const,
      bill_to_closing: true,
      live_data: {
        owner_names: "Robert & Karen Thompson",
        closing_date: daysFromNow(51),
      },
    },
  ];

  let succeeded = 0;
  let failed = 0;

  for (const req of requests) {
    try {
      console.log(`--- ${req.label} ---`);

      // Look up or create customer
      const customerId = await lookupOrCreateCustomer(
        req.requester_email,
        req.requester_name,
        req.requester_type
      );
      if (customerId) {
        console.log(`  Customer: ${customerId}`);
      }

      // Build insert payload
      const payload: Record<string, unknown> = {
        tenant_id: tenantId,
        association_id: req.association_id,
        document_types: req.document_types,
        requester_name: req.requester_name,
        requester_email: req.requester_email,
        requester_type: req.requester_type,
        property_address: req.property_address,
        status: req.status,
        payment_status: req.payment_status,
        total_price_cents: req.total_price_cents,
        turnaround: req.turnaround,
        live_data: req.live_data,
      };

      if (customerId) payload.customer_id = customerId;
      if ("rush_notes" in req) payload.rush_notes = (req as Record<string, unknown>).rush_notes;
      if ("bill_to_closing" in req) payload.bill_to_closing = (req as Record<string, unknown>).bill_to_closing;
      if ("delivered_at" in req) payload.delivered_at = (req as Record<string, unknown>).delivered_at;

      const { data: inserted, error: insertErr } = await supabase
        .from("document_requests")
        .insert(payload)
        .select("id")
        .single();

      if (insertErr) {
        // If delivered_at column doesn't exist, retry without it
        if (insertErr.message.includes("delivered_at") && "delivered_at" in req) {
          console.warn("  delivered_at column not recognized, retrying without it...");
          delete payload.delivered_at;
          const { data: retry, error: retryErr } = await supabase
            .from("document_requests")
            .insert(payload)
            .select("id")
            .single();
          if (retryErr) throw retryErr;
          console.log(`  Inserted request: ${retry!.id}`);
          await insertActivityLog(tenantId, retry!.id);
        } else {
          throw insertErr;
        }
      } else {
        console.log(`  Inserted request: ${inserted!.id}`);
        await insertActivityLog(tenantId, inserted!.id);
      }

      succeeded++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${message}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Done. ${succeeded} succeeded, ${failed} failed.`);
  console.log(`========================================`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
