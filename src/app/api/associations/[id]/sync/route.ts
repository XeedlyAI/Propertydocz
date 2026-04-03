import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { syncAssociationDocuments } from "@/lib/services/dropbox-sync";

/**
 * POST /api/associations/[id]/sync
 *
 * Trigger a Dropbox document sync for an association.
 * Body: { force?: boolean }
 * Auth: tenant_admin or platform_admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: associationId } = await params;

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

    // Verify association belongs to user's tenant
    const serviceClient = await createServiceClient();
    const { data: association } = await serviceClient
      .from("associations")
      .select("id, tenant_id")
      .eq("id", associationId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!association) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    // Run sync
    const result = await syncAssociationDocuments(
      associationId,
      profile.tenant_id,
      { forceFullSync: force }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync trigger error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/associations/[id]/sync
 *
 * Get sync status and summary for an association.
 * Auth: tenant_admin or platform_admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: associationId } = await params;

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

    // Verify association belongs to tenant
    const serviceClient = await createServiceClient();
    const { data: association } = await serviceClient
      .from("associations")
      .select("id, tenant_id, dropbox_folder_path")
      .eq("id", associationId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!association) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    // Query document_sync_log for this association
    const { data: syncLogs } = await serviceClient
      .from("document_sync_log")
      .select(
        "id, file_name, category, last_synced_at, extraction_status, extracted_fields, deleted_at, file_modified_at"
      )
      .eq("association_id", associationId)
      .order("last_synced_at", { ascending: false });

    const logs = syncLogs || [];

    // Calculate summary
    const activeLogs = logs.filter((l) => !l.deleted_at);
    const lastSyncDate = logs.length > 0 ? logs[0].last_synced_at : null;
    const completedCount = activeLogs.filter(
      (l) => l.extraction_status === "completed"
    ).length;
    const failedCount = activeLogs.filter(
      (l) => l.extraction_status === "failed"
    ).length;
    const totalFieldsExtracted = activeLogs.reduce((sum, log) => {
      const fields = log.extracted_fields as Record<string, string> | null;
      return sum + (fields ? Object.keys(fields).length : 0);
    }, 0);

    return NextResponse.json({
      has_dropbox_folder: !!association.dropbox_folder_path,
      last_sync_date: lastSyncDate,
      document_count: activeLogs.length,
      completed_count: completedCount,
      failed_count: failedCount,
      fields_extracted: totalFieldsExtracted,
      documents: activeLogs.map((log) => ({
        id: log.id,
        file_name: log.file_name,
        category: log.category,
        last_synced_at: log.last_synced_at,
        extraction_status: log.extraction_status,
        fields_count: log.extracted_fields
          ? Object.keys(log.extracted_fields as Record<string, string>).length
          : 0,
        extracted_fields: log.extracted_fields,
      })),
    });
  } catch (error) {
    console.error("Sync status error:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}
