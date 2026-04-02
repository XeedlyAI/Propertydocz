"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AssociationData {
  id?: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  mailing_address: string | null;
  manager_name: string | null;
  manager_email: string | null;
  manager_phone: string | null;
  total_units: number | null;
  monthly_assessment_amount: number | null;
  assessment_frequency: string | null;
  annual_budget_amount: number | null;
  reserve_balance: number | null;
  pet_policy: string | null;
  rental_policy: string | null;
  parking_policy: string | null;
  [key: string]: unknown;
}

interface AssociationFormProps {
  tenantId: string;
  association: AssociationData | null;
}

export function AssociationForm({
  tenantId,
  association,
}: AssociationFormProps) {
  const router = useRouter();
  const isEditing = !!association?.id;

  const [name, setName] = useState(association?.name || "");
  const [legalName, setLegalName] = useState(association?.legal_name || "");
  const [address, setAddress] = useState(association?.address || "");
  const [city, setCity] = useState(association?.city || "");
  const [state, setState] = useState(association?.state || "UT");
  const [zip, setZip] = useState(association?.zip || "");
  const [mailingAddress, setMailingAddress] = useState(association?.mailing_address || "");
  const [managerName, setManagerName] = useState(association?.manager_name || "");
  const [managerEmail, setManagerEmail] = useState(association?.manager_email || "");
  const [managerPhone, setManagerPhone] = useState(association?.manager_phone || "");
  const [totalUnits, setTotalUnits] = useState(
    association?.total_units?.toString() || ""
  );
  const [monthlyAssessment, setMonthlyAssessment] = useState(
    association?.monthly_assessment_amount
      ? (association.monthly_assessment_amount / 100).toString()
      : ""
  );
  const [petPolicy, setPetPolicy] = useState(association?.pet_policy || "");
  const [rentalPolicy, setRentalPolicy] = useState(association?.rental_policy || "");
  const [parkingPolicy, setParkingPolicy] = useState(association?.parking_policy || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Association name is required");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      tenant_id: tenantId,
      name: name.trim(),
      legal_name: legalName.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zip: zip.trim() || null,
      mailing_address: mailingAddress.trim() || null,
      manager_name: managerName.trim() || null,
      manager_email: managerEmail.trim() || null,
      manager_phone: managerPhone.trim() || null,
      total_units: totalUnits ? parseInt(totalUnits) : null,
      monthly_assessment_amount: monthlyAssessment
        ? Math.round(parseFloat(monthlyAssessment) * 100)
        : null,
      pet_policy: petPolicy.trim() || null,
      rental_policy: rentalPolicy.trim() || null,
      parking_policy: parkingPolicy.trim() || null,
    };

    try {
      const url = isEditing
        ? `/api/admin/associations/${association!.id}`
        : "/api/admin/associations";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push("/admin/associations");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Association Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="Sunset Ridge HOA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLegalName(e.target.value)
                }
                placeholder="Sunset Ridge Homeowners Association, Inc."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units</Label>
              <Input
                id="totalUnits"
                type="number"
                value={totalUnits}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTotalUnits(e.target.value)
                }
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyAssessment">Monthly Assessment ($)</Label>
              <Input
                id="monthlyAssessment"
                type="number"
                step="0.01"
                value={monthlyAssessment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMonthlyAssessment(e.target.value)
                }
                placeholder="250.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAddress(e.target.value)
              }
              placeholder="123 Community Drive"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCity(e.target.value)
                }
                placeholder="Salt Lake City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setState(e.target.value)
                }
                placeholder="UT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setZip(e.target.value)
                }
                placeholder="84101"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mailingAddress">Mailing Address (if different)</Label>
            <Input
              id="mailingAddress"
              value={mailingAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMailingAddress(e.target.value)
              }
              placeholder="P.O. Box 1234, Salt Lake City, UT 84101"
            />
          </div>
        </CardContent>
      </Card>

      {/* Management Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Management Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="managerName">Manager Name</Label>
              <Input
                id="managerName"
                value={managerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setManagerName(e.target.value)
                }
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerEmail">Manager Email</Label>
              <Input
                id="managerEmail"
                type="email"
                value={managerEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setManagerEmail(e.target.value)
                }
                placeholder="john@corehoa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerPhone">Manager Phone</Label>
              <Input
                id="managerPhone"
                type="tel"
                value={managerPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setManagerPhone(e.target.value)
                }
                placeholder="(801) 555-0100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rentalPolicy">Rental Policy</Label>
            <Textarea
              id="rentalPolicy"
              value={rentalPolicy}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRentalPolicy(e.target.value)
              }
              placeholder="Long-term rentals permitted with board approval. No more than 25% of units may be rented."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="petPolicy">Pet Policy</Label>
            <Textarea
              id="petPolicy"
              value={petPolicy}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPetPolicy(e.target.value)
              }
              placeholder="Two pets per unit. Dogs must be leashed in common areas."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parkingPolicy">Parking Policy</Label>
            <Textarea
              id="parkingPolicy"
              value={parkingPolicy}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setParkingPolicy(e.target.value)
              }
              placeholder="Two assigned parking spaces per unit. Guest parking available."
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Association"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/associations")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
