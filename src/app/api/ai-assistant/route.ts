import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * POST /api/ai-assistant
 * Interactive AI chat for tenant admins.
 * Provides context-aware responses about requests, associations, and revenue.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { message, history = [] } = body as {
      message: string;
      history: ChatMessage[];
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Gather context data
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    const [
      { data: tenant },
      { data: requests },
      { data: associations },
    ] = await Promise.all([
      serviceClient
        .from("tenants")
        .select("name")
        .eq("id", profile.tenant_id)
        .single(),
      serviceClient
        .from("document_requests")
        .select(
          "id, created_at, updated_at, status, requester_name, property_address, document_types, turnaround, total_price_cents, payment_status"
        )
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })
        .limit(100),
      serviceClient
        .from("associations")
        .select("id, name, total_units")
        .eq("tenant_id", profile.tenant_id),
    ]);

    const allRequests = requests || [];
    const allAssociations = associations || [];

    // Compute metrics
    const awaitingData = allRequests.filter(
      (r) => r.status === "awaiting_data"
    ).length;
    const pendingReview = allRequests.filter(
      (r) => r.status === "pending_review"
    ).length;
    const readyForGen = allRequests.filter(
      (r) => r.status === "ready_for_generation"
    ).length;
    const delivered = allRequests.filter(
      (r) => r.status === "delivered"
    ).length;
    const thisMonthRequests = allRequests.filter(
      (r) => r.created_at >= startOfMonth
    );
    const revenueThisMonth = thisMonthRequests
      .filter((r) => r.payment_status === "paid")
      .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

    const context = `
TENANT: ${tenant?.name || "Unknown"}
ADMIN: ${profile.full_name}
DATE: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

CURRENT PIPELINE:
- Awaiting Data: ${awaitingData}
- Pending Review: ${pendingReview}
- Ready for Generation: ${readyForGen}
- Delivered (all time): ${delivered}
- Total Requests: ${allRequests.length}

THIS MONTH:
- Requests: ${thisMonthRequests.length}
- Revenue: $${(revenueThisMonth / 100).toFixed(2)}

ASSOCIATIONS: ${allAssociations.length} total
${allAssociations.slice(0, 20).map((a) => `- ${a.name} (${a.total_units || "?"} units)`).join("\n")}

RECENT REQUESTS (last 10):
${allRequests
  .slice(0, 10)
  .map(
    (r) =>
      `- ${r.requester_name} | ${r.property_address} | ${r.status} | ${r.turnaround} | $${((r.total_price_cents || 0) / 100).toFixed(2)}`
  )
  .join("\n")}

APP NAVIGATION:
- /admin/dashboard — overview with KPIs and insights
- /admin/requests — all document requests, filterable
- /admin/requests/[id] — individual request detail + status management
- /admin/associations — HOA association management
- /admin/associations/[id] — association detail + field data
- /admin/settings — account, stripe, storage, branding
`.trim();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response:
          "AI assistant is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
      });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build message history for multi-turn
    const conversationMessages: Anthropic.MessageParam[] = [
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: `You are an AI assistant for PropertyDocz, an HOA document ordering platform. You help tenant admins understand their operations and make decisions.

CONTEXT:
${context}

GUIDELINES:
- Be professional, concise, and action-oriented
- Reference specific data points when answering questions
- If asked about navigation, provide the relevant URL path
- When suggesting actions, be specific (e.g., "Review the 3 pending requests")
- Keep responses under 3 sentences unless the user asks for detail
- Format money as dollars, dates in natural language
- You can help with: request status, revenue questions, association info, workflow guidance, data interpretation`,
      messages: conversationMessages,
    });

    let responseText = "";
    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      responseText = textBlock.text;
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("AI assistant error:", error);
    return NextResponse.json(
      { response: "Sorry, I encountered an error. Please try again." },
      { status: 200 }
    );
  }
}
