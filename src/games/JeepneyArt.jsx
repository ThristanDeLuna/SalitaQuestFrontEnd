import { signText, signTextLength } from './jeepneyLook';
import './JeepneyArt.css';

// JeepneyArt: one Filipino jeepney seen from the side, facing right, for RoadScene. Decoration only.
// Drawn in a 132 x 62 box, back to front: an open back entrance with a step, a long passenger section
// with five open side windows (riders inside), a short cab with the driver behind the windshield, and a
// long hood with a silver horse on it, a chrome grille, a headlight and a bumper. On the roof, over the
// cab, a light signboard with the region name. Along the body: a chrome trim line, two coloured stripes and
// a second trim line; chrome fenders over two big wheels with hubcaps.
// Light comes from the top left: a highlight band at the top of the body, a shade band at the bottom,
// and a soft contact shadow under the wheels. Styles: JeepneyArt.css (rs- classes, shared rules in RoadScene.css).
// The body is one group, so it can bob on its wheels; the wheels stay on the road and turn.
// Two exhaust puffs sit just behind the jeepney, outside its drawing so they can drift back; they only
// show (and drift) while it arrives or leaves.
// Props: className (lane classes from RoadScene: paint, here/gone, arrive/leave),
// regionName (shown on the roof sign; "SALITA QUEST" when there is none).

const JEEP_W = 132;
const JEEP_H = 62;
const AXLE_Y = 50;
const WHEELS = [30, 108];             // wheel centres: rear under the passengers, front under the hood
const WIN_XS = [16, 30, 44, 58, 72];  // the open side windows (11 x 10); a rider sits in all but the middle one
const WIN_Y = 21;
const SIGN = { x: 20, y: 1, w: 84, h: 13 };   // over the cab and the front of the roof

// The wheel well cut into the body (radius 11 round the axle), the fender band round it (11 to 13).
// Both stop at the body's bottom edge (y 46), 4 px above the axle.
const well = (cx) => `H${cx + 10.25} A11 11 0 0 0 ${cx - 10.25} 46`;
const fender = (cx) => `M${cx - 12.4} 46 A13 13 0 0 1 ${cx + 12.4} 46 H${cx + 10.25} A11 11 0 0 0 ${cx - 10.25} 46 Z`;

// Body: flat roof line, windshield slope, long low hood, round nose; wheel wells along the bottom.
const BODY = `M4 18 H100 L106 30 H120 Q126 30 126 36 V46 ${well(WHEELS[1])} H${WHEELS[0] + 10.25} `
  + `A11 11 0 0 0 ${WHEELS[0] - 10.25} 46 H4 Z`;

// A rider: a round head on rounded shoulders, a flat silhouette inside one window.
const riders = WIN_XS.filter((_, i) => i !== 2)
  .map((x) => `M${x + 8.1} 26 A2.6 2.6 0 1 1 ${x + 2.9} 26 A2.6 2.6 0 1 1 ${x + 8.1} 26 Z `
    + `M${x + 1.5} 31 Q${x + 5.5} 27 ${x + 9.5} 31 Z`)
  .join(' ');

// The hood ornament: a small rearing horse facing right (front legs up, tail out behind), drawn in a
// 10 x 10 box with its hind hooves at the bottom.
const HORSE = 'M1.6 5 Q2.6 3.6 4.6 3.2 L6.2 2.2 L7.3 0.3 L8 0 L9.9 1.7 L9.4 2.5 L8.1 2.1 L7.6 3.6 L7.9 4.4 '
  + 'L9.6 4.6 L9.9 6.3 L9.1 6.4 L8.9 5.6 L7.2 6 Q6 7 4.6 7 L4.2 10 H3 L3 7.6 Q2.6 7.8 2.4 8.4 L2.2 10 H1.2 '
  + 'L1.4 7.6 Q0.9 6.4 1.6 5 Z M1.6 5 Q0 5.4 0.2 8.4 Q1 6.6 1.6 6.2 Z';

// ---------- Wheel: tyre, a white hubcap with a silver centre and 4 spokes (they show the turn) ----------
function Wheel({ cx }) {
  return (
    <g className="rs-wheel">
      <circle className="rs-tyre" cx={cx} cy={AXLE_Y} r="9" />
      <circle className="rs-hub" cx={cx} cy={AXLE_Y} r="5" />
      <path className="rs-detail" d={`M${cx - 4} ${AXLE_Y} H${cx + 4} M${cx} ${AXLE_Y - 4} V${AXLE_Y + 4}`} />
      <circle className="rs-hub-cap" cx={cx} cy={AXLE_Y} r="1.8" />
    </g>
  );
}

export default function JeepneyArt({ className, regionName }) {
  const sign = signText(regionName);
  return (
    <div className={`rs-lane ${className}`}>
      <svg className="rs-puffs" viewBox="0 0 24 16" width="24" height="16" focusable="false">
        <circle className="rs-puff" cx="16" cy="10" r="4" />
        <circle className="rs-puff" cx="8" cy="7" r="3" />
      </svg>
      <svg className="rs-jeep" viewBox={`0 0 ${JEEP_W} ${JEEP_H}`} width={JEEP_W} height={JEEP_H} focusable="false">
        <ellipse className="rs-contact" cx="66" cy="59" rx="62" ry="2.5" />
        {/* Dark wheel wells and the wheels: they stay on the road while the body bobs over them. */}
        {WHEELS.map((cx) => <circle key={`w${cx}`} className="rs-well" cx={cx} cy={AXLE_Y} r="12" />)}
        {WHEELS.map((cx) => <Wheel key={cx} cx={cx} />)}

        <g className="rs-jeep-body">
          {/* Roof sign: dark capitals on a light panel; a long name is squeezed to fit. */}
          <rect className="rs-sign" x={SIGN.x} y={SIGN.y} width={SIGN.w} height={SIGN.h} rx="2" />
          <text className="rs-sign-text" x={SIGN.x + SIGN.w / 2} y={SIGN.y + 10.5} textAnchor="middle"
                textLength={signTextLength(sign)} lengthAdjust="spacingAndGlyphs">{sign}</text>
          <rect className="rs-jeep-roof" x="2" y="15" width="102" height="3" rx="1" />

          <path className="rs-body" d={BODY} />
          <path className="rs-hi" d="M6 19 H99 V20.5 H6 Z M108 31 H119 V32.5 H108 Z" />
          <rect className="rs-chrome-line" x="4" y="32.5" width="121" height="2" />
          <rect className="rs-stripe-1" x="4" y="36" width="122" height="4" />
          <rect className="rs-stripe-2" x="4" y="41" width="122" height="2" />
          <path className="rs-shade" d="M6 44.5 H125 V46 H6 Z" />
          {WHEELS.map((cx) => <path key={cx} className="rs-fender" d={fender(cx)} />)}

          {/* Passenger section: the open back entrance with a grab bar and a step, then the side windows. */}
          <rect className="rs-inside" x="5" y="21" width="7" height="22" />
          <path className="rs-detail" d="M8.5 23 V40" />
          <rect className="rs-chrome" x="1" y="43" width="12" height="3" rx="1" />
          {WIN_XS.map((x) => <rect key={x} className="rs-inside" x={x} y={WIN_Y} width="11" height="10" />)}
          <path className="rs-rider" d={riders} />

          {/* Cab: the post behind the driver, the windshield with a glare, the driver in a cap. */}
          <path className="rs-detail" d="M85 19 V45" />
          <path className="rs-glass" d="M87 21 H98.5 L103 30 H87 Z" />
          <path className="rs-glare" d="M98 22 L100.5 22 L102.5 27 L100 27 Z" />
          <circle className="rs-face" cx="93" cy="26" r="3.5" />
          <path className="rs-cap" d="M89.5 24 A3.5 3 0 0 1 96.5 24 L99 24 L99 25 L89.5 25 Z" />
          <ellipse className="rs-mouth" cx="95" cy="27.6" rx="1.2" ry="0.8" />
          <path className="rs-detail" d="M103.5 26 L106 23" />
          <ellipse className="rs-chrome" cx="106.5" cy="20.5" rx="1.8" ry="3" />

          {/* Hood and front: the silver horse, the headlight, the grille and the bumper. */}
          <path className="rs-horse" d={HORSE} transform="translate(110.5 15.6) scale(1.44)" />
          <circle className="rs-lamp" cx="119.5" cy="34" r="2" />
          <rect className="rs-chrome" x="123" y="32" width="6" height="11" rx="1.5" />
          <path className="rs-detail" d="M124.5 35 H127.5 M124.5 37.5 H127.5 M124.5 40 H127.5" />
          <rect className="rs-chrome" x="116" y="43" width="15" height="4" rx="2" />
        </g>
      </svg>
    </div>
  );
}
