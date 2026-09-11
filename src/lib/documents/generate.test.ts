/**
 * The Typst pipeline's pure half: value formatting, escaping, interpolation,
 * and the signature block. escapeTypst is the injection boundary — a "$" in
 * "$325.00" once broke compilation, and "#" or "@" in owner data would be
 * executed as Typst code without it (see the typst-pdf-generation skill).
 */
import { describe, expect, it } from "vitest";
import { buildSignatureBlock, escapeTypst, formatDataValues, formatNumber, getRequiredFields, interpolateTemplate } from "./generate";

describe("formatNumber — dollar fields", () => {
  it.each([
    ["$1234.56", "$1,234.56"],
    ["$ 1234", "$1,234.00"],
    ["1234.5", "1,234.50"],
    ["1775", "1,775.00"], // a dollar field without a $ still gets cents
    ["-$2500", "-$2,500.00"],
    ["$-2500", "-$2,500.00"],
    ["N/A", "N/A"],
    ["", ""],
    ["twelve", "twelve"],
    ["$1,234.56", "$1,234.56"], // already formatted: idempotent
  ])("%s → %s", (input, expected) => {
    expect(formatNumber(input, "dollar")).toBe(expected);
    expect(formatNumber(input)).toBe(expected); // dollar is the default
  });
});

describe("formatNumber — count fields", () => {
  it.each([
    ["1775", "1,775"],
    ["999", "999"],
    ["-1200", "-1,200"],
    ["1,200", "1,200"], // idempotent
    ["12.5", "12.5"], // not an integer: left alone
    ["N/A", "N/A"],
    ["", ""],
  ])("%s → %s", (input, expected) => {
    expect(formatNumber(input, "count")).toBe(expected);
  });
});

describe("formatDataValues", () => {
  it("formats only the dollar and numeric fields, leaving everything else verbatim", () => {
    expect(
      formatDataValues({
        total_payoff_amount: "$4321.5",
        total_units: "1200",
        owner_name: "1234",
        unit_lot_number: "$5",
        ccr_pages: "48",
      }),
    ).toEqual({
      total_payoff_amount: "$4,321.50",
      total_units: "1,200",
      owner_name: "1234",
      unit_lot_number: "$5",
      ccr_pages: "48",
    });
  });
});

describe("escapeTypst", () => {
  it("escapes every Typst-special character, backslash first", () => {
    expect(escapeTypst("$325.00")).toBe("\\$325.00");
    expect(escapeTypst("#let x = 1")).toBe("\\#let x = 1");
    expect(escapeTypst("owner@example.com")).toBe("owner\\@example.com");
    expect(escapeTypst("<script>")).toBe("\\<script\\>");
    expect(escapeTypst("C:\\path")).toBe("C:\\\\path");
    // A pre-escaped value is escaped again, never left executable.
    expect(escapeTypst("\\$")).toBe("\\\\\\$");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeTypst("Lakeside Village HOA, Unit 12-B")).toBe("Lakeside Village HOA, Unit 12-B");
  });
});

describe("interpolateTemplate", () => {
  it("substitutes every #{key}, escapes the values, and fills missing keys with N/A", () => {
    const tpl = "Assoc: #{association_name}\nDue: #{total_due}\nNotes: #{notes}\nRaw: #{missing}";
    expect(interpolateTemplate(tpl, { association_name: "Elm & Oak #4", total_due: "$1,200.00", notes: "see <attached>" })).toBe(
      "Assoc: Elm & Oak \\#4\nDue: \\$1,200.00\nNotes: see \\<attached\\>\nRaw: N/A",
    );
  });

  it("does not touch Typst code that is not a #{var} placeholder", () => {
    const tpl = '#text(size: 8pt)[Prepared] #{preparer} #v(2pt)';
    expect(interpolateTemplate(tpl, { preparer: "J. Doe" })).toBe('#text(size: 8pt)[Prepared] J. Doe #v(2pt)');
  });
});

describe("buildSignatureBlock", () => {
  it("renders a typed signature in italic Inter by default, with the preparer, title, date, and valid-through", () => {
    const block = buildSignatureBlock(false, "Jane Doe", "Community Manager", "2026-09-10");
    expect(block).toContain('#text(font: "Inter", size: 18pt, weight: "regular", style: "italic", fill: rgb("#1A1A2E"))[Jane Doe]');
    expect(block).toContain("Electronically signed by Jane Doe");
    expect(block).toContain("Prepared By: *Jane Doe*");
    expect(block).toContain("Date: 2026-09-10");
    expect(block).toContain("Title: *Community Manager*");
    expect(block).toContain("Valid Through: 2026-09-10");
    expect(block).not.toContain("signature.png");
  });

  it("uses the chosen cursive font without the italic style, and an uploaded image when present", () => {
    const cursive = buildSignatureBlock(false, "Jane Doe", "Manager", "2026-09-10", undefined, "great_vibes");
    expect(cursive).toContain('#text(font: "Great Vibes", size: 18pt, weight: "regular", fill: rgb("#1A1A2E"))[Jane Doe]');
    const image = buildSignatureBlock(true, "Jane Doe", "Manager", "2026-09-10", "Statement Valid Through: 2026-10-10");
    expect(image).toContain('#image("signature.png", width: 200pt, height: 80pt, fit: "contain")');
    expect(image).not.toContain("Electronically signed");
    expect(image).toContain("Statement Valid Through: 2026-10-10");
    expect(image).not.toContain("Valid Through: 2026-09-10");
  });

  it("falls back to Inter for an unknown font style key", () => {
    expect(buildSignatureBlock(false, "J", "T", "2026-01-01", undefined, "comic_sans")).toContain('font: "Inter"');
  });
});

describe("getRequiredFields", () => {
  it("requires the association address block for the three mailed documents and only the core for the questionnaire", () => {
    const core = ["association_name", "property_address", "preparation_date"];
    const address = ["association_address", "association_city", "association_state", "association_zip"];
    expect(getRequiredFields("resale_certificate")).toEqual([...core, ...address]);
    expect(getRequiredFields("payoff_statement")).toEqual([...core, ...address]);
    expect(getRequiredFields("governing_documents")).toEqual([...core, ...address]);
    expect(getRequiredFields("lender_questionnaire")).toEqual(core);
  });
});
