import Anthropic from "@anthropic-ai/sdk";
import type { DocumentType } from "@/lib/types";
import { getRequiredFields } from "./generate";

export interface ValidationResult {
  valid: boolean;
  notes: string;
  missingFields: string[];
  warnings: string[];
}

/**
 * Check that all required fields are present and non-empty.
 * Returns missing field names.
 */
function checkRequiredFields(
  docType: DocumentType,
  data: Record<string, string>
): string[] {
  const required = getRequiredFields(docType);
  return required.filter(
    (field) => !data[field] || data[field].trim() === ""
  );
}

/**
 * Use Claude to validate document data for completeness,
 * accuracy, and Utah legal compliance.
 *
 * Falls back to basic field validation if the ANTHROPIC_API_KEY
 * is not configured (allows dev/testing without API access).
 */
export async function validateDocumentData(
  docType: DocumentType,
  data: Record<string, string>
): Promise<ValidationResult> {
  const missingFields = checkRequiredFields(docType, data);

  // If critical fields are missing, fail fast without calling Claude
  if (missingFields.length > 0) {
    return {
      valid: false,
      notes: `Missing required fields: ${missingFields.join(", ")}`,
      missingFields,
      warnings: [],
    };
  }

  // If no API key, do basic validation only
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      valid: true,
      notes: "Basic field validation passed (Claude validation skipped — no API key)",
      missingFields: [],
      warnings: ["Claude AI validation was skipped. Set ANTHROPIC_API_KEY for full compliance checks."],
    };
  }

  // Call Claude for deep validation
  try {
    const anthropic = new Anthropic({ apiKey });

    const docTypeLabel = docType.replace(/_/g, " ");
    const dataJson = JSON.stringify(data, null, 2);

    const prompt = `You are a Utah HOA document compliance validator. Review this ${docTypeLabel} data for:

1. **Completeness** — Are all fields filled with reasonable values?
2. **Utah Legal Compliance** — Check against:
   - §57-8a-227 (resale certificate requirements, 30-day validity)
   - §57-8a-106 (payoff statement $50 fee cap)
   - §57-8a-311 (payoff statement requirements)
   - HB 217 (late fee caps: greater of $50 or 10% of past-due; interest cap: 10% per annum)
3. **Data Quality** — Flag suspicious values (e.g., negative amounts, unreasonable dates, obvious placeholders)

Document type: ${docTypeLabel}
Data:
${dataJson}

Respond in JSON format only:
{
  "valid": true/false,
  "notes": "Brief summary of validation result",
  "warnings": ["array of specific concerns or compliance notes, empty if none"]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text content
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr) as {
      valid: boolean;
      notes: string;
      warnings: string[];
    };

    // AI validation is ALWAYS advisory — never a hard block.
    // Only missing required fields (checked above) can prevent generation.
    const allWarnings = result.warnings || [];
    if (!result.valid) {
      allWarnings.unshift(`AI flagged concerns: ${result.notes}`);
    }

    return {
      valid: true, // Always proceed — AI concerns are advisory only
      notes: result.notes,
      missingFields: [],
      warnings: allWarnings,
    };
  } catch (error) {
    console.error("Claude validation error:", error);
    // Fail open — if Claude is unavailable, allow generation with a warning
    return {
      valid: true,
      notes: "Claude validation unavailable. Basic field checks passed.",
      missingFields: [],
      warnings: ["AI compliance validation failed. Manual review recommended."],
    };
  }
}
