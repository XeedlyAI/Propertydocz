// PropertyDocz — Payoff Statement Template
// Utah Code §57-8a-106, §57-8a-311

#set page(margin: (top: 1in, bottom: 1in, left: 1in, right: 1in), numbering: "1")
#set text(font: "New Computer Modern", size: 10pt)
#set par(justify: true, leading: 0.65em)

// --- HEADER ---
#align(center)[
  #text(size: 16pt, weight: "bold")[PAYOFF STATEMENT]
  #v(4pt)
  #text(size: 10pt, fill: rgb("#555"))[Pursuant to Utah Code §57-8a-106 & §57-8a-311]
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

// --- PAYOFF AMOUNT TABLE ---
#text(size: 11pt, weight: "bold")[Itemized Amount Due]
#v(6pt)

#table(
  columns: (1fr, auto),
  stroke: 0.5pt + rgb("#ddd"),
  inset: 8pt,
  fill: (_, y) => if y == 0 { rgb("#f5f5f5") } else { none },
  [*Item*], [*Amount*],
  [Regular Assessments Due], [#{regular_assessments_due}],
  [Past Due Assessments], [#{past_due_assessments}],
  [Late Fees], [#{late_fees}],
  [Interest], [#{interest}],
  [Special Assessments Due], [#{special_assessments_due}],
  [Collection/Legal Fees], [#{collection_legal_fees}],
  [Return Check Fees], [#{return_check_fees}],
  [Lien Recording Fees], [#{lien_recording_fees}],
  [Other Charges], [#{other_charges}],
  [Payoff Statement Fee], [#{payoff_statement_fee}],
  table.cell(fill: rgb("#f0f7ff"))[*Total Payoff Amount*],
  table.cell(fill: rgb("#f0f7ff"))[*#{total_payoff_amount}*],
)

#v(8pt)

#text(size: 9pt, fill: rgb("#c00"))[
  *HB 217 Notice:* Late fees and interest are subject to the caps established by Utah HB 217. Late fees may not exceed the greater of \$50 or 10% of the past-due assessment. Interest on delinquent assessments may not exceed 10% per annum. Any late fees or interest included above comply with these statutory limits.
]

#v(12pt)

// --- PER DIEM ---
#text(size: 11pt, weight: "bold")[Per Diem Notice]
#v(6pt)
*Daily Per Diem Amount:* #{per_diem_amount} \
*Per Diem Effective Date:* #{per_diem_start_date}

#v(4pt)
#text(size: 9pt)[
  The per diem amount reflects the daily accrual of assessments and any applicable interest beyond the good-through date. If closing occurs after the good-through date, add the per diem for each additional day.
]

#v(12pt)

// --- GOOD THROUGH DATE ---
#align(center)[
  #rect(
    width: 80%,
    inset: 12pt,
    stroke: 2pt + rgb("#333"),
    fill: rgb("#fffde7"),
  )[
    #align(center)[
      #text(size: 12pt, weight: "bold")[GOOD THROUGH DATE: #{good_through_date}]
      #v(4pt)
      #text(size: 9pt)[This payoff statement is valid through the date above. After this date, additional per diem charges will apply.]
    ]
  ]
]

#v(12pt)

// --- PAYMENT INSTRUCTIONS ---
#text(size: 11pt, weight: "bold")[Payment Instructions]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 16pt,
  [
    *Check Payment:*
    #v(4pt)
    Make payable to: #{check_payable_to} \
    Mail to: \
    #{payment_mail_address_line1} \
    #{payment_mail_address_line2}
    #v(4pt)
    Reference: #{owner_name} — #{unit_number}
  ],
  [
    *Wire Transfer:*
    #v(4pt)
    Bank: #{wire_bank_name} \
    Routing: #{wire_routing_number} \
    Account: #{wire_account_number} \
    Reference: #{owner_name} — #{unit_number}
  ],
)

#v(20pt)
#line(length: 100%, stroke: 1pt + rgb("#333"))
#v(8pt)

// --- CERTIFICATION ---
#text(size: 9pt)[
  *CERTIFICATION:* This Payoff Statement is prepared in accordance with the Utah Community Association Act, Utah Code §57-8a-106 and §57-8a-311.

  #v(6pt)
  *Fee Cap Notice (§57-8a-106):* The fee charged for preparing this statement does not exceed \$50.00, as required by Utah Code §57-8a-106. If you believe this fee exceeds the statutory cap, contact the Utah Division of Real Estate.

  #v(6pt)
  This statement represents the amounts due to the association as of the preparation date. The association reserves the right to amend this statement if additional charges accrue or errors are discovered. This statement does not constitute a release of lien.

  #v(6pt)
  Pursuant to §57-8a-227(1)(b), Social Security numbers and bank account numbers of owners have been redacted from this document.
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
    #text(size: 9pt)[Good Through: #{good_through_date}]
  ],
)
