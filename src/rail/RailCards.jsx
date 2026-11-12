import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSummary } from '../auth/useSummary';
import { weekDotLabel } from '../passport/passportLogic';
import { islandPercent, nextGoal, questCount, questRows } from './railLogic';
import './RailCards.css';

// Four stacked cards for the shell's right rail (300 px): today's quests, this week,
// island progress and the next goal. No props: it reads the shared summary
// (GET /api/me/summary through useSummary, like Passport) and asks the public
// GET /api/regions for the names. Numbers are always written as text;
// bars and circles are only an extra hint.

function Bar({ percent }) {
  return (
    <div className="rl-bar" aria-hidden="true">
      <div className="rl-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Card({ title, aside, children, labelId }) {
  return (
    <section className="card rl-card" aria-labelledby={labelId}>
      <div className="rl-head">
        <h2 id={labelId}>{title}</h2>
        {aside && <span className="rl-aside">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Check({ done }) {
  return <span className={done ? 'rl-circle rl-on' : 'rl-circle'} aria-hidden="true">{done ? '✓' : ''}</span>;
}

export default function RailCards() {
  const { summary, loading, error } = useSummary();
  const [names, setNames] = useState({});            // region code -> name; codes are shown until it arrives

  useEffect(() => {
    let cancelled = false;                            // ignore an answer that arrives after we left
    api('/api/regions')
      .then((r) => {
        if (!cancelled) setNames(Object.fromEntries((r?.data ?? []).map((x) => [x.code, x.name])));
      })
      .catch(() => { /* keep showing the codes */ });
    return () => { cancelled = true; };
  }, []);

  if (!summary && error !== null && !loading) {
    return (
      <div className="rl-rail">
        <p className="banner error" role="alert">Could not load your progress. Please try again later.</p>
      </div>
    );
  }
  if (!summary && !loading) return null;            // a visitor: nothing to show

  const wait = !summary;
  const regions = Array.isArray(summary?.regions) ? summary.regions : [];
  const week = Array.isArray(summary?.streak?.week) ? summary.streak.week : [];
  const count = questCount(summary?.quests_today);

  return (
    <div className="rl-rail">
      <Card title="Today's quests" labelId="rl-quests" aside={wait ? null : `${count.done} / ${count.total}`}>
        {wait ? <p className="muted">Loading...</p> : (
          <>
            <Bar percent={(count.done / count.total) * 100} />
            <ul className="rl-list">
              {questRows(summary.quests_today).map((q) => (
                <li key={q.key} className="rl-row">
                  <Check done={q.done} />
                  <span>{q.text}{q.done && <span className="rl-sr"> (done)</span>}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {(wait || week.length > 0) && (
        <Card title="This week" labelId="rl-week">
          {wait ? <p className="muted">Loading...</p> : (
            <ul className="rl-week">
              {week.map((d, i) => (
                <li key={d.date ?? i} className="rl-day">
                  <Check done={d.active === true} />
                  <span aria-hidden="true">{d.day}</span>
                  <span className="rl-sr">{weekDotLabel(d)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card title="Island progress" labelId="rl-islands">
        {wait ? <p className="muted">Loading...</p> : (
          <ul className="rl-list">
            {regions.map((r) => {
              const pct = islandPercent(r);
              const note = pct !== null ? `${pct}%` : r.status === 'locked' ? 'Locked' : 'Coming soon';
              return (
                <li key={r.code} className="rl-island">
                  <div className="rl-island-top">
                    <span>{names[r.code] ?? r.code}</span>
                    <strong>{note}</strong>
                  </div>
                  {pct !== null && <Bar percent={pct} />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Next goal" labelId="rl-goal">
        {wait ? <p className="muted">Loading...</p> : <p className="rl-goal">{nextGoal(regions, names)}</p>}
      </Card>
    </div>
  );
}
