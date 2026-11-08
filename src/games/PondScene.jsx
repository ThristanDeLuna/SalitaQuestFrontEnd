import PondBanner from './PondBanner';
import './PondScene.css';

// PondScene: the whole Word Pond scene in ONE frame (2px ink border, rounded): the bay on top
// (PondBanner: sky, sun, hills, palm, banca with its lanterns) and the pond water right below it,
// where the fish swim. The bay's sea and the pond have the same colour and no line between them.
// In the water, ripple rings and two lily pads sit on an art layer behind the fish; the fish list
// is passed in as children and sits on top, so every button keeps working as before.
// Props: caught, total, settled (for the lanterns, see PondBanner), children (the fish list; none on the results).
// The art layers are aria-hidden and ignore taps; only they are clipped, so focus outlines are never cut.

// One ripple ring, drawn at its full size; CSS scales it down and fades it in a slow pulse.
const RIPPLE_W = 56;
const RIPPLE_H = 24;

function Ripple({ className }) {
  return (
    <svg className={`ps-art-piece ps-ripple ${className}`} viewBox={`0 0 ${RIPPLE_W} ${RIPPLE_H}`}
         width={RIPPLE_W} height={RIPPLE_H} focusable="false">
      {/* Inset by 1 so the 2px outline stays inside the box. */}
      <ellipse cx={RIPPLE_W / 2} cy={RIPPLE_H / 2} rx={RIPPLE_W / 2 - 1} ry={RIPPLE_H / 2 - 1} />
    </svg>
  );
}

// One lily pad: an oval with a wedge cut out towards the right, like a real pad.
const PAD_W = 44;
const PAD_H = 36;

function LilyPad({ className }) {
  return (
    <svg className={`ps-art-piece ps-pad ${className}`} viewBox={`0 0 ${PAD_W} ${PAD_H}`}
         width={PAD_W} height={PAD_H} focusable="false">
      {/* Oval centre (22, 18), radii 20 x 16. The two straight edges meet at the centre and
          reach the rim 20 degrees above and below the right-hand side: that is the notch. */}
      <path d="M22 18 L40.8 12.5 A20 16 0 1 0 40.8 23.5 Z" />
      {/* Light from the top left: a highlight on the upper left, a shade low down (both inside the pad,
          clear of the notch). */}
      <ellipse className="ps-hi" cx="14" cy="11" rx="6" ry="3" />
      <ellipse className="ps-shade" cx="22" cy="27" rx="10" ry="4" />
    </svg>
  );
}

export default function PondScene({ caught, total, settled, children }) {
  return (
    <div className="ps-pond">
      <PondBanner caught={caught} total={total} settled={settled} />
      <div className="ps-water">
        <div className="ps-art" aria-hidden="true">
          <Ripple className="ps-ripple-a" />
          <Ripple className="ps-ripple-b" />
          <LilyPad className="ps-pad-a" />
          <LilyPad className="ps-pad-b" />
        </div>
        <div className="ps-content">{children}</div>
      </div>
    </div>
  );
}
