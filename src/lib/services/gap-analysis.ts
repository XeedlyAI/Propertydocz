/**
 * PropertyDocz — AI Gap Analysis
 *
 * Uses Claude to assess the completeness and accuracy of a document
 * request's data. Identifies missing fields, stale data, suspicious
 * values, and compliance concerns. Determines whether the request is
 * ready for review or needs more data.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  FieldDefinition,
  AssociationFieldValue,
  GapAnalysisResult,
} from "@/lib/types/fields";

/**
 * Run AI gap analysis on a document request.
 *
 * 1. Builds a prompt with field definitions, current values, and staleness info
 * 2. Asks Claude to assess completeness and compliance
 * 3. Saves the result to the request record
 * 4. Returns the gap analysis result
 */
export async function analyzeRequestGaps(
  requestId: string,
  documentType: string,
  liveData: Record<string, string>,
  fieldDefinitions: FieldDefinition[],
  fieldValues: AssociationFieldValue[]
): Promise<GapAnalysisResult> {
  // Build value lookup for staleness info
  const valueMap = new Map<string, AssociationFieldValue>();
  for (const v of fieldValues) {
    valueMap.set(v.field_key, v);
  }

  // Build the prompt
  const prompt = buildGapAnalysisPrompt(
    documentType,
    liveData,
    fieldDefinitions,
    valueMap
  );

  // Call Claude
  const result = await callClaudeForGapAnalysis(prompt, documentType, fieldDefinitions, liveData);

  // Save to the request record
  const supabase = await createServiceClient();
  await supabase
    .from("document_requests")
    .update({
      gap_analysis: result,
      completeness_score: result.completeness_score,
      missing_fields: result.missing_fields,
    })
    .eq("id", requestId);

  return result;
}

/**
 * Build the gap analysis prompt for Claude.
 */
function buildGapAnalysisPrompt(
  documentType: string,
  liveData: Record<string, string>,
  fieldDefinitions: FieldDefinition[],
  valueMap: Map<string, AssociationFieldValue>
): string {
  const now = Date.now();

  // Build field list with current values and staleness
  const fieldLines: string[] = [];
  const staleLines: string[] = [];

  for (const def of fieldDefinitions) {
    const value = liveData[def.field_key] || "";
    const required = def.validation_rules?.required ? " (REQUIRED)" : "";
    const tier = def.tier.toUpperCase();

    fieldLines.push(
      `  - ${def.field_key} [${tier}${required}]: "${value || "(empty)"}" — ${def.label}`
    );

    // Check staleness for periodic fields
    if (def.tier === "periodic" && def.staleness_days) {
      const assocValue = valueMap.get(def.field_key);
      if (assocValue?.last_verified_at) {
        const verifiedAt = new Date(assocValue.last_verified_at).getTime();
        const daysSince = Math.floor((now - verifiedAt) / (24 * 60 * 60 * 1000));
        if (daysSince > def.staleness_days) {
          staleLines.push(
            `  - ${def.field_key}: last verified ${daysSince} days ago (threshold: ${def.staleness_days} days)`
          );
        }
      } else if (value) {
        staleLines.push(
          `  - ${def.field_key}: never verified (threshold: ${def.staleness_days} days)`
        );
      }
    }
  }

  const docLabel = documentType.replace(/_/g, " ");

  let prompt = `You are a document compliance analyst reviewing a ${docLabel} request for a Utah HOA.

Required fields for this document type:
${fieldLines.join("\n")}
`;

  if (staleLines.length > 0) {
    prompt += `
Staleness concerns:
${staleLines.join("\n")}
`;
  }

  prompt += `
Assess the completeness and accuracy of this data:

1. Which required fields are missing entirely (empty)?
2. Which periodic fields are past their staleness threshold?
3. Which values seem suspicious or inconsistent? (e.g., reserve balance of $0 for a large complex, delinquency count exceeding unit count, expired insurance, unusually low/high assessment)
4. Any Utah HB 217 compliance concerns? Key rules:
   - Late fees: capped at greater of $50 or 10% of past-due assessment
   - Interest: max 10% per annum (was 1.5%/month, changed by HB 217)
   - Payoff statement fee: capped per §57-8a-106
   - Resale certificate must include all items per §57-8a-227
5. Overall completeness score (0-100)
6. Recommended status: "ready_for_review" (admin just verifies and generates) or "awaiting_data" (admin must fill gaps)

Return ONLY valid JSON:
{
  "missing_fields": ["field_key1", "field_key2"],
  "stale_fields": ["field_key3"],
  "suspicious_fields": [
    {"field_key": "example", "current_value": "...", "concern": "explanation"}
  ],
  "compliance_flags": ["description of compliance concern"],
  "completeness_score": 85,
  "recommended_status": "awaiting_data",
  "summary": "Brief human-readable assessment"
}`;

  return prompt;
}

/**
 * Call Claude API for gap analysis. Falls back to rule-based analysis
 * if the API is unavailable.
 */
async function callClaudeForGapAnalysis(
  prompt: string,
  documentType: string,
  fieldDefinitions: FieldDefinition[],
  liveData: Record<string, string>
): Promise<GapAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback: rule-based analysis without Claude
    return ruleBasedAnalysis(fieldDefinitions, liveData);
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return ruleBasedAnalysis(fieldDefinitions, liveData);
    }

    // Parse JSON response
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as GapAnalysisResult;

    // Validate and sanitize the response
    return {
      missing_fields: Array.isArray(parsed.missing_fields)
        ? parsed.missing_fields
        : [],
      stale_fields: Array.isArray(parsed.stale_fields)
        ? parsed.stale_fields
        : [],
      suspicious_fields: Array.isArray(parsed.suspicious_fields)
        ? parsed.suspicious_fields
        : [],
      compliance_flags: Array.isArray(parsed.compliance_flags)
        ? parsed.compliance_flags
        : [],
      completeness_score:
        typeof parsed.completeness_score === "number"
          ? Math.min(100, Math.max(0, parsed.completeness_score))
          : 0,
      recommended_status:
        parsed.recommended_status === "ready_for_review"
          ? "ready_for_review"
          : "awaiting_data",
      summary: parsed.summary || "Analysis complete",
    };
  } catch (error) {
    console.error("Claude gap analysis failed:", error);
    return ruleBasedAnalysis(fieldDefinitions, liveData);
  }
}

/**
 * Rule-based gap analysis fallback when Claude is unavailable.
 * Checks required fields, calculates basic completeness.
 */
function ruleBasedAnalysis(
  fieldDefinitions: FieldDefinition[],
  liveData: Record<string, string>
): GapAnalysisResult {
  const missing: string[] = [];
  let filled = 0;

  for (const def of fieldDefinitions) {
    const value = liveData[def.field_key];
    if (value && value.trim()) {
      filled++;
    } else if (def.validation_rules?.required) {
      missing.push(def.field_key);
    } else if (def.tier !== "transaction") {
      // Non-required, non-transaction fields count as missing if empty
      missing.push(def.field_key);
    }
  }

  const score = fieldDefinitions.length > 0
    ? Math.round((filled / fieldDefinitions.length) * 100)
    : 0;

  const hasRequiredMissing = fieldDefinitions.some(
    (f) =>
      f.validation_rules?.required &&
      (!liveData[f.field_key] || !liveData[f.field_key].trim())
  );

  return {
    missing_fields: missing,
    stale_fields: [],
    suspicious_fields: [],
    compliance_flags: [],
    completeness_score: score,
    recommended_status: hasRequiredMissing || score < 70 ? "awaiting_data" : "ready_for_review",
    summary: `${filled} of ${fieldDefinitions.length} fields populated. ${missing.length} fields missing. (Rule-based analysis — Claude unavailable)`,
  };
}
