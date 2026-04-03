"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CSVImportModal } from "@/components/admin/csv-import-modal";
import { Plus, Upload } from "lucide-react";

interface AssociationsHeaderProps {
  tenantId: string;
  tenantName: string;
}

export function AssociationsHeader({
  tenantId,
  tenantName,
}: AssociationsHeaderProps) {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associations</h1>
          <p className="text-sm text-muted-foreground">
            Manage HOA communities for {tenantName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-[6px]"
            onClick={() => setShowImport(true)}
          >
            <Upload className="size-4" />
            Import CSV
          </Button>
          <Link href="/admin/associations/new">
            <Button
              size="sm"
              className="rounded-[6px] bg-[#38b6ff] text-white font-medium hover:bg-[#1DA8F0]"
            >
              <Plus className="size-4" />
              Add Association
            </Button>
          </Link>
        </div>
      </div>

      {showImport && (
        <CSVImportModal
          tenantId={tenantId}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  );
}
