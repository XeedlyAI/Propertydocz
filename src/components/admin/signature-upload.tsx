"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Upload, Trash2, Loader2, PenLine } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const FONT_STYLES = [
  { value: "dancing_script", label: "Dancing Script", family: "'Dancing Script', cursive" },
  { value: "great_vibes", label: "Great Vibes", family: "'Great Vibes', cursive" },
  { value: "pacifico", label: "Pacifico", family: "'Pacifico', cursive" },
] as const;

interface SignatureUploadProps {
  tenantId: string;
  currentSignatureUrl: string | null;
  currentFontStyle: string | null;
}

export function SignatureUpload({
  tenantId,
  currentSignatureUrl,
  currentFontStyle,
}: SignatureUploadProps) {
  const [signatureUrl, setSignatureUrl] = useState(currentSignatureUrl);
  const [fontStyle, setFontStyle] = useState(currentFontStyle || "dancing_script");
  const [savingFont, setSavingFont] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG or JPG).");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const storagePath = `${tenantId}/signature.png`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("signatures").getPublicUrl(storagePath);

      // Save the storage path to the tenant record
      const { error: updateError } = await supabase
        .from("tenants")
        .update({ signature_image_url: storagePath })
        .eq("id", tenantId);

      if (updateError) {
        setError(`Failed to save: ${updateError.message}`);
        return;
      }

      setSignatureUrl(publicUrl);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const storagePath = `${tenantId}/signature.png`;

      // Remove from storage
      await supabase.storage.from("signatures").remove([storagePath]);

      // Clear from tenant record
      const { error: updateError } = await supabase
        .from("tenants")
        .update({ signature_image_url: null })
        .eq("id", tenantId);

      if (updateError) {
        setError(`Failed to remove: ${updateError.message}`);
        return;
      }

      setSignatureUrl(null);
    } catch {
      setError("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleFontChange(value: string) {
    setFontStyle(value);
    setSavingFont(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("tenants")
        .update({ signature_font_style: value })
        .eq("id", tenantId);

      if (updateError) {
        setError(`Failed to save font: ${updateError.message}`);
      }
    } catch {
      setError("Failed to save font preference.");
    } finally {
      setSavingFont(false);
    }
  }

  return (
    <>
    {/* Load Google Fonts for signature preview */}
    {/* eslint-disable-next-line @next/next/no-page-custom-font */}
    <link
      href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400&family=Great+Vibes&family=Pacifico&display=swap"
      rel="stylesheet"
    />
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="size-4" />
          Signature
        </CardTitle>
        <CardDescription>
          Upload a signature image for generated documents. PNG with transparent
          background recommended. If no image is uploaded, a typed electronic
          signature is used automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signatureUrl ? (
          <div className="space-y-3">
            <div className="rounded-lg border bg-white p-4">
              <img
                src={signatureUrl}
                alt="Current signature"
                className="h-20 w-auto max-w-[200px] object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 size-4" />
                )}
                Replace
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
              <PenLine className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No signature uploaded
              </p>
              <p className="text-xs text-muted-foreground">
                Documents will use a typed electronic signature
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Upload Signature
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleUpload}
        />

        {/* Font style selector — only relevant when no image uploaded */}
        {!signatureUrl && (
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">Signature Font Style</p>
            <p className="text-xs text-muted-foreground">
              Choose the cursive font used for the typed electronic signature on documents.
            </p>
            <div className="grid gap-2">
              {FONT_STYLES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleFontChange(f.value)}
                  disabled={savingFont}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                    fontStyle === f.value
                      ? "border-[#38b6ff] bg-[#38b6ff]/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span
                    className="text-lg text-[#1A1A2E]"
                    style={{ fontFamily: f.family }}
                  >
                    John Smith
                  </span>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
    </>
  );
}
