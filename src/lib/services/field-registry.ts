/**
 * PropertyDocz — Field Registry Service
 *
 * Reads from the field_definitions table to provide field metadata
 * for document generation, form rendering, and gap analysis.
 */

import { createServiceClient } from "@/lib/supabase/server";
import type { FieldDefinition, FieldTier } from "@/lib/types/fields";

/**
 * Get all field definitions for a given document type,
 * ordered by section and display_order.
 */
export async function getFieldsForDocumentType(
  docType: string
): Promise<FieldDefinition[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("field_definitions")
    .select("*")
    .contains("document_types", [docType])
    .order("section")
    .order("display_order");

  if (error) {
    console.error("Failed to fetch field definitions:", error);
    return [];
  }

  return (data ?? []) as FieldDefinition[];
}

/**
 * Get field definitions filtered by document type AND tier.
 */
export async function getFieldsByTier(
  docType: string,
  tier: FieldTier
): Promise<FieldDefinition[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("field_definitions")
    .select("*")
    .contains("document_types", [docType])
    .eq("tier", tier)
    .order("section")
    .order("display_order");

  if (error) {
    console.error("Failed to fetch field definitions by tier:", error);
    return [];
  }

  return (data ?? []) as FieldDefinition[];
}

/**
 * Get all field definitions across all document types,
 * ordered by section and display_order.
 */
export async function getAllFields(): Promise<FieldDefinition[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("field_definitions")
    .select("*")
    .order("section")
    .order("display_order");

  if (error) {
    console.error("Failed to fetch all field definitions:", error);
    return [];
  }

  return (data ?? []) as FieldDefinition[];
}

/**
 * Get a single field definition by key.
 */
export async function getFieldByKey(
  fieldKey: string
): Promise<FieldDefinition | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("field_definitions")
    .select("*")
    .eq("field_key", fieldKey)
    .single();

  if (error) {
    return null;
  }

  return data as FieldDefinition;
}
