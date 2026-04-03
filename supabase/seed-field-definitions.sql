-- ============================================================
-- PropertyDocz — Phase A: Seed Field Definitions
-- Run in Supabase SQL Editor AFTER 002_field_registry.sql
--
-- Comprehensive field registry covering ALL fields across:
--   - resale_certificate
--   - payoff_statement
--   - lender_questionnaire
--   - governing_documents
--
-- Tier classification:
--   static      = doesn't change between transactions (Tier 1)
--   periodic    = changes on a cycle, has staleness window (Tier 2)
--   transaction = unique to each request (Tier 3)
-- ============================================================

INSERT INTO field_definitions (field_key, label, tier, value_type, section, document_types, validation_rules, staleness_days, extraction_hints, display_order, help_text) VALUES

-- ===========================================
-- SECTION: general_info — Association basics
-- ===========================================

('association_name', 'Association Name', 'static', 'text', 'general_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null,
  '{"association name", "HOA name", "homeowners association", "community name"}',
  10, 'Full name of the homeowners association'),

('association_legal_name', 'Legal Name', 'static', 'text', 'general_info',
  '{lender_questionnaire}',
  '{"required": true}', null,
  '{"legal name", "incorporated as", "full legal name", "registered name"}',
  20, 'Official legal/incorporated name of the association'),

('association_address', 'Association Address', 'static', 'text', 'general_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null,
  '{"address", "street address", "mailing address"}',
  30, 'Primary street address of the association'),

('association_city', 'City', 'static', 'text', 'general_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null, null, 40, null),

('association_state', 'State', 'static', 'text', 'general_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null, null, 50, null),

('association_zip', 'ZIP Code', 'static', 'text', 'general_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null, null, 60, null),

('total_units', 'Total Units', 'static', 'number', 'general_info',
  '{resale_certificate,lender_questionnaire}',
  '{"required": true, "min": 1}', null,
  '{"total units", "number of units", "unit count", "total homes"}',
  70, 'Total number of units/lots in the association'),

('year_built', 'Year Built', 'static', 'number', 'general_info',
  '{lender_questionnaire}',
  null, null,
  '{"year built", "constructed", "construction year", "year of construction"}',
  80, 'Year the project was originally built'),

('year_converted', 'Year Converted', 'static', 'text', 'general_info',
  '{lender_questionnaire}',
  null, null,
  '{"year converted", "conversion date", "converted to condos"}',
  90, 'Year converted to condos/townhomes if applicable (N/A if original construction)'),

('association_ein', 'Tax ID (EIN)', 'static', 'text', 'general_info',
  '{lender_questionnaire}',
  null, null,
  '{"EIN", "tax ID", "employer identification", "federal tax id", "TIN"}',
  100, 'Federal Employer Identification Number for the HOA'),


-- ===========================================
-- SECTION: management — Management company info
-- ===========================================

('manager_name', 'Management Company / Manager', 'periodic', 'text', 'management',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', 180,
  '{"management company", "manager", "property manager", "managed by"}',
  10, 'Name of management company or community manager'),

('manager_email', 'Manager Email', 'periodic', 'text', 'management',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  null, 180,
  '{"manager email", "contact email", "management email"}',
  20, 'Contact email for management'),

('manager_phone', 'Manager Phone', 'periodic', 'text', 'management',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  null, 180,
  '{"manager phone", "contact phone", "management phone"}',
  30, 'Contact phone for management'),

('prepared_by', 'Prepared By', 'transaction', 'text', 'management',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  null, null, null,
  40, 'Name of the person who prepared the document (auto-filled from logged-in user)'),

('prepared_by_title', 'Prepared By Title', 'transaction', 'text', 'management',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  null, null, null,
  50, 'Title of the person who prepared the document'),

('preparation_date', 'Preparation Date', 'transaction', 'date', 'management',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null, null,
  60, 'Date the document was prepared (auto-filled)'),


-- ===========================================
-- SECTION: financials — Assessments, budgets, reserves
-- ===========================================

('monthly_assessment', 'Monthly Assessment', 'periodic', 'currency', 'financials',
  '{resale_certificate,lender_questionnaire}',
  '{"required": true}', 90,
  '{"monthly assessment", "monthly dues", "assessment amount", "HOA fee", "monthly fee"}',
  10, 'Current regular monthly assessment amount per unit'),

('assessment_frequency', 'Assessment Frequency', 'static', 'enum', 'financials',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"assessment frequency", "billing cycle", "dues frequency"}',
  20, 'How often assessments are billed (monthly, quarterly, annually)'),

('annual_budget', 'Annual Operating Budget', 'periodic', 'currency', 'financials',
  '{resale_certificate,lender_questionnaire}',
  null, 365,
  '{"annual budget", "total budget", "operating budget", "annual income"}',
  30, 'Total annual operating budget for the association'),

('reserve_balance', 'Current Reserve Balance', 'periodic', 'currency', 'financials',
  '{resale_certificate,lender_questionnaire}',
  '{"required": true}', 60,
  '{"reserve balance", "reserve fund", "replacement reserve", "capital reserve"}',
  40, 'Current balance in the reserve/replacement fund'),

('percent_funded', 'Percent Funded', 'periodic', 'text', 'financials',
  '{resale_certificate,lender_questionnaire}',
  null, 60,
  '{"percent funded", "funding level", "reserve funding percentage"}',
  50, 'Reserve fund percent funded from the most recent reserve study'),

('reserve_study_date', 'Reserve Study Date', 'periodic', 'date', 'financials',
  '{resale_certificate,lender_questionnaire}',
  null, 365,
  '{"reserve study date", "study date", "reserve analysis date"}',
  60, 'Date of the most recent reserve study'),

('reserve_study_completed', 'Reserve Study Completed?', 'periodic', 'boolean', 'financials',
  '{lender_questionnaire}',
  null, 365,
  '{"reserve study completed", "has reserve study", "study performed"}',
  70, 'Whether a reserve study has been completed'),

('reserve_study_current', 'Reserve Study Current (within 3 years)?', 'periodic', 'text', 'financials',
  '{lender_questionnaire}',
  null, 365,
  '{"study current", "within three years", "recent study"}',
  80, 'Whether the reserve study is current (within 3 years)'),

('annual_reserve_contribution', 'Annual Reserve Contribution', 'periodic', 'currency', 'financials',
  '{lender_questionnaire}',
  null, 365,
  '{"annual reserve contribution", "reserve funding", "annual contribution"}',
  90, 'Annual amount contributed to the reserve fund'),

('transfer_fee', 'Transfer Fee', 'static', 'currency', 'financials',
  '{resale_certificate}',
  null, null,
  '{"transfer fee", "ownership transfer", "sale fee"}',
  100, 'Fee charged when a unit is sold/transferred'),

('capital_contribution', 'Capital Contribution', 'static', 'currency', 'financials',
  '{resale_certificate}',
  null, null,
  '{"capital contribution", "working capital", "buy-in fee"}',
  110, 'One-time capital contribution required at sale'),

('special_assessments_planned', 'Special Assessments Planned?', 'periodic', 'text', 'financials',
  '{lender_questionnaire}',
  null, 90,
  '{"special assessment", "one-time assessment", "additional assessment"}',
  120, 'Whether any special assessments are currently in effect or planned'),

('special_assessment_details', 'Special Assessment Details', 'periodic', 'text', 'financials',
  '{lender_questionnaire}',
  null, 90,
  '{"assessment details", "assessment purpose", "assessment terms"}',
  130, 'Details including amount, purpose, duration, and start date'),

('assessments_adequate', 'Assessments Adequate?', 'periodic', 'text', 'financials',
  '{lender_questionnaire}',
  null, 365,
  '{"assessments adequate", "sufficient funding", "adequacy of assessments"}',
  140, 'Whether current assessments are adequate to meet projected obligations'),


-- ===========================================
-- SECTION: financials_transaction — Per-request financial data
-- ===========================================

('current_balance_due', 'Current Balance Due', 'transaction', 'currency', 'financials_transaction',
  '{resale_certificate}',
  null, null,
  '{"balance due", "current balance", "amount owed"}',
  10, 'Owner''s current outstanding balance'),

('special_assessments_due', 'Special Assessments Due', 'transaction', 'currency', 'financials_transaction',
  '{resale_certificate,payoff_statement}',
  null, null,
  '{"special assessments due", "SA balance"}',
  20, 'Special assessment balance due for this unit'),

('other_fees', 'Other Fees Due at Closing', 'transaction', 'currency', 'financials_transaction',
  '{resale_certificate}',
  null, null, null,
  30, 'Any other fees due at closing (move-in deposit, key fees, etc.)'),

('prorated_assessment', 'Prorated Assessment', 'transaction', 'currency', 'financials_transaction',
  '{resale_certificate}',
  null, null,
  '{"prorated assessment", "prorated dues"}',
  40, 'Prorated assessment amount through closing date'),

('total_due_at_closing', 'Total Due at Closing', 'transaction', 'currency', 'financials_transaction',
  '{resale_certificate}',
  null, null, null,
  50, 'Computed total of all amounts due at closing'),

-- Payoff-specific financial items
('regular_assessments_due', 'Regular Assessments Due', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  60, 'Regular assessments currently owed'),

('past_due_assessments', 'Past Due Assessments', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  70, 'Past-due assessment amount'),

('late_fees', 'Late Fees', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null,
  '{"late fees", "penalty", "late charge"}',
  80, 'Late fees accrued (capped per HB 217)'),

('interest', 'Interest', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  90, 'Interest on delinquent assessments (max 10% per annum)'),

('collection_legal_fees', 'Collection / Legal Fees', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  100, 'Collection and legal fees'),

('return_check_fees', 'Return Check Fees', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  110, 'Fees for returned/bounced checks'),

('lien_recording_fees', 'Lien Recording Fees', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  120, 'Lien recording or release fees'),

('other_charges', 'Other Charges', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  130, 'Any other charges not covered above'),

('total_payoff_amount', 'Total Payoff Amount', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  140, 'Computed total payoff amount'),

('per_diem_amount', 'Daily Per Diem Amount', 'transaction', 'currency', 'financials_transaction',
  '{payoff_statement}',
  null, null,
  '{"per diem", "daily rate", "daily charge"}',
  150, 'Daily per diem amount accruing after good-through date'),

('per_diem_start_date', 'Per Diem Start Date', 'transaction', 'date', 'financials_transaction',
  '{payoff_statement}',
  null, null, null,
  160, 'Date from which per diem begins accruing'),

('good_through_date', 'Good-Through Date', 'transaction', 'date', 'financials_transaction',
  '{payoff_statement}',
  '{"required": true}', null,
  '{"good through", "payoff valid through", "effective date"}',
  170, 'Date through which the payoff amount is valid'),

('valid_through', 'Valid Through', 'transaction', 'date', 'financials_transaction',
  '{resale_certificate}',
  null, null, null,
  180, 'Resale certificate validity expiration (30 days from preparation)'),


-- ===========================================
-- SECTION: payment — Payment instructions
-- ===========================================

('check_payable_to', 'Make Check Payable To', 'static', 'text', 'payment',
  '{payoff_statement}',
  null, null,
  '{"payable to", "make check to", "checks payable"}',
  10, 'Name to make checks payable to'),

('payment_mail_address_line1', 'Payment Mailing Address Line 1', 'static', 'text', 'payment',
  '{payoff_statement}',
  null, null, null, 20, 'First line of payment mailing address'),

('payment_mail_address_line2', 'Payment Mailing Address Line 2', 'static', 'text', 'payment',
  '{payoff_statement}',
  null, null, null, 30, 'Second line of payment mailing address'),

('wire_bank_name', 'Wire Bank Name', 'static', 'text', 'payment',
  '{payoff_statement}',
  null, null,
  '{"bank name", "wire bank", "financial institution"}',
  40, 'Bank name for wire transfers'),

('wire_routing_number', 'Wire Routing Number', 'static', 'text', 'payment',
  '{payoff_statement}',
  null, null,
  '{"routing number", "ABA number", "wire routing"}',
  50, 'Bank routing number for wire transfers'),

('wire_account_number', 'Wire Account Number', 'static', 'text', 'payment',
  '{payoff_statement}',
  null, null,
  '{"account number", "wire account"}',
  60, 'Bank account number for wire transfers'),


-- ===========================================
-- SECTION: insurance — Coverage details
-- ===========================================

('master_policy_carrier', 'Master Policy Carrier', 'periodic', 'text', 'insurance',
  '{resale_certificate,lender_questionnaire}',
  null, 365,
  '{"insurance carrier", "master policy", "hazard insurance", "property insurance"}',
  10, 'Insurance carrier for the master/hazard policy'),

('master_policy_expiration', 'Master Policy Expiration', 'periodic', 'date', 'insurance',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"policy expiration", "renewal date", "insurance expires"}',
  20, 'Expiration date of the master insurance policy'),

('general_liability', 'General Liability Coverage', 'periodic', 'currency', 'insurance',
  '{resale_certificate,lender_questionnaire}',
  null, 365,
  '{"general liability", "liability coverage", "liability amount"}',
  30, 'General liability coverage amount'),

('general_liability_expiration', 'General Liability Expiration', 'periodic', 'date', 'insurance',
  '{lender_questionnaire}',
  null, null,
  '{"liability expiration", "GL expiration"}',
  40, 'Expiration date of general liability coverage'),

('fidelity_bond', 'Fidelity Bond / Crime Coverage', 'periodic', 'currency', 'insurance',
  '{resale_certificate,lender_questionnaire}',
  null, 365,
  '{"fidelity bond", "crime insurance", "employee dishonesty"}',
  50, 'Fidelity bond/crime coverage amount'),

('fidelity_bond_expiration', 'Fidelity Bond Expiration', 'periodic', 'date', 'insurance',
  '{lender_questionnaire}',
  null, null,
  '{"fidelity expiration", "bond expiration"}',
  60, 'Expiration date of fidelity bond'),

('flood_zone', 'Flood Zone', 'static', 'text', 'insurance',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"flood zone", "FEMA flood", "flood designation"}',
  70, 'FEMA flood zone designation'),

('flood_insurance', 'Flood Insurance Coverage', 'periodic', 'text', 'insurance',
  '{resale_certificate,lender_questionnaire}',
  null, 365,
  '{"flood insurance", "flood coverage", "flood policy"}',
  80, 'Flood insurance coverage amount or status'),

('flood_insurance_expiration', 'Flood Insurance Expiration', 'periodic', 'date', 'insurance',
  '{lender_questionnaire}',
  null, null,
  '{"flood expiration", "flood policy renewal"}',
  90, 'Expiration date of flood insurance policy'),

('workers_comp', 'Workers'' Compensation', 'periodic', 'text', 'insurance',
  '{lender_questionnaire}',
  null, 365,
  '{"workers comp", "worker compensation", "work comp"}',
  100, 'Workers'' compensation coverage amount'),

('workers_comp_expiration', 'Workers'' Comp Expiration', 'periodic', 'date', 'insurance',
  '{lender_questionnaire}',
  null, null, null, 110, 'Expiration date of workers'' compensation'),

('umbrella_coverage', 'Umbrella / Excess Coverage', 'periodic', 'currency', 'insurance',
  '{lender_questionnaire}',
  null, 365,
  '{"umbrella", "excess liability", "umbrella policy"}',
  120, 'Umbrella/excess liability coverage amount'),

('umbrella_expiration', 'Umbrella Coverage Expiration', 'periodic', 'date', 'insurance',
  '{lender_questionnaire}',
  null, null, null, 130, 'Expiration date of umbrella coverage'),


-- ===========================================
-- SECTION: restrictions — Policies & restrictions
-- ===========================================

('rental_policy', 'Rental Policy', 'static', 'text', 'restrictions',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"rental", "leasing", "lease", "rent restrictions", "rental policy"}',
  10, 'Rental/leasing policy and restrictions'),

('short_term_rental_policy', 'Short-Term Rental Policy', 'static', 'text', 'restrictions',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"short-term rental", "Airbnb", "VRBO", "vacation rental"}',
  20, 'Short-term rental (< 30 days) policy'),

('rental_cap', 'Rental Cap', 'static', 'text', 'restrictions',
  '{lender_questionnaire}',
  null, null,
  '{"rental cap", "rental limit", "maximum rentals", "rental percentage"}',
  30, 'Maximum percentage or number of units allowed to be rented'),

('pet_policy', 'Pet Policy', 'static', 'text', 'restrictions',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"pet", "animal", "pet restrictions", "pet policy"}',
  40, 'Pet restrictions and policies'),

('parking_policy', 'Parking Policy', 'static', 'text', 'restrictions',
  '{resale_certificate}',
  null, null,
  '{"parking", "garage", "parking restrictions"}',
  50, 'Parking policy and restrictions'),

('age_restrictions', 'Age Restrictions', 'static', 'text', 'restrictions',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"age restriction", "55+", "senior community", "age requirement"}',
  60, 'Age restrictions (e.g., 55+ community)'),

('right_of_first_refusal', 'Right of First Refusal', 'static', 'text', 'restrictions',
  '{resale_certificate,lender_questionnaire}',
  null, null,
  '{"right of first refusal", "ROFR", "first right"}',
  70, 'Whether the association has a right of first refusal on sales'),

('mandatory_membership_fees', 'Mandatory Membership Fees', 'periodic', 'text', 'restrictions',
  '{lender_questionnaire}',
  null, 90,
  '{"mandatory fee", "membership fee", "required fee"}',
  80, 'Description of all mandatory fees for unit owners'),

('commercial_space', 'Commercial Space', 'static', 'text', 'restrictions',
  '{lender_questionnaire}',
  null, null,
  '{"commercial space", "retail space", "commercial area", "mixed use"}',
  90, 'Description and percentage of commercial space in the project'),


-- ===========================================
-- SECTION: legal — Litigation and compliance
-- ===========================================

('in_litigation', 'Pending Litigation?', 'periodic', 'text', 'legal',
  '{resale_certificate,lender_questionnaire}',
  null, 30,
  '{"litigation", "lawsuit", "legal action", "pending case"}',
  10, 'Whether the association is currently involved in litigation'),

('litigation_details', 'Litigation Details', 'periodic', 'text', 'legal',
  '{resale_certificate,lender_questionnaire}',
  null, 30,
  '{"litigation details", "case details", "lawsuit description"}',
  20, 'Description of pending litigation including case number'),

('litigation_safety_related', 'Litigation Safety/Structural Related?', 'periodic', 'text', 'legal',
  '{lender_questionnaire}',
  null, 30,
  '{"safety related", "structural", "defect litigation"}',
  30, 'Whether litigation relates to safety or structural defects'),


-- ===========================================
-- SECTION: owner_info — Transaction-specific owner data
-- ===========================================

('property_address', 'Property Address', 'transaction', 'text', 'owner_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null,
  '{"property address", "unit address", "subject property"}',
  10, 'Full address of the subject property'),

('unit_number', 'Unit / Lot Number', 'transaction', 'text', 'owner_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  null, null,
  '{"unit number", "lot number", "unit #", "apt #"}',
  20, 'Unit or lot number of the subject property'),

('owner_name', 'Owner Name(s)', 'transaction', 'text', 'owner_info',
  '{resale_certificate,payoff_statement,lender_questionnaire,governing_documents}',
  '{"required": true}', null,
  '{"owner name", "homeowner", "property owner", "seller"}',
  30, 'Current owner(s) of record'),

('account_status', 'Account Status', 'transaction', 'text', 'owner_info',
  '{resale_certificate}',
  null, null,
  '{"account status", "payment status", "current", "delinquent"}',
  40, 'Owner''s account status (current, delinquent, collections)'),

('outstanding_violations', 'Outstanding Violations', 'transaction', 'text', 'owner_info',
  '{resale_certificate}',
  null, null,
  '{"violations", "compliance issues", "infractions"}',
  50, 'Any outstanding violations or compliance issues for this unit'),

('unit_restrictions', 'Unit-Specific Restrictions', 'transaction', 'text', 'owner_info',
  '{resale_certificate}',
  null, null, null,
  60, 'Any restrictions or encumbrances specific to this unit'),


-- ===========================================
-- SECTION: request_info — Requester and transaction details
-- ===========================================

('requester_name', 'Requester Name', 'transaction', 'text', 'request_info',
  '{governing_documents}',
  null, null, null,
  10, 'Name of the person who ordered the documents'),

('requester_type', 'Requester Type', 'transaction', 'text', 'request_info',
  '{governing_documents}',
  null, null, null,
  20, 'Role of requester (agent, lender, owner, title company)'),


-- ===========================================
-- SECTION: project — Project completion & control (lender)
-- ===========================================

('phases_complete', 'Phases Complete', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"phases complete", "phases built", "completed phases"}',
  10, 'Number of phases completed'),

('additional_phases_planned', 'Additional Phases Planned?', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"additional phases", "future phases", "planned phases"}',
  20, 'Whether additional phases are planned'),

('project_complete', 'Project Complete?', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"project complete", "construction complete", "fully built"}',
  30, 'Whether the project is fully complete'),

('percent_complete', 'Percent Complete', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"percent complete", "completion percentage"}',
  40, 'Percentage of project completion'),

('developer_in_control', 'Developer Still in Control?', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"developer control", "declarant control", "developer in control"}',
  50, 'Whether the original developer still controls the HOA board'),

('turnover_date', 'Turnover Date', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"turnover date", "control turnover", "board turnover"}',
  60, 'Date control was turned over from developer to homeowners'),

('pending_annexations', 'Pending Additions/Annexations?', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"annexation", "addition", "expansion"}',
  70, 'Whether there are pending additions or annexations to the project'),

('is_conversion', 'Conversion Project?', 'static', 'text', 'project',
  '{lender_questionnaire}',
  null, null,
  '{"conversion", "converted project", "rental conversion"}',
  80, 'Whether the project is a conversion from rental to ownership'),


-- ===========================================
-- SECTION: ownership — Ownership distribution (lender)
-- ===========================================

('owner_occupied_units', 'Owner-Occupied Units', 'periodic', 'number', 'ownership',
  '{lender_questionnaire}',
  null, 30,
  '{"owner occupied", "owner-occupied units", "primary residence"}',
  10, 'Number of owner-occupied units'),

('investor_owned_units', 'Investor-Owned / Rented Units', 'periodic', 'number', 'ownership',
  '{lender_questionnaire}',
  null, 30,
  '{"investor owned", "rented units", "rental units", "non-owner occupied"}',
  20, 'Number of investor-owned or rented units'),

('percent_owner_occupied', 'Percent Owner-Occupied', 'periodic', 'text', 'ownership',
  '{lender_questionnaire}',
  null, 30,
  '{"percent owner occupied", "owner occupancy rate"}',
  30, 'Percentage of units that are owner-occupied'),

('units_single_entity', 'Units Owned by Single Entity', 'periodic', 'number', 'ownership',
  '{lender_questionnaire}',
  null, 30,
  '{"single entity", "single owner", "concentration"}',
  40, 'Number of units owned by a single entity'),

('percent_single_entity', 'Percent Owned by Single Entity', 'periodic', 'text', 'ownership',
  '{lender_questionnaire}',
  null, 30, null, 50, 'Percentage of units owned by a single entity'),

('developer_held_units', 'Developer-Held Units', 'periodic', 'number', 'ownership',
  '{lender_questionnaire}',
  null, 90,
  '{"developer held", "developer owned", "unsold units"}',
  60, 'Number of units still held by the developer'),

('delinquent_units', 'Delinquent Units (60+ days)', 'periodic', 'number', 'ownership',
  '{lender_questionnaire}',
  null, 30,
  '{"delinquent units", "past due units", "60 days delinquent"}',
  70, 'Number of units delinquent 60+ days on assessments'),

('percent_delinquent', 'Percent Delinquent (60+ days)', 'periodic', 'text', 'ownership',
  '{lender_questionnaire}',
  null, 30,
  '{"delinquency rate", "percent delinquent"}',
  80, 'Percentage of units delinquent 60+ days'),


-- ===========================================
-- SECTION: physical — Environmental & safety (lender)
-- ===========================================

('environmental_hazards', 'Environmental Hazards?', 'static', 'text', 'physical',
  '{lender_questionnaire}',
  null, null,
  '{"environmental hazard", "contamination", "hazardous material"}',
  10, 'Known environmental hazards on the property'),

('asbestos', 'Asbestos?', 'static', 'text', 'physical',
  '{lender_questionnaire}',
  null, null,
  '{"asbestos", "asbestos containing", "ACM"}',
  20, 'Presence of asbestos-containing materials'),

('lead_paint', 'Lead-Based Paint?', 'static', 'text', 'physical',
  '{lender_questionnaire}',
  null, null,
  '{"lead paint", "lead-based paint", "lead hazard"}',
  30, 'Presence of lead-based paint (relevant for pre-1978 buildings)'),

('mold_issues', 'Mold Issues?', 'periodic', 'text', 'physical',
  '{lender_questionnaire}',
  null, 365,
  '{"mold", "mold remediation", "mold issue"}',
  40, 'Current or past mold issues and remediation status'),

('fema_disaster', 'FEMA Disaster Area?', 'static', 'text', 'physical',
  '{lender_questionnaire}',
  null, null,
  '{"FEMA", "disaster area", "federal disaster"}',
  50, 'Whether the property is in a FEMA-declared disaster area'),

('structural_deficiencies', 'Structural Deficiencies?', 'periodic', 'text', 'physical',
  '{lender_questionnaire}',
  null, 365,
  '{"structural deficiency", "structural issue", "building defect"}',
  60, 'Known structural deficiencies or issues'),

('deferred_maintenance', 'Deferred Maintenance?', 'periodic', 'text', 'physical',
  '{lender_questionnaire}',
  null, 365,
  '{"deferred maintenance", "maintenance backlog", "needed repairs"}',
  70, 'Description of deferred maintenance items'),

('failed_inspections', 'Failed Inspections?', 'periodic', 'text', 'physical',
  '{lender_questionnaire}',
  null, 365,
  '{"failed inspection", "inspection failure", "code violation"}',
  80, 'Whether any inspections have failed'),


-- ===========================================
-- SECTION: amenities — Common area & services (lender)
-- ===========================================

('common_amenities', 'Common Amenities', 'static', 'text', 'amenities',
  '{lender_questionnaire}',
  null, null,
  '{"amenities", "common areas", "clubhouse", "pool", "fitness"}',
  10, 'List of common amenities and facilities'),

('utilities_included', 'Utilities Included', 'static', 'text', 'amenities',
  '{lender_questionnaire}',
  null, null,
  '{"utilities included", "HOA includes", "services included"}',
  20, 'Utilities and services included in the assessment'),

('fha_approved', 'FHA Approved?', 'static', 'text', 'amenities',
  '{lender_questionnaire}',
  null, null,
  '{"FHA approved", "FHA certification", "FHA eligible"}',
  30, 'FHA approval status and ID number if applicable'),

('va_approved', 'VA Approved?', 'static', 'text', 'amenities',
  '{lender_questionnaire}',
  null, null,
  '{"VA approved", "VA eligible", "VA certification"}',
  40, 'VA approval status'),


-- ===========================================
-- SECTION: governing_docs — Document checklist fields
-- ===========================================

('ccr_status', 'CC&Rs Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null,
  10, 'Inclusion status of the Declaration of CC&Rs'),

('ccr_pages', 'CC&Rs Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 20, 'Page count for CC&Rs document'),

('ccr_amendments_status', 'CC&R Amendments Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 30, 'Inclusion status of CC&R amendments'),

('ccr_amendments_pages', 'CC&R Amendments Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 40, 'Page count for CC&R amendments'),

('bylaws_status', 'Bylaws Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 50, 'Inclusion status of bylaws'),

('bylaws_pages', 'Bylaws Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 60, 'Page count for bylaws document'),

('bylaws_amendments_status', 'Bylaws Amendments Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 70, 'Inclusion status of bylaws amendments'),

('bylaws_amendments_pages', 'Bylaws Amendments Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 80, 'Page count for bylaws amendments'),

('articles_status', 'Articles of Incorporation Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 90, 'Inclusion status of articles of incorporation'),

('articles_pages', 'Articles Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 100, 'Page count for articles of incorporation'),

('rules_status', 'Rules & Regulations Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 110, 'Inclusion status of rules and regulations'),

('rules_pages', 'Rules Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 120, 'Page count for rules and regulations'),

('architectural_guidelines_status', 'Architectural Guidelines Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 130, 'Inclusion status of architectural guidelines'),

('architectural_guidelines_pages', 'Architectural Guidelines Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 140, 'Page count for architectural guidelines'),

('budget_status', 'Current Year Budget Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 150, 'Inclusion status of current year budget'),

('budget_pages', 'Budget Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 160, 'Page count for budget document'),

('financial_statement_status', 'Financial Statement Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 170, 'Inclusion status of most recent financial statement'),

('financial_statement_pages', 'Financial Statement Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 180, 'Page count for financial statement'),

('reserve_study_status', 'Reserve Study Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 190, 'Inclusion status of reserve study'),

('reserve_study_pages', 'Reserve Study Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 200, 'Page count for reserve study'),

('insurance_cert_status', 'Insurance Certificate Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 210, 'Inclusion status of insurance certificate'),

('insurance_cert_pages', 'Insurance Certificate Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 220, 'Page count for insurance certificate'),

('meeting_minutes_status', 'Meeting Minutes Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 230, 'Inclusion status of meeting minutes'),

('meeting_minutes_pages', 'Meeting Minutes Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 240, 'Page count for meeting minutes'),

('plat_map_status', 'Plat/Survey Map Status', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 250, 'Inclusion status of plat/survey map'),

('plat_map_pages', 'Plat/Survey Map Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null, 260, 'Page count for plat/survey map'),

('package_notes', 'Package Notes', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null,
  270, 'Notes about the governing documents package'),

('total_pages', 'Total Pages', 'transaction', 'text', 'governing_docs',
  '{governing_documents}',
  null, null, null,
  280, 'Total page count for the entire governing documents package');
