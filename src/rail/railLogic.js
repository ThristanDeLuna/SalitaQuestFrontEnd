// Pure helpers for the right-rail cards (RailCards.jsx), built from GET /api/me/summary.
// Plain JavaScript on purpose (no React), so `npm test` can check every branch.

// Today's quests, in a fixed order. The server has exactly these three (Game_rules::quests_for).
const QUESTS = [
  ['play_one', 'Play one game'],
  ['pass_one', 'Pass one game'],
  ['both_games', 'Play both games'],
];

export function questRows(questsToday) {
  const q = questsToday && typeof questsToday === 'object' ? questsToday : {};
  return QUESTS.map(([key, text]) => ({ key, text, done: q[key] === true }));
}

// { done: 2, total: 3 } for the "2 / 3" text and the bar.
export function questCount(questsToday) {
  const rows = questRows(questsToday);
  return { done: rows.filter((r) => r.done).length, total: rows.length };
}

// 0, 50 or 100 for a region you can play; null for locked and coming soon (no bar, no number).
export function islandPercent(region) {
  const status = region?.status;
  if (status === 'stamped') return 100;
  if (status !== 'in_progress' && status !== 'not_started') return null;
  const passed = Number.isFinite(region.games_passed) ? Math.min(2, Math.max(0, region.games_passed)) : 0;
  return (passed / 2) * 100;
}

// A game is passed when it has a medal. null or a missing game = not passed.
const isPassed = (game) => Boolean(game && game.medal);

// One sentence about what to do next. It never names an island that is still locked
// (soft lock: a stamp opens a slot, not a named island).
export function nextGoal(regions, names = {}) {
  const list = Array.isArray(regions) ? regions : [];
  const nameOf = (r) => names[r.code] ?? r.code;

  for (const r of list) {
    if (r.status !== 'in_progress') continue;
    if (!isPassed(r.matching)) return `Pass Word Pond to stamp ${nameOf(r)}.`;
    if (!isPassed(r.listening)) return `Pass Jeepney stop to stamp ${nameOf(r)}.`;
  }
  const fresh = list.find((r) => r.status === 'not_started');
  if (fresh) return `Start ${nameOf(fresh)}: play Word Pond.`;
  if (list.some((r) => r.status === 'stamped')) {
    return 'Every open island is stamped. More islands are coming soon.';
  }
  return 'Play Word Pond to begin.';
}
