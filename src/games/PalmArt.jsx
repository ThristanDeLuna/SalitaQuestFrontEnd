// PalmArt: the palm on its sand island, for PondBanner's bay. Decoration only.
// Drawn in a 64 x 100 box: the island (with a shade on its lower side and a contact shadow on the water),
// a smoothly curved trunk with ring lines and a shaded right side, and a crown of five fronds with leaflet
// lines and three coconuts. The crown (.pb-leaves) is what sways. Light comes from the top left.
// Styles live in PondBanner.css (pb- classes). No props.

const CROWN = [38, 28];            // where the fronds meet, at the top of the trunk
// Frond tips, left to right; each frond curves out from the crown to its tip.
const FRONDS = [[4, 28], [12, 8], [40, 2], [62, 12], [62, 40]];
const FROND_UP = 11;               // how far the frond's upper edge bulges out from the straight line
const FROND_DOWN = 4;              // and how far its lower edge dips the other way: a leaf, not a line
const LEAFLETS = [0.4, 0.6, 0.8];  // where leaflet lines sit along each frond (0 = crown, 1 = tip)
const RING_YS = [80, 70, 60, 50, 40];
// The trunk's centre line runs from (29.5, 90) up to (38.5, 28); x at a given height:
const trunkX = (y) => 29.5 + ((90 - y) * 9) / 62;

// One frond: its outline, its midrib and three leaflet lines, all from the same curve.
function Frond({ tip }) {
  const [sx, sy] = CROWN;
  const [ex, ey] = tip;
  const len = Math.hypot(ex - sx, ey - sy);
  const px = -(ey - sy) / len;     // unit vector at right angles to the frond
  const py = (ex - sx) / len;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const at = (t, k) => [(1 - t) * (1 - t) * sx + 2 * t * (1 - t) * (mx + px * k) + t * t * ex,
    (1 - t) * (1 - t) * sy + 2 * t * (1 - t) * (my + py * k) + t * t * ey];
  const leaflets = LEAFLETS.map((t) => {
    const [x, y] = at(t, (FROND_UP - FROND_DOWN) / 2);
    return `M${x} ${y} l${px * 4} ${py * 4}`;
  }).join(' ');
  return (
    <>
      <path d={`M${sx} ${sy} Q${mx + px * FROND_UP} ${my + py * FROND_UP} ${ex} ${ey}
                Q${mx - px * FROND_DOWN} ${my - py * FROND_DOWN} ${sx} ${sy} Z`} />
      <path className="pb-detail" d={`M${sx} ${sy} Q${mx + px * (FROND_UP - FROND_DOWN) / 2} ${my + py * (FROND_UP - FROND_DOWN) / 2} ${ex} ${ey} ${leaflets}`} />
    </>
  );
}

export default function PalmArt() {
  const rings = RING_YS.map((y) => `M${trunkX(y) - 3.5} ${y} q3.5 2 7 0`).join(' ');
  return (
    <svg className="pb-palm" viewBox="0 0 64 100" width="64" height="100" focusable="false">
      <ellipse className="pb-contact" cx="32" cy="96" rx="28" ry="2.5" />
      <ellipse className="pb-island" cx="32" cy="92" rx="28" ry="6" />
      <ellipse className="pb-shade" cx="34" cy="94" rx="20" ry="3" />
      <ellipse className="pb-contact" cx="30" cy="90" rx="9" ry="2" />
      <path className="pb-trunk" d="M26 90 C28 70 30 48 36 28 L41 29 C36 48 34 70 33 90 Z" />
      <path className="pb-shade" d="M31 89 C32 70 34 50 39 31 L40 31 C35 50 33 70 32.5 89 Z" />
      <path className="pb-detail" d={rings} />
      <g className="pb-leaves">
        {FRONDS.map((tip) => <Frond key={tip.join()} tip={tip} />)}
        <circle className="pb-coconut" cx="35" cy="32" r="3" />
        <circle className="pb-coconut" cx="40" cy="34" r="3" />
        <circle className="pb-coconut" cx="44" cy="31" r="3" />
      </g>
    </svg>
  );
}
