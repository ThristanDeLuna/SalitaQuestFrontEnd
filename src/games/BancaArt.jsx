// BancaArt: the banca (outrigger boat) in PondBanner's bay, with one lantern per meaning. Decoration only.
// Drawn in a 112 x 52 box: a soft shadow on the water, a green bamboo float with node lines, two curved
// bamboo booms reaching out to it, a yellow hull with a red stripe (highlight on its upper left, shade
// along its lower right), and two posts holding a sagging string of lanterns.
// Props: caught (lanterns lit), total (lanterns drawn). A lantern counts a catch, never right or wrong.
// Styles live in PondBanner.css (pb- classes).

// Lantern centres [x, y]: each hangs 5 px under the string, which sags from y 8 at the posts to y 15 mid-way.
const LANTERNS = [[36, 17], [49, 20], [62, 20], [75, 17]];
const NODE_XS = [16, 32, 48, 64, 80, 96];   // bamboo nodes along the float, every 16 px

export default function BancaArt({ caught, total }) {
  const nodes = NODE_XS.map((x) => `M${x} 38 V42`).join(' ');
  return (
    <svg className="pb-banca" viewBox="0 0 112 52" width="112" height="52" focusable="false">
      <ellipse className="pb-contact" cx="56" cy="49" rx="44" ry="2.5" />
      <path className="pb-line" d="M24 34 V6 M88 34 V6 M24 8 Q56 22 88 8" />
      {LANTERNS.slice(0, total).map(([x, y], i) => (
        <circle key={x} className={`pb-lantern${i < caught ? ' pb-lit' : ''}`} cx={x} cy={y} r="4" />
      ))}
      <rect className="pb-bamboo" x="2" y="38" width="108" height="4" rx="2" />
      <path className="pb-detail" d={nodes} />
      <path className="pb-line" d="M26 32 Q12 26 6 38 M86 32 Q100 26 106 38" />
      <path className="pb-hull" d="M4 26 Q14 34 24 34 H88 Q98 34 108 26 Q100 48 80 50 H32 Q12 48 4 26 Z" />
      <path className="pb-hi" d="M10 30 Q17 35 24 36 H56 V38 H24 Q15 37 9 32 Z" />
      <path className="pb-shade" d="M32 46 H80 Q95 45 102 35 L101 37 Q97 47 80 48.5 H32 Z" />
      <rect className="pb-stripe" x="20" y="38" width="72" height="4" />
    </svg>
  );
}
