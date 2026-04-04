import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required"),
  company_name: z.string().optional(),
  license_number: z.string().optional(),
  phone: z.string().optional(),
  tenant_id: z.string().uuid("Invalid tenant"),
  tier_slug: z.string().default("pay_per_order"),
});

/**
 * POST /api/auth/register
 * Creates a new agent account:
 * 1. Creates Supabase auth user
 * 2. Creates profile with 'agent' role
 * 3. Creates agent_accounts record linked to the selected tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Use service role client for user creation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("id", data.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Invalid management company" },
        { status: 400 }
      );
    }

    // Look up the selected tier
    const { data: tier, error: tierError } = await supabase
      .from("membership_tiers")
      .select("id, slug, price_cents")
      .eq("slug", data.tier_slug)
      .eq("is_active", true)
      .single();

    if (tierError || !tier) {
      return NextResponse.json(
        { error: "Invalid membership tier" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email === data.email
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm for now
      });

    if (authError || !authData.user) {
      console.error("Auth user creation failed:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone || null,
      tenant_id: data.tenant_id,
      role: "agent",
    });

    if (profileError) {
      console.error("Profile creation failed:", profileError);
      // Clean up auth user on failure
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create profile. Please try again." },
        { status: 500 }
      );
    }

    // Create agent account
    const { error: agentError } = await supabase
      .from("agent_accounts")
      .insert({
        user_id: userId,
        tenant_id: data.tenant_id,
        tier_id: tier.id,
        company_name: data.company_name || null,
        license_number: data.license_number || null,
        phone: data.phone || null,
        subscription_status: tier.price_cents === 0 ? "active" : "none",
      });

    if (agentError) {
      console.error("Agent account creation failed:", agentError);
      // Clean up on failure
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create agent account. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      requires_subscription: tier.price_cents > 0,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
