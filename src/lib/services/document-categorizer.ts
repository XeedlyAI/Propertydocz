/**
 * PropertyDocz — Document Categorizer
 *
 * Categorizes files from a Dropbox folder into document types
 * for the onboarding harvest pipeline. Uses filename pattern matching
 * first (cheap), then falls back to Claude API for ambiguous files.
 */

import Anthropic from "@anthropic-ai/sdk";

/** Document categories for the onboarding pipeline */
export type DocumentCategory =
  | "ccrs"
  | "ccr_amendments"
  | "bylaws"
  | "bylaw_amendments"
  | "articles"
  | "rules"
  | "architectural"
  | "budget"
  | "financial_statement"
  | "reserve_study"
  | "insurance"
  | "meeting_minutes"
  | "plat_map"
  | "other";

/** Category labels for display */
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  ccrs: "CC&Rs / Declaration",
  ccr_amendments: "CC&R Amendments",
  bylaws: "Bylaws",
  bylaw_amendments: "Bylaw Amendments",
  articles: "Articles of Incorporation",
  rules: "Rules & Regulations",
  architectural: "Architectural Guidelines",
  budget: "Budget",
  financial_statement: "Financial Statement",
  reserve_study: "Reserve Study",
  insurance: "Insurance Certificate",
  meeting_minutes: "Meeting Minutes",
  plat_map: "Plat / Survey Map",
  other: "Other",
};

/** Result of categorization for a single file */
export interface CategorizationResult {
  filename: string;
  category: DocumentCategory;
  method: "pattern" | "ai";
  confidence: "high" | "medium" | "low";
}

/**
 * Filename pattern rules. Order matters — first match wins.
 * Each rule has a test function and resulting category.
 */
const PATTERN_RULES: Array<{
  test: (lower: string) => boolean;
  category: DocumentCategory;
}> = [
  // CC&R amendments (must come before CCRs base match)
  {
    test: (f) =>
      (/cc&?r|ccr|covenant|declaration|restriction/i.test(f) &&
        /amend/i.test(f)) ||
      (/amend/i.test(f) && /\d/.test(f) && !/bylaw|by-law/i.test(f)),
    category: "ccr_amendments",
  },
  // CC&Rs / Declaration
  {
    test: (f) => /cc&?r|ccrs|covenant|declaration/i.test(f),
    category: "ccrs",
  },
  // Bylaw amendments (must come before bylaws base match)
  {
    test: (f) => /bylaw|by-law/i.test(f) && /amend/i.test(f),
    category: "bylaw_amendments",
  },
  // Bylaws
  {
    test: (f) => /bylaw|by-law/i.test(f),
    category: "bylaws",
  },
  // Articles of incorporation
  {
    test: (f) => /article|incorporat/i.test(f),
    category: "articles",
  },
  // Architectural guidelines
  {
    test: (f) => /architectural|design\s*guideline|design\s*standard/i.test(f),
    category: "architectural",
  },
  // Rules & regulations
  {
    test: (f) => /rule|regulation/i.test(f),
    category: "rules",
  },
  // Reserve study
  {
    test: (f) => /reserve\s*(study|analysis|report)/i.test(f),
    category: "reserve_study",
  },
  // Budget
  {
    test: (f) => /budget/i.test(f),
    category: "budget",
  },
  // Financial statement
  {
    test: (f) => /financial\s*(statement|report)|balance\s*sheet|income\s*statement|profit.?loss/i.test(f),
    category: "financial_statement",
  },
  // Insurance
  {
    test: (f) => /insurance|certificate\s*of\s*insurance|\bcoi\b|fidelity\s*bond/i.test(f),
    category: "insurance",
  },
  // Meeting minutes
  {
    test: (f) => /minute|meeting\s*minute|board\s*meeting|annual\s*meeting/i.test(f),
    category: "meeting_minutes",
  },
  // Plat / survey map
  {
    test: (f) => /plat|survey|site\s*map|property\s*map/i.test(f),
    category: "plat_map",
  },
];

/**
 * Categorize a single filename using pattern matching.
 * Returns the category if matched, or null if ambiguous.
 */
export function categorizeByPattern(filename: string): DocumentCategory | null {
  const lower = filename.toLowerCase();

  for (const rule of PATTERN_RULES) {
    if (rule.test(lower)) {
      return rule.category;
    }
  }

  return null;
}

/**
 * Categorize a batch of filenames using Claude API.
 * Only called for files that couldn't be matched by pattern.
 */
async function categorizeWithAI(
  filenames: string[]
): Promise<Map<string, DocumentCategory>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || filenames.length === 0) {
    return new Map(filenames.map((f) => [f, "other" as DocumentCategory]));
  }

  const anthropic = new Anthropic({ apiKey });

  const categoryList = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => `  "${key}" — ${label}`)
    .join("\n");

  const prompt = `You are categorizing HOA (Homeowners Association) governing documents based on their filenames.

Available categories:
${categoryList}

For each filename below, determine the most likely category. If you cannot determine the category with reasonable confidence, use "other".

Filenames:
${filenames.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Respond with ONLY valid JSON — a mapping of filename to category key. Example:
{
  "CC&Rs 2020.pdf": "ccrs",
  "Annual Budget 2025.pdf": "budget"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return new Map(filenames.map((f) => [f, "other" as DocumentCategory]));
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr) as Record<string, string>;
    const validCategories = new Set(Object.keys(CATEGORY_LABELS));
    const map = new Map<string, DocumentCategory>();

    for (const filename of filenames) {
      const cat = result[filename];
      if (cat && validCategories.has(cat)) {
        map.set(filename, cat as DocumentCategory);
      } else {
        map.set(filename, "other");
      }
    }

    return map;
  } catch (error) {
    console.error("AI categorization failed:", error);
    return new Map(filenames.map((f) => [f, "other" as DocumentCategory]));
  }
}

/**
 * Categorize all files from a Dropbox folder.
 *
 * Uses filename pattern matching first (free, instant).
 * Falls back to Claude API for files that don't match any pattern.
 *
 * @param filenames - Array of filenames from the Dropbox folder
 * @returns Array of categorization results
 */
export async function categorizeDocuments(
  filenames: string[]
): Promise<CategorizationResult[]> {
  const results: CategorizationResult[] = [];
  const ambiguous: string[] = [];

  // First pass: pattern matching
  for (const filename of filenames) {
    const category = categorizeByPattern(filename);
    if (category) {
      results.push({
        filename,
        category,
        method: "pattern",
        confidence: "high",
      });
    } else {
      ambiguous.push(filename);
    }
  }

  // Second pass: AI categorization for ambiguous files
  if (ambiguous.length > 0) {
    const aiResults = await categorizeWithAI(ambiguous);
    for (const filename of ambiguous) {
      const category = aiResults.get(filename) ?? "other";
      results.push({
        filename,
        category,
        method: "ai",
        confidence: category === "other" ? "low" : "medium",
      });
    }
  }

  return results;
}
