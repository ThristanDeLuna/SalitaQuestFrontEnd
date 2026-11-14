import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSummary } from '../auth/useSummary';
import Leaderboard from './Leaderboard';
import {
  badgeInfo, bestScoreLine, comingSoonLabel, daysLabel, questList, regionChipText, starsPercent,
  stickerHeading, weekDotLabel,
} from './passportLogic';
import './Passport.css';

// The Passport (wireframe page 11): the player's progress in four tabs (the fourth, Ranks, is the leaderboard).
// It reads the shared summary (GET /api/me/summary, fetched once by SummaryProvider);
// it does not fetch the summary itself. The summary has no region names, so this page
// asks the public GET /api/regions for them and shows the region code until they arrive.
// Everything is said in words; symbols and shapes are only an extra hint.

const TABS = [
  ['progress', 'Progress'],
  ['stickers', 'Stickers'],
  ['badges', 'Badges'],
  ['ranks', 'Ranks'],
];

// ---------- Progress: stars card, streak card, islands, today's quests ----------
// Small inline icons; always aria-hidden, the words next to them say the same thing.
const ICON_PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
};
function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"
         fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  );
}
const STATUS_ICON = { stamped: 'check', in_progress: 'play', not_started: 'play', locked: 'lock', coming_soon: 'clock' };

function ProgressTab({ summary, nameOf }) {
  const { streak } = summary;
  const percent = starsPercent(summary.stars, summary.max_stars);
  const soon = comingSoonLabel(summary.regions);
  return (
    <div className="pp-progress">
      <section className="pp-stars" aria-label="Total stars">
        <p className="pp-stars-label">Total stars</p>
        <p className="pp-big">{summary.stars} / {summary.max_stars}</p>
        {percent !== null && (
          <div className="pp-bar" aria-hidden="true"><div className="pp-bar-fill" style={{ width: `${percent}%` }} /></div>
        )}
        {soon && <p className="pp-stars-soon">{soon}</p>}
      </section>

      <section className="pp-card pp-streak" aria-label="Streak">
        <div className="pp-streak-top">
          <h2>Streak</h2>
          <strong>{daysLabel(streak.current)}</strong>
        </div>
        <ul className="pp-week" aria-label="This week">
          {streak.week.map((d) => (
            <li key={d.date} className="pp-day">
              <span className={d.active ? 'pp-circle pp-played' : 'pp-circle'}>
                {d.active && <Icon name="check" />}
              </span>
              <span aria-hidden="true">{d.day}</span>
              <span className="pp-sr">{weekDotLabel(d)}</span>
            </li>
          ))}
        </ul>
        <p className="muted">Longest: {daysLabel(streak.longest)}</p>
      </section>

      <section className="pp-islands">
        <h2>Your islands</h2>
        <ul className="pp-list">
          {summary.regions.map((r) => {
            const scores = bestScoreLine(r);
            return (
              <li key={r.code} className={`pp-island pp-${r.status}`}>
                <span className="pp-tile"><Icon name={STATUS_ICON[r.status] ?? 'clock'} /></span>
                <span className="pp-island-text">
                  <Link to={`/regions/${r.code}`} className="pp-island-name">{nameOf(r.code)}</Link>
                  {scores && <span className="muted">{scores}</span>}
                </span>
                <span className="chip">{regionChipText(r)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="pp-card pp-quests">
        <h2>Today's quests</h2>
        <ul className="pp-list">
          {questList(summary.quests_today).map((q) => (
            <li key={q.key} className="pp-quest">
              <span aria-hidden="true">{q.done ? '✓' : '○'}</span>
              <span>{q.text}</span>
              <span className={q.done ? 'pp-done' : 'muted'}>{q.done ? 'Done' : 'Not done'}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Stickers: the words of stamped regions; "?" for the rest, so nothing is spoiled ----------
function StickersTab({ summary, nameOf }) {
  return summary.regions.map((r) => (
    <section key={r.code} className="pp-stickers">
      <h2>{stickerHeading(nameOf(r.code), r.stickers)}</h2>
      {r.stickers.words ? (
        <ul className="pp-grid">
          {r.stickers.words.map((w) => (
            <li key={w.id} className="pp-sticker">
              <strong>{w.word}</strong>
              <span className="muted">{w.translation}</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className="pp-grid" aria-hidden="true">
            {Array.from({ length: r.stickers.total }, (_, i) => (
              <li key={i} className="pp-sticker pp-hidden">?</li>
            ))}
          </ul>
          <p className="muted">Stickers unlock when this region's stamp is earned.</p>
        </>
      )}
    </section>
  ));
}

// ---------- Badges: in the order the server sent them ----------
function BadgesTab({ summary }) {
  return (
    <ul className="pp-list">
      {summary.badges.map((b) => {
        const info = badgeInfo(b.key);
        return (
          <li key={b.key} className={`card pp-badge${b.earned ? ' pp-earned' : ''}`}>
            <strong>{info.title}</strong>
            <span className="muted">{info.description}</span>
            <span className="pp-badge-state">
              <span aria-hidden="true">{b.earned ? '★' : '🔒'}</span> {b.earned ? 'Earned' : 'Locked'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Passport() {
  const { summary, loading, error, reload } = useSummary();
  const [tab, setTab] = useState('progress');
  const [names, setNames] = useState({});            // region code -> name, empty until it arrives
  // The leaderboard, kept here once the Ranks tab has loaded it, so coming back to the tab does not ask again.
  const [ranks, setRanks] = useState(null);

  // Region names are only a nicer label: if this fails or is slow, the code is shown instead.
  useEffect(() => {
    let cancelled = false;                            // ignore an answer that arrives after we left
    api('/api/regions')
      .then((r) => {
        if (!cancelled) setNames(Object.fromEntries((r?.data ?? []).map((x) => [x.code, x.name])));
      })
      .catch(() => { /* keep showing the codes */ });
    return () => { cancelled = true; };
  }, []);
  const nameOf = (code) => names[code] ?? code;

  // A summary we already have is always shown, even if a later reload failed.
  if (!summary) {
    if (error !== null && !loading) {
      return (
        <p className="banner error" role="alert">
          {error === 0 ? 'Cannot reach the server. Check your connection and try again.'
                       : 'Could not load your Passport. Please try again.'}
          {' '}<button type="button" className="btn" onClick={reload}>Try again</button>
        </p>
      );
    }
    return <p className="muted">Loading your Passport...</p>;
  }

  return (
    <>
      <h1>Passport</h1>
      <div className="pp-tabs" role="tablist" aria-label="Passport sections">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" id={`pp-tab-${key}`} aria-controls="pp-panel"
                  aria-selected={tab === key} className={tab === key ? 'pp-tab pp-active' : 'pp-tab'}
                  onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <section id="pp-panel" role="tabpanel" aria-labelledby={`pp-tab-${tab}`} className="pp-panel">
        {tab === 'progress' && <ProgressTab summary={summary} nameOf={nameOf} />}
        {tab === 'stickers' && <StickersTab summary={summary} nameOf={nameOf} />}
        {tab === 'badges' && <BadgesTab summary={summary} />}
        {tab === 'ranks' && <Leaderboard saved={ranks} onSaved={setRanks} />}
      </section>
    </>
  );
}
