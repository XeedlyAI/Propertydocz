import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Plus, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssociationsHeader } from "@/components/admin/associations-header";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function AssociationsPage() {
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: associations } = await supabase
    .from("associations")
    .select(
      "id, name, legal_name, address, city, state, zip, total_units, project_type"
    )
    .eq("tenant_id", user.tenantId)
    .order("name");

  // Get property counts per association
  const assocIds = (associations || []).map((a) => a.id);
  let propertyCounts: Record<string, number> = {};

  if (assocIds.length > 0) {
    const { data: properties } = await supabase
      .from("properties")
      .select("association_id")
      .in("association_id", assocIds);

    if (properties) {
      propertyCounts = properties.reduce(
        (acc, p) => {
          acc[p.association_id] = (acc[p.association_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  return (
    <div className="space-y-6">
      <AssociationsHeader
        tenantId={user.tenantId}
        tenantName={user.tenantName}
      />

      {!associations || associations.length === 0 ? (
        <Card className="dash-card">
          <CardContent className="py-4">
            <EmptyState
              icon={Building2}
              title="No associations yet"
              description="Add your first HOA community to get started."
              action={
                <Link href="/admin/associations/new">
                  <Button
                    size="sm"
                    className="rounded-[6px] bg-[#38b6ff] text-white font-medium hover:bg-[#1DA8F0] min-h-[44px]"
                  >
                    <Plus className="size-4" />
                    Add Association
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {associations.map((assoc) => (
            <Link key={assoc.id} href={`/admin/associations/${assoc.id}`}>
              <Card className="dash-card cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="size-4 text-[#38b6ff]" />
                    {assoc.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {assoc.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {assoc.address}
                        {assoc.city && `, ${assoc.city}`}
                        {assoc.state && `, ${assoc.state}`}
                        {assoc.zip && ` ${assoc.zip}`}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {assoc.total_units && (
                      <span className="font-mono inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {assoc.total_units} units
                      </span>
                    )}
                    <span className="font-mono inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {propertyCounts[assoc.id] || 0} properties
                    </span>
                    {assoc.project_type && (
                      <span className="inline-flex items-center rounded-md bg-[#38b6ff]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#38b6ff] capitalize">
                        {assoc.project_type}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
