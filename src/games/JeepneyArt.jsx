import './JeepneyArt.css';

// JeepneyArt: one jeepney seen from the side, facing right, for RoadScene. Decoration only.
// Drawn in a 132 x 62 box (shapes on a 4 px grid where they can be): roof rack, cabin and rounded hood,
// a white trim band with red and yellow diamonds, three glass windows with a glare, the driver in the
// front window, a door line, side mirror, headlight, chrome bumper and two wheels with 4-spoke hubcaps.
// Light comes from the top left: a highlight band at the top of the body, a shade band at the bottom,
// and a soft contact shadow under the wheels. Styles: JeepneyArt.css (rs- classes, shared rules in RoadScene.css).
// Two exhaust puffs sit just behind the jeepney, outside its drawing so they can drift back; they only
// show (and drift) while it arrives or leaves.
// Props: className (lane classes from RoadScene: paint, here/gone, arrive/leave).

const JEEP_W = 132;
const JEEP_H = 62;
const WINDOWS = [12, 36, 64];         // window left edges; the driver sits in the front one
const WIN_Y = 16;
const WIN_W = 20;
const WIN_H = 14;
const TRIM_XS = Array.from({ length: 14 }, (_, i) => 12 + i * 8);   // diamond centres, every 8 px
const DIAMOND = 2.5;                  // half the width of one trim diamond

// One path of diamonds: every other one, starting at `from`, so the two colours alternate.
const diamonds = (from) => TRIM_XS.filter((_, i) => i % 2 === from)
  .map((x) => `M${x} ${37 - DIAMOND} L${x + DIAMOND} 37 L${x} ${37 + DIAMOND} L${x - DIAMOND} 37 Z`).join(' ');

// A diagonal glare across each window, kept inside the glass.
const GLARE = WINDOWS.map((x) => `M${x + 3} ${WIN_Y + 12} L${x + 10} ${WIN_Y + 2} H${x + 14} L${x + 7} ${WIN_Y + 12} Z`).join(' ');

// ---------- Wheel: tyre, a white hubcap and 4 spokes (the spokes show the spin while driving) ----------
const WHEEL_R = 9;
const HUB_R = 5;

function Wheel({ cx, cy }) {
  return (
    <g className="rs-wheel">
      <circle className="rs-tyre" cx={cx} cy={cy} r={WHEEL_R} />
      <circle className="rs-hub" cx={cx} cy={cy} r={HUB_R} />
      <path className="rs-detail" d={`M${cx - 4} ${cy} H${cx + 4} M${cx} ${cy - 4} V${cy + 4}`} />
    </g>
  );
}

export default function JeepneyArt({ className }) {
  return (
    <div className={`rs-lane ${className}`}>
      <svg className="rs-puffs" viewBox="0 0 24 16" width="24" height="16" focusable="false">
        <circle className="rs-puff" cx="16" cy="10" r="4" />
        <circle className="rs-puff" cx="8" cy="7" r="3" />
      </svg>
      <svg className="rs-jeep" viewBox={`0 0 ${JEEP_W} ${JEEP_H}`} width={JEEP_W} height={JEEP_H} focusable="false">
        <ellipse className="rs-contact" cx="66" cy="59" rx="58" ry="2.5" />
        <rect className="rs-rack" x="12" y="4" width="76" height="4" />
        <path className="rs-detail" d="M20 8 V12 M48 8 V12 M76 8 V12" />
        <path className="rs-body" d="M4 12 H96 V28 H112 Q124 28 124 40 V48 H4 Z" />
        <path className="rs-hi" d="M8 15 H92 V18 H8 Z" />
        <path className="rs-shade" d="M6 42 H122 V46 H6 Z" />
        <rect className="rs-trim" x="4" y="33" width="120" height="8" />
        <path className="rs-trim-a" d={diamonds(0)} />
        <path className="rs-trim-b" d={diamonds(1)} />
        {WINDOWS.map((x) => <rect key={x} className="rs-window" x={x} y={WIN_Y} width={WIN_W} height={WIN_H} />)}
        <path className="rs-glare" d={GLARE} />
        <path className="rs-detail" d="M60 14 V46" />
        <circle className="rs-face" cx="76" cy="25" r="5" />
        <path className="rs-cap" d="M71 22 A5 4 0 0 1 81 22 L85 22 L85 23 L71 23 Z" />
        <ellipse className="rs-mouth" cx="78.5" cy="27" rx="1.5" ry="1" />
        <path className="rs-detail" d="M96 22 L101 18" />
        <ellipse className="rs-mirror" cx="102" cy="15" rx="2" ry="3.5" />
        <circle className="rs-lamp" cx="119" cy="35" r="3" />
        <rect className="rs-chrome" x="116" y="44" width="14" height="5" rx="2" />
        <Wheel cx={28} cy={50} />
        <Wheel cx={104} cy={50} />
      </svg>
    </div>
  );
}
