import './Fish.css';

// FishButton: one fish in the Word Pond, a real <button> with the word on a light label over a drawn fish.
// The colour comes from the fish's POSITION in the round (0 to 5), never from its word, so it can never hint at an
// answer (DEC-56). The drawing is decoration (aria-hidden); the button's name is the word. The handlers, disabled
// state and keyboard behaviour are WordPond's: they come in as props and go straight onto the button.
// Which way the fish faces (flipped in the second column) is set by WordPond.css through --wpf-dir; only the
// drawing flips, the label never does. Styles: Fish.css (wpf-).
// Props: word, index (position in the round), onMeaning (the meaning it is caught on, or null), playing, disabled, onTap.

const SHADES = ['coral', 'yellow', 'green', 'purple', 'pink', 'blue'];

// Drawn facing right in a 120 x 64 box. Back to front: dorsal fin, forked tail, body, side fin, details.
function FishArt() {
  return (
    <svg className="wpf-art" viewBox="0 0 120 64" width="112" height="60" aria-hidden="true" focusable="false">
      <path className="wpf-shape" d="M54 17 Q66 2 90 18 Z" />
      <path className="wpf-shape" d="M34 36 L6 12 L16 36 L6 60 Z" />
      <ellipse className="wpf-shape" cx="70" cy="36" rx="46" ry="23" />
      <path className="wpf-shape" d="M64 42 Q56 58 80 54 Z" />
      <g className="wpf-scales">
        <path d="M38 30 Q44 36 38 44" />
        <path d="M46 27 Q53 36 46 47" />
        <path d="M54 25 Q62 36 54 49" />
      </g>
      <ellipse className="wpf-shine" cx="72" cy="22" rx="22" ry="4" />
      <circle className="wpf-eye" cx="102" cy="24" r="5" />
      <circle className="wpf-pupil" cx="103.5" cy="24" r="2.2" />
    </svg>
  );
}

export default function FishButton({ word, index, onMeaning, playing, disabled, onTap }) {
  return (
    <button type="button"
            className={`wpf wpf-${SHADES[index % SHADES.length]}${onMeaning ? ' wpf-caught' : ''}${playing ? ' wpf-playing' : ''}`}
            disabled={disabled} onClick={onTap}>
      <FishArt />
      <strong className="wpf-label">{word}</strong>
      {/* Kept for screen readers, as before: where this fish is caught. */}
      {onMeaning && <span className="wpf-sr">on: {onMeaning}</span>}
    </button>
  );
}
