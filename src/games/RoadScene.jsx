import './RoadScene.css';

// RoadScene: the street scene above each Jeepney stop question. Decoration around one speech bubble.
// Back to front: a still mountain and sun, clouds, a slowly scrolling street, the road, and two jeepneys
// that take turns: the stop number's parity says which is "here" (parked) and which is "gone" (off the
// right edge). On a new stop they cross, by CSS classes alone (no timers). The bubble holds the real
// content (the "Hear the driver" button, or plain text) and only fades in, so it never moves under a finger.
// Props: stopIndex (0-based stop number), parked (true: nobody drives, e.g. on the results),
// playing (true while the sound plays: the driver talks, the waves pulse), children (the bubble content).
// The art is aria-hidden and ignores taps; only the art layer is clipped, never the bubble.

// ---------- Far view: a sun over a two-peaked mountain; it never moves (the slowest parallax layer) ----------
function FarView() {
  return (
    <svg className="rs-far" viewBox="0 0 200 110" width="200" height="110" focusable="false">
      <circle className="rs-sun" cx="180" cy="16" r="12" />
      {/* The foot stands on the road's top edge. */}
      <path className="rs-mountain" d="M1 110 L58 62 L90 86 L126 52 L199 110 Z" />
    </svg>
  );
}

// ---------- Cloud: one puffy outline; its track carries it across the sky ----------
function Cloud({ className }) {
  return (
    <div className={`rs-cloud-track ${className}`}>
      <svg className="rs-cloud" viewBox="0 0 44 22" width="44" height="22" focusable="false">
        {/* Three bumps on a flat bottom, kept 1 px inside the box for the 2 px outline. */}
        <path d="M8 21 A7 7 0 0 1 9 8 A10 10 0 0 1 28 6 A8 8 0 0 1 37 21 Z" />
      </svg>
    </div>
  );
}

// ---------- Street: one block of houses and a tree, repeated so the strip loops seamlessly ----------
const BLOCK_W = 260;               // one block; the strip moves left by exactly this, then starts over
const BLOCKS = [0, 1, 2].map((i) => i * BLOCK_W);   // 780 px: the widest scene (about 490) + one block
const STREET_W = BLOCKS.length * BLOCK_W;
const STREET_H = 44;               // the tallest wall (30) + its roof (10) + room for the outline
const ROOF_RISE = 10;              // roof peak above the wall top
const HOUSES = [[8, 44, 26], [70, 56, 20], [188, 48, 30]];   // [x, width, wall height]
const TREE_X = 156;                // the tree stands in the gap between the 2nd and 3rd house

function House({ x, w, h }) {
  const top = STREET_H - h;
  return (
    <>
      <rect className="rs-wall" x={x} y={top} width={w} height={h} />
      <path className="rs-roof" d={`M${x - 3} ${top} L${x + w / 2} ${top - ROOF_RISE} L${x + w + 3} ${top} Z`} />
      <rect className="rs-pane" x={x + w / 2 - 6} y={top + 6} width="12" height="10" />
    </>
  );
}

function Street() {
  return (
    <svg className="rs-street" viewBox={`0 0 ${STREET_W} ${STREET_H}`} width={STREET_W} height={STREET_H}
         focusable="false">
      {BLOCKS.map((bx) => (
        <g key={bx} transform={`translate(${bx} 0)`}>
          {HOUSES.map(([x, w, h]) => <House key={x} x={x} w={w} h={h} />)}
          <rect className="rs-trunk" x={TREE_X - 3} y={STREET_H - 16} width="6" height="16" />
          <circle className="rs-crown" cx={TREE_X} cy={STREET_H - 26} r="12" />
        </g>
      ))}
    </svg>
  );
}

// ---------- Road: grey band with a dashed centre line that scrolls left (faster than the street) ----------
const DASH_W = 22;
const DASH_H = 6;
const DASH_PERIOD = 40;            // one dash + one gap; the strip moves by exactly this, so the loop is seamless
const STRIP_W = 560;               // wider than the widest card (about 480 px inside) plus one period
const DASHES = Array.from({ length: STRIP_W / DASH_PERIOD }, (_, i) => i * DASH_PERIOD);

function Road() {
  return (
    <div className="rs-road">
      <svg className="rs-strip" viewBox={`0 0 ${STRIP_W} ${DASH_H + 2}`} width={STRIP_W} height={DASH_H + 2}
           focusable="false">
        {DASHES.map((x) => <rect key={x} x={x + 1} y="1" width={DASH_W} height={DASH_H} />)}
      </svg>
    </div>
  );
}

// ---------- Wheel: tyre, rim and one bolt off-centre, so the spin can be seen ----------
const WHEEL_R = 9;

function Wheel({ cx, cy }) {
  return (
    <g className="rs-wheel">
      <circle className="rs-tyre" cx={cx} cy={cy} r={WHEEL_R} />
      <circle className="rs-rim" cx={cx} cy={cy} r={WHEEL_R / 2} />
      <circle className="rs-bolt" cx={cx} cy={cy - 2} r="1.5" />
    </g>
  );
}

// ---------- Jeepney: side view facing right, on a full-width lane so CSS can move it edge to edge ----------
// Drawn in a 132 x 62 box: cabin from x 4 to 96, hood and bumper in front, wheels at the bottom.
// The driver (face, cap with the peak forward, small mouth) sits in the front window.
const JEEP_W = 132;
const JEEP_H = 62;
const WINDOW_XS = [12, 38, 64];    // three windows; the driver sits in the front one (x 64)

function Jeepney({ className }) {
  return (
    <div className={`rs-lane ${className}`}>
      <svg className="rs-jeep" viewBox={`0 0 ${JEEP_W} ${JEEP_H}`} width={JEEP_W} height={JEEP_H} focusable="false">
        <rect className="rs-rack" x="10" y="3" width="80" height="5" />
        <path className="rs-body" d="M4 10 H96 V26 L118 28 L126 34 V48 H4 Z" />
        <rect className="rs-stripe" x="4" y="36" width="122" height="5" />
        {WINDOW_XS.map((x) => <rect key={x} className="rs-window" x={x} y="14" width="22" height="16" />)}
        <circle className="rs-face" cx="76" cy="25" r="5" />
        <path className="rs-cap" d="M71 22 A5 4 0 0 1 81 22 L85 22 L85 23 L71 23 Z" />
        <ellipse className="rs-mouth" cx="78.5" cy="27" rx="1.5" ry="1" />
        <rect className="rs-bumper" x="120" y="44" width="10" height="5" />
        <Wheel cx={26} cy={50} />
        <Wheel cx={104} cy={50} />
      </svg>
    </div>
  );
}

// ---------- Sound waves: three arcs that are always there; only their opacity changes ----------
function SoundWaves() {
  return (
    <svg className="rs-waves" viewBox="0 0 20 32" width="20" height="32" aria-hidden="true" focusable="false">
      <path d="M4 12 A5 5 0 0 1 4 20" />
      <path d="M9 8 A9 9 0 0 1 9 24" />
      <path d="M14 4 A13 13 0 0 1 14 28" />
    </svg>
  );
}

const PAINTS = ['rs-paint-a', 'rs-paint-b'];   // the two jeepneys, two paint jobs; they take turns

// Which classes a jeepney gets. The one that is "gone" only drives off when it was on screen before:
// never on the first stop and never when parked, so it simply waits off the right edge.
function jeepClasses(isHere, stopIndex, parked) {
  if (isHere) return parked ? 'rs-here' : 'rs-here rs-arrive';
  return stopIndex > 0 && !parked ? 'rs-gone rs-leave' : 'rs-gone';
}

export default function RoadScene({ stopIndex = 0, parked = false, playing = false, children }) {
  const here = stopIndex % 2;
  return (
    <div className={`rs-scene${playing ? ' rs-playing' : ''}`}>
      <div className="rs-art" aria-hidden="true">
        <FarView />
        <Cloud className="rs-cloud-a" />
        <Cloud className="rs-cloud-b" />
        <Street />
        <Road />
        {/* Fixed keys: the same two jeepneys stay mounted, so a class change is what starts each drive. */}
        {PAINTS.map((paint, i) => (
          <Jeepney key={paint} className={`${paint} ${jeepClasses(i === here, stopIndex, parked)}`} />
        ))}
      </div>
      <div className="rs-content">
        <SoundWaves />
        <div key={stopIndex} className="rs-bubble">{children}</div>
      </div>
    </div>
  );
}
