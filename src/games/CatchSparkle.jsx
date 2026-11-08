// CatchSparkle: a small twinkle (a cross of light and a dot) that flashes beside a fish when it lands on a
// meaning, for WordPond. Decoration only (aria-hidden, ignores taps), and the same for every catch: it says
// "caught", never right or wrong (DEC-56). WordPond keys it on the meaning the fish is on, so it replays on
// each catch or move without any state. Styles and the 400 ms flash: WordPond.css (.wp-sparkle). No props.

export default function CatchSparkle() {
  return (
    <svg className="wp-sparkle" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M10 2 V18 M2 10 H18" />
      <circle cx="15" cy="4" r="2" />
    </svg>
  );
}
