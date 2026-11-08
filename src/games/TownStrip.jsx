// TownStrip: the middle layer of RoadScene, a row of houses and a tree that scrolls left. Decoration only.
// One 260 px block (three houses and a tree) is drawn three times, so moving the strip by exactly one
// block loops seamlessly. Each house: white wall with a shade on its right side, a red roof that
// overhangs the wall by 4 px with a highlight on its left slope, a door and a window with crossbars.
// The tree has a shaded, highlighted crown. Everything stands on a soft contact shadow.
// Light comes from the top left. Styles live in RoadScene.css (rs- classes). No props.

const BLOCK_W = 260;               // one block; RoadScene.css moves the strip left by exactly this (-260px)
const BLOCKS = [0, 1, 2].map((i) => i * BLOCK_W);   // 780 px: the widest scene (about 490) + one block
const STREET_W = BLOCKS.length * BLOCK_W;
const STREET_H = 44;               // the tallest wall (28) + its roof (10) + room for the outline
const ROOF_RISE = 10;              // roof peak above the wall top
const OVERHANG = 4;                // the roof reaches this far past each wall
const HOUSES = [[8, 44, 24], [72, 56, 20], [188, 48, 28]];   // [x, width, wall height], on the 4 px grid
const TREE_X = 156;                // the tree stands in the gap between the 2nd and 3rd house
const CROWN_R = 12;

function House({ x, w, h }) {
  const top = STREET_H - h;
  const mid = x + w / 2;
  const win = { x: mid - 2, y: top + 4 };     // the window sits right of centre, the door at the left
  return (
    <>
      <ellipse className="rs-contact" cx={mid} cy={STREET_H - 1} rx={w / 2 + 6} ry="2" />
      <rect className="rs-wall" x={x} y={top} width={w} height={h} />
      <rect className="rs-shade" x={x + w - 10} y={top + 2} width="8" height={h - 3} />
      <path className="rs-roof" d={`M${x - OVERHANG} ${top + 2} L${mid} ${top - ROOF_RISE} L${x + w + OVERHANG} ${top + 2} Z`} />
      <path className="rs-hi" d={`M${x} ${top} L${mid} ${top - ROOF_RISE + 4} V${top - ROOF_RISE + 7} L${x + 8} ${top} Z`} />
      <rect className="rs-door" x={x + 6} y={STREET_H - 12} width="8" height="12" />
      <rect className="rs-pane" x={win.x} y={win.y} width="12" height="10" />
      <path className="rs-detail" d={`M${win.x + 6} ${win.y} V${win.y + 10} M${win.x} ${win.y + 5} H${win.x + 12}`} />
    </>
  );
}

function Tree() {
  const cy = STREET_H - 26;
  return (
    <>
      <ellipse className="rs-contact" cx={TREE_X} cy={STREET_H - 1} rx="10" ry="2" />
      <rect className="rs-trunk" x={TREE_X - 3} y={STREET_H - 16} width="6" height="16" />
      <circle className="rs-crown" cx={TREE_X} cy={cy} r={CROWN_R} />
      <circle className="rs-shade" cx={TREE_X + 3} cy={cy + 3} r="6" />
      <circle className="rs-hi" cx={TREE_X - 4} cy={cy - 4} r="3" />
    </>
  );
}

export default function TownStrip() {
  return (
    <svg className="rs-street" viewBox={`0 0 ${STREET_W} ${STREET_H}`} width={STREET_W} height={STREET_H}
         focusable="false">
      {BLOCKS.map((bx) => (
        <g key={bx} transform={`translate(${bx} 0)`}>
          {HOUSES.map(([x, w, h]) => <House key={x} x={x} w={w} h={h} />)}
          <Tree />
        </g>
      ))}
    </svg>
  );
}
