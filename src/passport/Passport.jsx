import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSummary } from '../auth/useSummary';
import {
  badgeInfo, bestText, daysLabel, questList, regionStatusText, stickerHeading, weekDotLabel,
} from './passportLogic';
import './Passport.css';

// The Passport (wireframe page 11): the player's progress in three tabs.
// It reads the shared summary (GET /api/me/summary, fetched once by SummaryProvider);
// it does not fetch the summary itself. The summary has no region names, so this page
// asks the public GET /api/regions for them and shows the region code until they arrive.
// Everything is said in words; symbols and shapes are only an extra hint.

const TABS = [
  ['progress', 'Progress'],
  ['stickers', 'Stickers'],
  ['badges', 'Badges'],
];

// ---------- Progress: stars, streak, week, regions, today's quests ----------
function ProgressTab({ summary, nameOf }) {
  const { streak } = summary;
  return (
    <>
      <p className="pp-big">Stars {summary.stars} / {summary.max_stars}</p>

      <h2>Streak</h2>
      <p>{daysLabel(streak.current)} <span className="muted">· Longest: {daysLabel(streak.longest)}</span></p>
      <ul className="pp-week" aria-label="This week">
        {streak.week.map((d) => (
          <li key={d.date} className={d.active ? 'pp-dot pp-played' : 'pp-dot'}>
            <span aria-hidden="true" className="pp-dot-mark">{d.active ? '●' : '○'}</span>
            <span aria-hidden="true">{d.day}</span>
            <span className="pp-sr">{weekDotLabel(d)}</span>
          </li>
        ))}
      </ul>

      <h2>Regions</h2>
      <ul className="pp-list">
        {summary.regions.map((r) => (
          <li key={r.code} className="card pp-region">
            <div className="pp-region-top">
              <Link to={`/regions/${r.code}`}><strong>{nameOf(r.code)}</strong></Link>
              <span className="chip">{regionStatusText(r)}</span>
            </div>
            <span className="muted">{bestText('Word Pond', r.matching)}</span>
            <span className="muted">{bestText('Jeepney stop', r.listening)}</span>
          </li>
        ))}
      </ul>

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
    </>
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
      </section>
    </>
  );
}
