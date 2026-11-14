// Small helpers for the Passport "Ranks" tab (GET /api/leaderboard).
// Plain JavaScript on purpose (no React): every function only uses its arguments,
// so they can be tested with `npm test`.
//
// The API answers { top: [{ rank, name, stars, you }, ... up to 10, sorted], me: { rank, stars } | null }.
// Ties share a rank (1, 2, 2, 4). me.rank is null for a player with no stars; me is null for an admin.

// "0 stars", "1 star", "12 stars". Anything that is not a whole number of 0 or more counts as 0.
export function starsLabel(n) {
  const stars = Number.isInteger(n) && n > 0 ? n : 0;
  return `${stars} ${stars === 1 ? 'star' : 'stars'}`;
}

// Turns the raw answer into a safe board: entries without a whole-number rank are dropped,
// at most 10 are kept, a missing name becomes "Player". A bad answer gives an empty board, never a crash.
export function readBoard(data) {
  const top = (Array.isArray(data?.top) ? data.top : [])
    .filter((e) => e && typeof e === 'object' && Number.isInteger(e.rank) && e.rank > 0)
    .slice(0, 10)
    .map((e) => ({
      rank: e.rank,
      name: typeof e.name === 'string' && e.name.trim() ? e.name.trim() : 'Player',
      stars: Number.isInteger(e.stars) && e.stars > 0 ? e.stars : 0,
      you: e.you === true,
    }));
  const raw = data?.me;
  const me = raw && typeof raw === 'object'
    ? { rank: Number.isInteger(raw.rank) && raw.rank > 0 ? raw.rank : null, stars: Number.isInteger(raw.stars) && raw.stars > 0 ? raw.stars : 0 }
    : null;
  return { top, me };
}

// The medal colour of a rank. Ties share a rank, so two columns can share a colour.
// In the first three positions the rank is always 1, 2 or 3 (competition ranking).
const MEDALS = { 1: 'gold', 2: 'silver', 3: 'bronze' };
export function medalFor(rank) {
  return MEDALS[rank] ?? 'bronze';
}

// The podium: the first three entries BY POSITION in the list (place 1, 2, 3), in that order
// (the order a screen reader reads them). `order` is the visual column: 2nd left, 1st middle,
// 3rd right. With 1 or 2 entries only those are returned (the CSS centres them).
// The block height follows the place: 1st tallest, 2nd medium, 3rd shortest.
const VISUAL_ORDER = { 1: 2, 2: 1, 3: 3 };
const HEIGHT = { 1: 'tall', 2: 'mid', 3: 'short' };
export function podiumOrder(top) {
  const firstThree = Array.isArray(top) ? top.slice(0, 3) : [];
  return firstThree.map((entry, i) => {
    const place = i + 1;
    // With a single entry it is the only column, so it comes first.
    const order = firstThree.length === 1 ? 1 : VISUAL_ORDER[place];
    return { entry, place, order, height: HEIGHT[place], medal: medalFor(entry.rank) };
  });
}

// The list under the podium: entries 4 to 10.
export function restRows(top) {
  return Array.isArray(top) ? top.slice(3, 10) : [];
}

// The "your place" part at the bottom of the card:
//   { kind: 'row', rank, stars }  the caller has a rank but is not in the top list
//   { kind: 'no-stars' }          the caller has no stars yet (and the board is not empty)
//   { kind: 'none' }              admin (me is null), or the caller is already in the top list,
//                                 or the board is empty (its own message already says "Play a game")
export function yourPlaceRow(top, me) {
  if (!me) return { kind: 'none' };
  const list = Array.isArray(top) ? top : [];
  if (list.some((e) => e?.you === true)) return { kind: 'none' };
  if (me.rank === null || me.rank === undefined) return list.length === 0 ? { kind: 'none' } : { kind: 'no-stars' };
  return { kind: 'row', rank: me.rank, stars: me.stars ?? 0 };
}
export function showYourPlace(top, me) {
  return yourPlaceRow(top, me).kind !== 'none';
}

// The screen-reader text of the "your place" row, e.g. "Your place: rank 14, 12 stars".
export function yourPlaceLabel(place) {
  return `Your place: rank ${place.rank}, ${starsLabel(place.stars)}`;
}

// The empty board message, or null when there is someone on the board.
export function emptyState(top) {
  if (Array.isArray(top) && top.length > 0) return null;
  return { title: 'No one is on the board yet.', line: 'Play a game to be first.' };
}

// The accessible text of one row or podium column: "Rank 1, Ana R., 90 stars" (", you" for the caller).
export function rowLabel(entry) {
  return `Rank ${entry.rank}, ${entry.name}, ${starsLabel(entry.stars)}${entry.you ? ', you' : ''}`;
}

// The error banner text for a failed request (status 0 = no answer at all).
// 404 means the backend with /api/leaderboard is not deployed yet.
export function errorText(status) {
  if (status === 404) return 'Ranks are not available yet.';
  if (status === 0) return 'Cannot reach the server. Check your connection and try again.';
  return 'Could not load the ranks. Please try again.';
}
