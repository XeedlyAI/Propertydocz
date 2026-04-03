import { createServiceClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getAllFields } from "@/lib/services/field-registry";
import { getAssociationFieldValues } from "@/lib/services/association-data";
import { FIELD_SECTIONS } from "@/lib/types/fields";
import { OnboardingReviewClient } from "@/components/admin/onboarding-review";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function OnboardingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUser();

  // Verify association belongs to user's tenant
  const supabase = await createServiceClient();
  const { data: association, error } = await supabase
    .from("associations")
    .select("id, name, onboarding_status, tenant_id")
    .eq("id", id)
    .eq("tenant_id", user.tenantId)
    .single();

  if (error || !association) {
    notFound();
  }

  // Get all field definitions and current values
  const [allFields, fieldValues] = await Promise.all([
    getAllFields(),
    getAssociationFieldValues(id),
  ]);

  // Only include static and periodic fields (not transaction-specific)
  const extractableFields = allFields.filter(
    (f) => f.tier === "static" || f.tier === "periodic"
  );

  // Build value map
  const valueMap = new Map(fieldValues.map((v) => [v.field_key, v]));

  // Group fields by section
  const sections = new Map<
    string,
    Array<{
      field_key: string;
      label: string;
      tier: string;
      value_type: string;
      help_text: string | null;
      value: string | null;
      confidence: string | null;
      source: string | null;
      source_document: string | null;
      previous_value: string | null;
      last_verified_at: string | null;
    }>
  >();

  for (const field of extractableFields) {
    const val = valueMap.get(field.field_key);
    const sectionKey = field.section;

    if (!sections.has(sectionKey)) {
      sections.set(sectionKey, []);
    }

    sections.get(sectionKey)!.push({
      field_key: field.field_key,
      label: field.label,
      tier: field.tier,
      value_type: field.value_type,
      help_text: field.help_text,
      value: val?.value ?? null,
      confidence: val?.confidence ?? null,
      source: val?.source ?? null,
      source_document: val?.source_document ?? null,
      previous_value: val?.previous_value ?? null,
      last_verified_at: val?.last_verified_at ?? null,
    });
  }

  // Convert to serializable array sorted by section order
  const sortedSections = Array.from(sections.entries())
    .map(([key, fields]) => ({
      key,
      label: FIELD_SECTIONS[key]?.label || key,
      order: FIELD_SECTIONS[key]?.order || 99,
      fields,
    }))
    .sort((a, b) => a.order - b.order);

  // Calculate summary stats
  const totalFields = extractableFields.length;
  const populatedFields = extractableFields.filter(
    (f) => valueMap.has(f.field_key) && valueMap.get(f.field_key)?.value
  ).length;
  const verifiedFields = extractableFields.filter(
    (f) => valueMap.get(f.field_key)?.confidence === "verified"
  ).length;
  const aiExtractedFields = extractableFields.filter(
    (f) => valueMap.get(f.field_key)?.confidence === "ai_extracted"
  ).length;
  const missingFields = totalFields - populatedFields;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/associations/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {association.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Onboarding Review — {association.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and confirm AI-extracted data from governing documents
        </p>
      </div>

      <OnboardingReviewClient
        associationId={id}
        associationName={association.name}
        onboardingStatus={association.onboarding_status}
        sections={sortedSections}
        summary={{
          total: totalFields,
          populated: populatedFields,
          verified: verifiedFields,
          aiExtracted: aiExtractedFields,
          missing: missingFields,
        }}
      />
    </div>
  );
}
