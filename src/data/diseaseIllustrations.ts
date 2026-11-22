// Self-contained SVG data-URI illustrations for sample crop diseases.
// Embedded directly into the JS bundle so they never break, never show wrong stock photos,
// and work 100% offline in installed PWAs and GitHub Pages builds.

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

export const DISEASE_ILLUSTRATIONS = {
  // 1. Wheat Yellow Rust (गेहूं का पीला रतुआ)
  wheatYellowRust: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dcfce7"/>
      <stop offset="100%" stop-color="#bbf7d0"/>
    </linearGradient>
    <linearGradient id="leaf1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#15803d"/>
      <stop offset="100%" stop-color="#166534"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#sky1)"/>
  <!-- Background wheat stems -->
  <path d="M40 180 Q55 95 95 25" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M275 180 Q255 100 220 30" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Main affected wheat leaf -->
  <path d="M28 158 C80 92, 175 48, 295 38 C235 88, 150 132, 48 168 Z" fill="url(#leaf1)" stroke="#14532d" stroke-width="2"/>
  <path d="M36 162 C115 112, 195 72, 285 41" stroke="#86efac" stroke-width="1.5" fill="none" opacity="0.65"/>
  <!-- Characteristic linear yellow rust stripe pustules -->
  <g fill="#facc15" stroke="#ca8a04" stroke-width="0.7">
    <ellipse cx="105" cy="116" rx="10" ry="2.6" transform="rotate(-24 105 116)"/>
    <ellipse cx="132" cy="103" rx="12" ry="2.8" transform="rotate(-24 132 103)"/>
    <ellipse cx="162" cy="89" rx="11" ry="2.7" transform="rotate(-23 162 89)"/>
    <ellipse cx="192" cy="76" rx="12" ry="2.6" transform="rotate(-22 192 76)"/>
    <ellipse cx="222" cy="64" rx="10" ry="2.3" transform="rotate(-20 222 64)"/>
    <ellipse cx="118" cy="126" rx="9" ry="2.4" transform="rotate(-24 118 126)"/>
    <ellipse cx="147" cy="113" rx="11" ry="2.6" transform="rotate(-23 147 113)"/>
    <ellipse cx="177" cy="99" rx="12" ry="2.6" transform="rotate(-22 177 99)"/>
    <ellipse cx="207" cy="86" rx="10" ry="2.4" transform="rotate(-21 207 86)"/>
  </g>
  <!-- Rust spore dust badge -->
  <circle cx="255" cy="130" r="28" fill="#ffffff" stroke="#eab308" stroke-width="3"/>
  <circle cx="248" cy="126" r="4" fill="#eab308"/>
  <circle cx="261" cy="122" r="3.5" fill="#facc15"/>
  <circle cx="256" cy="136" r="4.2" fill="#ca8a04"/>
  <circle cx="244" cy="137" r="3" fill="#facc15"/>
  <circle cx="266" cy="133" r="3.2" fill="#eab308"/>
</svg>`),

  // 2. Mustard Aphids / Chepa (सरसों में माहू / चेपा कीट)
  mustardAphids: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef9c3"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#sky2)"/>
  <!-- Mustard stem & pods -->
  <path d="M155 180 L158 32" stroke="#166534" stroke-width="8" stroke-linecap="round"/>
  <path d="M157 128 L88 86" stroke="#15803d" stroke-width="5" stroke-linecap="round"/>
  <path d="M157 104 L228 66" stroke="#15803d" stroke-width="5" stroke-linecap="round"/>
  <path d="M158 76 L102 42" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>
  <!-- Mustard yellow flowers at top -->
  <g fill="#facc15" stroke="#eab308" stroke-width="1">
    <circle cx="158" cy="28" r="10"/>
    <circle cx="144" cy="36" r="8"/>
    <circle cx="172" cy="36" r="8"/>
    <circle cx="102" cy="40" r="7"/>
    <circle cx="228" cy="64" r="7"/>
  </g>
  <!-- Aphid colony clustered on tender stem & pod -->
  <g fill="#1f2937" stroke="#4ade80" stroke-width="0.9">
    <ellipse cx="152" cy="96" rx="4.5" ry="3.2"/>
    <ellipse cx="163" cy="91" rx="4.2" ry="3"/>
    <ellipse cx="154" cy="84" rx="4.6" ry="3.2"/>
    <ellipse cx="164" cy="79" rx="4" ry="2.8"/>
    <ellipse cx="155" cy="70" rx="4.5" ry="3.1"/>
    <ellipse cx="163" cy="63" rx="4.2" ry="3"/>
    <ellipse cx="154" cy="54" rx="4" ry="2.8"/>
    <ellipse cx="190" cy="86" rx="4" ry="2.8"/>
    <ellipse cx="201" cy="80" rx="4.2" ry="3"/>
    <ellipse cx="211" cy="75" rx="3.8" ry="2.7"/>
    <ellipse cx="118" cy="103" rx="4" ry="2.8"/>
    <ellipse cx="107" cy="97" rx="4.3" ry="3"/>
  </g>
  <!-- Tiny antennae/legs accents -->
  <circle cx="262" cy="132" r="27" fill="#ffffff" stroke="#16a34a" stroke-width="2.5"/>
  <ellipse cx="262" cy="133" rx="11" ry="8" fill="#365314"/>
  <circle cx="250" cy="130" r="3.5" fill="#1a2e05"/>
  <path d="M247 128 L240 122 M247 132 L240 137 M258 125 L256 118 M265 125 L268 118 M258 141 L256 148 M265 141 L268 148" stroke="#1a2e05" stroke-width="1.6" stroke-linecap="round"/>
</svg>`),

  // 3. Tomato Early & Late Blight (टमाटर की झुलसा)
  tomatoBlight: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>
    <radialGradient id="tom" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#bg3)"/>
  <!-- Tomato branch -->
  <path d="M25 45 Q140 60 285 42" stroke="#15803d" stroke-width="5" fill="none"/>
  <!-- Blighted leaf -->
  <path d="M55 96 C90 55, 165 62, 182 110 C152 150, 82 146, 55 96 Z" fill="#4d7c0f" stroke="#365314" stroke-width="2"/>
  <!-- Concentric brown blight spots on leaf -->
  <circle cx="115" cy="98" r="18" fill="#78350f" opacity="0.9"/>
  <circle cx="115" cy="98" r="12" fill="#451a03" fill-opacity="0.7" stroke="#d97706" stroke-width="1.3"/>
  <circle cx="115" cy="98" r="5" fill="#78350f" stroke="#f59e0b" stroke-width="1"/>
  <circle cx="148" cy="116" r="11" fill="#78350f" opacity="0.88"/>
  <circle cx="148" cy="116" r="6" fill="#451a03" stroke="#d97706" stroke-width="1"/>
  <!-- Tomato fruit with dark blight lesion -->
  <circle cx="235" cy="108" r="40" fill="url(#tom)" stroke="#991b1b" stroke-width="2"/>
  <path d="M222 70 L235 80 L248 70 L241 64 L235 72 L229 64 Z" fill="#166534"/>
  <!-- Dark sunken lesion on tomato -->
  <ellipse cx="222" cy="118" rx="15" ry="12" fill="#451a03" opacity="0.88" stroke="#92400e" stroke-width="1.5"/>
  <ellipse cx="222" cy="118" rx="8" ry="6" fill="#291202" opacity="0.7"/>
</svg>`),

  // 4. Cotton Pink Bollworm (कपास में गुलाबी सुंडी)
  cottonBollworm: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="bg4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#bg4)"/>
  <!-- Stem & sepals -->
  <path d="M148 180 L152 115" stroke="#166534" stroke-width="7" stroke-linecap="round"/>
  <path d="M115 126 L152 104 L188 126 L168 142 L134 142 Z" fill="#15803d"/>
  <!-- Fluffy white open cotton boll -->
  <circle cx="128" cy="84" r="30" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8"/>
  <circle cx="174" cy="84" r="30" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8"/>
  <circle cx="151" cy="60" r="31" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8"/>
  <!-- Damaged / stained lint area -->
  <ellipse cx="164" cy="88" rx="14" ry="10" fill="#fef08a" opacity="0.75"/>
  <circle cx="162" cy="89" r="5" fill="#451a03"/>
  <!-- Pink bollworm larva visible on cotton boll -->
  <path d="M138 95 Q154 78 178 92 Q192 100 184 110 Q168 100 152 106 Z" fill="#ec4899" stroke="#9d174d" stroke-width="1.5"/>
  <circle cx="184" cy="104" r="3.5" fill="#701a75"/>
  <line x1="150" y1="90" x2="152" y2="103" stroke="#fbcfe8" stroke-width="1.2"/>
  <line x1="162" y1="88" x2="162" y2="101" stroke="#fbcfe8" stroke-width="1.2"/>
  <line x1="173" y1="91" x2="171" y2="104" stroke="#fbcfe8" stroke-width="1.2"/>
  <!-- Green unopen boll on right -->
  <path d="M242 135 C224 135, 222 100, 246 78 C270 100, 268 135, 242 135 Z" fill="#16a34a" stroke="#14532d" stroke-width="2"/>
  <circle cx="249" cy="112" r="4" fill="#451a03" stroke="#ca8a04" stroke-width="1"/>
</svg>`),
};
