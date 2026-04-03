import { readFileSync, writeFileSync, unlinkSync, mkdtempSync, existsSync, mkdirSync, rmdirSync } from "fs";
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
 * Font directory — contains Inter and JetBrains Mono TTF files.
 * These are loaded as blobs and passed to NodeCompiler so they're
 * available regardless of system fonts (works on Vercel serverless).
 */
const FONTS_DIR = join(
  process.cwd(),
  "src",
  "lib",
  "documents",
  "fonts"
);

/**
 * Font files to load. Each is read once and cached in memory.
 */
const FONT_FILES = [
  "Inter-Regular.ttf",
  "Inter-Bold.ttf",
  "Inter-Medium.ttf",
  "Inter-SemiBoldItalic.ttf",
  "JetBrainsMono-Regular.ttf",
  "JetBrainsMono-Bold.ttf",
  "DancingScript-Regular.ttf",
  "GreatVibes-Regular.ttf",
  "Pacifico-Regular.ttf",
];

/**
 * Signature font style options.
 * Maps the DB value to the Typst font family name.
 */
export const SIGNATURE_FONT_STYLES: Record<string, { label: string; font: string }> = {
  dancing_script: { label: "Dancing Script", font: "Dancing Script" },
  great_vibes: { label: "Great Vibes", font: "Great Vibes" },
  pacifico: { label: "Pacifico", font: "Pacifico" },
};

let _fontBlobsCache: Buffer[] | null = null;

/**
 * Load font files as buffers. Cached after first call.
 */
function loadFontBlobs(): Buffer[] {
  if (_fontBlobsCache) return _fontBlobsCache;

  _fontBlobsCache = FONT_FILES.map((file) => {
    const fontPath = join(FONTS_DIR, file);
    return readFileSync(fontPath);
  });

  return _fontBlobsCache;
}

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
 * Format a number string with commas (US standard).
 * If the value looks like a dollar amount (starts with $), formats the numeric part
 * with commas and 2 decimal places. If it's a plain number >= 1000, adds commas.
 * Non-numeric values are returned as-is.
 */
function formatNumber(value: string): string {
  if (!value || value === "N/A") return value;

  // Dollar amount: $1234.56 → $1,234.56
  const dollarMatch = value.match(/^\$?\s*(-?\d[\d,]*\.?\d*)$/);
  if (dollarMatch) {
    const raw = dollarMatch[1].replace(/,/g, "");
    const num = parseFloat(raw);
    if (isNaN(num)) return value;
    const hasDollarSign = value.trimStart().startsWith("$");
    const formatted = num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return hasDollarSign ? `$${formatted}` : formatted;
  }

  // Plain integer >= 1000: 1775 → 1,775
  const intMatch = value.match(/^(-?\d+)$/);
  if (intMatch) {
    const num = parseInt(intMatch[1], 10);
    if (Math.abs(num) >= 1000) {
      return num.toLocaleString("en-US");
    }
  }

  return value;
}

/**
 * Fields that contain dollar amounts — format with commas + 2 decimal places.
 */
const DOLLAR_FIELDS = new Set([
  // Resale certificate
  "monthly_assessment", "current_balance_due", "special_assessments_due",
  "transfer_fee", "capital_contribution", "other_fees", "prorated_assessment",
  "total_due_at_closing", "general_liability", "fidelity_bond",
  "reserve_balance", "annual_budget",
  // Payoff statement
  "regular_assessments_due", "past_due_assessments", "late_fees", "interest",
  "collection_legal_fees", "return_check_fees", "lien_recording_fees",
  "other_charges", "total_payoff_amount", "per_diem_amount",
  // Lender questionnaire
  "annual_reserve_contribution",
  "umbrella_coverage",
]);

/**
 * Fields that contain plain numbers (counts, pages) — format with commas if >= 1000.
 */
const NUMERIC_FIELDS = new Set([
  "total_units", "owner_occupied_units", "investor_owned_units",
  "units_single_entity", "developer_held_units", "delinquent_units",
  "total_pages",
  "ccr_pages", "ccr_amendments_pages", "bylaws_pages", "bylaws_amendments_pages",
  "articles_pages", "rules_pages", "architectural_guidelines_pages",
  "budget_pages", "financial_statement_pages", "reserve_study_pages",
  "insurance_cert_pages", "meeting_minutes_pages", "plat_map_pages",
]);

/**
 * Pre-process data values: add commas to financial figures and large numbers.
 * Applied BEFORE Typst interpolation so templates stay clean.
 */
function formatDataValues(data: Record<string, string>): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (DOLLAR_FIELDS.has(key) || NUMERIC_FIELDS.has(key)) {
      formatted[key] = formatNumber(value);
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
}

/**
 * Escape characters that are special in Typst markup.
 *
 * Key Typst-special chars that break compilation when injected raw:
 *   $  — math delimiter (unmatched $ causes "unclosed delimiter")
 *   #  — code/function prefix
 *   @  — label/reference
 *   <> — raw/label delimiters
 *   \  — escape character itself (must come first)
 *
 * We prefix each with a backslash so Typst treats them as literal text.
 */
function escapeTypst(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/@/g, "\\@")
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>");
}

/**
 * Interpolate template variables into a Typst template.
 * Replaces all #{variable_name} occurrences with data values.
 * Missing values are replaced with "N/A".
 * All injected values are escaped so Typst-special characters
 * (like $ in "$325.00") don't break compilation.
 */
function interpolateTemplate(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/#\{(\w+)\}/g, (_match: string, key: string) => {
    return escapeTypst(data[key] ?? "N/A");
  });
}

/**
 * Generate a PDF buffer from a document type and its data.
 *
 * Uses @myriaddreamin/typst-ts-node-compiler for compilation.
 * Fonts (Inter, JetBrains Mono) are loaded as blobs so they work
 * on Vercel serverless where no system fonts are installed.
 * Writes a temp file (compiler requires real files on disk), compiles to PDF,
 * then cleans up.
 */
/**
 * Build the Typst snippet for the signature block.
 *
 * If a signature image is provided, renders the image above the signature line.
 * Otherwise renders a typed electronic signature using italic Inter.
 * The signature_block is injected RAW (not escaped) since it contains Typst markup.
 */
function buildSignatureBlock(
  hasSignatureImage: boolean,
  preparedBy: string,
  preparedByTitle: string,
  prepDate: string,
  extraRight?: string,
  signatureFontStyle?: string,
): string {
  // Determine font for typed electronic signature
  const fontInfo = signatureFontStyle
    ? SIGNATURE_FONT_STYLES[signatureFontStyle]
    : null;
  const sigFont = fontInfo ? fontInfo.font : "Inter";
  const sigStyle = fontInfo ? "" : `, style: "italic"`;

  const signatureContent = hasSignatureImage
    ? `#image("signature.png", width: 200pt, height: 80pt, fit: "contain")`
    : `#text(font: "${sigFont}", size: 18pt, weight: "regular"${sigStyle}, fill: rgb("#1A1A2E"))[${preparedBy}]
      #v(2pt)
      #text(size: 7.5pt, fill: rgb("#777"))[Electronically signed by ${preparedBy}]`;

  const rightLabel = extraRight || `Valid Through: ${prepDate}`;

  return `#block(breakable: false)[
  #grid(
    columns: (1fr, 1fr),
    gutter: 24pt,
    [
      ${signatureContent}
      #v(4pt)
      #line(length: 85%, stroke: 0.5pt + rgb("#999"))
      #v(4pt)
      #text(size: 8pt, fill: rgb("#555"))[Prepared By: *${preparedBy}*]
      #v(2pt)
      #text(size: 8pt, fill: rgb("#555"))[Date: ${prepDate}]
    ],
    [
      #v(40pt)
      #line(length: 85%, stroke: 0.5pt + rgb("#999"))
      #v(4pt)
      #text(size: 8pt, fill: rgb("#555"))[Title: *${preparedByTitle}*]
      #v(2pt)
      #text(size: 8pt, fill: rgb("#555"))[${rightLabel}]
    ],
  )
]`;
}

export async function generatePdf(
  docType: DocumentType,
  data: Record<string, string>,
  signatureImageBuffer?: Buffer | null,
  signatureFontStyle?: string | null,
): Promise<Buffer> {
  const { NodeCompiler } = await import(
    "@myriaddreamin/typst-ts-node-compiler"
  );

  const template = loadTemplate(docType);
  const formattedData = formatDataValues(data);

  // Build signature block based on whether we have an image
  const hasSignatureImage = !!signatureImageBuffer;
  const preparedBy = data.prepared_by || "Authorized Representative";
  const preparedByTitle = data.prepared_by_title || "Community Manager";
  const prepDate = data.preparation_date || new Date().toLocaleDateString("en-US");

  // Determine the right-side label based on doc type
  let extraRight: string | undefined;
  if (docType === "resale_certificate") {
    extraRight = `Valid Through: ${data.valid_through || "N/A"}`;
  } else if (docType === "payoff_statement") {
    extraRight = `Good Through: ${data.good_through_date || "N/A"}`;
  } else if (docType === "lender_questionnaire" || docType === "governing_documents") {
    extraRight = `Phone: ${data.manager_phone || "N/A"}`;
  }

  const signatureBlock = buildSignatureBlock(
    hasSignatureImage,
    escapeTypst(preparedBy),
    escapeTypst(preparedByTitle),
    escapeTypst(prepDate),
    extraRight ? escapeTypst(extraRight) : undefined,
    signatureFontStyle || undefined,
  );

  // Interpolate data values (escaped), then replace signature marker (raw Typst)
  let typstSource = interpolateTemplate(template, formattedData);
  typstSource = typstSource.replace("// SIGNATURE_BLOCK", signatureBlock);

  // Load embedded font files as buffers
  const fontBlobs = loadFontBlobs();

  // Vercel serverless: process.cwd() is /var/task (read-only).
  // NodeCompiler hardcodes workspace root to process.cwd(), ignoring the
  // `root` option. Workaround: write temp file to os.tmpdir() (/tmp on
  // Vercel), then chdir there before compilation so the compiler's
  // workspace matches. Restore cwd immediately after.
  const tmpBase = join(tmpdir(), "propertydocz");
  if (!existsSync(tmpBase)) {
    mkdirSync(tmpBase, { recursive: true });
  }
  const tempDir = mkdtempSync(join(tmpBase, "gen-"));
  const tempFile = join(tempDir, "document.typ");

  const originalCwd = process.cwd();

  try {
    // Write signature image to temp dir if provided
    if (signatureImageBuffer) {
      writeFileSync(join(tempDir, "signature.png"), signatureImageBuffer);
    }

    writeFileSync(tempFile, typstSource, "utf-8");

    // Temporarily set cwd to the temp dir so NodeCompiler accepts it
    process.chdir(tempDir);

    const compiler = NodeCompiler.create({
      fontArgs: [{ fontBlobs }],
    });
    const pdfBuffer = compiler.pdf({ mainFilePath: tempFile });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error(`Typst compilation produced empty output for ${docType}`);
    }

    return Buffer.from(pdfBuffer);
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up temp files and directory
    try {
      unlinkSync(tempFile);
      if (signatureImageBuffer) {
        try { unlinkSync(join(tempDir, "signature.png")); } catch { /* */ }
      }
      rmdirSync(tempDir);
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
 *
 * IMPORTANT: Only include fields that are GUARANTEED to be populated
 * from association data, request-level data, or auto-computed values
 * (preparation_date, prepared_by, etc.). Fields that depend on live_data
 * (owner_name, unit_number, financial specifics) are NOT hard-required
 * here — missing live_data fields render as "N/A" in the template and
 * are flagged by AI advisory validation during review.
 */
export function getRequiredFields(docType: DocumentType): string[] {
  // Core fields sourced from association + request tables (always populated)
  const core = [
    "association_name",
    "property_address",
    "preparation_date",
  ];

  switch (docType) {
    case "resale_certificate":
      return [...core, "association_address", "association_city", "association_state", "association_zip"];
    case "payoff_statement":
      return [...core, "association_address", "association_city", "association_state", "association_zip"];
    case "lender_questionnaire":
      return [...core];
    case "governing_documents":
      return [...core, "association_address", "association_city", "association_state", "association_zip"];
    default:
      return [];
  }
}
