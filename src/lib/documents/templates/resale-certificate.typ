// PropertyDocz — Resale Certificate Template
// Utah Code §57-8a-227

#set page(margin: (top: 1in, bottom: 1in, left: 1in, right: 1in), numbering: "1")
#set text(font: "New Computer Modern", size: 10pt)
#set par(justify: true, leading: 0.65em)

// --- HEADER ---
#align(center)[
  #text(size: 16pt, weight: "bold")[RESALE CERTIFICATE]
  #v(4pt)
  #text(size: 10pt, fill: rgb("#555"))[Pursuant to Utah Code §57-8a-227]
  #v(12pt)
  #line(length: 100%, stroke: 1pt + rgb("#333"))
]

#v(12pt)

// --- ASSOCIATION INFO ---
#text(size: 12pt, weight: "bold")[#{association_name}]
#v(4pt)
#{association_address} \
#{association_city}, #{association_state} #{association_zip}
#v(4pt)
*Management Company:* #{manager_name} \
*Contact:* #{manager_email} #h(1em) #{manager_phone}

#v(12pt)
#line(length: 100%, stroke: 0.5pt + rgb("#ccc"))
#v(8pt)

// --- PROPERTY INFO ---
#text(size: 11pt, weight: "bold")[Property Information]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [*Property Address:* #{property_address}],
  [*Unit/Lot:* #{unit_number}],
  [*Owner of Record:* #{owner_name}],
  [*Preparation Date:* #{preparation_date}],
)

#v(12pt)

// --- ASSESSMENT TABLE ---
#text(size: 11pt, weight: "bold")[Assessment & Financial Summary]
#v(6pt)

#table(
  columns: (1fr, auto),
  stroke: 0.5pt + rgb("#ddd"),
  inset: 8pt,
  fill: (_, y) => if y == 0 { rgb("#f5f5f5") } else { none },
  [*Item*], [*Amount*],
  [Monthly Assessment], [#{monthly_assessment}],
  [Assessment Frequency], [#{assessment_frequency}],
  [Current Balance Due], [#{current_balance_due}],
  [Special Assessments Due], [#{special_assessments_due}],
  [Transfer Fee], [#{transfer_fee}],
  [Capital Contribution], [#{capital_contribution}],
  [Other Fees Due at Closing], [#{other_fees}],
  [Prorated Assessment], [#{prorated_assessment}],
  table.cell(fill: rgb("#f0f7ff"))[*Total Due at Closing*],
  table.cell(fill: rgb("#f0f7ff"))[*#{total_due_at_closing}*],
)

#v(12pt)

// --- ACCOUNT STATUS ---
#text(size: 11pt, weight: "bold")[Account Status]
#v(6pt)
*Status:* #{account_status}
#v(4pt)
*Outstanding Violations:* #{outstanding_violations}

#v(12pt)

// --- GOVERNING DOCUMENTS ---
#text(size: 11pt, weight: "bold")[Governing Documents Status]
#v(6pt)

#table(
  columns: (1fr, auto),
  stroke: 0.5pt + rgb("#ddd"),
  inset: 8pt,
  fill: (_, y) => if y == 0 { rgb("#f5f5f5") } else { none },
  [*Document*], [*Status*],
  [CC&Rs (Declaration)], [Recorded],
  [Bylaws], [On File],
  [Rules & Regulations], [On File],
  [Current Year Budget], [Approved],
  [Insurance Certificate], [Current],
)

#v(12pt)

// --- INSURANCE ---
#text(size: 11pt, weight: "bold")[Insurance Information]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [*Master Policy Carrier:* #{master_policy_carrier}],
  [*Policy Expiration:* #{master_policy_expiration}],
  [*General Liability:* #{general_liability}],
  [*Fidelity Bond:* #{fidelity_bond}],
  [*Flood Zone:* #{flood_zone}],
  [*Flood Insurance:* #{flood_insurance}],
)

#v(12pt)

// --- RESERVES ---
#text(size: 11pt, weight: "bold")[Reserve Fund]
#v(6pt)

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 8pt,
  [*Reserve Balance:* #{reserve_balance}],
  [*Percent Funded:* #{percent_funded}],
  [*Study Date:* #{reserve_study_date}],
)

#v(4pt)
*Annual Budget:* #{annual_budget}

#v(12pt)

// --- RESTRICTIONS & POLICIES ---
#text(size: 11pt, weight: "bold")[Restrictions & Policies]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [*Rental Policy:* #{rental_policy}],
  [*Short-Term Rental:* #{short_term_rental_policy}],
  [*Pet Policy:* #{pet_policy}],
  [*Parking:* #{parking_policy}],
  [*Age Restrictions:* #{age_restrictions}],
  [*Right of First Refusal:* #{right_of_first_refusal}],
)

#v(4pt)
*Unit-Specific Restrictions:* #{unit_restrictions}

#v(12pt)

// --- LITIGATION ---
#text(size: 11pt, weight: "bold")[Litigation Status]
#v(6pt)

*Pending Litigation:* #{in_litigation} \
*Details:* #{litigation_details}

#v(20pt)
#line(length: 100%, stroke: 1pt + rgb("#333"))
#v(8pt)

// --- CERTIFICATION ---
#text(size: 9pt)[
  *CERTIFICATION:* This Resale Certificate is prepared in accordance with the Utah Community Association Act, Utah Code §57-8a-227. The information contained herein is believed to be accurate as of the date of preparation. This certificate is valid for thirty (30) days from the preparation date.

  #v(6pt)
  Pursuant to §57-8a-227(1)(b), Social Security numbers and bank account numbers have been redacted from this document.

  #v(6pt)
  This certificate does not constitute a guarantee or warranty of any kind. The recipient should conduct their own due diligence regarding the property and association.
]

#v(24pt)

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
    #text(size: 9pt)[Valid Through: #{valid_through}]
  ],
)
