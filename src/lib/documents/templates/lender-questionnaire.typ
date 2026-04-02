// PropertyDocz — Lender Questionnaire Template
// Fannie Mae Form 1076 / Freddie Mac Form 476

#set page(margin: (top: 0.75in, bottom: 0.75in, left: 0.75in, right: 0.75in), numbering: "1")
#set text(font: "New Computer Modern", size: 9.5pt)
#set par(justify: true, leading: 0.6em)

// --- HEADER ---
#align(center)[
  #text(size: 14pt, weight: "bold")[HOA LENDER QUESTIONNAIRE]
  #v(2pt)
  #text(size: 10pt)[Fannie Mae Form 1076 / Freddie Mac Form 476]
  #v(4pt)
  #text(size: 9pt, fill: rgb("#555"))[Prepared for mortgage lending due diligence]
  #v(10pt)
  #line(length: 100%, stroke: 1pt + rgb("#333"))
]

#v(10pt)

// --- ASSOCIATION INFO ---
#text(size: 11pt, weight: "bold")[Section 1 — Basic Project Information]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*HOA/Project Name:* #{association_name}],
  [*Legal Name:* #{association_legal_name}],
  [*Address:* #{association_address}],
  [*City, State, ZIP:* #{association_city}, #{association_state} #{association_zip}],
  [*Management Company:* #{manager_name}],
  [*Contact Email:* #{manager_email}],
  [*Contact Phone:* #{manager_phone}],
  [*Tax ID (EIN):* #{association_ein}],
  [*Year Built:* #{year_built}],
  [*Year Converted (if applicable):* #{year_converted}],
)

#v(10pt)

// --- UNIT INFO ---
#text(size: 11pt, weight: "bold")[Section 2 — Unit & Project Composition]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*Total Units in Project:* #{total_units}],
  [*Subject Unit:* #{unit_number}],
  [*Property Address:* #{property_address}],
  [*Owner of Record:* #{owner_name}],
  [*Phases Complete:* #{phases_complete}],
  [*Additional Phases Planned:* #{additional_phases_planned}],
)

#v(10pt)

// --- PROJECT COMPLETION ---
#text(size: 11pt, weight: "bold")[Section 3 — Project Completion & Control]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*Is the project complete?* #{project_complete}],
  [*% Complete:* #{percent_complete}],
  [*Developer still in control?* #{developer_in_control}],
  [*Turnover date (if applicable):* #{turnover_date}],
  [*Any pending additions or annexations?* #{pending_annexations}],
  [*Is this a conversion project?* #{is_conversion}],
)

#v(10pt)

// --- OWNERSHIP ---
#text(size: 11pt, weight: "bold")[Section 4 — Ownership Distribution]
#v(6pt)

#table(
  columns: (1fr, auto),
  stroke: 0.5pt + rgb("#ddd"),
  inset: 6pt,
  fill: (_, y) => if y == 0 { rgb("#f5f5f5") } else { none },
  [*Category*], [*Count / %*],
  [Total Units], [#{total_units}],
  [Owner-Occupied Units], [#{owner_occupied_units}],
  [Investor-Owned / Rented Units], [#{investor_owned_units}],
  [% Owner-Occupied], [#{percent_owner_occupied}],
  [Units Owned by Single Entity], [#{units_single_entity}],
  [% Owned by Single Entity], [#{percent_single_entity}],
  [Developer-Held Units], [#{developer_held_units}],
  [Delinquent Units (60+ days)], [#{delinquent_units}],
  [% Delinquent (60+ days)], [#{percent_delinquent}],
)

#v(10pt)

// --- FINANCIAL ---
#text(size: 11pt, weight: "bold")[Section 5 — Financial Information]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*Annual Operating Budget:* #{annual_budget}],
  [*Monthly Assessment (subject unit):* #{monthly_assessment}],
  [*Assessment Frequency:* #{assessment_frequency}],
  [*Any special assessments current or planned?* #{special_assessments_planned}],
  [*Special Assessment Details:* #{special_assessment_details}],
  [*Are assessments adequate to fund reserves?* #{assessments_adequate}],
)

#v(10pt)

// --- RESERVES ---
#text(size: 11pt, weight: "bold")[Section 6 — Reserve Fund]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*Current Reserve Balance:* #{reserve_balance}],
  [*Percent Funded:* #{percent_funded}],
  [*Reserve Study Completed?* #{reserve_study_completed}],
  [*Reserve Study Date:* #{reserve_study_date}],
  [*Is the reserve study current (within 3 years)?* #{reserve_study_current}],
  [*Annual Reserve Contribution:* #{annual_reserve_contribution}],
)

#v(10pt)

// --- INSURANCE ---
#text(size: 11pt, weight: "bold")[Section 7 — Insurance]
#v(6pt)

#table(
  columns: (1fr, auto, auto),
  stroke: 0.5pt + rgb("#ddd"),
  inset: 6pt,
  fill: (_, y) => if y == 0 { rgb("#f5f5f5") } else { none },
  [*Coverage Type*], [*Carrier / Details*], [*Expiration*],
  [Master/Hazard Policy], [#{master_policy_carrier}], [#{master_policy_expiration}],
  [General Liability], [#{general_liability}], [#{general_liability_expiration}],
  [Fidelity Bond / Crime], [#{fidelity_bond}], [#{fidelity_bond_expiration}],
  [Flood Insurance], [#{flood_insurance}], [#{flood_insurance_expiration}],
  [Workers' Compensation], [#{workers_comp}], [#{workers_comp_expiration}],
  [Umbrella / Excess], [#{umbrella_coverage}], [#{umbrella_expiration}],
)

#v(4pt)
*Flood Zone Designation:* #{flood_zone}

#v(10pt)

// --- LITIGATION ---
#text(size: 11pt, weight: "bold")[Section 8 — Litigation]
#v(6pt)

#{if in_litigation == "true" [
  *Is the HOA involved in any current litigation?* Yes \
  *Nature of Litigation:* #{litigation_details} \
  *Is the litigation related to safety, structural integrity, or habitability?* #{litigation_safety_related}
] else [
  *Is the HOA involved in any current litigation?* No
]}

#v(10pt)

// --- RESTRICTIONS ---
#text(size: 11pt, weight: "bold")[Section 9 — Restrictions & Policies]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*Rental Restrictions?* #{rental_policy}],
  [*Short-Term Rental Allowed?* #{short_term_rental_policy}],
  [*Rental Cap (if applicable):* #{rental_cap}],
  [*Right of First Refusal?* #{right_of_first_refusal}],
  [*Age Restrictions?* #{age_restrictions}],
  [*Pet Restrictions?* #{pet_policy}],
  [*Mandatory Membership/Club Fees?* #{mandatory_membership_fees}],
  [*Commercial Space in Project?* #{commercial_space}],
)

#v(10pt)

// --- ENVIRONMENTAL/SAFETY ---
#text(size: 11pt, weight: "bold")[Section 10 — Environmental & Safety]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  [*Known environmental hazards?* #{environmental_hazards}],
  [*Asbestos?* #{asbestos}],
  [*Lead-based paint?* #{lead_paint}],
  [*Mold issues?* #{mold_issues}],
  [*FEMA disaster declaration area?* #{fema_disaster}],
  [*Any structural deficiencies?* #{structural_deficiencies}],
  [*Deferred maintenance issues?* #{deferred_maintenance}],
  [*Failed inspections?* #{failed_inspections}],
)

#v(10pt)

// --- SERVICES ---
#text(size: 11pt, weight: "bold")[Section 11 — Common Area & Services]
#v(6pt)

*Common amenities:* #{common_amenities}
#v(4pt)
*Utilities included in assessment:* #{utilities_included}
#v(4pt)
*Is the project FHA approved?* #{fha_approved} \
*Is the project VA approved?* #{va_approved}

#v(16pt)
#line(length: 100%, stroke: 1pt + rgb("#333"))
#v(8pt)

// --- CERTIFICATION ---
#text(size: 9pt)[
  *CERTIFICATION:* The information provided in this questionnaire is accurate to the best of our knowledge as of the preparation date. This questionnaire is provided for mortgage lending due diligence purposes and is not a guarantee or warranty of any kind.

  #v(4pt)
  *Preparation Date:* #{preparation_date}
]

#v(20pt)

// --- SIGNATURE ---
#grid(
  columns: (1fr, 1fr),
  gutter: 24pt,
  [
    #line(length: 80%, stroke: 0.5pt)
    #v(4pt)
    #text(size: 9pt)[Prepared By: #{prepared_by}]
    #v(2pt)
    #text(size: 9pt)[Date: #{preparation_date}]
  ],
  [
    #line(length: 80%, stroke: 0.5pt)
    #v(4pt)
    #text(size: 9pt)[Title: #{prepared_by_title}]
    #v(2pt)
    #text(size: 9pt)[Phone: #{manager_phone}]
  ],
)
