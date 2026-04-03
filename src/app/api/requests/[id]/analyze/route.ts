import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { autoFillRequest } from "@/lib/services/auto-fill";
import { checkForNewDocuments } from "@/lib/services/dropbox-delta";
import { analyzeRequestGaps } from "@/lib/services/gap-analysis";
import { getFieldsForDocumentType } from "@/lib/services/field-registry";
import { getAssociationFieldValues } from "@/lib/services/association-data";

/**
 * POST /api/requests/[id]/analyze
 *
 * Re-runs auto-fill and gap analysis on an existing request.
 * Used when admin fills in missing fields and wants to re-check,
 * or when new documents have been added to Dropbox.
 *
 * Auth: tenant_admin or platform_admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["tenant_admin", "platform_admin"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the request
    const serviceClient = await createServiceClient();
    const { data: docRequest } = await serviceClient
      .from("document_requests")
      .select("id, association_id, tenant_id, document_types, live_data")
      .eq("id", requestId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!docRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const primaryDocType = (docRequest.document_types as string[])[0];

    // Step 1: Check Dropbox for new documents
    let deltaResult = null;
    try {
      deltaResult = await checkForNewDocuments(
        docRequest.association_id,
        docRequest.tenant_id
      );
    } catch (err) {
      console.error("Delta check failed during re-analysis:", err);
    }

    // Step 2: Re-run auto-fill (picks up any new Dropbox data + admin edits)
    let autoFillResult = null;
    try {
      autoFillResult = await autoFillRequest(
        requestId,
        docRequest.association_id,
        primaryDocType
      );
    } catch (err) {
      console.error("Auto-fill failed during re-analysis:", err);
    }

    // Step 3: Re-run gap analysis with current data
    let gapAnalysis = null;
    try {
      // Fetch refreshed live_data
      const { data: refreshed } = await serviceClient
        .from("document_requests")
        .select("live_data")
        .eq("id", requestId)
        .single();

      const liveData = (refreshed?.live_data as Record<string, string>) || {};
      const fieldDefs = await getFieldsForDocumentType(primaryDocType);
      const fieldValues = await getAssociationFieldValues(
        docRequest.association_id
      );

      gapAnalysis = await analyzeRequestGaps(
        requestId,
        primaryDocType,
        liveData,
        fieldDefs,
        fieldValues
      );
    } catch (err) {
      console.error("Gap analysis failed during re-analysis:", err);
    }

    return NextResponse.json({
      success: true,
      autoFillResult,
      deltaResult,
      gapAnalysis,
    });
  } catch (error) {
    console.error("Re-analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
