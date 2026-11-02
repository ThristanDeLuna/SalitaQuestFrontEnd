// Small helpers that turn parts of GET /api/me/summary into the words the Passport shows.
// Plain JavaScript on purpose (no React): every function only uses its arguments,
// so they can be tested with `npm test`.

// "0 days", "1 day", "3 days". Anything that is not a whole number of 0 or more counts as 0.
export function daysLabel(n) {
  const days = Number.isInteger(n) && n > 0 ? n : 0;
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

// The status of one region in words. The server decides the status (Game_rules::region_status).
const STATUS_TEXT = {
  stamped: 'Stamped',
  not_started: 'Not started',
  locked: 'Locked',
  coming_soon: 'Coming soon',
};
export function regionStatusText(region) {
  if (region?.status === 'in_progress') return `${region.games_passed ?? 0} of 2 games`;
  return STATUS_TEXT[region?.status] ?? 'Not available';
}

// The best score of one game in one region, e.g. "Word Pond: 30 / 40 (Bronze medal)".
// game is null when it was never played. The medal is 'gold', 'silver', 'bronze' or null (no medal).
const MEDAL_TEXT = { gold: 'Gold medal', silver: 'Silver medal', bronze: 'Bronze medal' };
export function bestText(label, game) {
  if (!game) return `${label}: not played yet`;
  const medal = MEDAL_TEXT[game.medal];
  return `${label}: ${game.best} / ${game.max}${medal ? ` (${medal})` : ''}`;
}

// The server sends only badge keys (Game_rules::BADGE_IDS), so the titles live here.
// The descriptions say what the server really checks (Game_rules::badges_for).
const BADGES = {
  first_stamp: { title: 'First Stamp', description: 'Earn a stamp' },
  sailor_3: { title: '3-day Sailor', description: 'Reach a 3-day streak (it is kept even if the streak later breaks)' },
  gold_catcher: { title: 'Gold Catcher', description: 'Full marks in any game' },
  sharp_ears: { title: 'Sharp Ears', description: 'Pass a Jeepney stop quiz' },
  island_hopper: { title: 'Island Hopper', description: 'Play games in 3 different regions' },
};
export function badgeInfo(key) {
  return BADGES[key] ?? { title: key, description: '' };
}

// "Tagalog 6 of 6". The server's stickers.unlocked is true or false for the whole region
// (true once its stamp is earned), so a region has either all of its stickers or none.
export function stickerHeading(name, stickers) {
  const total = stickers?.total ?? 0;
  return `${name} ${stickers?.unlocked ? total : 0} of ${total}`;
}

// Today's quests (Game_rules::quests_for), in a fixed order. The wording is ours:
// it was not found in the backend docs.
const QUESTS = [
  ['play_one', 'Play any game'],
  ['pass_one', 'Pass any game'],
  ['both_games', 'Play both Word Pond and Jeepney stop'],
];
export function questList(questsToday) {
  if (!questsToday || typeof questsToday !== 'object') return [];
  return QUESTS
    .filter(([key]) => key in questsToday)
    .map(([key, text]) => ({ key, text, done: questsToday[key] === true }));
}

// A screen-reader text for one week dot, e.g. "Mon: played".
// The server's `day` is one letter (M T W T F S S), and T and S are ambiguous, so the
// short name comes from the `date` ('Y-m-d') when it is there; otherwise the letter is used.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function weekDotLabel(day) {
  const at = /^\d{4}-\d{2}-\d{2}$/.test(day?.date ?? '') ? new Date(`${day.date}T00:00:00Z`) : null;
  const name = at && !Number.isNaN(at.getTime()) ? WEEKDAYS[at.getUTCDay()] : (day?.day ?? '?');
  return `${name}: ${day?.active ? 'played' : 'not played'}`;
}
