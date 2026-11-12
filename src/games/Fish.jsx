import './Fish.css';

// FishButton: one fish in the Word Pond, a real <button>: a big plump drawn fish with the word written on its body.
// The colour comes from the fish's POSITION in the round (0 to 5), never from its word, so it can never hint at an
// answer (DEC-56). The drawing is decoration (aria-hidden); the button's name is the word. The handlers, disabled
// state and keyboard behaviour are WordPond's: they come in as props and go straight onto the button.
// Which way the fish faces (flipped in the second column) is set by WordPond.css through --wpf-dir; only the
// drawing flips, the word never does. Styles: Fish.css (wpf-).
// Props: word, index (position in the round), onMeaning (the meaning it is caught on, or null), playing, disabled, onTap.

const SHADES = ['coral', 'yellow', 'green', 'purple', 'pink', 'blue'];

// Body: ellipse centre (114, 62), radii 82 x 42. The back's scale band follows the top of the body from x 46 to
// x 142, and its lower edge is a zigzag between y 38 and y 30. The middle of the body, where the word sits, stays plain.
const ZIG_XS = [142, 134, 126, 118, 110, 102, 94, 86, 78, 70, 62, 54, 46];
const BAND_D = `M46 38.5 A82 42 0 0 1 142 22.5 ${ZIG_XS.map((x, i) => `L${x} ${i % 2 ? 30 : 38}`).join(' ')} Z`;

// Drawn facing right in a 200 x 120 box. Back to front: top and bottom fins, forked tail, body, scale band, eye.
function FishArt() {
  return (
    <svg className="wpf-art" viewBox="0 0 200 120" aria-hidden="true" focusable="false">
      <path className="wpf-shape" d="M70 30 Q84 2 112 2 Q134 4 148 28 Z" />
      <path className="wpf-shape" d="M92 96 Q100 118 126 116 Q120 106 134 96 Z" />
      {/* A wide fan with a deep V notch: a clearly forked tail, with a zigzag of scales at its base. */}
      <path className="wpf-shape" d="M50 62 L8 12 Q2 10 4 18 L22 62 L4 106 Q2 114 8 112 Z" />
      <path className="wpf-zig" d="M30 42 L24 48 L30 54 L24 60 L30 66 L24 72 L30 78" />
      <ellipse className="wpf-shape" cx="114" cy="62" rx="82" ry="42" />
      <path className="wpf-band" d={BAND_D} />
      <circle className="wpf-eye" cx="166" cy="46" r="11" />
      <circle className="wpf-pupil" cx="169" cy="46" r="5.5" />
      <circle className="wpf-glint" cx="171" cy="43" r="2" />
    </svg>
  );
}

export default function FishButton({ word, index, onMeaning, playing, disabled, onTap }) {
  return (
    <button type="button"
            className={`wpf wpf-${SHADES[index % SHADES.length]}${onMeaning ? ' wpf-caught' : ''}${playing ? ' wpf-playing' : ''}`}
            disabled={disabled} onClick={onTap}>
      <span className="wpf-fish">
        <FishArt />
        <span className="wpf-text"><strong className="wpf-word">{word}</strong></span>
      </span>
      {/* Kept for screen readers, as before: where this fish is caught. */}
      {onMeaning && <span className="wpf-sr">on: {onMeaning}</span>}
    </button>
  );
}
