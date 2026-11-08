import JeepneyArt from './JeepneyArt';
import TownStrip from './TownStrip';
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
      <circle className="rs-glow" cx="176" cy="24" r="20" />
      <circle className="rs-glow" cx="176" cy="24" r="16" />
      <circle className="rs-sun" cx="176" cy="24" r="12" />
      <circle className="rs-hi" cx="172" cy="20" r="4" />
      {/* Two peaks; the foot stands on the road's top edge. The right slopes are in shade, a highlight runs
          down the left of the tall peak. */}
      <path className="rs-mountain" d="M1 110 L56 60 L88 84 L124 52 L199 110 Z" />
      <path className="rs-shade" d="M56 62 L86 86 L82 110 L64 110 Z M124 54 L196 110 L140 110 Z" />
      <path className="rs-hi" d="M122 56 L116 64 L120 66 Z" />
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
        <TownStrip />
        <Road />
        {/* Fixed keys: the same two jeepneys stay mounted, so a class change is what starts each drive. */}
        {PAINTS.map((paint, i) => (
          <JeepneyArt key={paint} className={`${paint} ${jeepClasses(i === here, stopIndex, parked)}`} />
        ))}
      </div>
      <div className="rs-content">
        <SoundWaves />
        <div key={stopIndex} className="rs-bubble">{children}</div>
      </div>
    </div>
  );
}
