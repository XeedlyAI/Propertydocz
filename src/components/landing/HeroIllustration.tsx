export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 700 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Architectural illustration of a house for sale with property documents"
    >
      {/* ═══════════════════════════════════════════
          LEFT HALF — HOUSE WITH FOR-SALE SIGN
          ═══════════════════════════════════════════ */}

      {/* ── Ground line ── */}
      <line x1="0" y1="480" x2="360" y2="480" stroke="#94a3b8" strokeWidth="2" />

      {/* ── Grass texture marks ── */}
      <g stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round">
        <line x1="15" y1="480" x2="20" y2="474" />
        <line x1="22" y1="480" x2="26" y2="475" />
        <line x1="55" y1="480" x2="60" y2="474" />
        <line x1="62" y1="480" x2="65" y2="476" />
        <line x1="240" y1="480" x2="244" y2="474" />
        <line x1="248" y1="480" x2="253" y2="475" />
        <line x1="290" y1="480" x2="295" y2="474" />
        <line x1="300" y1="480" x2="303" y2="476" />
        <line x1="330" y1="480" x2="335" y2="475" />
        <line x1="340" y1="480" x2="343" y2="476" />
      </g>

      {/* ── Walkway to door (dashed) ── */}
      <path d="M160 480 L160 500 Q160 510 170 510 L210 510 Q220 510 220 500 L220 480" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />

      {/* ═══ THE HOUSE — Craftsman style ═══ */}

      {/* Foundation */}
      <rect x="70" y="465" width="240" height="15" stroke="#94a3b8" strokeWidth="2" fill="none" />
      {/* Foundation texture lines */}
      <line x1="80" y1="472" x2="300" y2="472" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Main structure */}
      <rect x="70" y="260" width="240" height="205" stroke="#94a3b8" strokeWidth="2.5" fill="none" />

      {/* ── Roof — gable with overhang ── */}
      <path d="M55 260 L190 130 L325 260" stroke="#94a3b8" strokeWidth="3" fill="none" strokeLinejoin="round" />
      {/* Roof overhang eave line */}
      <line x1="60" y1="260" x2="320" y2="260" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Roof ridge cap */}
      <line x1="175" y1="140" x2="205" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />
      {/* Roof shingle lines */}
      <line x1="100" y1="220" x2="280" y2="220" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="85" y1="240" x2="295" y2="240" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="115" y1="200" x2="265" y2="200" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="135" y1="180" x2="245" y2="180" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="155" y1="160" x2="225" y2="160" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Gable window (attic) */}
      <circle cx="190" cy="200" r="18" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <line x1="190" y1="182" x2="190" y2="218" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="172" y1="200" x2="208" y2="200" stroke="#cbd5e1" strokeWidth="1" />

      {/* ── Second floor windows ── */}
      {/* Window left */}
      <rect x="95" y="280" width="50" height="60" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
      <line x1="120" y1="280" x2="120" y2="340" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="95" y1="310" x2="145" y2="310" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Window sill */}
      <line x1="90" y1="342" x2="150" y2="342" stroke="#94a3b8" strokeWidth="2" />
      {/* Window header */}
      <line x1="90" y1="278" x2="150" y2="278" stroke="#94a3b8" strokeWidth="2" />

      {/* Window right */}
      <rect x="235" y="280" width="50" height="60" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
      <line x1="260" y1="280" x2="260" y2="340" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="235" y1="310" x2="285" y2="310" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Window sill */}
      <line x1="230" y1="342" x2="290" y2="342" stroke="#94a3b8" strokeWidth="2" />
      {/* Window header */}
      <line x1="230" y1="278" x2="290" y2="278" stroke="#94a3b8" strokeWidth="2" />

      {/* ── Front porch ── */}
      {/* Porch roof */}
      <line x1="100" y1="365" x2="280" y2="365" stroke="#94a3b8" strokeWidth="2.5" />
      {/* Porch columns */}
      <rect x="108" y="365" width="8" height="100" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      <rect x="264" y="365" width="8" height="100" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      {/* Porch railing */}
      <line x1="116" y1="425" x2="160" y2="425" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="220" y1="425" x2="264" y2="425" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Railing balusters left */}
      <line x1="126" y1="425" x2="126" y2="465" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="138" y1="425" x2="138" y2="465" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="150" y1="425" x2="150" y2="465" stroke="#cbd5e1" strokeWidth="1" />
      {/* Railing balusters right */}
      <line x1="230" y1="425" x2="230" y2="465" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="242" y1="425" x2="242" y2="465" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="254" y1="425" x2="254" y2="465" stroke="#cbd5e1" strokeWidth="1" />
      {/* Porch floor */}
      <line x1="100" y1="465" x2="280" y2="465" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Steps */}
      <rect x="155" y="465" width="70" height="6" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      <rect x="150" y="471" width="80" height="6" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
      <rect x="145" y="477" width="90" height="4" stroke="#cbd5e1" strokeWidth="1" fill="none" />

      {/* ── Front door ── */}
      <rect x="165" y="380" width="50" height="85" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
      {/* Door panels */}
      <rect x="172" y="387" width="36" height="30" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
      <rect x="172" y="425" width="36" height="30" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
      {/* Door knob */}
      <circle cx="205" cy="425" r="3.5" fill="#94a3b8" />

      {/* ── Chimney ── */}
      <rect x="255" y="150" width="22" height="80" stroke="#94a3b8" strokeWidth="2" fill="none" />
      {/* Chimney cap */}
      <line x1="250" y1="150" x2="282" y2="150" stroke="#94a3b8" strokeWidth="2.5" />
      {/* Chimney brick lines */}
      <line x1="255" y1="165" x2="277" y2="165" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="255" y1="180" x2="277" y2="180" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="255" y1="195" x2="277" y2="195" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="266" y1="150" x2="266" y2="165" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="266" y1="180" x2="266" y2="195" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* ── Landscaping — bushes ── */}
      {/* Left bush */}
      <ellipse cx="85" cy="470" rx="20" ry="14" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      <ellipse cx="75" cy="472" rx="12" ry="10" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      {/* Right bush */}
      <ellipse cx="295" cy="470" rx="20" ry="14" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      <ellipse cx="305" cy="472" rx="12" ry="10" stroke="#cbd5e1" strokeWidth="1" fill="none" />

      {/* ═══ FOR SALE SIGN — Large, prominent ═══ */}
      <g>
        {/* Sign post — vertical */}
        <line x1="30" y1="290" x2="30" y2="480" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        {/* Horizontal arm */}
        <line x1="26" y1="290" x2="80" y2="290" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
        {/* Decorative finial on post top */}
        <circle cx="30" cy="286" r="5" stroke="#94a3b8" strokeWidth="2" fill="none" />

        {/* Main sign panel */}
        <rect x="14" y="296" width="66" height="60" rx="4" stroke="#38b6ff" strokeWidth="3" fill="none" />
        {/* Inner border */}
        <rect x="20" y="302" width="54" height="48" rx="2" stroke="#38b6ff" strokeWidth="1" fill="none" />

        {/* "HOUSE" text */}
        <text x="47" y="322" textAnchor="middle" fill="#38b6ff" fontSize="13" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" letterSpacing="1">HOUSE</text>
        {/* "FOR SALE" text */}
        <text x="47" y="340" textAnchor="middle" fill="#38b6ff" fontSize="14" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" letterSpacing="1.5">FOR SALE</text>

        {/* Hanging rider sign below */}
        <rect x="22" y="362" width="50" height="22" rx="2" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        {/* Hanging chains */}
        <line x1="30" y1="356" x2="30" y2="362" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="64" y1="356" x2="64" y2="362" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Agent text lines */}
        <line x1="30" y1="370" x2="64" y2="370" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="34" y1="378" x2="60" y2="378" stroke="#cbd5e1" strokeWidth="0.8" />
      </g>


      {/* ═══════════════════════════════════════════
          RIGHT HALF — SCATTERED DOCUMENTS
          ═══════════════════════════════════════════ */}

      {/* ── Document 1: Resale Certificate (top-left, slight rotation) ── */}
      <g transform="translate(385, 40) rotate(-3)">
        <rect x="0" y="0" width="130" height="170" stroke="#94a3b8" strokeWidth="2.5" fill="white" rx="4" />
        {/* Header bar */}
        <rect x="0" y="0" width="130" height="28" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
        <rect x="0" y="14" width="130" height="14" stroke="none" fill="none" />
        <text x="65" y="19" textAnchor="middle" fill="#38b6ff" fontSize="9" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">RESALE CERTIFICATE</text>
        {/* Content lines */}
        <line x1="12" y1="42" x2="118" y2="42" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="12" y1="54" x2="100" y2="54" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="66" x2="110" y2="66" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="78" x2="95" y2="78" stroke="#cbd5e1" strokeWidth="1" />
        {/* Separator */}
        <line x1="12" y1="92" x2="118" y2="92" stroke="#94a3b8" strokeWidth="0.8" />
        {/* More content */}
        <line x1="12" y1="106" x2="105" y2="106" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="118" x2="115" y2="118" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="130" x2="90" y2="130" stroke="#cbd5e1" strokeWidth="1" />
        {/* Signature area */}
        <line x1="12" y1="152" x2="60" y2="152" stroke="#94a3b8" strokeWidth="1.2" />
        <text x="12" y="163" fill="#cbd5e1" fontSize="6" fontFamily="Inter, system-ui, sans-serif">Signature</text>
        <line x1="75" y1="152" x2="118" y2="152" stroke="#94a3b8" strokeWidth="1.2" />
        <text x="75" y="163" fill="#cbd5e1" fontSize="6" fontFamily="Inter, system-ui, sans-serif">Date</text>
      </g>

      {/* ── Document 2: Property Disclosure (top-right, opposite rotation) ── */}
      <g transform="translate(530, 55) rotate(4)">
        <rect x="0" y="0" width="130" height="170" stroke="#94a3b8" strokeWidth="2.5" fill="white" rx="4" />
        {/* Header */}
        <rect x="0" y="0" width="130" height="28" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
        <text x="65" y="12" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">PROPERTY DISCLOSURE</text>
        <text x="65" y="23" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">STATEMENT</text>
        {/* Checkbox section */}
        <text x="12" y="44" fill="#94a3b8" fontSize="7" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">APPLIANCES</text>
        <rect x="12" y="50" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <rect x="28" y="50" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <rect x="44" y="50" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <line x1="24" y1="56" x2="26" y2="56" stroke="#cbd5e1" strokeWidth="0.5" />
        {/* Check marks in boxes */}
        <path d="M14 54 L16 57 L19 52" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M30 54 L32 57 L35 52" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        <text x="12" y="76" fill="#94a3b8" fontSize="7" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">ROOF</text>
        <rect x="12" y="82" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <rect x="28" y="82" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <path d="M14 86 L16 89 L19 84" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        <text x="12" y="108" fill="#94a3b8" fontSize="7" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">PLUMBING</text>
        <rect x="12" y="114" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <rect x="28" y="114" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <rect x="44" y="114" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        {/* Label lines next to checkboxes */}
        <line x1="58" y1="56" x2="90" y2="56" stroke="#cbd5e1" strokeWidth="0.8" />
        <line x1="58" y1="88" x2="85" y2="88" stroke="#cbd5e1" strokeWidth="0.8" />
        <line x1="58" y1="120" x2="95" y2="120" stroke="#cbd5e1" strokeWidth="0.8" />
        {/* Right column labels */}
        <text x="72" y="44" fill="#94a3b8" fontSize="7" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">WINDOWS</text>
        <rect x="72" y="50" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        <rect x="88" y="50" width="8" height="8" stroke="#cbd5e1" strokeWidth="1" fill="none" rx="1" />
        {/* Signature */}
        <line x1="12" y1="152" x2="60" y2="152" stroke="#94a3b8" strokeWidth="1.2" />
        <line x1="75" y1="152" x2="118" y2="152" stroke="#94a3b8" strokeWidth="1.2" />
      </g>

      {/* ── Document 3: Payoff Statement (middle, overlapping) ── */}
      <g transform="translate(400, 230) rotate(-2)">
        <rect x="0" y="0" width="130" height="170" stroke="#94a3b8" strokeWidth="2.5" fill="white" rx="4" />
        {/* Header */}
        <rect x="0" y="0" width="130" height="28" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
        <text x="65" y="19" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">PAYOFF STATEMENT</text>
        {/* Amount section */}
        <text x="12" y="48" fill="#94a3b8" fontSize="7" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">BALANCE DUE</text>
        <rect x="12" y="52" width="106" height="20" stroke="#cbd5e1" strokeWidth="1.2" fill="none" rx="2" />
        <text x="95" y="66" textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">$2,847.50</text>
        {/* Line items */}
        <line x1="12" y1="84" x2="80" y2="84" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="90" y1="84" x2="118" y2="84" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="96" x2="80" y2="96" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="90" y1="96" x2="118" y2="96" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="108" x2="80" y2="108" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="90" y1="108" x2="118" y2="108" stroke="#cbd5e1" strokeWidth="1" />
        {/* Total line */}
        <line x1="12" y1="122" x2="118" y2="122" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="12" y1="136" x2="70" y2="136" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="90" y1="136" x2="118" y2="136" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Signature */}
        <line x1="12" y1="155" x2="55" y2="155" stroke="#94a3b8" strokeWidth="1.2" />
        <line x1="75" y1="155" x2="118" y2="155" stroke="#94a3b8" strokeWidth="1.2" />
      </g>

      {/* ── Document 4: Lender Questionnaire (middle-right) ── */}
      <g transform="translate(550, 250) rotate(5)">
        <rect x="0" y="0" width="130" height="170" stroke="#94a3b8" strokeWidth="2.5" fill="white" rx="4" />
        {/* Header */}
        <rect x="0" y="0" width="130" height="28" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
        <text x="65" y="12" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">LENDER</text>
        <text x="65" y="23" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">QUESTIONNAIRE</text>
        {/* Q&A lines */}
        <text x="12" y="45" fill="#94a3b8" fontSize="6" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">Q1.</text>
        <line x1="26" y1="45" x2="118" y2="45" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="56" x2="118" y2="56" stroke="#cbd5e1" strokeWidth="0.8" />
        <text x="12" y="72" fill="#94a3b8" fontSize="6" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">Q2.</text>
        <line x1="26" y1="72" x2="118" y2="72" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="83" x2="118" y2="83" stroke="#cbd5e1" strokeWidth="0.8" />
        <text x="12" y="99" fill="#94a3b8" fontSize="6" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">Q3.</text>
        <line x1="26" y1="99" x2="118" y2="99" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="110" x2="118" y2="110" stroke="#cbd5e1" strokeWidth="0.8" />
        <text x="12" y="126" fill="#94a3b8" fontSize="6" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">Q4.</text>
        <line x1="26" y1="126" x2="118" y2="126" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="137" x2="100" y2="137" stroke="#cbd5e1" strokeWidth="0.8" />
        {/* Signature */}
        <line x1="12" y1="155" x2="55" y2="155" stroke="#94a3b8" strokeWidth="1.2" />
        <line x1="75" y1="155" x2="118" y2="155" stroke="#94a3b8" strokeWidth="1.2" />
      </g>

      {/* ── Document 5: Governing Docs (bottom, overlapping) ── */}
      <g transform="translate(430, 415) rotate(-4)">
        <rect x="0" y="0" width="130" height="110" stroke="#94a3b8" strokeWidth="2.5" fill="white" rx="4" />
        {/* Header */}
        <rect x="0" y="0" width="130" height="28" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
        <text x="65" y="12" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">GOVERNING</text>
        <text x="65" y="23" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">DOCUMENTS</text>
        {/* Content lines */}
        <line x1="12" y1="42" x2="100" y2="42" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="54" x2="110" y2="54" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="66" x2="90" y2="66" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="78" x2="105" y2="78" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="90" x2="95" y2="90" stroke="#cbd5e1" strokeWidth="1" />
      </g>

      {/* ── Gold checkmark overlay on Resale Certificate ── */}
      <g transform="translate(470, 150)">
        <circle cx="0" cy="0" r="18" stroke="#F5A623" strokeWidth="2.5" fill="white" />
        <path d="M-8 0 L-3 6 L9 -6" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* ── "APPROVED" stamp on Payoff Statement ── */}
      <g transform="translate(480, 360) rotate(-8)">
        <rect x="-35" y="-12" width="70" height="24" rx="3" stroke="#14b8a6" strokeWidth="2" fill="none" />
        <text x="0" y="4" textAnchor="middle" fill="#14b8a6" fontSize="11" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" letterSpacing="2">APPROVED</text>
      </g>

      {/* ── Connecting arrow from house to documents ── */}
      <g>
        <path d="M330 300 C360 300, 365 260, 390 180" stroke="#38b6ff" strokeWidth="2" strokeDasharray="8 5" fill="none" />
        <path d="M385 185 L392 176 L388 190 Z" fill="#38b6ff" />
      </g>

      {/* ═══ SKY DETAILS ═══ */}
      {/* Cloud wisps */}
      <path d="M90 60 Q120 42, 150 60 Q168 44, 195 60" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
      <path d="M200 85 Q225 70, 250 85 Q265 72, 285 85" stroke="#cbd5e1" strokeWidth="1" fill="none" />

      {/* Sun */}
      <circle cx="330" cy="55" r="22" stroke="#F5A623" strokeWidth="2" fill="none" />
      <line x1="330" y1="25" x2="330" y2="16" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="330" y1="85" x2="330" y2="94" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="300" y1="55" x2="291" y2="55" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="360" y1="55" x2="369" y2="55" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="314" y1="39" x2="308" y2="33" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="346" y1="71" x2="352" y2="77" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="346" y1="39" x2="352" y2="33" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="314" y1="71" x2="308" y2="77" stroke="#F5A623" strokeWidth="1.5" />

      {/* ── Dimension lines (architectural style) ── */}
      {/* Vertical dimension left */}
      <line x1="50" y1="130" x2="50" y2="260" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="46" y1="130" x2="54" y2="130" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="46" y1="260" x2="54" y2="260" stroke="#cbd5e1" strokeWidth="0.8" />
    </svg>
  );
}
