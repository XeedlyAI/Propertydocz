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

interface SignatureUploadProps {
  tenantId: string;
  currentSignatureUrl: string | null;
}

export function SignatureUpload({
  tenantId,
  currentSignatureUrl,
}: SignatureUploadProps) {
  const [signatureUrl, setSignatureUrl] = useState(currentSignatureUrl);
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

  return (
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

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
