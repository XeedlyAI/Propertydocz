export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of property document ordering process across three properties"
    >
      {/* ═══ GROUND LINE ═══ */}
      <line x1="0" y1="370" x2="600" y2="370" stroke="#94a3b8" strokeWidth="2" />

      {/* ═══ PATHWAY (dashed) ═══ */}
      <path
        d="M30 370 L570 370"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />

      {/* ═══ LANDSCAPING ═══ */}
      {/* Shrubs between houses */}
      <circle cx="185" cy="362" r="10" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
      <circle cx="198" cy="358" r="7" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      <circle cx="395" cy="362" r="10" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
      <circle cx="408" cy="358" r="7" stroke="#cbd5e1" strokeWidth="1" fill="none" />

      {/* Fence sections */}
      <g stroke="#cbd5e1" strokeWidth="1.2">
        <line x1="210" y1="370" x2="210" y2="345" />
        <line x1="222" y1="370" x2="222" y2="345" />
        <line x1="234" y1="370" x2="234" y2="345" />
        <line x1="208" y1="352" x2="236" y2="352" />
        <line x1="208" y1="361" x2="236" y2="361" />
      </g>
      <g stroke="#cbd5e1" strokeWidth="1.2">
        <line x1="370" y1="370" x2="370" y2="345" />
        <line x1="382" y1="370" x2="382" y2="345" />
        <line x1="394" y1="370" x2="394" y2="345" />
        <line x1="368" y1="352" x2="396" y2="352" />
        <line x1="368" y1="361" x2="396" y2="361" />
      </g>

      {/* ═══ HOUSE 1 — FOR SALE ═══ */}
      <g>
        {/* Main structure */}
        <rect x="45" y="240" width="130" height="130" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        {/* Roof — pitched */}
        <path d="M38 240 L110 175 L182 240" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
        {/* Roof ridge detail */}
        <line x1="90" y1="200" x2="130" y2="200" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Windows — top floor */}
        <rect x="60" y="258" width="30" height="28" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <rect x="130" y="258" width="30" height="28" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        {/* Window cross panes */}
        <line x1="75" y1="258" x2="75" y2="286" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="60" y1="272" x2="90" y2="272" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="145" y1="258" x2="145" y2="286" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="130" y1="272" x2="160" y2="272" stroke="#cbd5e1" strokeWidth="1" />
        {/* Door */}
        <rect x="96" y="325" width="28" height="45" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <circle cx="118" cy="348" r="2" fill="#94a3b8" />
        {/* Steps */}
        <line x1="92" y1="370" x2="128" y2="370" stroke="#94a3b8" strokeWidth="2" />

        {/* ── Classic Real Estate "FOR SALE" Sign ── */}
        <g>
          {/* Post — single vertical */}
          <line x1="22" y1="260" x2="22" y2="370" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Horizontal arm extending right from post top */}
          <line x1="22" y1="260" x2="60" y2="260" stroke="#94a3b8" strokeWidth="2" />
          {/* Sign hanging from arm — rectangular */}
          <rect x="24" y="262" width="38" height="28" rx="3" stroke="#38b6ff" strokeWidth="2" fill="none" />
          {/* "FOR" text */}
          <text x="43" y="275" textAnchor="middle" fill="#38b6ff" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">FOR</text>
          {/* "SALE" text */}
          <text x="43" y="285" textAnchor="middle" fill="#38b6ff" fontSize="8" fontWeight="800" fontFamily="Inter, sans-serif">SALE</text>
          {/* Hanging chains/lines */}
          <line x1="30" y1="260" x2="30" y2="262" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="56" y1="260" x2="56" y2="262" stroke="#94a3b8" strokeWidth="1.5" />
        </g>
      </g>

      {/* Agent silhouette by sign */}
      <g>
        {/* Head */}
        <circle cx="50" cy="320" r="8" fill="#64748b" />
        {/* Body */}
        <path d="M40 332 L50 355 L60 332 Z" fill="#64748b" />
        {/* Extended arm gesturing toward house */}
        <line x1="60" y1="336" x2="78" y2="326" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Buyer couple approaching */}
      <g>
        {/* Person 1 */}
        <circle cx="145" cy="330" r="7" fill="#64748b" />
        <path d="M137 340 L145 362 L153 340 Z" fill="#64748b" />
        {/* Person 2 */}
        <circle cx="162" cy="327" r="8" fill="#64748b" />
        <path d="M153 338 L162 361 L171 338 Z" fill="#64748b" />
      </g>

      {/* ═══ HOUSE 2 — CENTER, TALLER — DOCUMENT PREP ═══ */}
      <g>
        {/* Main structure — taller */}
        <rect x="248" y="210" width="140" height="160" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        {/* Roof — flat parapet style */}
        <line x1="242" y1="210" x2="394" y2="210" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="246" y1="204" x2="390" y2="204" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Windows — top floor row */}
        <rect x="262" y="228" width="28" height="26" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <rect x="304" y="228" width="28" height="26" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <rect x="346" y="228" width="28" height="26" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        {/* Window pane details */}
        <line x1="276" y1="228" x2="276" y2="254" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="318" y1="228" x2="318" y2="254" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="360" y1="228" x2="360" y2="254" stroke="#cbd5e1" strokeWidth="1" />
        {/* Windows — bottom floor */}
        <rect x="262" y="278" width="28" height="28" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <rect x="346" y="278" width="28" height="28" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        {/* Door — wider entrance */}
        <rect x="304" y="328" width="30" height="42" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <circle cx="328" cy="350" r="2" fill="#94a3b8" />

        {/* Figure at desk/laptop inside */}
        <g>
          {/* Desk */}
          <rect x="260" y="344" width="32" height="3" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          <line x1="263" y1="347" x2="263" y2="370" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="289" y1="347" x2="289" y2="370" stroke="#cbd5e1" strokeWidth="1.2" />
          {/* Laptop on desk */}
          <rect x="266" y="336" width="20" height="8" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
          <line x1="266" y1="344" x2="286" y2="344" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Person sitting */}
          <circle cx="254" cy="322" r="7" fill="#64748b" />
          <path d="M246 332 L254 354 L262 332 Z" fill="#64748b" />
        </g>

        {/* Floating document icons above house */}
        {/* Doc 1 */}
        <g>
          <rect x="340" y="148" width="32" height="40" stroke="#94a3b8" strokeWidth="2" fill="none" rx="3" />
          <line x1="347" y1="158" x2="365" y2="158" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="347" y1="165" x2="363" y2="165" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="347" y1="172" x2="360" y2="172" stroke="#cbd5e1" strokeWidth="1" />
        </g>
        {/* Doc 2 */}
        <g>
          <rect x="300" y="128" width="32" height="40" stroke="#94a3b8" strokeWidth="2" fill="none" rx="3" />
          <line x1="307" y1="138" x2="325" y2="138" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="307" y1="145" x2="323" y2="145" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="307" y1="152" x2="320" y2="152" stroke="#cbd5e1" strokeWidth="1" />
        </g>
        {/* Doc 3 — with gold checkmark */}
        <g>
          <rect x="260" y="140" width="32" height="40" stroke="#94a3b8" strokeWidth="2" fill="none" rx="3" />
          <line x1="267" y1="150" x2="285" y2="150" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="267" y1="157" x2="283" y2="157" stroke="#cbd5e1" strokeWidth="1" />
          {/* Gold checkmark */}
          <path d="M270 165 L276 172 L288 160" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Connection lines from docs to house */}
        <line x1="318" y1="204" x2="318" y2="170" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
      </g>

      {/* ═══ HOUSE 3 — COMPLETED TRANSACTION / SOLD ═══ */}
      <g>
        {/* Main structure */}
        <rect x="430" y="248" width="130" height="122" stroke="#94a3b8" strokeWidth="2.5" fill="none" rx="2" />
        {/* Roof — gabled */}
        <path d="M424 248 L495 190 L566 248" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
        {/* Chimney */}
        <rect x="535" y="210" width="16" height="30" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
        {/* Window left */}
        <rect x="445" y="268" width="30" height="28" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <line x1="460" y1="268" x2="460" y2="296" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="445" y1="282" x2="475" y2="282" stroke="#cbd5e1" strokeWidth="1" />
        {/* Window right */}
        <rect x="515" y="268" width="30" height="28" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <line x1="530" y1="268" x2="530" y2="296" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="515" y1="282" x2="545" y2="282" stroke="#cbd5e1" strokeWidth="1" />
        {/* Door */}
        <rect x="480" y="328" width="28" height="42" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        <circle cx="502" cy="350" r="2" fill="#94a3b8" />

        {/* ── Classic Real Estate "SOLD" Sign ── */}
        <g>
          {/* Post */}
          <line x1="578" y1="260" x2="578" y2="370" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Horizontal arm extending left */}
          <line x1="540" y1="260" x2="578" y2="260" stroke="#94a3b8" strokeWidth="2" />
          {/* Sign hanging from arm */}
          <rect x="542" y="262" width="38" height="28" rx="3" stroke="#F5A623" strokeWidth="2" fill="none" />
          {/* "SOLD" text */}
          <text x="561" y="281" textAnchor="middle" fill="#F5A623" fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif">SOLD</text>
          {/* Hanging lines */}
          <line x1="548" y1="260" x2="548" y2="262" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="574" y1="260" x2="574" y2="262" stroke="#94a3b8" strokeWidth="1.5" />
        </g>

        {/* Figure receiving document */}
        <g>
          {/* Head */}
          <circle cx="435" cy="330" r="8" fill="#64748b" />
          {/* Body */}
          <path d="M426 341 L435 364 L444 341 Z" fill="#64748b" />
          {/* Document in hand */}
          <rect x="420" y="346" width="14" height="18" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="2" />
          <line x1="423" y1="352" x2="431" y2="352" stroke="#cbd5e1" strokeWidth="0.75" />
          <line x1="423" y1="356" x2="430" y2="356" stroke="#cbd5e1" strokeWidth="0.75" />
        </g>

        {/* Email/digital delivery symbol */}
        <g>
          <rect x="520" y="322" width="26" height="18" stroke="#94a3b8" strokeWidth="2" fill="none" rx="3" />
          <path d="M520 322 L533 333 L546 322" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          {/* Send lines */}
          <line x1="550" y1="326" x2="562" y2="326" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="550" y1="332" x2="558" y2="332" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="550" y1="338" x2="555" y2="338" stroke="#cbd5e1" strokeWidth="1" />
        </g>
      </g>

      {/* ═══ SKY — SUN ═══ */}
      <circle cx="540" cy="70" r="24" stroke="#F5A623" strokeWidth="2" fill="none" />
      {/* Sun rays */}
      <line x1="540" y1="38" x2="540" y2="28" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="540" y1="102" x2="540" y2="112" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="508" y1="70" x2="498" y2="70" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="572" y1="70" x2="582" y2="70" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="517" y1="47" x2="510" y2="40" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="563" y1="93" x2="570" y2="100" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="563" y1="47" x2="570" y2="40" stroke="#F5A623" strokeWidth="1.5" />
      <line x1="517" y1="93" x2="510" y2="100" stroke="#F5A623" strokeWidth="1.5" />

      {/* ═══ CLOUD WISPS ═══ */}
      <path d="M60 55 Q90 40, 120 55 Q135 42, 155 55" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      <path d="M200 80 Q225 65, 250 80 Q265 68, 280 80" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      <path d="M380 50 Q400 38, 420 50 Q430 40, 445 50" stroke="#cbd5e1" strokeWidth="1" fill="none" />
    </svg>
  );
}
