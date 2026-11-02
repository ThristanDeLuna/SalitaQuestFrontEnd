import { Link } from 'react-router-dom';
import './ResultsCard.css';

// The results of one finished game. Shared by Word Pond and Jeepney stop, so it knows
// nothing about either game: the screen hands it the server's answer and ready-made rows.
// Props:
//   result  the submit answer: score, max_score, passed, pass_mark, medal, stars_gained, stamp_earned
//   rows    [{ key, word, rightMeaning, yourMeaning, correct }], one per answer
//   onAgain called by "Try again"
//   backTo  where "Back to the Map" goes
// Everything is said in words; symbols and colour are only an extra hint.

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
      <span className="rc-word"><strong>{row.word}</strong> means {row.rightMeaning}</span>
      {!row.correct && <span className="muted">You chose: {row.yourMeaning}</span>}
    </li>
  );
}

export default function ResultsCard({ result, rows, onAgain, backTo }) {
  return (
    <section className="rc card" aria-labelledby="rc-title">
      <h2 id="rc-title">Your results</h2>
      <p className="rc-score">{result.score} / {result.max_score}</p>
      <Medal medal={result.medal} />
      <p>
        {result.passed ? 'Passed' : 'Not passed yet'} <span className="muted">· Pass mark {result.pass_mark}</span>
      </p>
      {typeof result.stars_gained === 'number' && <p>+{result.stars_gained} stars</p>}

      {result.stamp_earned && (
        <p className="banner info" role="status">You earned this region's stamp! See it in your Passport.</p>
      )}

      <ul className="rc-rows">
        {rows.map((row) => <AnswerRow key={row.key} row={row} />)}
      </ul>

      <div className="actions">
        <button type="button" className="btn primary" onClick={onAgain}>Try again</button>
        <Link className="btn" to={backTo}>Back to the Map</Link>
      </div>
    </section>
  );
}
