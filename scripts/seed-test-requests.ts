/**
 * Seed script: inserts 4 test document_requests for tenant slug "corehoa"
 * Run with: npm run seed:test
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// 1. Parse .env.local
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
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
  console.log("Seed script: inserting 4 test document_requests for corehoa\n");

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

  // 2. Look up associations
  const { data: associations, error: assocErr } = await supabase
    .from("associations")
    .select("id, name")
    .eq("tenant_id", tenantId);

  if (assocErr || !associations?.length) {
    console.error(`Could not find associations for tenant: ${assocErr?.message}`);
    process.exit(1);
  }

  const mountainView = associations.find((a) =>
    a.name.toLowerCase().includes("mountain view")
  );
  const sunsetRidge = associations.find((a) =>
    a.name.toLowerCase().includes("sunset")
  );

  if (!mountainView || !sunsetRidge) {
    console.error(
      `Could not find required associations. Found: ${associations.map((a) => a.name).join(", ")}`
    );
    process.exit(1);
  }

  console.log(`Mountain View Condos: ${mountainView.id}`);
  console.log(`Sunset Ridge HOA: ${sunsetRidge.id}\n`);

  // 3. Define the 4 test requests
  const requests = [
    {
      label: "Request 1: Resale Certificate",
      requester_name: "Sarah Johnson",
      requester_email: "sarah@utahrealty.com",
      requester_type: "agent" as const,
      property_address: "1622 Heatherwood Circle, Unit 209",
      association_id: mountainView.id,
      status: "received" as const,
      payment_status: "pending" as const,
      document_types: ["resale_certificate"],
      total_price_cents: 9900,
      turnaround: "standard" as const,
      live_data: {
        owner_name: "Robert & Linda Martinez",
        closing_date: daysFromNow(30),
      },
    },
    {
      label: "Request 2: Payoff + Resale combo",
      requester_name: "Michael Torres",
      requester_email: "m.torres@firstam.com",
      requester_type: "title_company" as const,
      property_address: "4500 Mountain View Dr, Unit B22",
      association_id: mountainView.id,
      status: "awaiting_data" as const,
      payment_status: "paid" as const,
      document_types: ["payoff_statement", "resale_certificate"],
      total_price_cents: 24400,
      turnaround: "standard" as const,
      live_data: {},
    },
    {
      label: "Request 3: Lender Questionnaire",
      requester_name: "Jennifer Walsh",
      requester_email: "j.walsh@wellsfargo.com",
      requester_type: "lender" as const,
      property_address: "1200 Sunset Ridge Blvd, Unit 310",
      association_id: sunsetRidge.id,
      status: "ready_for_generation" as const,
      payment_status: "paid" as const,
      document_types: ["lender_questionnaire"],
      total_price_cents: 27500,
      turnaround: "rush" as const,
      live_data: {
        owner_name: "Jennifer & Mark Walsh",
        closing_date: daysFromNow(14),
      },
      rush_notes: "Lender deadline in 2 weeks",
    },
    {
      label: "Request 4: Governing Documents",
      requester_name: "David Kim",
      requester_email: "david@kw.com",
      requester_type: "agent" as const,
      property_address: "1234 Mountain View Dr, Unit 5",
      association_id: sunsetRidge.id,
      status: "delivered" as const,
      payment_status: "paid" as const,
      document_types: ["governing_documents"],
      total_price_cents: 9900,
      turnaround: "standard" as const,
      live_data: { owner_name: "David Kim" },
      delivered_at: daysFromNow(-3),
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
      if ("rush_notes" in req) payload.rush_notes = req.rush_notes;
      if ("delivered_at" in req) payload.delivered_at = req.delivered_at;

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
