// PropertyDocz — Governing Documents Cover Sheet
// Cover page + document checklist for governing document packages

#set page(margin: (top: 1in, bottom: 1in, left: 1in, right: 1in), numbering: "1")
#set text(font: "New Computer Modern", size: 10pt)
#set par(justify: true, leading: 0.65em)

// --- HEADER ---
#align(center)[
  #text(size: 16pt, weight: "bold")[GOVERNING DOCUMENTS PACKAGE]
  #v(4pt)
  #text(size: 10pt, fill: rgb("#555"))[Association Governing Document Compilation]
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
#text(size: 11pt, weight: "bold")[Prepared For]
#v(6pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [*Property Address:* #{property_address}],
  [*Unit/Lot:* #{unit_number}],
  [*Owner of Record:* #{owner_name}],
  [*Preparation Date:* #{preparation_date}],
  [*Requested By:* #{requester_name}],
  [*Requester Type:* #{requester_type}],
)

#v(16pt)

// --- DOCUMENT CHECKLIST ---
#text(size: 11pt, weight: "bold")[Document Checklist]
#v(4pt)
#text(size: 9pt, fill: rgb("#555"))[The following documents are included in or referenced by this package.]
#v(8pt)

#table(
  columns: (auto, 1fr, auto, auto),
  stroke: 0.5pt + rgb("#ddd"),
  inset: 8pt,
  fill: (_, y) => if y == 0 { rgb("#f5f5f5") } else { none },
  [*\#*], [*Document*], [*Status*], [*Pages*],
  [1], [Declaration of Covenants, Conditions & Restrictions (CC&Rs)], [#{ccr_status}], [#{ccr_pages}],
  [2], [CC&R Amendments], [#{ccr_amendments_status}], [#{ccr_amendments_pages}],
  [3], [Bylaws], [#{bylaws_status}], [#{bylaws_pages}],
  [4], [Bylaws Amendments], [#{bylaws_amendments_status}], [#{bylaws_amendments_pages}],
  [5], [Articles of Incorporation], [#{articles_status}], [#{articles_pages}],
  [6], [Rules & Regulations], [#{rules_status}], [#{rules_pages}],
  [7], [Architectural Guidelines], [#{architectural_guidelines_status}], [#{architectural_guidelines_pages}],
  [8], [Current Year Budget], [#{budget_status}], [#{budget_pages}],
  [9], [Most Recent Financial Statement], [#{financial_statement_status}], [#{financial_statement_pages}],
  [10], [Reserve Study], [#{reserve_study_status}], [#{reserve_study_pages}],
  [11], [Insurance Certificate], [#{insurance_cert_status}], [#{insurance_cert_pages}],
  [12], [Meeting Minutes (most recent annual)], [#{meeting_minutes_status}], [#{meeting_minutes_pages}],
  [13], [Plat/Survey Map], [#{plat_map_status}], [#{plat_map_pages}],
)

#v(12pt)

// --- STATUS LEGEND ---
#rect(
  width: 100%,
  inset: 10pt,
  stroke: 0.5pt + rgb("#ddd"),
  fill: rgb("#fafafa"),
)[
  #text(size: 9pt, weight: "bold")[Status Legend]
  #v(4pt)
  #grid(
    columns: (1fr, 1fr, 1fr, 1fr),
    gutter: 4pt,
    text(size: 8.5pt)[✓ *Included* — in package],
    text(size: 8.5pt)[⊘ *Not Available* — not on file],
    text(size: 8.5pt)[◎ *On File* — available on request],
    text(size: 8.5pt)[△ *Not Applicable*],
  )
]

#v(12pt)

// --- NOTES ---
#{if package_notes != "" [
  #text(size: 11pt, weight: "bold")[Notes]
  #v(6pt)
  #{package_notes}
  #v(12pt)
]}

// --- TOTAL PAGES ---
#align(center)[
  #rect(
    width: 60%,
    inset: 10pt,
    stroke: 1pt + rgb("#333"),
    fill: rgb("#f5f5f5"),
  )[
    #align(center)[
      #text(size: 11pt, weight: "bold")[Total Package: #{total_pages} pages]
    ]
  ]
]

#v(20pt)
#line(length: 100%, stroke: 1pt + rgb("#333"))
#v(8pt)

// --- CERTIFICATION ---
#text(size: 9pt)[
  *NOTICE:* This governing documents package has been compiled by the association's management company for the benefit of the requesting party. The documents included are believed to be the most current versions on file as of the preparation date.

  #v(6pt)
  The recipient is advised that governing documents may be amended from time to time. This package does not guarantee completeness. The recipient should verify with the county recorder's office that no additional amendments to the CC&Rs or plat have been recorded after the date of this package.

  #v(6pt)
  Documents in this package are the property of #{association_name} and are provided for the sole use of the requesting party in connection with a real estate transaction or lending decision. Unauthorized reproduction or distribution is prohibited.
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
    #text(size: 9pt)[Phone: #{manager_phone}]
  ],
)
