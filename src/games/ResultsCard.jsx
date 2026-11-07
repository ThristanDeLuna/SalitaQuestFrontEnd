import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import './ResultsCard.css';

// The results of one finished game. Shared by Word Pond and Jeepney stop, so it knows
// nothing about either game: the screen hands it the server's answer and ready-made rows.
// Props:
//   result  the submit answer: score, max_score, passed, pass_mark, medal, stars_gained, stamp_earned
//   rows    [{ key, word, rightMeaning, yourMeaning, correct, summary? }], one per answer
//           (summary, if given, replaces the "<word> means <meaning>" sentence)
//   onAgain called by "Try again"
//   backTo  where "Back to the Map" goes
//   next    optional { to, label }: after a pass, the next step becomes the main button
// Everything is said in words; symbols and colour are only an extra hint.
// It shows as a pop-up over the dimmed game: the same .overlay + role="dialog" pattern as the app's other
// dialogs (Profile sign-out, AdminAudio, AdminPending), rendered into document.body through a portal so no
// ancestor can break position: fixed. It has no close button and no Escape: the actions are the way out.
// On open, focus moves to the "Your results" heading. The game behind it is made inert by the game screen.
// The answers sit in a collapsed <details>, so score, medal and buttons fit without scrolling.

// The medal values come from Game_rules::medal() on the server: 'gold', 'silver', 'bronze' or null.
const MEDALS = {
  gold: { symbol: '🥇', label: 'Gold medal' },
  silver: { symbol: '🥈', label: 'Silver medal' },
  bronze: { symbol: '🥉', label: 'Bronze medal' },
};

function Medal({ medal }) {
  const m = MEDALS[medal];
  if (!m) return <p className="rc-medal">No medal this time</p>;
  return (
    <p className="rc-medal">
      <span className="rc-medal-symbol" aria-hidden="true">{m.symbol}</span> {m.label}
    </p>
  );
}

function AnswerRow({ row }) {
  return (
    <li className={`rc-row ${row.correct ? 'rc-right' : 'rc-wrong'}`}>
      <span className="rc-mark">
        <span aria-hidden="true">{row.correct ? '✓' : '✗'}</span> {row.correct ? 'Correct' : 'Incorrect'}
      </span>
      {/* A game can give the row its own sentence (row.summary); otherwise "<word> means <meaning>". */}
      <span className="rc-word">
        {row.summary ?? <><strong>{row.word}</strong> means {row.rightMeaning}</>}
      </span>
      {!row.correct && <span className="muted">You chose: {row.yourMeaning}</span>}
    </li>
  );
}

// A round passport stamp with a star. Decoration only: the banner's words carry the message.
function StampIcon() {
  return (
    <svg className="rc-stamp" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M16 8.5l2.3 4.8 5.2.7-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.6 5.2-.7z" fill="currentColor" />
    </svg>
  );
}

export default function ResultsCard({ result, rows, onAgain, backTo, next }) {
  const showNext = Boolean(next) && result.passed;   // only one primary button on the card
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);   // a screen reader starts at the title

  return createPortal(
    <div className="overlay rc-overlay">
      <section className="rc card" role="dialog" aria-modal="true" aria-labelledby="rc-title">
        <h2 id="rc-title" className="rc-ribbon" ref={titleRef} tabIndex={-1}>Your results</h2>
        <p className="rc-score">{result.score} / {result.max_score}</p>
        <Medal medal={result.medal} />
        <p>
          {result.passed ? 'Passed' : 'Not passed yet'} <span className="muted">· Pass mark {result.pass_mark}</span>
        </p>
        {typeof result.stars_gained === 'number' && <p>+{result.stars_gained} stars</p>}

        {result.stamp_earned && (
          <p className="banner info rc-stamp-banner" role="status">
            <StampIcon />
            <span>You earned this region's stamp! See it in your Passport.</span>
          </p>
        )}

        <details className="rc-answers">
          <summary>See my answers</summary>
          <ul className="rc-rows">
            {rows.map((row) => <AnswerRow key={row.key} row={row} />)}
          </ul>
        </details>

        <div className="actions">
          {showNext && <Link className="btn primary" to={next.to}>{next.label}</Link>}
          <button type="button" className={showNext ? 'btn' : 'btn primary'} onClick={onAgain}>Try again</button>
          <Link className="btn" to={backTo}>Back to the Map</Link>
        </div>
      </section>
    </div>,
    document.body,
  );
}
