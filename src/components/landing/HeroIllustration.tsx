export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 680 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of HOA document ordering process across three properties"
    >
      {/* ═══ GROUND LINE ═══ */}
      <line x1="0" y1="440" x2="680" y2="440" stroke="#94a3b8" strokeWidth="2.5" />

      {/* ═══ PATHWAY (dashed) ═══ */}
      <path
        d="M10 440 L670 440"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="10 6"
      />

      {/* ═══ LANDSCAPING ═══ */}
      {/* Shrubs between houses */}
      <circle cx="210" cy="428" r="14" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      <circle cx="228" cy="422" r="10" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
      <circle cx="450" cy="428" r="14" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
      <circle cx="468" cy="422" r="10" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />

      {/* Fence sections — between house 1 and 2 */}
      <g stroke="#cbd5e1" strokeWidth="1.5">
        <line x1="240" y1="440" x2="240" y2="408" />
        <line x1="256" y1="440" x2="256" y2="408" />
        <line x1="272" y1="440" x2="272" y2="408" />
        <line x1="237" y1="418" x2="275" y2="418" />
        <line x1="237" y1="430" x2="275" y2="430" />
      </g>
      {/* Fence sections — between house 2 and 3 */}
      <g stroke="#cbd5e1" strokeWidth="1.5">
        <line x1="420" y1="440" x2="420" y2="408" />
        <line x1="436" y1="440" x2="436" y2="408" />
        <line x1="452" y1="440" x2="452" y2="408" />
        <line x1="417" y1="418" x2="455" y2="418" />
        <line x1="417" y1="430" x2="455" y2="430" />
      </g>

      {/* ═══ HOUSE 1 — FOR SALE ═══ */}
      <g>
        {/* Main structure — 180px wide */}
        <rect x="30" y="240" width="180" height="200" stroke="#94a3b8" strokeWidth="3" fill="none" rx="2" />
        {/* Roof — pitched */}
        <path d="M20 240 L120 155 L220 240" stroke="#94a3b8" strokeWidth="3" fill="none" />
        {/* Roof ridge detail */}
        <line x1="85" y1="185" x2="155" y2="185" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Windows — top floor */}
        <rect x="50" y="265" width="42" height="38" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <rect x="148" y="265" width="42" height="38" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        {/* Window cross panes */}
        <line x1="71" y1="265" x2="71" y2="303" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="50" y1="284" x2="92" y2="284" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="169" y1="265" x2="169" y2="303" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="148" y1="284" x2="190" y2="284" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Door */}
        <rect x="100" y="380" width="38" height="60" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <circle cx="130" cy="412" r="3" fill="#94a3b8" />
        {/* Steps */}
        <rect x="94" y="438" width="50" height="6" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
      </g>

      {/* ── FOR SALE Yard Sign — classic real estate style ── */}
      <g>
        {/* Left post leg */}
        <line x1="12" y1="270" x2="12" y2="440" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        {/* Right post leg */}
        <line x1="56" y1="270" x2="56" y2="440" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        {/* Top crossbar */}
        <line x1="8" y1="270" x2="60" y2="270" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        {/* Sign panel — hanging from crossbar */}
        <rect x="8" y="275" width="52" height="42" rx="3" stroke="#38b6ff" strokeWidth="2.5" fill="none" />
        {/* "FOR" text line */}
        <text x="34" y="293" textAnchor="middle" fill="#38b6ff" fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">FOR</text>
        {/* "SALE" text line */}
        <text x="34" y="310" textAnchor="middle" fill="#38b6ff" fontSize="13" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">SALE</text>
      </g>

      {/* Agent silhouette by sign */}
      <g>
        <circle cx="55" cy="378" r="11" fill="#64748b" />
        <path d="M41 394 L55 425 L69 394 Z" fill="#64748b" />
        {/* Extended arm gesturing toward house */}
        <line x1="69" y1="400" x2="92" y2="386" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Buyer couple approaching */}
      <g>
        {/* Person 1 */}
        <circle cx="160" cy="388" r="10" fill="#64748b" />
        <path d="M148 402 L160 432 L172 402 Z" fill="#64748b" />
        {/* Person 2 */}
        <circle cx="184" cy="384" r="11" fill="#64748b" />
        <path d="M171 399 L184 430 L197 399 Z" fill="#64748b" />
      </g>

      {/* ═══ HOUSE 2 — CENTER, TALLER — DOCUMENT PREP ═══ */}
      <g>
        {/* Main structure — 190px wide, taller */}
        <rect x="280" y="195" width="190" height="245" stroke="#94a3b8" strokeWidth="3" fill="none" rx="2" />
        {/* Roof — flat parapet style */}
        <line x1="273" y1="195" x2="477" y2="195" stroke="#94a3b8" strokeWidth="3" />
        <line x1="278" y1="187" x2="472" y2="187" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Windows — top floor row */}
        <rect x="298" y="218" width="38" height="34" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <rect x="356" y="218" width="38" height="34" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <rect x="414" y="218" width="38" height="34" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        {/* Window pane details */}
        <line x1="317" y1="218" x2="317" y2="252" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="375" y1="218" x2="375" y2="252" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="433" y1="218" x2="433" y2="252" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Windows — bottom floor */}
        <rect x="298" y="280" width="38" height="36" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <rect x="414" y="280" width="38" height="36" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        {/* Door — wider entrance */}
        <rect x="358" y="388" width="38" height="52" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <circle cx="388" cy="416" r="3" fill="#94a3b8" />

        {/* Figure at desk/laptop */}
        <g>
          {/* Desk */}
          <rect x="293" y="410" width="44" height="4" stroke="#94a3b8" strokeWidth="2" fill="none" />
          <line x1="297" y1="414" x2="297" y2="440" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="333" y1="414" x2="333" y2="440" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Laptop on desk */}
          <rect x="300" y="398" width="28" height="12" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
          <line x1="300" y1="410" x2="328" y2="410" stroke="#94a3b8" strokeWidth="2" />
          {/* Person sitting */}
          <circle cx="285" cy="378" r="10" fill="#64748b" />
          <path d="M273 392 L285 422 L297 392 Z" fill="#64748b" />
        </g>

        {/* Floating document icons above house */}
        {/* Doc 1 */}
        <g>
          <rect x="404" y="108" width="44" height="56" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
          <line x1="414" y1="122" x2="438" y2="122" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="414" y1="132" x2="436" y2="132" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="414" y1="142" x2="432" y2="142" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="414" y1="152" x2="428" y2="152" stroke="#cbd5e1" strokeWidth="1" />
        </g>
        {/* Doc 2 */}
        <g>
          <rect x="348" y="82" width="44" height="56" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
          <line x1="358" y1="96" x2="382" y2="96" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="358" y1="106" x2="380" y2="106" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="358" y1="116" x2="376" y2="116" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="358" y1="126" x2="372" y2="126" stroke="#cbd5e1" strokeWidth="1" />
        </g>
        {/* Doc 3 — with gold checkmark */}
        <g>
          <rect x="292" y="95" width="44" height="56" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="4" />
          <line x1="302" y1="109" x2="326" y2="109" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="302" y1="119" x2="324" y2="119" stroke="#cbd5e1" strokeWidth="1.2" />
          {/* Gold checkmark */}
          <path d="M306 131 L314 140 L330 124" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Connection lines from docs to house */}
        <line x1="375" y1="187" x2="375" y2="140" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="5 5" />
      </g>

      {/* ═══ HOUSE 3 — COMPLETED TRANSACTION / SOLD ═══ */}
      <g>
        {/* Main structure — 180px wide */}
        <rect x="490" y="255" width="180" height="185" stroke="#94a3b8" strokeWidth="3" fill="none" rx="2" />
        {/* Roof — gabled */}
        <path d="M482 255 L580 170 L678 255" stroke="#94a3b8" strokeWidth="3" fill="none" />
        {/* Chimney */}
        <rect x="640" y="195" width="20" height="45" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        {/* Window left */}
        <rect x="510" y="280" width="42" height="38" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <line x1="531" y1="280" x2="531" y2="318" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="510" y1="299" x2="552" y2="299" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Window right */}
        <rect x="608" y="280" width="42" height="38" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <line x1="629" y1="280" x2="629" y2="318" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="608" y1="299" x2="650" y2="299" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Door */}
        <rect x="560" y="388" width="38" height="52" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        <circle cx="590" cy="416" r="3" fill="#94a3b8" />
      </g>

      {/* ── SOLD Yard Sign — classic real estate style ── */}
      <g>
        {/* Left post leg */}
        <line x1="490" y1="290" x2="490" y2="440" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        {/* Right post leg */}
        <line x1="534" y1="290" x2="534" y2="440" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        {/* Top crossbar */}
        <line x1="486" y1="290" x2="538" y2="290" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        {/* Sign panel */}
        <rect x="486" y="295" width="52" height="42" rx="3" stroke="#F5A623" strokeWidth="2.5" fill="none" />
        {/* "SOLD" text */}
        <text x="512" y="322" textAnchor="middle" fill="#F5A623" fontSize="14" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">SOLD</text>
      </g>

      {/* Figure receiving document */}
      <g>
        <circle cx="496" cy="386" r="11" fill="#64748b" />
        <path d="M483 401 L496 432 L509 401 Z" fill="#64748b" />
        {/* Document in hand */}
        <rect x="476" y="408" width="18" height="24" stroke="#94a3b8" strokeWidth="2" fill="none" rx="2" />
        <line x1="480" y1="416" x2="490" y2="416" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="480" y1="422" x2="489" y2="422" stroke="#cbd5e1" strokeWidth="1" />
      </g>

      {/* Email/digital delivery symbol */}
      <g>
        <rect x="618" y="376" width="36" height="24" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="3" />
        <path d="M618 376 L636 394 L654 376" stroke="#94a3b8" strokeWidth="2" fill="none" />
        {/* Send lines */}
        <line x1="660" y1="382" x2="676" y2="382" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="660" y1="390" x2="672" y2="390" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="660" y1="398" x2="668" y2="398" stroke="#cbd5e1" strokeWidth="1.2" />
      </g>

      {/* ═══ SKY — SUN ═══ */}
      <circle cx="620" cy="65" r="32" stroke="#F5A623" strokeWidth="2.5" fill="none" />
      {/* Sun rays */}
      <line x1="620" y1="22" x2="620" y2="8" stroke="#F5A623" strokeWidth="2" />
      <line x1="620" y1="108" x2="620" y2="122" stroke="#F5A623" strokeWidth="2" />
      <line x1="577" y1="65" x2="563" y2="65" stroke="#F5A623" strokeWidth="2" />
      <line x1="663" y1="65" x2="677" y2="65" stroke="#F5A623" strokeWidth="2" />
      <line x1="589" y1="34" x2="579" y2="24" stroke="#F5A623" strokeWidth="2" />
      <line x1="651" y1="96" x2="661" y2="106" stroke="#F5A623" strokeWidth="2" />
      <line x1="651" y1="34" x2="661" y2="24" stroke="#F5A623" strokeWidth="2" />
      <line x1="589" y1="96" x2="579" y2="106" stroke="#F5A623" strokeWidth="2" />

      {/* ═══ CLOUD WISPS ═══ */}
      <path d="M50 55 Q90 35, 130 55 Q148 38, 175 55" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
      <path d="M220 75 Q255 55, 290 75 Q310 58, 335 75" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
      <path d="M420 45 Q450 28, 480 45 Q495 32, 515 45" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
