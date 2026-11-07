import './RoadScene.css';

// RoadScene: the street scene above each Jeepney stop question. Decoration around one bubble.
// It draws a road with a moving centre line, two drifting clouds and a jeepney that drives in
// from the left; the driver's mouth moves and sound waves pulse while the word is playing.
// The speech bubble holds the real content (the "Hear the driver" button, or the
// "not available" text). The bubble only fades in, so the button never moves under a finger.
// Props: playing (true while the question's sound plays), children (the bubble content).
// Give it a new key per question so the drive-in starts again.
// The art is aria-hidden and ignores taps; only the art layer is clipped, never the bubble.

// ---------- Road: grey band with a dashed centre line that scrolls left ----------
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

// ---------- Driver: face in the front window, cap with the peak forward, small mouth ----------
function Driver() {
  return (
    <g>
      <circle className="rs-face" cx="76" cy="25" r="5" />
      {/* Cap: a dome over the head plus a peak pointing forward (right). */}
      <path className="rs-cap" d="M71 22 A5 4 0 0 1 81 22 L85 22 L85 23 L71 23 Z" />
      <ellipse className="rs-mouth" cx="78.5" cy="27" rx="1.5" ry="1" />
    </g>
  );
}

// ---------- Jeepney: side view facing right ----------
// Drawn in a 132 x 62 box: cabin from x 4 to 96, hood and bumper in front, wheels at the bottom.
const JEEP_W = 132;
const JEEP_H = 62;
const WINDOW_XS = [12, 38, 64];    // three windows; the driver sits in the front one (x 64)

function Jeepney() {
  return (
    <div className="rs-jeepney">
      <svg className="rs-jeep" viewBox={`0 0 ${JEEP_W} ${JEEP_H}`} width={JEEP_W} height={JEEP_H} focusable="false">
        <rect className="rs-rack" x="10" y="3" width="80" height="5" />
        {/* Cabin, then the lower hood stepping down to the front. */}
        <path className="rs-body" d="M4 10 H96 V26 L118 28 L126 34 V48 H4 Z" />
        <rect className="rs-stripe" x="4" y="36" width="122" height="5" />
        {WINDOW_XS.map((x) => <rect key={x} className="rs-window" x={x} y="14" width="22" height="16" />)}
        <Driver />
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

export default function RoadScene({ playing, children }) {
  return (
    <div className={`rs-scene${playing ? ' rs-playing' : ''}`}>
      <div className="rs-art" aria-hidden="true">
        <Cloud className="rs-cloud-a" />
        <Cloud className="rs-cloud-b" />
        <Road />
        <Jeepney />
      </div>
      <div className="rs-content">
        <SoundWaves />
        <div className="rs-bubble">{children}</div>
      </div>
    </div>
  );
}
