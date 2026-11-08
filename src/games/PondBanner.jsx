import BancaArt from './BancaArt';
import PalmArt from './PalmArt';
import './PondBanner.css';

// PondBanner: the bay at the top of the Word Pond scene (PondScene draws it above the pond water, in the
// same frame, so the bay's sea and the pond read as one body of water). Decoration only: it holds no text
// and no buttons, so the whole bay is the art layer (aria-hidden, ignores taps, clipped to the top corners).
// Back to front: the sun with pulsing rays, far hills, birds now and then, the sea (two wave layers on
// a slightly tilted plane, for a 2.5D look), a palm on a little island in the sea, three fish swimming across,
// one fish that jumps, and a banca (outrigger boat) bobbing with one lantern per meaning.
// The palm (PalmArt) and the banca (BancaArt) have their own files. Light comes from the top left.
// Props: caught (how many meanings hold a fish), total (how many meanings, 4), settled (true on the results:
// the lanterns are simply lit, without the pop each one gets when it lights up during play).
// A lantern lights up once that many fish are caught. It counts catches only, never right or wrong (DEC-56).

// ---------- Sun: a disc with a highlight, two faint glow rings and eight rays; the rays pulse ----------
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];   // degrees, one ray every 45
const GLOW_RS = [14, 17];                              // the glow rings, between the disc and the rays

function Sun() {
  return (
    <svg className="pb-sun" viewBox="0 0 60 60" width="60" height="60" focusable="false">
      <g className="pb-rays">
        {RAYS.map((a) => <path key={a} transform={`rotate(${a} 30 30)`} d="M27 9 L30 2 L33 9 Z" />)}
      </g>
      {GLOW_RS.map((r) => <circle key={r} className="pb-glow" cx="30" cy="30" r={r} />)}
      <circle cx="30" cy="30" r="11" />
      <circle className="pb-hi" cx="26.5" cy="26.5" r="3.5" />
    </svg>
  );
}

// ---------- Hills: one wide strip of humps on the horizon (clipped on narrow screens) ----------
function Hills() {
  return (
    <svg className="pb-hills" viewBox="0 0 1000 44" width="1000" height="44" focusable="false">
      {/* The foot and the left side run outside the box, so they are cut off and only the hilltops are outlined. */}
      <path d="M-2 46 V40 Q70 4 150 30 Q240 0 330 34 Q430 8 520 32 Q620 2 720 30 Q830 6 920 32 Q960 18 999 26 V46 Z" />
    </svg>
  );
}

// ---------- Birds: three small wings, a flock that crosses the sky every so often ----------
function Birds() {
  return (
    <div className="pb-track pb-birds">
      <svg viewBox="0 0 40 16" width="40" height="16" focusable="false">
        <path d="M2 6 Q6 2 9 6 Q12 2 16 6" />
        <path d="M18 12 Q21 9 24 12 Q27 9 30 12" />
        <path d="M26 4 Q29 1 32 4 Q35 1 38 4" />
      </svg>
    </div>
  );
}

// ---------- Sea: a tilted plane with two wave crests that slide at different speeds (same water colour) ----------
const WAVE_P = 48;                  // one crest; each strip slides by exactly this, so the loop is seamless
const WAVE_H = 20;
const WAVE_W = 27 * WAVE_P;         // 1296 px: the widest bay plus one crest, with room for the tilt
// The top edge: a crest and a trough per period; the band below it is filled. The bottom edge runs 2 px
// below the box, so only the wavy top is outlined.
const CRESTS = Array.from({ length: WAVE_W / WAVE_P }, (_, i) => i * WAVE_P);
const WAVE_D = `M0 ${WAVE_H + 2} V8 ${CRESTS.map((x) =>
  `Q${x + WAVE_P / 4} 1 ${x + WAVE_P / 2} 8 T${x + WAVE_P} 8`).join(' ')} V${WAVE_H + 2} Z`;
// Foam: a dot and a smaller one just under each crest top (x + WAVE_P / 4), one path for the whole strip.
const dot = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const FOAM_D = CRESTS.map((x) => `${dot(x + WAVE_P / 4, 7, 1.5)} ${dot(x + WAVE_P / 4 + 5, 8.5, 1)}`).join(' ');

function Wave({ className }) {
  return (
    <svg className={`pb-wave ${className}`} viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} width={WAVE_W} height={WAVE_H}
         focusable="false">
      <path d={WAVE_D} />
      <path className="pb-foam" d={FOAM_D} />
    </svg>
  );
}

// ---------- Fish: body, tail and eye, drawn for a given width (the outline stays 2 px at every size) ----------
function Fish({ w, className = '' }) {
  const h = Math.round(w * 0.55);   // a fish is a bit more than half as tall as it is long
  return (
    <svg className={`pb-fish ${className}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} focusable="false">
      <path d={`M${w * 0.26} ${h / 2} L1 1 L1 ${h - 1} Z`} />
      <ellipse cx={w * 0.6} cy={h / 2} rx={w * 0.38} ry={h / 2 - 1} />
      <circle className="pb-eye" cx={w * 0.8} cy={h / 2 - 1} r="1.5" />
    </svg>
  );
}

// Three swimmers: [class, width]. Smaller ones swim higher and slower, so they look further away.
const SWIMMERS = [['pb-swim-far', 16], ['pb-swim-mid', 22], ['pb-swim-near', 28]];

export default function PondBanner({ caught = 0, total = 4, settled = false }) {
  return (
    <div className={`pb-sky${settled ? ' pb-settled' : ''}`} aria-hidden="true">
      <div className="pb-art">
        <Sun />
        <Hills />
        <Birds />
        <div className="pb-sea">
          <div className="pb-plane">
            <Wave className="pb-wave-back" />
            <Wave className="pb-wave-front" />
          </div>
        </div>
        <PalmArt />
        {SWIMMERS.map(([cls, w]) => (
          <div key={cls} className={`pb-track ${cls}`}><Fish w={w} /></div>
        ))}
        <Fish w={24} className="pb-jumper" />
        <BancaArt caught={caught} total={total} />
      </div>
    </div>
  );
}
