"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  X,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CSVImportModalProps {
  tenantId: string;
  onClose: () => void;
}

interface ParsedRow {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  unit_count?: string;
  type?: string;
}

interface ImportResult {
  created: number;
  failed: number;
  errors: string[];
}

export function CSVImportModal({ tenantId, onClose }: CSVImportModalProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setParseError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            setParseError("No valid rows found in CSV");
            return;
          }
          setRows(parsed);
        } catch (err) {
          setParseError(
            err instanceof Error ? err.message : "Failed to parse CSV"
          );
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const handleImport = useCallback(async () => {
    setImporting(true);
    setResult(null);

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const res = await fetch("/api/admin/associations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            name: row.name,
            address: row.address || null,
            city: row.city || null,
            state: row.state || null,
            zip: row.zip || null,
            total_units: row.unit_count ? parseInt(row.unit_count) : null,
            project_type: row.type || null,
            onboarding_status: "pending",
          }),
        });

        if (res.ok) {
          created++;
        } else {
          const data = await res.json();
          failed++;
          errors.push(`${row.name}: ${data.error || "Failed"}`);
        }
      } catch {
        failed++;
        errors.push(`${row.name}: Network error`);
      }
    }

    setResult({ created, failed, errors });
    setImporting(false);

    if (created > 0) {
      router.refresh();
    }
  }, [rows, tenantId, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-[#38b6ff]" />
            Import Associations from CSV
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CSV format instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Upload a CSV file with these columns:</p>
            <code className="block text-xs bg-muted px-2 py-1 rounded">
              name, address, city, state, zip, unit_count, type
            </code>
            <p className="text-xs">
              Only <strong>name</strong> is required. Type can be: condo,
              townhome, single_family, or mixed.
            </p>
          </div>

          {/* File upload */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4 mr-2" />
              {fileName || "Choose CSV file"}
            </Button>
          </div>

          {parseError && (
            <p className="text-sm text-red-600">{parseError}</p>
          )}

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {rows.length} association{rows.length !== 1 ? "s" : ""} found:
              </p>
              <div className="max-h-48 overflow-auto rounded border">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Name
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        City
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Units
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">{row.name}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {row.city || "—"}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {row.unit_count || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                className="w-full bg-[#38b6ff] hover:bg-[#38b6ff]/90"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Import {rows.length} Association
                    {rows.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {result.created > 0 && (
                  <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-4" />
                    {result.created} imported
                  </span>
                )}
                {result.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="size-4" />
                    {result.failed} failed
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-auto">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
              <Button className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Parse CSV text into rows. Handles quoted fields and common delimiters.
 */
function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return []; // Need header + at least 1 data row

  // Parse header
  const header = splitCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_")
  );

  // Map common header variations
  const colMap: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i];
    if (h.includes("name")) colMap.name = String(i);
    else if (h.includes("address") && !h.includes("city"))
      colMap.address = String(i);
    else if (h.includes("city")) colMap.city = String(i);
    else if (h.includes("state")) colMap.state = String(i);
    else if (h.includes("zip") || h.includes("postal"))
      colMap.zip = String(i);
    else if (h.includes("unit") || h.includes("count"))
      colMap.unit_count = String(i);
    else if (h.includes("type")) colMap.type = String(i);
  }

  if (!colMap.name) {
    throw new Error(
      'CSV must have a "name" column. Found headers: ' + header.join(", ")
    );
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const name = values[parseInt(colMap.name)]?.trim();
    if (!name) continue;

    rows.push({
      name,
      address: colMap.address
        ? values[parseInt(colMap.address)]?.trim()
        : undefined,
      city: colMap.city ? values[parseInt(colMap.city)]?.trim() : undefined,
      state: colMap.state ? values[parseInt(colMap.state)]?.trim() : undefined,
      zip: colMap.zip ? values[parseInt(colMap.zip)]?.trim() : undefined,
      unit_count: colMap.unit_count
        ? values[parseInt(colMap.unit_count)]?.trim()
        : undefined,
      type: colMap.type ? values[parseInt(colMap.type)]?.trim() : undefined,
    });
  }

  return rows;
}

/** Split a CSV line, respecting quoted fields */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map((s) => s.replace(/^"|"$/g, "").trim());
}
