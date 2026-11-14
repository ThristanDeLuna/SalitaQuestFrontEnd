import { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  emptyState, errorText, podiumOrder, readBoard, restRows, rowLabel, starsLabel, yourPlaceLabel, yourPlaceRow,
} from './leaderboardLogic';
import './Leaderboard.css';

// The Passport "Ranks" tab: one pop-out card with a podium (top 3), a scrolling list (4 to 10)
// and the caller's own place. It mounts only when the tab is opened, so GET /api/leaderboard is
// asked for only then. The answer is kept by the Passport page (saved / onSaved), so switching
// tabs does not ask again and the podium animation plays only the first time.

function Star({ big = false }) {
  const size = big ? 48 : 18;
  return (
    <svg className="lb-star" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
    </svg>
  );
}

function YouChip() {
  return <span className="lb-chip">You</span>;
}

function Podium({ top }) {
  return (
    <ol className="lb-podium" aria-label="Top three">
      {podiumOrder(top).map(({ entry, place, order, height, medal }) => (
        <li key={place} className={`lb-col${entry.you ? ' lb-col-you' : ''}`}
            style={{ order, '--lb-i': order - 1 }}>
          <span className="lb-sr">{rowLabel(entry)}</span>
          <div className="lb-col-top" aria-hidden="true">
            {entry.you && <YouChip />}
            <span className={`lb-badge lb-${medal}`}>{entry.rank}</span>
            <span className="lb-name">{entry.name}</span>
            <span className="lb-stars"><Star />{starsLabel(entry.stars)}</span>
          </div>
          <div className={`lb-block lb-${height} lb-${medal}`} aria-hidden="true">{entry.rank}</div>
        </li>
      ))}
    </ol>
  );
}

function RestList({ rows }) {
  if (rows.length === 0) return null;
  return (
    // Only this area scrolls (about five rows), so the page does not grow; focusable for keyboard scrolling.
    <div className="lb-scroll" role="region" aria-label="More ranks" tabIndex={0}>
      <ol className="lb-list">
        {rows.map((r, i) => (
          <li key={`${r.rank}-${r.name}-${i}`} className={`lb-row${r.you ? ' lb-row-you' : ''}`}>
            <span className="lb-sr">{rowLabel(r)}</span>
            <span className="lb-circle" aria-hidden="true">{r.rank}</span>
            <span className="lb-row-name" aria-hidden="true">{r.name}{r.you && <> <YouChip /></>}</span>
            <span className="lb-stars" aria-hidden="true"><Star />{starsLabel(r.stars)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function YourPlace({ top, me }) {
  const place = yourPlaceRow(top, me);
  if (place.kind === 'row') {
    return (
      <div className="lb-mine">
        <p className="lb-row lb-row-you">
          <span className="lb-sr">{yourPlaceLabel(place)}</span>
          <span className="lb-circle lb-circle-wide" aria-hidden="true">#{place.rank}</span>
          <span className="lb-row-name" aria-hidden="true">You</span>
          <span className="lb-stars" aria-hidden="true"><Star />{starsLabel(place.stars)}</span>
        </p>
      </div>
    );
  }
  if (place.kind === 'no-stars') {
    return <p className="lb-mine lb-nostars"><Star />Play a game to get on the board.</p>;
  }
  return null;
}

export default function Leaderboard({ saved, onSaved }) {
  const [error, setError] = useState(null);   // the failing HTTP status (0 = no answer), or null
  const [round, setRound] = useState(0);      // "Try again" bumps this to ask again
  const [fresh, setFresh] = useState(false);  // true when this visit fetched the board: animate once

  useEffect(() => {
    if (saved) return undefined;               // already have it: no request
    let cancelled = false;                     // ignore an answer that arrives after the tab was left
    api('/api/leaderboard')
      .then((data) => {
        if (!cancelled) { setFresh(true); onSaved(readBoard(data)); }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.status ?? 0);
      });
    return () => { cancelled = true; };
  }, [saved, onSaved, round]);

  function retry() {
    setError(null);
    setRound((r) => r + 1);
  }

  let body;
  if (saved) {
    const empty = emptyState(saved.top);
    body = empty ? (
      <div className="lb-empty">
        <Star big />
        <p className="lb-empty-title">{empty.title}</p>
        <p>{empty.line}</p>
      </div>
    ) : (
      <>
        <Podium top={saved.top} />
        <RestList rows={restRows(saved.top)} />
      </>
    );
  } else if (error !== null) {
    body = (
      <p className="banner error lb-error" role="alert">
        {errorText(error)}
        {' '}<button type="button" className="btn" onClick={retry}>Try again</button>
      </p>
    );
  } else {
    body = <p className="muted lb-loading">Loading ranks...</p>;
  }

  return (
    <div className={`lb-card${fresh ? ' lb-animate' : ''}`}>
      <div className="lb-head">
        <h2>Top sailors</h2>
        <p className="lb-sub">Stars from your best games</p>
      </div>
      {body}
      {saved && <YourPlace top={saved.top} me={saved.me} />}
    </div>
  );
}
