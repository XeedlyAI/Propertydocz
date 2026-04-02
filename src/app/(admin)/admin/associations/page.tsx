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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associations</h1>
          <p className="text-sm text-muted-foreground">
            Manage HOA communities for {user.tenantName}
          </p>
        </div>
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

      {!associations || associations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-semibold">
              No associations yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first HOA community to get started.
            </p>
            <Link href="/admin/associations/new">
              <Button
                size="sm"
                className="mt-4 rounded-[6px] bg-[#38b6ff] text-white font-medium hover:bg-[#1DA8F0]"
              >
                <Plus className="size-4" />
                Add Association
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {associations.map((assoc) => (
            <Link key={assoc.id} href={`/admin/associations/${assoc.id}`}>
              <Card className="cursor-pointer transition-all duration-150 hover:shadow-md hover:border-[#38b6ff]/30 h-full">
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
                  <div className="flex items-center gap-2">
                    {assoc.total_units && (
                      <span className="font-data inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {assoc.total_units} units
                      </span>
                    )}
                    <span className="font-data inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
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
