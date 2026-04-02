import { z } from "zod/v4";

export const orderFormSchema = z.object({
  association_id: z.string().uuid("Please select an association"),
  document_types: z
    .array(
      z.enum([
        "resale_certificate",
        "payoff_statement",
        "governing_documents",
        "lender_questionnaire",
      ])
    )
    .min(1, "Select at least one document type"),
  property_address: z.string().min(1, "Property address is required"),
  unit_number: z.string().optional(),
  requester_name: z.string().min(1, "Name is required"),
  requester_email: z.string().email("Valid email is required"),
  requester_phone: z.string().optional(),
  requester_type: z.enum(["agent", "lender", "owner", "title_company", "other"]),
  turnaround: z.enum(["standard", "rush"]),
  rush_notes: z.string().optional(),
  bill_to_closing: z.boolean().default(false),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;
