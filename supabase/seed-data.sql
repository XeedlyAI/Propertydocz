-- ============================================================
-- PropertyDocz Seed Data
-- Run in Supabase SQL Editor AFTER migration.sql
-- Updates: replace TENANT_ID below with your actual tenant UUID
-- ============================================================

-- IMPORTANT: Before running this seed data, ensure the "documents"
-- storage bucket exists in Supabase Storage:
--   1. Go to Supabase Dashboard > Storage
--   2. Create a bucket named "documents"
--   3. Set it to public (or configure appropriate policies)
-- The document generation pipeline uploads PDFs to this bucket.

-- Step 0: Find your tenant ID
-- SELECT id, name, slug FROM tenants;
-- Then replace all occurrences of 'YOUR_TENANT_ID' below.

-- For convenience, store the tenant id in a variable
DO $$
DECLARE
  v_tenant_id uuid;
  v_assoc_sunset uuid;
  v_assoc_mountain uuid;
  v_prop1 uuid;
  v_prop2 uuid;
  v_prop3 uuid;
  v_prop4 uuid;
  v_prop5 uuid;
  v_prop6 uuid;
  v_prop7 uuid;
  v_prop8 uuid;
  v_prop9 uuid;
  v_prop10 uuid;
  v_prop11 uuid;
BEGIN

-- ============================================================
-- Get the first tenant (adjust if you have multiple)
-- ============================================================
SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

IF v_tenant_id IS NULL THEN
  RAISE EXCEPTION 'No tenant found. Create a tenant first.';
END IF;

RAISE NOTICE 'Using tenant_id: %', v_tenant_id;

-- ============================================================
-- ASSOCIATION 1: Sunset Ridge HOA
-- 48-unit condo community in Draper, UT
-- ============================================================
INSERT INTO associations (
  id, tenant_id, name, legal_name, address, city, state, zip, mailing_address,
  -- Management contacts
  manager_name, manager_email, manager_phone,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  -- Payment info
  payable_to, remit_address, wire_instructions, electronic_payment_instructions,
  -- Financial
  monthly_assessment_amount, assessment_frequency, annual_budget_amount,
  reserve_balance, reserve_study_date, percent_funded,
  capital_contribution_fee, transfer_fee, requires_first_month_assessment,
  -- Ownership & occupancy
  total_units, owner_occupied_pct, second_home_pct, investor_owned_pct, commercial_space_pct,
  -- Project info
  project_type, year_built, construction_status, phases_planned, phases_completed,
  developer_units_remaining, hoa_owned_units,
  -- Insurance
  master_policy_carrier, master_policy_number, master_policy_expiration,
  general_liability_coverage, general_liability_amount,
  fidelity_bond, fidelity_amount,
  flood_zone, flood_insurance_in_force, flood_coverage_amount,
  -- Policies
  rental_policy, short_term_rental_policy, pet_policy, parking_policy,
  age_restrictions, right_of_first_refusal,
  -- Legal
  in_litigation, litigation_details, litigation_relates_to_defects,
  attorney_name, attorney_phone,
  -- Building safety
  last_inspection_date, last_inspection_findings, inspection_repairs_completed,
  known_deficiencies, outstanding_violations,
  -- Special assessments
  current_special_assessment, planned_special_assessment,
  -- HOA loans
  hoa_loan_exists,
  -- Financial controls
  separate_operating_reserve_accounts, account_access_controls,
  bank_sends_statements_to_hoa, dual_signatures_for_reserves,
  independent_financial_review, financial_review_frequency,
  -- Tax/legal
  hoa_ein, management_company_ein
) VALUES (
  uuid_generate_v4(), v_tenant_id,
  'Sunset Ridge HOA', 'Sunset Ridge Homeowners Association Inc.',
  '1200 Sunset Ridge Blvd', 'Draper', 'UT', '84020',
  'PO Box 4471, Draper, UT 84020',
  -- Management
  'Sarah Mitchell', 'sarah.mitchell@sunsetridgehoa.org', '(801) 555-0142',
  'Karen Torres', 'billing@sunsetridgehoa.org', '(801) 555-0143',
  -- Payment
  'Sunset Ridge HOA', 'PO Box 4471, Draper, UT 84020',
  'Bank: Zions Bancorporation | Routing: 124000054 | Account: 3847201958 | Ref: Unit # + Owner Name',
  'Online payments accepted at sunsetridgehoa.appfolio.com',
  -- Financial (all in cents)
  32500, 'monthly', 187200000,  -- $325/mo, $1,872,000 annual budget
  84500000, '2025-06-15', 72.50,  -- $845,000 reserves, 72.5% funded
  50000, 25000, true,  -- $500 capital contribution, $250 transfer fee
  -- Ownership
  48, 78.50, 4.20, 14.60, 2.70,
  -- Project
  'condo', 2007, 'Complete', 2, 2, 0, 0,
  -- Insurance
  'State Farm', 'HO-48291-SRD', '2026-09-30',
  true, 200000000,   -- $2M general liability
  true, 50000000,     -- $500K fidelity bond
  'Zone X', false, null,
  -- Policies
  'Owners may lease units with Board approval. Minimum 12-month lease term. Maximum 25% rental cap. Tenant must be approved by management.',
  'Short-term rentals (less than 30 days) are prohibited per CC&Rs Section 8.4.',
  'Two domestic pets allowed per unit, maximum 40 lbs each. Breed restrictions apply per insurance requirements. Pets must be leashed in common areas.',
  'Two assigned parking spaces per unit. Guest parking in designated visitor areas only. No commercial vehicles, RVs, or boats in parking areas.',
  'None',
  'The Association has a right of first refusal on all unit sales per CC&Rs Section 12.1. Must be exercised within 15 days of written notice.',
  -- Legal
  false, null, false,
  'David Chen, Esq.', '(801) 555-0199',
  -- Building safety
  '2025-01-15', false, true,
  false, false,
  -- Special assessments
  false, false,
  -- HOA loans
  false,
  -- Financial controls
  true, true, true, true, true, 'Annually',
  -- Tax
  '87-0542189', '84-1928374'
) RETURNING id INTO v_assoc_sunset;

RAISE NOTICE 'Created Sunset Ridge HOA: %', v_assoc_sunset;

-- ============================================================
-- ASSOCIATION 2: Mountain View Condos
-- 72-unit townhome community in Sandy, UT
-- ============================================================
INSERT INTO associations (
  id, tenant_id, name, legal_name, address, city, state, zip, mailing_address,
  manager_name, manager_email, manager_phone,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  payable_to, remit_address, wire_instructions, electronic_payment_instructions,
  monthly_assessment_amount, assessment_frequency, annual_budget_amount,
  reserve_balance, reserve_study_date, percent_funded,
  capital_contribution_fee, transfer_fee, requires_first_month_assessment,
  total_units, owner_occupied_pct, second_home_pct, investor_owned_pct, commercial_space_pct,
  project_type, year_built, construction_status, phases_planned, phases_completed,
  developer_units_remaining, hoa_owned_units,
  master_policy_carrier, master_policy_number, master_policy_expiration,
  general_liability_coverage, general_liability_amount,
  fidelity_bond, fidelity_amount,
  flood_zone, flood_insurance_in_force, flood_coverage_amount,
  rental_policy, short_term_rental_policy, pet_policy, parking_policy,
  age_restrictions, right_of_first_refusal,
  in_litigation, litigation_details, litigation_relates_to_defects,
  attorney_name, attorney_phone,
  last_inspection_date, last_inspection_findings, inspection_repairs_completed,
  inspection_repairs_remaining, inspection_repairs_timeline,
  known_deficiencies, deficiency_details,
  outstanding_violations,
  current_special_assessment, current_sa_amount, current_sa_terms, current_sa_purpose,
  planned_special_assessment,
  hoa_loan_exists, hoa_loan_amount, hoa_loan_terms,
  separate_operating_reserve_accounts, account_access_controls,
  bank_sends_statements_to_hoa, dual_signatures_for_reserves,
  independent_financial_review, financial_review_frequency,
  hoa_ein, management_company_ein
) VALUES (
  uuid_generate_v4(), v_tenant_id,
  'Mountain View Condos', 'Mountain View Condominium Owners Association',
  '4500 Mountain View Dr', 'Sandy', 'UT', '84070',
  '4500 Mountain View Dr, Unit 1A, Sandy, UT 84070',
  -- Management
  'James Whitfield', 'james@mountainviewcondos.com', '(801) 555-0287',
  'Lisa Park', 'accounts@mountainviewcondos.com', '(801) 555-0288',
  -- Payment
  'Mountain View COA', '4500 Mountain View Dr, Unit 1A, Sandy, UT 84070',
  'Bank: Mountain America Credit Union | Routing: 324079555 | Account: 9001847362 | Ref: Unit # + Owner Name',
  'Online payments at mountainviewcondos.buildium.com',
  -- Financial
  41500, 'monthly', 358560000,  -- $415/mo, $3,585,600 annual
  126700000, '2024-11-01', 58.30,  -- $1,267,000 reserves, 58.3% funded
  75000, 35000, true,  -- $750 capital contribution, $350 transfer
  -- Ownership
  72, 65.30, 2.80, 29.20, 2.70,
  -- Project
  'townhome', 2001, 'Complete', 3, 3, 0, 0,
  -- Insurance
  'Travelers Insurance', 'TH-72019-MVC', '2026-07-15',
  true, 300000000,   -- $3M general liability
  true, 75000000,     -- $750K fidelity bond
  'Zone AE', true, 50000000,  -- $500K flood coverage
  -- Policies
  'Rentals permitted. Must register tenant with management within 30 days. No subletting. Lease minimum 6 months.',
  'Short-term rentals permitted with Board-issued license. Maximum 120 days per calendar year. Must carry additional liability insurance.',
  'One pet per unit, maximum 25 lbs. No exotic animals. Pet deposit of $500 required. Owner liable for all damages.',
  'One covered space and one uncovered space per unit. EV charging stations available in Lot B (first-come, $50/mo). No overnight guest parking without permit.',
  '55+ community — at least one occupant per unit must be 55 or older',
  'No right of first refusal. Board reserves right to approve all buyers per CC&Rs Section 9.2.',
  -- Legal — active litigation
  true,
  'Mountain View COA v. Wasatch Builders LLC — construction defect claim related to roof membrane failure on Buildings C and D. Filed March 2025. Case No. 250300142.',
  true,
  'Patricia Hernandez, Esq.', '(801) 555-0341',
  -- Building safety — some issues
  '2024-08-20', true, false,
  'Roof membrane replacement on Buildings C and D pending litigation resolution',
  'Estimated completion Q3 2026 pending settlement',
  true, 'Deteriorating balcony railings on Buildings A and B identified in 2024 inspection. Replacement scheduled.',
  false,
  -- Special assessment — active
  true, 150000, '$150/month for 24 months beginning January 2026', 'Balcony railing replacement and exterior painting for Buildings A and B',
  false,
  -- HOA loan
  true, 45000000, '$450,000 from Mountain America CU at 5.25% APR, 7-year term, secured by HOA reserves',
  -- Financial controls
  true, true, true, true, true, 'Annually',
  -- Tax
  '87-1284567', '84-1928374'
) RETURNING id INTO v_assoc_mountain;

RAISE NOTICE 'Created Mountain View Condos: %', v_assoc_mountain;

-- ============================================================
-- PROPERTIES — Sunset Ridge HOA (6 units)
-- ============================================================
INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_sunset, '1200 Sunset Ridge Blvd #101', '101', NULL, 'Michael and Jennifer Thompson', 'mthompson@gmail.com', '(801) 555-1001')
RETURNING id INTO v_prop1;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_sunset, '1200 Sunset Ridge Blvd #204', '204', NULL, 'Robert Nakamura', 'rnakamura@outlook.com', '(801) 555-1002')
RETURNING id INTO v_prop2;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_sunset, '1200 Sunset Ridge Blvd #312', '312', NULL, 'Angela and Marcus Washington', 'awashington@yahoo.com', '(801) 555-1003')
RETURNING id INTO v_prop3;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_sunset, '1200 Sunset Ridge Blvd #105', '105', NULL, 'David Park', 'dpark@protonmail.com', '(801) 555-1004')
RETURNING id INTO v_prop4;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_sunset, '1200 Sunset Ridge Blvd #408', '408', NULL, 'Stephanie Rivera', 'srivera@gmail.com', '(801) 555-1005')
RETURNING id INTO v_prop5;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_sunset, '1200 Sunset Ridge Blvd #210', '210', NULL, 'Christopher and Emily Foster', 'cfoster@icloud.com', '(801) 555-1006')
RETURNING id INTO v_prop6;

-- ============================================================
-- PROPERTIES — Mountain View Condos (5 units)
-- ============================================================
INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_mountain, '4500 Mountain View Dr #A102', 'A102', NULL, 'Harold and Betty Simmons', 'hsimmons@comcast.net', '(801) 555-2001')
RETURNING id INTO v_prop7;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_mountain, '4500 Mountain View Dr #B215', 'B215', NULL, 'Patricia Liu', 'pliu@gmail.com', '(801) 555-2002')
RETURNING id INTO v_prop8;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_mountain, '4500 Mountain View Dr #C308', 'C308', NULL, 'Frank and Donna Martinez', 'fmartinez@yahoo.com', '(801) 555-2003')
RETURNING id INTO v_prop9;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_mountain, '4500 Mountain View Dr #D104', 'D104', NULL, 'William O''Brien', 'wobrien@hotmail.com', '(801) 555-2004')
RETURNING id INTO v_prop10;

INSERT INTO properties (id, association_id, address, unit_number, lot_number, owner_name, owner_email, owner_phone)
VALUES (uuid_generate_v4(), v_assoc_mountain, '4500 Mountain View Dr #A205', 'A205', NULL, 'Sandra and Thomas Kim', 'skim@gmail.com', '(801) 555-2005')
RETURNING id INTO v_prop11;

-- ============================================================
-- DOCUMENT REQUESTS — 4 requests, one per type
-- All in ready_for_generation with pre-filled live_data
-- ============================================================

-- Request 1: Resale Certificate — Sunset Ridge, Unit 101
INSERT INTO document_requests (
  tenant_id, association_id, property_id,
  document_types, requester_name, requester_email, requester_phone, requester_type,
  property_address, turnaround, total_price_cents, bill_to_closing,
  payment_status, status, live_data
) VALUES (
  v_tenant_id, v_assoc_sunset, v_prop1,
  ARRAY['resale_certificate']::document_type[],
  'Jessica Palmer', 'jessica.palmer@utahrealty.com', '(801) 555-3001', 'agent',
  '1200 Sunset Ridge Blvd #101, Draper, UT 84020',
  'standard', 27500, false, 'paid', 'ready_for_generation',
  '{
    "owner_name": "Michael and Jennifer Thompson",
    "unit_number": "101",
    "current_balance_due": "$0.00",
    "special_assessments_due": "$0.00",
    "other_fees": "$0.00",
    "prorated_assessment": "$216.67",
    "total_due_at_closing": "$991.67",
    "account_status": "Current — no outstanding balance",
    "outstanding_violations": "None",
    "unit_restrictions": "Standard CC&R restrictions apply. No modifications to exterior without Board approval.",
    "in_litigation": "No"
  }'::jsonb
);

-- Request 2: Payoff Statement — Sunset Ridge, Unit 312
INSERT INTO document_requests (
  tenant_id, association_id, property_id,
  document_types, requester_name, requester_email, requester_phone, requester_type,
  property_address, turnaround, total_price_cents, bill_to_closing,
  payment_status, status, live_data
) VALUES (
  v_tenant_id, v_assoc_sunset, v_prop3,
  ARRAY['payoff_statement']::document_type[],
  'Brian Mercer', 'brian.mercer@firstamericantitle.com', '(801) 555-3002', 'title_company',
  '1200 Sunset Ridge Blvd #312, Draper, UT 84020',
  'rush', 35000, true, 'bill_to_closing', 'ready_for_generation',
  '{
    "owner_name": "Angela and Marcus Washington",
    "unit_number": "312",
    "regular_assessments_due": "$325.00",
    "past_due_assessments": "$975.00",
    "late_fees": "$75.00",
    "interest": "$23.47",
    "special_assessments_due": "$0.00",
    "collection_legal_fees": "$0.00",
    "return_check_fees": "$0.00",
    "lien_recording_fees": "$0.00",
    "other_charges": "$0.00",
    "payoff_statement_fee": "$350.00",
    "total_payoff_amount": "$1,748.47",
    "per_diem_amount": "$10.83",
    "per_diem_start_date": "April 1, 2026",
    "good_through_date": "April 30, 2026",
    "check_payable_to": "Sunset Ridge HOA",
    "payment_mail_address_line1": "PO Box 4471",
    "payment_mail_address_line2": "Draper, UT 84020",
    "wire_bank_name": "Zions Bancorporation",
    "wire_routing_number": "124000054",
    "wire_account_number": "3847201958"
  }'::jsonb
);

-- Request 3: Lender Questionnaire — Mountain View, Unit B215
INSERT INTO document_requests (
  tenant_id, association_id, property_id,
  document_types, requester_name, requester_email, requester_phone, requester_type,
  property_address, turnaround, total_price_cents, bill_to_closing,
  payment_status, status, live_data
) VALUES (
  v_tenant_id, v_assoc_mountain, v_prop8,
  ARRAY['lender_questionnaire']::document_type[],
  'Amanda Chen', 'achen@wellsfargo.com', '(801) 555-3003', 'lender',
  '4500 Mountain View Dr #B215, Sandy, UT 84070',
  'standard', 27500, false, 'paid', 'ready_for_generation',
  '{
    "owner_name": "Patricia Liu",
    "unit_number": "B215",
    "year_converted": "N/A — original construction",
    "phases_complete": "3",
    "additional_phases_planned": "No",
    "project_complete": "Yes",
    "percent_complete": "100%",
    "developer_in_control": "No",
    "turnover_date": "2004",
    "pending_annexations": "No",
    "is_conversion": "No",
    "owner_occupied_units": "47",
    "investor_owned_units": "21",
    "percent_owner_occupied": "65.3%",
    "units_single_entity": "3",
    "percent_single_entity": "4.2%",
    "developer_held_units": "0",
    "delinquent_units": "4",
    "percent_delinquent": "5.6%",
    "special_assessments_planned": "Yes — $150/month for 24 months for balcony railing replacement",
    "special_assessment_details": "Board-approved October 2025. Covers exterior railing replacement on Buildings A & B. Begins January 2026.",
    "assessments_adequate": "Yes — with special assessment supplement",
    "reserve_study_completed": "Yes",
    "reserve_study_current": "Yes — completed November 2024",
    "annual_reserve_contribution": "$358,560",
    "general_liability_expiration": "July 15, 2026",
    "fidelity_bond_expiration": "July 15, 2026",
    "flood_insurance_expiration": "July 15, 2026",
    "workers_comp": "$1,000,000",
    "workers_comp_expiration": "July 15, 2026",
    "umbrella_coverage": "$5,000,000",
    "umbrella_expiration": "July 15, 2026",
    "litigation_safety_related": "Yes — roof membrane defect on Buildings C and D",
    "rental_cap": "No formal cap, registration required",
    "mandatory_membership_fees": "Yes — $415/month regular assessment plus current special assessment of $150/month",
    "commercial_space": "2.7% — small retail space on ground floor of Building A",
    "environmental_hazards": "No known environmental hazards",
    "asbestos": "None identified — abatement completed during 2018 renovation",
    "lead_paint": "None — constructed 2001",
    "mold_issues": "No active mold issues. Remediation completed in Building D Unit 401 in 2023.",
    "fema_disaster": "No",
    "structural_deficiencies": "Roof membrane failure on Buildings C and D — covered by pending litigation",
    "deferred_maintenance": "Balcony railing replacement in progress via special assessment",
    "failed_inspections": "No",
    "common_amenities": "Clubhouse, outdoor pool, fitness center, pickleball court, community garden, dog park",
    "utilities_included": "Water, sewer, trash, exterior maintenance, snow removal",
    "fha_approved": "Yes — FHA ID: UT-84070-1001",
    "va_approved": "Yes"
  }'::jsonb
);

-- Request 4: Governing Documents — Mountain View, Unit C308
INSERT INTO document_requests (
  tenant_id, association_id, property_id,
  document_types, requester_name, requester_email, requester_phone, requester_type,
  property_address, turnaround, total_price_cents, bill_to_closing,
  payment_status, status, live_data
) VALUES (
  v_tenant_id, v_assoc_mountain, v_prop9,
  ARRAY['governing_documents']::document_type[],
  'Daniel Reeves', 'dreeves@kw.com', '(801) 555-3004', 'agent',
  '4500 Mountain View Dr #C308, Sandy, UT 84070',
  'rush', 40000, false, 'paid', 'ready_for_generation',
  '{
    "owner_name": "Frank and Donna Martinez",
    "unit_number": "C308",
    "ccr_status": "Included",
    "ccr_pages": "42",
    "ccr_amendments_status": "Included (3 amendments)",
    "ccr_amendments_pages": "18",
    "bylaws_status": "Included",
    "bylaws_pages": "24",
    "bylaws_amendments_status": "Included (1 amendment)",
    "bylaws_amendments_pages": "4",
    "articles_status": "Included",
    "articles_pages": "8",
    "rules_status": "Included",
    "rules_pages": "16",
    "architectural_guidelines_status": "Included",
    "architectural_guidelines_pages": "12",
    "budget_status": "Included — FY 2026",
    "budget_pages": "6",
    "financial_statement_status": "Included — Year ending Dec 2025",
    "financial_statement_pages": "14",
    "reserve_study_status": "Included — November 2024",
    "reserve_study_pages": "28",
    "insurance_cert_status": "Included — Current through July 2026",
    "insurance_cert_pages": "4",
    "meeting_minutes_status": "Included — Last 3 meetings",
    "meeting_minutes_pages": "9",
    "plat_map_status": "Included",
    "plat_map_pages": "2",
    "package_notes": "Complete governing document package for Mountain View Condominium Owners Association. Includes all recorded documents, current financials, and insurance certificates. Note: Association is involved in active litigation regarding construction defects — see CC&R Amendment 3 for related provisions.",
    "total_pages": "187"
  }'::jsonb
);

RAISE NOTICE 'Seed data inserted successfully!';
RAISE NOTICE 'Sunset Ridge HOA: % (6 properties, 2 requests)', v_assoc_sunset;
RAISE NOTICE 'Mountain View Condos: % (5 properties, 2 requests)', v_assoc_mountain;

END $$;
