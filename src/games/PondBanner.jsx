import './PondBanner.css';

// PondBanner: the bay above the Word Pond game. Decoration only: it holds no text and no buttons,
// so the whole banner is the art layer (aria-hidden, ignores taps, clipped to its rounded border).
// Back to front: the sun with pulsing rays, far hills, birds now and then, the sea (two wave layers on
// a slightly tilted plane, for a 2.5D look), a palm on a little island in the sea, three fish swimming across,
// one fish that jumps, and a banca (outrigger boat) bobbing with one lantern per meaning.
// Props: caught (how many meanings hold a fish), total (how many meanings, 4).
// A lantern lights up once that many fish are caught. It counts catches only, never right or wrong (DEC-56).

// ---------- Sun: a disc and eight rays; the rays pulse ----------
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];   // degrees, one ray every 45

function Sun() {
  return (
    <svg className="pb-sun" viewBox="0 0 52 52" width="52" height="52" focusable="false">
      <g className="pb-rays">
        {RAYS.map((a) => <path key={a} transform={`rotate(${a} 26 26)`} d="M23 9 L26 2 L29 9 Z" />)}
      </g>
      <circle cx="26" cy="26" r="12" />
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

// ---------- Palm: a leaning trunk on a sand island; the crown of leaves sways ----------
function Palm() {
  return (
    <svg className="pb-palm" viewBox="0 0 64 100" width="64" height="100" focusable="false">
      <ellipse className="pb-island" cx="32" cy="92" rx="30" ry="7" />
      <path className="pb-trunk" d="M26 90 Q28 56 36 28 L41 29 Q35 58 33 90 Z" />
      <g className="pb-leaves">
        <path d="M38 28 Q22 14 4 26 Q22 20 38 28 Z" />
        <path d="M38 28 Q30 6 14 6 Q30 14 38 28 Z" />
        <path d="M38 28 Q48 4 62 10 Q48 12 38 28 Z" />
        <path d="M38 28 Q56 20 62 36 Q52 26 38 28 Z" />
      </g>
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

// ---------- Sea: a tilted plane with two wave strips that slide at different speeds ----------
const WAVE_P = 48;                  // one crest; each strip slides by exactly this, so the loop is seamless
const WAVE_H = 20;
const WAVE_W = 27 * WAVE_P;         // 1296 px: the widest banner (about 930 px) plus one crest, with room for the tilt
// The top edge: a crest and a trough per period; the band below it is filled. The bottom edge runs 2 px
// below the box, so only the wavy top is outlined.
const WAVE_D = `M0 ${WAVE_H + 2} V8 ${Array.from({ length: WAVE_W / WAVE_P }, (_, i) =>
  `Q${i * WAVE_P + WAVE_P / 4} 1 ${i * WAVE_P + WAVE_P / 2} 8 T${(i + 1) * WAVE_P} 8`).join(' ')} V${WAVE_H + 2} Z`;

function Wave({ className }) {
  return (
    <svg className={`pb-wave ${className}`} viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} width={WAVE_W} height={WAVE_H}
         focusable="false">
      <path d={WAVE_D} />
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

// ---------- Banca: hull, red stripe, ink outrigger, two posts holding a string of lanterns ----------
// Lantern centres [x, y]: each hangs 5 px under the string, which sags from y 8 at the posts to y 15 mid-way.
const LANTERNS = [[36, 17], [49, 20], [62, 20], [75, 17]];

function Banca({ caught, total }) {
  return (
    <svg className="pb-banca" viewBox="0 0 112 52" width="112" height="52" focusable="false">
      <path className="pb-line" d="M24 34 V6 M88 34 V6 M24 8 Q56 22 88 8" />
      {LANTERNS.slice(0, total).map(([x, y], i) => (
        <circle key={x} className={`pb-lantern${i < caught ? ' pb-lit' : ''}`} cx={x} cy={y} r="4" />
      ))}
      <rect className="pb-pole" x="2" y="38" width="108" height="3" />
      <path className="pb-hull" d="M4 26 Q14 34 24 34 H88 Q98 34 108 26 Q100 48 80 50 H32 Q12 48 4 26 Z" />
      <rect className="pb-stripe" x="20" y="38" width="72" height="4" />
    </svg>
  );
}

export default function PondBanner({ caught = 0, total = 4 }) {
  return (
    <div className="pb-banner" aria-hidden="true">
      <Sun />
      <Hills />
      <Birds />
      <div className="pb-sea">
        <div className="pb-plane">
          <Wave className="pb-wave-back" />
          <Wave className="pb-wave-front" />
        </div>
      </div>
      <Palm />
      {SWIMMERS.map(([cls, w]) => (
        <div key={cls} className={`pb-track ${cls}`}><Fish w={w} /></div>
      ))}
      <Fish w={24} className="pb-jumper" />
      <Banca caught={caught} total={total} />
    </div>
  );
}
