import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { DocumentType } from "@/lib/types";

// Template file mapping
const TEMPLATE_FILES: Record<DocumentType, string> = {
  resale_certificate: "resale-certificate.typ",
  payoff_statement: "payoff-statement.typ",
  governing_documents: "governing-docs-cover.typ",
  lender_questionnaire: "lender-questionnaire.typ",
};

/**
 * Load a Typst template from the templates directory.
 */
function loadTemplate(docType: DocumentType): string {
  const templatePath = join(
    process.cwd(),
    "src",
    "lib",
    "documents",
    "templates",
    TEMPLATE_FILES[docType]
  );
  return readFileSync(templatePath, "utf-8");
}

/**
 * Interpolate template variables into a Typst template.
 * Replaces all #{variable_name} occurrences with data values.
 * Missing values are replaced with "N/A".
 */
function interpolateTemplate(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/#\{(\w+)\}/g, (_match: string, key: string) => {
    return data[key] ?? "N/A";
  });
}

/**
 * Generate a PDF buffer from a document type and its data.
 *
 * Uses @myriaddreamin/typst-ts-node-compiler for compilation.
 * Writes a temp file (compiler requires real files on disk), compiles to PDF,
 * then cleans up.
 */
export async function generatePdf(
  docType: DocumentType,
  data: Record<string, string>
): Promise<Buffer> {
  const { NodeCompiler } = await import(
    "@myriaddreamin/typst-ts-node-compiler"
  );

  const template = loadTemplate(docType);
  const typstSource = interpolateTemplate(template, data);

  // Write to a temp file — the compiler reads from disk
  const tempDir = mkdtempSync(join(tmpdir(), "propertydocz-"));
  const tempFile = join(tempDir, "document.typ");

  try {
    writeFileSync(tempFile, typstSource, "utf-8");

    const compiler = NodeCompiler.create();
    const pdfBuffer = compiler.pdf({ mainFilePath: tempFile });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error(`Typst compilation produced empty output for ${docType}`);
    }

    return Buffer.from(pdfBuffer);
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Upload a generated PDF to Supabase Storage.
 * Returns the storage path.
 */
export async function uploadPdfToStorage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  tenantId: string,
  requestId: string,
  docType: DocumentType,
  pdfBuffer: Buffer
): Promise<string> {
  const timestamp = Date.now();
  const storagePath = `${tenantId}/${requestId}/${docType}_${timestamp}.pdf`;

  const { error } = await supabaseClient.storage
    .from("documents")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

/**
 * Get the list of required fields for a document type.
 * Used to validate that all necessary data is present before generation.
 */
export function getRequiredFields(docType: DocumentType): string[] {
  switch (docType) {
    case "resale_certificate":
      return [
        "association_name",
        "association_address",
        "association_city",
        "association_state",
        "association_zip",
        "property_address",
        "unit_number",
        "owner_name",
        "preparation_date",
        "monthly_assessment",
        "current_balance_due",
        "total_due_at_closing",
      ];
    case "payoff_statement":
      return [
        "association_name",
        "association_address",
        "association_city",
        "association_state",
        "association_zip",
        "property_address",
        "unit_number",
        "owner_name",
        "preparation_date",
        "total_payoff_amount",
        "good_through_date",
      ];
    case "lender_questionnaire":
      return [
        "association_name",
        "property_address",
        "unit_number",
        "owner_name",
        "preparation_date",
        "total_units",
        "monthly_assessment",
        "annual_budget",
        "reserve_balance",
        "percent_funded",
      ];
    case "governing_documents":
      return [
        "association_name",
        "association_address",
        "association_city",
        "association_state",
        "association_zip",
        "property_address",
        "owner_name",
        "preparation_date",
      ];
    default:
      return [];
  }
}
