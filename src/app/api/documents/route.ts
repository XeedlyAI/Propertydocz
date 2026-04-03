import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generatePdf, uploadPdfToStorage } from "@/lib/documents/generate";
import { validateDocumentData } from "@/lib/documents/validate";
import {
  getValidAccessToken,
  listFolder,
  downloadFile,
  detectDocCategory,
} from "@/lib/dropbox";
import type { DocumentType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const requestId = body.request_id as string;

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 }
      );
    }

    // Fetch the document request with association data
    const { data: docRequest, error: fetchError } = await supabase
      .from("document_requests")
      .select(
        `*, associations(name, legal_name, address, city, state, zip,
          manager_name, manager_email, manager_phone,
          assessment_frequency, monthly_assessment_amount,
          master_policy_carrier, master_policy_expiration,
          general_liability_coverage, general_liability_amount,
          fidelity_bond, fidelity_amount,
          flood_zone, flood_insurance_in_force, flood_coverage_amount,
          reserve_balance, percent_funded, reserve_study_date,
          annual_budget_amount, rental_policy, short_term_rental_policy,
          pet_policy, parking_policy, age_restrictions, right_of_first_refusal,
          total_units, year_built, project_type, hoa_ein,
          in_litigation, litigation_details,
          capital_contribution_fee, transfer_fee,
          current_special_assessment, current_sa_amount, current_sa_terms,
          payable_to, remit_address, wire_instructions,
          owner_occupied_pct, investor_owned_pct,
          phases_completed, phases_planned, developer_units_remaining)`
      )
      .eq("id", requestId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (fetchError) {
      console.error("Document request fetch error:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch request: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!docRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (docRequest.status !== "ready_for_generation") {
      return NextResponse.json(
        { error: "Request is not ready for generation" },
        { status: 400 }
      );
    }

    const association = Array.isArray(docRequest.associations)
      ? docRequest.associations[0]
      : docRequest.associations;

    const liveData = (docRequest.live_data as Record<string, string>) || {};
    const documentTypes = docRequest.document_types as DocumentType[];

    // Debug logging — helps diagnose data pipeline issues
    console.log(`[documents] Request ${requestId}: association=${association ? 'loaded' : 'NULL'}, liveData keys=${Object.keys(liveData).length}, docTypes=${documentTypes.join(',')}`);
    if (!association) {
      console.warn(`[documents] No association data for request ${requestId}. Check RLS policies and associations join.`);
    }

    // Merge association data + live data into a flat data object
    const baseData: Record<string, string> = {
      // Association fields
      association_name: association?.name || "",
      association_legal_name: association?.legal_name || association?.name || "",
      association_address: association?.address || "",
      association_city: association?.city || "",
      association_state: association?.state || "",
      association_zip: association?.zip || "",
      manager_name: association?.manager_name || "",
      manager_email: association?.manager_email || "",
      manager_phone: association?.manager_phone || "",
      assessment_frequency: association?.assessment_frequency || "monthly",
      // Property/request fields
      property_address: docRequest.property_address || "",
      owner_name: liveData.owner_name || "",
      unit_number: liveData.unit_number || "",
      requester_name: docRequest.requester_name || "",
      requester_type: docRequest.requester_type || "",
      // Preparation metadata
      preparation_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      prepared_by: profile.full_name || user.email || "",
      prepared_by_title: profile.role === "tenant_admin" ? "Community Manager" : "Staff",
      // Financial (convert cents to dollar strings)
      monthly_assessment: formatCentsToDisplay(
        association?.monthly_assessment_amount
      ),
      annual_budget: formatCentsToDisplay(association?.annual_budget_amount),
      reserve_balance: formatCentsToDisplay(association?.reserve_balance),
      transfer_fee: formatCentsToDisplay(association?.transfer_fee),
      capital_contribution: formatCentsToDisplay(association?.capital_contribution_fee),
      // Association details
      percent_funded: association?.percent_funded
        ? `${association.percent_funded}%`
        : "N/A",
      reserve_study_date: association?.reserve_study_date || "N/A",
      master_policy_carrier: association?.master_policy_carrier || "N/A",
      master_policy_expiration: association?.master_policy_expiration || "N/A",
      general_liability: association?.general_liability_coverage
        ? formatCentsToDisplay(association?.general_liability_amount)
        : "N/A",
      fidelity_bond: association?.fidelity_bond
        ? formatCentsToDisplay(association?.fidelity_amount)
        : "N/A",
      flood_zone: association?.flood_zone || "N/A",
      flood_insurance: association?.flood_insurance_in_force
        ? formatCentsToDisplay(association?.flood_coverage_amount)
        : "N/A",
      rental_policy: association?.rental_policy || "N/A",
      short_term_rental_policy: association?.short_term_rental_policy || "N/A",
      pet_policy: association?.pet_policy || "N/A",
      parking_policy: association?.parking_policy || "N/A",
      age_restrictions: association?.age_restrictions || "None",
      right_of_first_refusal: association?.right_of_first_refusal || "No",
      total_units: association?.total_units?.toString() || "N/A",
      year_built: association?.year_built?.toString() || "N/A",
      association_ein: association?.hoa_ein || "N/A",
      in_litigation: association?.in_litigation ? "Yes" : "No",
      litigation_details: association?.litigation_details || "None",
      // Ownership breakdown
      percent_owner_occupied: association?.owner_occupied_pct
        ? `${association.owner_occupied_pct}%`
        : "N/A",
      investor_owned_units: association?.investor_owned_pct
        ? `${Math.round((association.investor_owned_pct / 100) * (association.total_units || 0))}`
        : "N/A",
      // Special assessments
      special_assessments_planned: association?.current_special_assessment ? "Yes" : "No",
      special_assessment_details: association?.current_sa_terms || "None",
      // Payment info
      check_payable_to: association?.payable_to || "N/A",
      payment_mail_address_line1: association?.remit_address || "N/A",
      // Spread live data last so it overrides defaults
      ...liveData,
    };

    // Calculate valid_through (30 days from now) for resale cert
    const validThrough = new Date();
    validThrough.setDate(validThrough.getDate() + 30);
    baseData.valid_through = validThrough.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Auto-calculate payoff total from line items (never trust pre-computed totals)
    if (documentTypes.includes("payoff_statement")) {
      const payoffLineItemKeys = [
        "regular_assessments_due",
        "past_due_assessments",
        "late_fees",
        "interest",
        "special_assessments_due",
        "collection_legal_fees",
        "return_check_fees",
        "lien_recording_fees",
        "other_charges",
      ];
      const total = payoffLineItemKeys.reduce((sum, key) => {
        const raw = baseData[key] || "$0.00";
        // Parse "$1,234.56" → 1234.56
        const parsed = parseFloat(raw.replace(/[$,]/g, ""));
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0);
      baseData.total_payoff_amount = `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Auto-calculate resale cert total from line items
    if (documentTypes.includes("resale_certificate")) {
      const resaleLineItemKeys = [
        "current_balance_due",
        "special_assessments_due",
        "other_fees",
        "prorated_assessment",
      ];
      // Include transfer_fee and capital_contribution (from association data)
      const transferFee = parseFloat((baseData.transfer_fee || "$0.00").replace(/[$,]/g, ""));
      const capitalContribution = parseFloat((baseData.capital_contribution || "$0.00").replace(/[$,]/g, ""));
      const total = resaleLineItemKeys.reduce((sum, key) => {
        const raw = baseData[key] || "$0.00";
        const parsed = parseFloat(raw.replace(/[$,]/g, ""));
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, (isNaN(transferFee) ? 0 : transferFee) + (isNaN(capitalContribution) ? 0 : capitalContribution));
      baseData.total_due_at_closing = `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Service client for storage uploads
    const serviceClient = await createServiceClient();

    // If governing_documents is requested, auto-sync from Dropbox first
    if (documentTypes.includes("governing_documents") && association) {
      try {
        await syncDropboxDocs(serviceClient, profile.tenant_id, docRequest.association_id);
      } catch (err) {
        console.warn("Dropbox sync before generation skipped:", err);
        // Non-fatal — continue with whatever docs we have
      }
    }

    const generatedDocs: {
      docType: DocumentType;
      storagePath: string;
      validationNotes: string;
      warnings: string[];
    }[] = [];
    const errors: string[] = [];

    // Generate each requested document type
    for (const docType of documentTypes) {
      try {
        // Step 1: Validate — only missing required fields block generation.
        // AI validation concerns are advisory (always valid=true from Claude).
        const validation = await validateDocumentData(docType, baseData);

        if (!validation.valid) {
          // Only triggers when required fields are missing
          errors.push(
            `${docType}: Missing required fields — ${validation.missingFields.join(", ")}`
          );
          continue;
        }

        // Step 2: Generate PDF
        const pdfBuffer = await generatePdf(docType, baseData);

        // Step 3: Upload to storage
        let storagePath: string;
        try {
          storagePath = await uploadPdfToStorage(
            serviceClient,
            profile.tenant_id,
            requestId,
            docType,
            pdfBuffer
          );
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : "Unknown upload error";
          console.error(`Storage upload failed for ${docType}:`, uploadErr);
          errors.push(`${docType}: Storage upload failed — ${msg}`);
          continue;
        }

        // Step 4: Record in generated_documents table
        const fileName = `${docType}_${Date.now()}.pdf`;
        const { data: { publicUrl } } = serviceClient.storage
          .from("documents")
          .getPublicUrl(storagePath);

        const { error: insertError } = await serviceClient.from("generated_documents").insert({
          document_request_id: requestId,
          document_type: docType,
          file_url: publicUrl,
          file_name: fileName,
          file_type: "pdf",
          generation_method: "typst",
        });

        if (insertError) {
          console.error(`DB insert failed for ${docType}:`, insertError);
          errors.push(`${docType}: Database insert failed — ${insertError.message}`);
          continue;
        }

        generatedDocs.push({
          docType,
          storagePath,
          validationNotes: validation.notes,
          warnings: validation.warnings,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown generation error";
        console.error(`Generation error for ${docType}:`, err);
        errors.push(`${docType}: ${message}`);
      }
    }

    // If at least one doc was generated, advance status to pending_review
    if (generatedDocs.length > 0) {
      await supabase
        .from("document_requests")
        .update({ status: "pending_review" })
        .eq("id", requestId);
    }

    return NextResponse.json({
      success: generatedDocs.length > 0,
      generated: generatedDocs.map((d) => ({
        document_type: d.docType,
        storage_path: d.storagePath,
        validation_notes: d.validationNotes,
        warnings: d.warnings,
      })),
      errors,
    });
  } catch (error) {
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatCentsToDisplay(cents: number | null | undefined): string {
  if (cents == null) return "N/A";
  return `$${(cents / 100).toFixed(2)}`;
}

const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"];

/**
 * Auto-sync governing documents from Dropbox before generation.
 * Downloads new/updated files from the association's mapped Dropbox folder.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncDropboxDocs(serviceClient: any, tenantId: string, associationId: string) {
  // Get association's Dropbox folder path
  const { data: assoc } = await serviceClient
    .from("associations")
    .select("dropbox_folder_path")
    .eq("id", associationId)
    .single();

  if (!assoc?.dropbox_folder_path) return;

  // Get tenant's Dropbox tokens
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("dropbox_access_token, dropbox_refresh_token")
    .eq("id", tenantId)
    .single();

  if (!tenant?.dropbox_access_token || !tenant?.dropbox_refresh_token) return;

  const accessToken = await getValidAccessToken(
    serviceClient,
    tenantId,
    tenant.dropbox_access_token,
    tenant.dropbox_refresh_token
  );

  const entries = await listFolder(accessToken, assoc.dropbox_folder_path);
  const files = entries.filter(
    (e) =>
      e[".tag"] === "file" &&
      SUPPORTED_EXTENSIONS.some((ext) => e.name.toLowerCase().endsWith(ext))
  );

  // Get existing docs
  const { data: existingDocs } = await serviceClient
    .from("governing_documents")
    .select("id, dropbox_path")
    .eq("association_id", associationId);

  const existingPaths = new Set((existingDocs || []).map((d: { dropbox_path: string }) => d.dropbox_path));

  for (const file of files) {
    if (existingPaths.has(file.path_lower)) continue; // Already synced

    const { buffer, name } = await downloadFile(accessToken, file.path_lower);
    const storagePath = `governing-docs/${tenantId}/${associationId}/${name}`;

    await serviceClient.storage.from("documents").upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    const { data: { publicUrl } } = serviceClient.storage
      .from("documents")
      .getPublicUrl(storagePath);

    await serviceClient.from("governing_documents").insert({
      association_id: associationId,
      tenant_id: tenantId,
      document_name: name.replace(/\.[^/.]+$/, ""),
      document_category: detectDocCategory(name),
      file_url: publicUrl,
      file_name: name,
      source: "dropbox",
      dropbox_path: file.path_lower,
      last_synced_at: new Date().toISOString(),
    });
  }
}
