export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      viewBox="0 0 680 520"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>PropertyDocz hero illustration</title>
      <desc>Line drawing of a two-story house with a real estate for sale sign to the left and floating HOA documents to the right</desc>
      <style>{`
        .line { fill: none; stroke: #4a9ec4; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .line-thin { fill: none; stroke: #4a9ec4; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
        .line-bold { fill: none; stroke: #4a9ec4; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
        .doc { fill: none; stroke: #38b6ff; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
        .doc-fill { fill: rgba(56,182,255,0.08); stroke: #38b6ff; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
        .check { fill: none; stroke: #ffffff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .dashed { fill: none; stroke: #4a9ec4; stroke-width: 1.2; stroke-dasharray: 5,4; stroke-linecap: round; }
        .sign-text { font-family: var(--font-sans, sans-serif); font-size: 10px; font-weight: 700; fill: #ffffff; text-anchor: middle; letter-spacing: 1px; }
        .sun-ray { fill: none; stroke: #f59e0b; stroke-width: 1.5; stroke-linecap: round; }
      `}</style>

      {/* Sun */}
      <circle cx="580" cy="62" r="14" style={{fill: "rgba(251,191,36,0.2)", stroke: "#f59e0b", strokeWidth: 1.5}} />
      <line x1="580" y1="40" x2="580" y2="34" className="sun-ray" />
      <line x1="580" y1="84" x2="580" y2="90" className="sun-ray" />
      <line x1="558" y1="62" x2="552" y2="62" className="sun-ray" />
      <line x1="602" y1="62" x2="608" y2="62" className="sun-ray" />
      <line x1="564" y1="46" x2="559" y2="41" className="sun-ray" />
      <line x1="596" y1="78" x2="601" y2="83" className="sun-ray" />
      <line x1="596" y1="46" x2="601" y2="41" className="sun-ray" />
      <line x1="564" y1="78" x2="559" y2="83" className="sun-ray" />

      {/* FOR SALE SIGN */}
      <line x1="80" y1="300" x2="80" y2="425" className="line-bold" />
      <polygon points="73,421 80,436 87,421" style={{fill: "none", stroke: "#4a9ec4", strokeWidth: 2, strokeLinejoin: "round"}} />
      <line x1="80" y1="308" x2="185" y2="308" className="line-bold" />
      <line x1="80" y1="330" x2="110" y2="308" className="line-thin" />
      <line x1="118" y1="310" x2="114" y2="323" className="line-thin" />
      <line x1="158" y1="310" x2="162" y2="323" className="line-thin" />
      <rect x="104" y="323" width="68" height="56" rx="3" style={{fill: "#38b6ff", stroke: "#38b6ff", strokeWidth: 1.4}} />
      <text x="138" y="346" className="sign-text">FOR</text>
      <text x="138" y="360" className="sign-text">SALE</text>
      <line x1="110" y1="368" x2="166" y2="368" style={{stroke: "rgba(255,255,255,0.4)", strokeWidth: 1}} />
      <rect x="116" y="372" width="44" height="6" rx="1" style={{fill: "rgba(255,255,255,0.25)", stroke: "none"}} />
      <line x1="52" y1="425" x2="112" y2="425" className="line-thin" />

      {/* HOUSE */}
      <line x1="195" y1="420" x2="520" y2="420" className="line-bold" />
      <rect x="210" y="270" width="295" height="150" rx="0" className="line" />
      <polygon points="195,270 357,155 520,270" className="line" />
      <line x1="357" y1="155" x2="357" y2="175" className="line-thin" />

      {/* Chimney */}
      <rect x="430" y="178" width="28" height="52" rx="0" className="line" />
      <line x1="425" y1="178" x2="463" y2="178" className="line" />
      <path d="M436,172 Q432,162 438,156 Q444,150 440,142" className="line-thin" style={{strokeDasharray: "3,3"}} />
      <path d="M449,170 Q445,158 451,151 Q457,144 453,136" className="line-thin" style={{strokeDasharray: "3,3"}} />

      {/* Attic window */}
      <rect x="333" y="210" width="48" height="38" rx="2" className="line" />
      <line x1="357" y1="210" x2="357" y2="248" className="line-thin" />
      <line x1="333" y1="229" x2="381" y2="229" className="line-thin" />
      <line x1="329" y1="248" x2="385" y2="248" className="line-thin" />

      {/* Left window */}
      <rect x="230" y="295" width="55" height="50" rx="2" className="line" />
      <line x1="257" y1="295" x2="257" y2="345" className="line-thin" />
      <line x1="230" y1="320" x2="285" y2="320" className="line-thin" />
      <line x1="225" y1="345" x2="290" y2="345" className="line" />

      {/* Right window */}
      <rect x="432" y="295" width="55" height="50" rx="2" className="line" />
      <line x1="459" y1="295" x2="459" y2="345" className="line-thin" />
      <line x1="432" y1="320" x2="487" y2="320" className="line-thin" />
      <line x1="427" y1="345" x2="492" y2="345" className="line" />

      {/* Front door */}
      <rect x="322" y="340" width="50" height="80" rx="2" style={{fill: "rgba(56,182,255,0.25)", stroke: "#4a9ec4", strokeWidth: 1.8}} />
      <path d="M322,356 Q347,336 372,356" className="line-thin" />
      <circle cx="335" cy="385" r="3" style={{fill: "#38b6ff", stroke: "#38b6ff"}} />
      <rect x="328" y="360" width="16" height="20" rx="1" className="line-thin" />
      <rect x="350" y="360" width="16" height="20" rx="1" className="line-thin" />

      {/* Steps & porch */}
      <rect x="310" y="418" width="76" height="8" rx="0" className="line" />
      <rect x="316" y="413" width="64" height="6" rx="0" className="line-thin" />
      <line x1="210" y1="395" x2="310" y2="395" className="line-thin" />
      <line x1="386" y1="395" x2="520" y2="395" className="line-thin" />
      <rect x="210" y="415" width="295" height="8" rx="0" className="line-thin" />

      {/* DOCUMENTS */}
      <path d="M520,300 Q560,270 575,240" className="dashed" />

      {/* Doc 1 — top right */}
      <g transform="rotate(-8, 615, 200)">
        <rect x="570" y="140" width="82" height="104" rx="3" className="doc-fill" />
        <rect x="570" y="140" width="82" height="18" rx="3" style={{fill: "rgba(56,182,255,0.2)", stroke: "none"}} />
        <rect x="582" y="148" width="18" height="6" rx="1" style={{fill: "#38b6ff", stroke: "none"}} />
        <line x1="582" y1="168" x2="640" y2="168" className="doc" />
        <line x1="582" y1="180" x2="640" y2="180" className="doc" />
        <line x1="582" y1="192" x2="625" y2="192" className="doc" />
      </g>

      {/* Doc 2 — middle right with checkmark */}
      <g transform="rotate(5, 590, 250)">
        <rect x="548" y="210" width="78" height="100" rx="3" className="doc-fill" />
        <line x1="560" y1="236" x2="614" y2="236" className="doc" />
        <line x1="560" y1="248" x2="614" y2="248" className="doc" />
        <line x1="560" y1="260" x2="598" y2="260" className="doc" />
        <circle cx="587" cy="221" r="9" style={{fill: "#38b6ff", stroke: "#38b6ff", strokeWidth: 1.4}} />
        <polyline points="582,221 586,226 593,215" className="check" />
      </g>

      {/* Doc 3 — bottom right with OK badge */}
      <g transform="rotate(-3, 600, 310)">
        <rect x="555" y="285" width="82" height="104" rx="3" className="doc-fill" />
        <line x1="567" y1="312" x2="625" y2="312" className="doc" />
        <line x1="567" y1="324" x2="625" y2="324" className="doc" />
        <line x1="567" y1="336" x2="610" y2="336" className="doc" />
        <circle cx="600" cy="300" r="10" style={{fill: "#38b6ff", stroke: "#38b6ff", strokeWidth: 1.4}} />
        <text x="600" y="304" style={{fontFamily: "var(--font-sans,sans-serif)", fontSize: "9px", fontWeight: 700, fill: "#ffffff", textAnchor: "middle"}}>OK</text>
      </g>

      {/* Price badge */}
      <rect x="556" y="393" width="78" height="24" rx="4" style={{fill: "#38b6ff", stroke: "none"}} />
      <text x="595" y="409" style={{fontFamily: "var(--font-sans,sans-serif)", fontSize: "10px", fontWeight: 700, fill: "#ffffff", textAnchor: "middle"}}>$2,047.50</text>
    </svg>
  );
}
