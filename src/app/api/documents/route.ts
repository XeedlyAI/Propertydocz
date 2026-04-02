import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generatePdf, uploadPdfToStorage } from "@/lib/documents/generate";
import { validateDocumentData } from "@/lib/documents/validate";
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
    const { data: docRequest } = await supabase
      .from("document_requests")
      .select(
        `*, associations(name, legal_name, address, city, state, zip,
          manager_name, manager_email, manager_phone,
          assessment_frequency, monthly_assessment_cents,
          master_policy_carrier, master_policy_expiration,
          general_liability, fidelity_bond, flood_zone, flood_insurance,
          reserve_balance_cents, percent_funded, reserve_study_date,
          annual_budget_cents, rental_policy, short_term_rental_policy,
          pet_policy, parking_policy, age_restrictions, right_of_first_refusal,
          total_units, year_built, project_type, ein)`
      )
      .eq("id", requestId)
      .eq("tenant_id", profile.tenant_id)
      .single();

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
        association?.monthly_assessment_cents
      ),
      annual_budget: formatCentsToDisplay(association?.annual_budget_cents),
      reserve_balance: formatCentsToDisplay(association?.reserve_balance_cents),
      // Association details
      percent_funded: association?.percent_funded
        ? `${association.percent_funded}%`
        : "N/A",
      reserve_study_date: association?.reserve_study_date || "N/A",
      master_policy_carrier: association?.master_policy_carrier || "N/A",
      master_policy_expiration: association?.master_policy_expiration || "N/A",
      general_liability: association?.general_liability || "N/A",
      fidelity_bond: association?.fidelity_bond || "N/A",
      flood_zone: association?.flood_zone || "N/A",
      flood_insurance: association?.flood_insurance || "N/A",
      rental_policy: association?.rental_policy || "N/A",
      short_term_rental_policy: association?.short_term_rental_policy || "N/A",
      pet_policy: association?.pet_policy || "N/A",
      parking_policy: association?.parking_policy || "N/A",
      age_restrictions: association?.age_restrictions || "None",
      right_of_first_refusal: association?.right_of_first_refusal || "No",
      total_units: association?.total_units?.toString() || "N/A",
      year_built: association?.year_built?.toString() || "N/A",
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

    // Service client for storage uploads
    const serviceClient = await createServiceClient();

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
        // Step 1: Validate with Claude
        const validation = await validateDocumentData(docType, baseData);

        if (!validation.valid) {
          errors.push(
            `${docType}: Validation failed — ${validation.notes}`
          );
          continue;
        }

        // Step 2: Generate PDF
        const pdfBuffer = await generatePdf(docType, baseData);

        // Step 3: Upload to storage
        const storagePath = await uploadPdfToStorage(
          serviceClient,
          profile.tenant_id,
          requestId,
          docType,
          pdfBuffer
        );

        // Step 4: Record in generated_documents table
        await serviceClient.from("generated_documents").insert({
          document_request_id: requestId,
          tenant_id: profile.tenant_id,
          document_type: docType,
          storage_path: storagePath,
          file_size_bytes: pdfBuffer.length,
          generation_method: "typst",
          generated_by: user.id,
          validation_notes: validation.notes,
          validation_warnings: validation.warnings,
        });

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
