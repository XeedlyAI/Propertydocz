import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/customer/create-account
 *
 * Converts a guest customer into an authenticated account.
 * Creates a Supabase auth user and links it to the existing customer_account.
 *
 * Body: { email: string, password: string, customerAccountId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, customerAccountId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Create Supabase auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true, // Auto-confirm since they already have an order
      });

    if (authError) {
      // User might already exist
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account already exists with this email. Please sign in." },
          { status: 409 }
        );
      }
      console.error("Auth user creation failed:", authError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Account creation failed" },
        { status: 500 }
      );
    }

    // Link auth user to customer_account
    if (customerAccountId) {
      await supabase
        .from("customer_account")
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", customerAccountId);
    } else {
      // Find by email
      await supabase
        .from("customer_account")
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq("email", email.toLowerCase().trim());
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
