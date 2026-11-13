import { STAMP_ARC, stampNameFits, stampNameSize } from './resultsLogic';
import './StampMoment.css';

// The first step of the results pop-up when the SERVER says a stamp was earned (result.stamp_earned).
// ResultsCard decides when to show it; this file only draws it. Every class starts with sm-.
// Props:
//   regionName  the region's display name, or null: the heading then says "Stamp earned!"
//   starsGained the submit answer's stars_gained (a chip when it is a number above 0)
//   titleRef    ResultsCard focuses this heading on open; the dialog is labelled by its id
//   burst       ResultsCard's star Burst, reused here at a larger size round the stamp
//   onContinue  the one primary button: ResultsCard then shows the normal results
// No star totals and nothing about other regions: only what the submit answer already says.

export const STAMP_TITLE_ID = 'sm-title';
const GENERIC_TITLE = 'Stamp earned!';
const STAMP_WORD = 'STAMPED';

// A five-point star centred on 0,0 (outer radius 34, inner 14).
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 14 : 34;
  const a = (Math.PI / 5) * i - Math.PI / 2;
  return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

// The big rubber stamp, drawn in a 200-unit box: a --surface disc, an outer ink ring, a dashed inner ring,
// the region name along the top arc, STAMPED along the bottom arc and a yellow star in the middle.
// Decoration only (aria-hidden): the heading says the same in words.
function BigStamp({ name }) {
  const label = name ? name.toLocaleUpperCase() : '';
  const squeeze = label && !stampNameFits(label) ? { textLength: STAMP_ARC, lengthAdjust: 'spacingAndGlyphs' } : {};
  return (
    <svg className="sm-stamp" viewBox="-100 -100 200 200" width="168" height="168" aria-hidden="true" focusable="false">
      <defs>
        {/* Top arc left to right (letters stand outward); bottom arc left to right (letters stand inward). */}
        <path id="sm-arc-top" d="M -62 0 A 62 62 0 0 1 62 0" />
        <path id="sm-arc-bottom" d="M -74 0 A 74 74 0 0 0 74 0" />
      </defs>
      <circle className="sm-disc" r="96" />
      <circle className="sm-ring" r="96" />
      <circle className="sm-ring-dashed" r="86" />
      {label && (
        <text className="sm-text" fontSize={stampNameSize(label)}>
          <textPath href="#sm-arc-top" startOffset="50%" textAnchor="middle" {...squeeze}>{label}</textPath>
        </text>
      )}
      <text className="sm-text sm-text-word" fontSize="17">
        <textPath href="#sm-arc-bottom" startOffset="50%" textAnchor="middle">{STAMP_WORD}</textPath>
      </text>
      <polygon className="sm-star" points={STAR} />
    </svg>
  );
}

export default function StampMoment({ regionName, starsGained, titleRef, burst, onContinue }) {
  const title = regionName ? `${regionName} stamped!` : GENERIC_TITLE;
  const showStars = typeof starsGained === 'number' && starsGained > 0;

  return (
    <>
      <h2 id={STAMP_TITLE_ID} className="rc-ribbon sm-title" ref={titleRef} tabIndex={-1}>{title}</h2>
      <p className="sm-label" aria-hidden="true">STAMP EARNED</p>
      {/* Decoration only: the heading above already says it in words. The yellow band holds no text. */}
      <div className="sm-band" aria-hidden="true">
        <div className="sm-art">
          {burst}
          <BigStamp name={regionName} />
        </div>
      </div>
      {showStars && <p><span className="chip">+{starsGained} {starsGained === 1 ? 'star' : 'stars'}</span></p>}
      <div className="actions">
        <button type="button" className="btn primary" onClick={onContinue}>Continue</button>
      </div>
    </>
  );
}
