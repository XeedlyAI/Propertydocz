/**
 * PropertyDocz — AI Document Extraction Engine
 *
 * Extracts structured field values from HOA documents using Claude API.
 * Each document category gets a tailored extraction prompt with the
 * relevant field_definitions and extraction_hints.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { DocumentCategory } from "./document-categorizer";

/** Extraction result for a single document */
export interface ExtractionResult {
  extracted: Record<string, string>;
  changes: Array<{
    field_key: string;
    new_value: string;
    previous_value: string;
    source_reference?: string;
  }>;
  confidence_notes: Record<string, string>;
}

/**
 * Mapping of document categories to the field_keys that can be extracted
 * from that category. These match the field_definitions seeded in the DB.
 */
const CATEGORY_FIELD_MAP: Record<string, string[]> = {
  ccrs: [
    "association_name",
    "association_legal_name",
    "total_units",
    "rental_policy",
    "short_term_rental_policy",
    "rental_cap",
    "pet_policy",
    "parking_policy",
    "age_restrictions",
    "right_of_first_refusal",
    "commercial_space",
    "transfer_fee",
    "capital_contribution",
    "common_amenities",
  ],
  ccr_amendments: [
    "rental_policy",
    "short_term_rental_policy",
    "rental_cap",
    "pet_policy",
    "parking_policy",
    "age_restrictions",
    "right_of_first_refusal",
    "commercial_space",
    "transfer_fee",
    "capital_contribution",
  ],
  bylaws: [
    "association_name",
    "association_legal_name",
  ],
  bylaw_amendments: [],
  articles: [
    "association_name",
    "association_legal_name",
    "association_ein",
  ],
  rules: [
    "rental_policy",
    "short_term_rental_policy",
    "pet_policy",
    "parking_policy",
    "age_restrictions",
  ],
  architectural: [
    "pet_policy",
    "parking_policy",
  ],
  budget: [
    "monthly_assessment",
    "assessment_frequency",
    "annual_budget",
    "reserve_balance",
    "annual_reserve_contribution",
    "special_assessments_planned",
    "special_assessment_details",
  ],
  financial_statement: [
    "reserve_balance",
    "annual_budget",
    "annual_reserve_contribution",
    "delinquent_units",
    "percent_delinquent",
  ],
  reserve_study: [
    "reserve_study_date",
    "reserve_study_completed",
    "reserve_study_current",
    "reserve_balance",
    "percent_funded",
    "annual_reserve_contribution",
  ],
  insurance: [
    "master_policy_carrier",
    "master_policy_expiration",
    "general_liability",
    "general_liability_expiration",
    "fidelity_bond",
    "fidelity_bond_expiration",
    "flood_zone",
    "flood_insurance",
    "flood_insurance_expiration",
    "workers_comp",
    "workers_comp_expiration",
    "umbrella_coverage",
    "umbrella_expiration",
  ],
  meeting_minutes: [
    "in_litigation",
    "litigation_details",
    "special_assessments_planned",
    "special_assessment_details",
  ],
  plat_map: [],
};

/**
 * Human-readable field labels for prompts. Subset of the most
 * commonly extracted fields — Claude uses these plus the field_key
 * to understand what to extract.
 */
const FIELD_LABELS: Record<string, string> = {
  association_name: "Association Name",
  association_legal_name: "Legal / Incorporated Name",
  total_units: "Total Number of Units",
  rental_policy: "Rental/Leasing Restrictions",
  short_term_rental_policy: "Short-Term Rental Policy (Airbnb, VRBO, etc.)",
  rental_cap: "Rental Cap (max % or # of units allowed to be rented)",
  pet_policy: "Pet Restrictions & Policies",
  parking_policy: "Parking Policy & Restrictions",
  age_restrictions: "Age Restrictions (e.g., 55+ community)",
  right_of_first_refusal: "Right of First Refusal on Sales",
  commercial_space: "Commercial Space Description & Percentage",
  transfer_fee: "Transfer Fee Amount at Sale",
  capital_contribution: "Capital Contribution / Working Capital Fee at Sale",
  common_amenities: "Common Amenities (pool, clubhouse, gym, etc.)",
  association_ein: "Federal Tax ID (EIN)",
  monthly_assessment: "Monthly Assessment Amount (dollar amount)",
  assessment_frequency: "Assessment Frequency (monthly, quarterly, annually)",
  annual_budget: "Annual Operating Budget Total",
  reserve_balance: "Current Reserve Fund Balance",
  percent_funded: "Reserve Percent Funded",
  annual_reserve_contribution: "Annual Reserve Contribution Amount",
  special_assessments_planned: "Special Assessments Planned or In Effect? (Yes/No + details)",
  special_assessment_details: "Special Assessment Details (amount, purpose, duration)",
  reserve_study_date: "Date of Most Recent Reserve Study",
  reserve_study_completed: "Has a Reserve Study Been Completed? (Yes/No)",
  reserve_study_current: "Is the Reserve Study Current (within 3 years)? (Yes/No)",
  master_policy_carrier: "Master Insurance Policy Carrier Name",
  master_policy_expiration: "Master Policy Expiration Date",
  general_liability: "General Liability Coverage Amount",
  general_liability_expiration: "General Liability Expiration Date",
  fidelity_bond: "Fidelity Bond / Crime Coverage Amount",
  fidelity_bond_expiration: "Fidelity Bond Expiration Date",
  flood_zone: "FEMA Flood Zone Designation",
  flood_insurance: "Flood Insurance Coverage Amount or Status",
  flood_insurance_expiration: "Flood Insurance Expiration Date",
  workers_comp: "Workers' Compensation Coverage",
  workers_comp_expiration: "Workers' Comp Expiration Date",
  umbrella_coverage: "Umbrella / Excess Liability Coverage Amount",
  umbrella_expiration: "Umbrella Coverage Expiration Date",
  in_litigation: "Pending Litigation? (Yes/No)",
  litigation_details: "Litigation Details (description, case number)",
  delinquent_units: "Number of Delinquent Units (60+ days)",
  percent_delinquent: "Delinquency Percentage (60+ days)",
};

/**
 * Build the extraction prompt for a specific document category.
 */
function buildExtractionPrompt(
  content: string,
  category: string,
  associationName: string,
  fieldKeys: string[],
  existingValues?: Record<string, string>
): string {
  const fieldList = fieldKeys
    .map((key) => {
      const label = FIELD_LABELS[key] || key;
      const existing = existingValues?.[key];
      return `  - "${key}": ${label}${existing ? ` (current value: "${existing}")` : ""}`;
    })
    .join("\n");

  const categoryLabel = getCategoryLabel(category);

  let prompt = `You are extracting structured data from an HOA (Homeowners Association) ${categoryLabel} document for "${associationName}".

Extract the following fields from the document content. For each field you can confidently extract, include it in the JSON output. If you cannot find a value with reasonable confidence, OMIT that field entirely — do not guess.

Fields to extract:
${fieldList}

Rules:
- For currency amounts, return just the number (e.g., "250.00" not "$250.00")
- For dates, use ISO format YYYY-MM-DD when possible, or the exact date string from the document
- For Yes/No fields, return "Yes" or "No" followed by brief details if applicable
- For text fields, extract the complete relevant text, keeping it concise
- If a value has changed from the current value shown above, note this in the confidence_notes`;

  if (existingValues && Object.keys(existingValues).length > 0) {
    prompt += `\n- Compare extracted values against current values. If you find a different value, include it — the document may be more recent.`;
  }

  prompt += `

Document content:
---
${content.slice(0, 80000)}
---

Respond with ONLY valid JSON in this exact format:
{
  "extracted": {
    "field_key": "extracted value",
    ...
  },
  "confidence_notes": {
    "field_key": "note about extraction confidence or source location",
    ...
  }
}`;

  return prompt;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ccrs: "CC&Rs / Declaration of Covenants",
    ccr_amendments: "CC&R Amendment",
    bylaws: "Bylaws",
    bylaw_amendments: "Bylaw Amendment",
    articles: "Articles of Incorporation",
    rules: "Rules & Regulations",
    architectural: "Architectural Guidelines",
    budget: "Budget",
    financial_statement: "Financial Statement",
    reserve_study: "Reserve Study",
    insurance: "Insurance Certificate",
    meeting_minutes: "Meeting Minutes",
    plat_map: "Plat / Survey Map",
  };
  return labels[category] || category;
}

/**
 * Extract field values from a document using Claude API.
 *
 * @param content - Text content of the document
 * @param category - Document category from categorization step
 * @param associationName - Association name for context
 * @param existingValues - Current field values for change detection
 * @returns Extraction result with extracted values, changes, and confidence notes
 */
export async function extractFromDocument(
  content: string,
  category: string,
  associationName: string,
  existingValues?: Record<string, string>
): Promise<ExtractionResult> {
  const fieldKeys = CATEGORY_FIELD_MAP[category];

  // If no fields to extract for this category, return empty
  if (!fieldKeys || fieldKeys.length === 0) {
    return { extracted: {}, changes: [], confidence_notes: {} };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set — skipping extraction");
    return { extracted: {}, changes: [], confidence_notes: {} };
  }

  // Don't try to extract from empty content
  if (!content || content.trim().length < 50) {
    return {
      extracted: {},
      changes: [],
      confidence_notes: { _general: "Document content too short for extraction" },
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = buildExtractionPrompt(
    content,
    category,
    associationName,
    fieldKeys,
    existingValues
  );

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        extracted: {},
        changes: [],
        confidence_notes: { _error: "No text response from Claude" },
      };
    }

    // Parse JSON response — handle markdown code blocks
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as {
      extracted?: Record<string, string>;
      confidence_notes?: Record<string, string>;
    };

    const extracted = parsed.extracted || {};
    const confidenceNotes = parsed.confidence_notes || {};

    // Filter to only valid field keys
    const validKeys = new Set(fieldKeys);
    const cleanExtracted: Record<string, string> = {};
    for (const [key, value] of Object.entries(extracted)) {
      if (validKeys.has(key) && value !== null && value !== undefined && String(value).trim() !== "") {
        cleanExtracted[key] = String(value).trim();
      }
    }

    // Detect changes from existing values
    const changes: ExtractionResult["changes"] = [];
    if (existingValues) {
      for (const [key, newValue] of Object.entries(cleanExtracted)) {
        const previous = existingValues[key];
        if (previous && previous !== newValue) {
          changes.push({
            field_key: key,
            new_value: newValue,
            previous_value: previous,
            source_reference: confidenceNotes[key],
          });
        }
      }
    }

    return {
      extracted: cleanExtracted,
      changes,
      confidence_notes: confidenceNotes,
    };
  } catch (error) {
    console.error(`Extraction failed for ${category} document:`, error);

    // Try to parse partial JSON if it was a JSON parse error
    if (error instanceof SyntaxError) {
      return {
        extracted: {},
        changes: [],
        confidence_notes: { _error: "Failed to parse Claude response as JSON" },
      };
    }

    return {
      extracted: {},
      changes: [],
      confidence_notes: {
        _error: error instanceof Error ? error.message : "Unknown extraction error",
      },
    };
  }
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 * Returns null if the PDF is image-only (scanned) or unreadable.
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<string | null> {
  try {
    // Dynamic import — pdf-parse v1 exports a single function
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const result = await pdfParse(buffer);

    // If the extracted text is very short relative to page count,
    // it's likely a scanned/image-only PDF
    const textPerPage = result.text.length / Math.max(result.numpages, 1);
    if (textPerPage < 50) {
      return null; // Likely image-only — needs OCR
    }

    return result.text;
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    return null;
  }
}

/**
 * Extract text from a plain text or RTF file buffer.
 */
export function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): string | null {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "txt") {
    return buffer.toString("utf-8");
  }

  if (ext === "rtf") {
    // Basic RTF text extraction — strip RTF control codes
    const raw = buffer.toString("utf-8");
    return raw
      .replace(/\{\\[^{}]*\}/g, "") // Remove control groups
      .replace(/\\[a-z]+\d*\s?/g, "") // Remove control words
      .replace(/[{}]/g, "") // Remove remaining braces
      .trim();
  }

  // .doc/.docx — return null (would need specialized parsing)
  return null;
}

/**
 * Get extractable text content from a file buffer.
 * Handles PDFs, text files, and RTF. Returns null for unsupported formats.
 */
export async function getDocumentText(
  buffer: Buffer,
  filename: string
): Promise<{ text: string | null; requiresOCR: boolean }> {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    const text = await extractTextFromPDF(buffer);
    if (text === null) {
      return { text: null, requiresOCR: true };
    }
    return { text, requiresOCR: false };
  }

  if (ext === "txt" || ext === "rtf") {
    const text = extractTextFromBuffer(buffer, filename);
    return { text, requiresOCR: false };
  }

  // .doc/.docx — not supported without additional libraries
  return { text: null, requiresOCR: false };
}
