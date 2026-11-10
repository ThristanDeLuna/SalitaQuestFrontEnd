import './StampMoment.css';

// The first step of the results pop-up when the SERVER says a stamp was earned (result.stamp_earned).
// ResultsCard decides when to show it; this file only draws it. Every class starts with sm-.
// Props:
//   regionName  the region's display name, or null: the heading then says "Stamp earned!"
//   starsGained the submit answer's stars_gained (a chip when it is a number above 0)
//   titleRef    ResultsCard focuses this heading on open; the dialog is labelled by its id
//   icon, burst ResultsCard's own StampIcon and star Burst, reused here at a larger size
//   onContinue  the one primary button: ResultsCard then shows the normal results
// No star totals and nothing about other regions: only what the submit answer already says.

export const STAMP_TITLE_ID = 'sm-title';
const GENERIC_TITLE = 'Stamp earned!';
const STAMP_WORD = 'STAMPED';

export default function StampMoment({ regionName, starsGained, titleRef, icon, burst, onContinue }) {
  const title = regionName ? `${regionName} stamped!` : GENERIC_TITLE;
  const showStars = typeof starsGained === 'number' && starsGained > 0;

  return (
    <>
      <h2 id={STAMP_TITLE_ID} className="rc-ribbon sm-title" ref={titleRef} tabIndex={-1}>{title}</h2>
      {/* Decoration only: the heading above already says it in words. */}
      <div className="sm-art" aria-hidden="true">
        {burst}
        <div className="sm-stamp">
          {icon}
          {regionName && <span className="sm-name">{regionName}</span>}
          <span className="sm-word">{STAMP_WORD}</span>
        </div>
      </div>
      {showStars && <p><span className="chip">+{starsGained} {starsGained === 1 ? 'star' : 'stars'}</span></p>}
      <div className="actions">
        <button type="button" className="btn primary" onClick={onContinue}>Continue</button>
      </div>
    </>
  );
}
