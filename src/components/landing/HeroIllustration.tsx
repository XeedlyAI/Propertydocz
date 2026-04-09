export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of HOA document ordering process across three properties"
    >
      {/* ═══ GROUND LINE ═══ */}
      <line x1="0" y1="340" x2="640" y2="340" stroke="#94a3b8" strokeWidth="1.5" />

      {/* ═══ PATHWAY (dashed) ═══ */}
      <path
        d="M80 340 L200 340 L280 340 L400 340 L480 340 L580 340"
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="6 4"
      />

      {/* ═══ LANDSCAPING ═══ */}
      {/* Shrubs — geometric circles */}
      <circle cx="45" cy="335" r="8" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <circle cx="55" cy="332" r="6" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      <circle cx="255" cy="335" r="7" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <circle cx="245" cy="332" r="5" stroke="#cbd5e1" strokeWidth="1" fill="none" />
      <circle cx="475" cy="335" r="8" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <circle cx="465" cy="332" r="6" stroke="#cbd5e1" strokeWidth="1" fill="none" />

      {/* Fence sections */}
      <g stroke="#cbd5e1" strokeWidth="1">
        <line x1="220" y1="340" x2="220" y2="320" />
        <line x1="230" y1="340" x2="230" y2="320" />
        <line x1="240" y1="340" x2="240" y2="320" />
        <line x1="218" y1="325" x2="242" y2="325" />
        <line x1="218" y1="332" x2="242" y2="332" />
      </g>
      <g stroke="#cbd5e1" strokeWidth="1">
        <line x1="440" y1="340" x2="440" y2="320" />
        <line x1="450" y1="340" x2="450" y2="320" />
        <line x1="460" y1="340" x2="460" y2="320" />
        <line x1="438" y1="325" x2="462" y2="325" />
        <line x1="438" y1="332" x2="462" y2="332" />
      </g>

      {/* ═══ HOUSE 1 — TOWNHOME WITH FOR SALE SIGN ═══ */}
      <g>
        {/* Main structure */}
        <rect x="60" y="230" width="100" height="110" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        {/* Roof — pitched */}
        <path d="M55 230 L110 185 L165 230" stroke="#94a3b8" strokeWidth="2" fill="none" />
        {/* Roof ridge detail */}
        <line x1="95" y1="200" x2="125" y2="200" stroke="#cbd5e1" strokeWidth="1" />
        {/* Windows — top floor */}
        <rect x="72" y="245" width="22" height="22" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <rect x="126" y="245" width="22" height="22" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        {/* Window cross panes */}
        <line x1="83" y1="245" x2="83" y2="267" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="72" y1="256" x2="94" y2="256" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="137" y1="245" x2="137" y2="267" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="126" y1="256" x2="148" y2="256" stroke="#cbd5e1" strokeWidth="0.75" />
        {/* Door */}
        <rect x="98" y="295" width="24" height="45" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <circle cx="117" cy="318" r="1.5" fill="#94a3b8" />
        {/* Steps */}
        <line x1="95" y1="340" x2="125" y2="340" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="93" y1="345" x2="127" y2="345" stroke="#cbd5e1" strokeWidth="1" />

        {/* FOR SALE sign */}
        <line x1="30" y1="280" x2="30" y2="340" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="15" y="280" width="30" height="20" stroke="#38b6ff" strokeWidth="1.5" fill="none" rx="2" />
        <line x1="21" y1="287" x2="39" y2="287" stroke="#38b6ff" strokeWidth="1" />
        <line x1="23" y1="293" x2="37" y2="293" stroke="#38b6ff" strokeWidth="0.75" />
      </g>

      {/* Agent silhouette by sign */}
      <g>
        <circle cx="48" cy="298" r="5" fill="#64748b" />
        <path d="M42 306 L48 320 L54 306 Z" fill="#64748b" />
        {/* Extended arm gesturing */}
        <line x1="54" y1="309" x2="65" y2="303" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Buyer couple approaching */}
      <g>
        {/* Person 1 */}
        <circle cx="130" cy="310" r="4.5" fill="#64748b" />
        <path d="M125 317 L130 330 L135 317 Z" fill="#64748b" />
        {/* Person 2 */}
        <circle cx="142" cy="308" r="5" fill="#64748b" />
        <path d="M137 315 L142 329 L147 315 Z" fill="#64748b" />
      </g>

      {/* ═══ HOUSE 2 — CENTER, TALLER — DOCUMENT PREP ═══ */}
      <g>
        {/* Main structure — taller */}
        <rect x="270" y="200" width="110" height="140" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        {/* Roof — flat parapet style */}
        <line x1="265" y1="200" x2="385" y2="200" stroke="#94a3b8" strokeWidth="2" />
        <line x1="268" y1="195" x2="382" y2="195" stroke="#cbd5e1" strokeWidth="1" />
        {/* Windows — top floor row */}
        <rect x="282" y="215" width="20" height="20" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <rect x="315" y="215" width="20" height="20" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <rect x="348" y="215" width="20" height="20" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        {/* Window pane details */}
        <line x1="292" y1="215" x2="292" y2="235" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="325" y1="215" x2="325" y2="235" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="358" y1="215" x2="358" y2="235" stroke="#cbd5e1" strokeWidth="0.75" />
        {/* Windows — bottom floor */}
        <rect x="282" y="260" width="20" height="22" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <rect x="348" y="260" width="20" height="22" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        {/* Door — wider entrance */}
        <rect x="312" y="300" width="26" height="40" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <circle cx="333" cy="320" r="1.5" fill="#94a3b8" />

        {/* Figure at desk/laptop */}
        <g>
          {/* Desk */}
          <rect x="280" y="318" width="24" height="2" stroke="#94a3b8" strokeWidth="1" fill="none" />
          <line x1="282" y1="320" x2="282" y2="340" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="302" y1="320" x2="302" y2="340" stroke="#cbd5e1" strokeWidth="1" />
          {/* Laptop on desk */}
          <rect x="285" y="312" width="14" height="6" stroke="#94a3b8" strokeWidth="1" fill="none" rx="0.5" />
          <line x1="285" y1="318" x2="299" y2="318" stroke="#94a3b8" strokeWidth="1" />
          {/* Person sitting */}
          <circle cx="276" cy="302" r="4.5" fill="#64748b" />
          <path d="M271 309 L276 322 L281 309 Z" fill="#64748b" />
        </g>

        {/* Floating document icons */}
        {/* Doc 1 */}
        <g>
          <rect x="345" y="155" width="24" height="30" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="2" />
          <line x1="350" y1="163" x2="364" y2="163" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="350" y1="168" x2="362" y2="168" stroke="#cbd5e1" strokeWidth="0.75" />
          <line x1="350" y1="173" x2="360" y2="173" stroke="#cbd5e1" strokeWidth="0.75" />
        </g>
        {/* Doc 2 */}
        <g>
          <rect x="315" y="140" width="24" height="30" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="2" />
          <line x1="320" y1="148" x2="334" y2="148" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="320" y1="153" x2="332" y2="153" stroke="#cbd5e1" strokeWidth="0.75" />
          <line x1="320" y1="158" x2="330" y2="158" stroke="#cbd5e1" strokeWidth="0.75" />
        </g>
        {/* Doc 3 — with gold checkmark */}
        <g>
          <rect x="285" y="148" width="24" height="30" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="2" />
          <line x1="290" y1="156" x2="304" y2="156" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="290" y1="161" x2="302" y2="161" stroke="#cbd5e1" strokeWidth="0.75" />
          {/* Gold checkmark */}
          <path d="M293 167 L297 171 L305 163" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Connection lines from docs to house */}
        <line x1="325" y1="195" x2="325" y2="170" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="3 3" />
      </g>

      {/* ═══ HOUSE 3 — COMPLETED TRANSACTION ═══ */}
      <g>
        {/* Main structure */}
        <rect x="500" y="240" width="100" height="100" stroke="#94a3b8" strokeWidth="2" fill="none" rx="1" />
        {/* Roof — gabled */}
        <path d="M495 240 L550 195 L605 240" stroke="#94a3b8" strokeWidth="2" fill="none" />
        {/* Chimney */}
        <rect x="575" y="205" width="12" height="25" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        {/* Window */}
        <rect x="512" y="258" width="24" height="22" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <line x1="524" y1="258" x2="524" y2="280" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="512" y1="269" x2="536" y2="269" stroke="#cbd5e1" strokeWidth="0.75" />
        {/* Window — right */}
        <rect x="564" y="258" width="24" height="22" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <line x1="576" y1="258" x2="576" y2="280" stroke="#cbd5e1" strokeWidth="0.75" />
        <line x1="564" y1="269" x2="588" y2="269" stroke="#cbd5e1" strokeWidth="0.75" />
        {/* Door */}
        <rect x="538" y="300" width="24" height="40" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="1" />
        <circle cx="557" cy="320" r="1.5" fill="#94a3b8" />

        {/* SOLD banner overlay */}
        <rect x="510" y="230" width="42" height="14" stroke="#F5A623" strokeWidth="1.5" fill="none" rx="3" />
        <text x="531" y="240.5" textAnchor="middle" fill="#F5A623" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">SOLD</text>

        {/* Figure receiving document */}
        <g>
          <circle cx="500" cy="310" r="5" fill="#64748b" />
          <path d="M494 317 L500 331 L506 317 Z" fill="#64748b" />
          {/* Document in hand */}
          <rect x="488" y="318" width="10" height="13" stroke="#94a3b8" strokeWidth="1" fill="none" rx="1" />
          <line x1="490" y1="322" x2="496" y2="322" stroke="#cbd5e1" strokeWidth="0.5" />
          <line x1="490" y1="325" x2="495" y2="325" stroke="#cbd5e1" strokeWidth="0.5" />
        </g>

        {/* Email/digital delivery symbol */}
        <g>
          <rect x="570" y="295" width="20" height="14" stroke="#94a3b8" strokeWidth="1.5" fill="none" rx="2" />
          <path d="M570 295 L580 304 L590 295" stroke="#94a3b8" strokeWidth="1" fill="none" />
          {/* Send lines */}
          <line x1="594" y1="298" x2="602" y2="298" stroke="#cbd5e1" strokeWidth="0.75" />
          <line x1="594" y1="302" x2="600" y2="302" stroke="#cbd5e1" strokeWidth="0.75" />
          <line x1="594" y1="306" x2="598" y2="306" stroke="#cbd5e1" strokeWidth="0.75" />
        </g>
      </g>

      {/* ═══ SKY — SUN ═══ */}
      <circle cx="580" cy="60" r="18" stroke="#F5A623" strokeWidth="1.5" fill="none" />
      {/* Sun rays */}
      <line x1="580" y1="36" x2="580" y2="28" stroke="#F5A623" strokeWidth="1" />
      <line x1="580" y1="84" x2="580" y2="92" stroke="#F5A623" strokeWidth="1" />
      <line x1="556" y1="60" x2="548" y2="60" stroke="#F5A623" strokeWidth="1" />
      <line x1="604" y1="60" x2="612" y2="60" stroke="#F5A623" strokeWidth="1" />
      <line x1="563" y1="43" x2="557" y2="37" stroke="#F5A623" strokeWidth="1" />
      <line x1="597" y1="77" x2="603" y2="83" stroke="#F5A623" strokeWidth="1" />
      <line x1="597" y1="43" x2="603" y2="37" stroke="#F5A623" strokeWidth="1" />
      <line x1="563" y1="77" x2="557" y2="83" stroke="#F5A623" strokeWidth="1" />

      {/* ═══ CLOUD WISPS ═══ */}
      <path d="M80 50 Q100 40, 120 50 Q130 42, 145 50" stroke="#cbd5e1" strokeWidth="0.75" fill="none" />
      <path d="M200 70 Q215 62, 230 70 Q240 63, 250 70" stroke="#cbd5e1" strokeWidth="0.75" fill="none" />
    </svg>
  );
}
