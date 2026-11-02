// The Word Pond catching rules, in plain JavaScript (no React), so they can be tested with `npm test`.
//
// The screen shows 4 meanings and some fish (words). The player picks a meaning
// (the "selected" one), then taps a fish to catch it onto that meaning.
// State shape:
//   { meanings: string[4],                  the 4 meanings, in the order the server sent them
//     caught:   { [meaning]: wordId|null },  which fish sits on each meaning
//     selected: string|null }               the meaning the next fish goes to
// The reducer never changes the old state object: it always returns a new one
// (or the very same object when nothing changes), as React's useReducer expects.

export const PAIRS = 4;   // the server wants exactly 4 pairs (Game_rules::MATCHING_PAIRS)

// The start of a round: nothing caught, the first meaning selected.
export function initialPond(meanings) {
  const list = [...meanings];
  return {
    meanings: list,
    // Object.fromEntries makes real own keys even for odd meanings like "constructor".
    caught: Object.fromEntries(list.map((m) => [m, null])),
    selected: list[0] ?? null,
  };
}

const hasMeaning = (state, meaning) => state.meanings.includes(meaning);

// The next meaning with no fish, looking after `from` in list order and wrapping around.
// Returns null when every meaning has a fish.
function nextEmpty(meanings, caught, from) {
  const start = meanings.indexOf(from);
  for (let step = 1; step <= meanings.length; step += 1) {
    const m = meanings[(start + step) % meanings.length];
    if (caught[m] === null) return m;
  }
  return null;
}

export function pondReducer(state, action) {
  switch (action?.type) {
    case 'select': {
      // Only one of the four meanings can be selected; anything else is ignored.
      if (!hasMeaning(state, action.meaning) || state.selected === action.meaning) return state;
      return { ...state, selected: action.meaning };
    }
    case 'catch': {
      const { selected } = state;
      const { wordId } = action;
      if (selected === null || !hasMeaning(state, selected)) return state;   // nowhere to put it
      if (wordId === null || wordId === undefined) return state;

      // One pass over the meanings builds the new "caught":
      // - the selected meaning gets this fish (a fish that was there goes back to the pond);
      // - if this fish was already on another meaning, that meaning becomes empty
      //   (a fish MOVES; it never sits on two meanings).
      const caught = Object.fromEntries(state.meanings.map((m) => {
        if (m === selected) return [m, wordId];
        return [m, state.caught[m] === wordId ? null : state.caught[m]];
      }));

      // Move on to the next empty meaning, or stay put if all four are full.
      const next = nextEmpty(state.meanings, caught, selected);
      return { ...state, caught, selected: next ?? selected };
    }
    default:
      return state;   // unknown action: same object, so React skips the re-render
  }
}

// The word ids that are caught right now, in meaning order.
export function caughtWordIds(state) {
  return state.meanings.map((m) => state.caught[m]).filter((id) => id !== null && id !== undefined);
}

// Finish is allowed only when all 4 meanings hold a fish and the 4 fish are different.
export function canFinish(state) {
  const ids = caughtWordIds(state);
  return state.meanings.length === PAIRS && ids.length === PAIRS && new Set(ids).size === PAIRS;
}

// The body the server wants: [{word_id, meaning}] x4, in the order of state.meanings.
export function buildPairs(state) {
  if (!canFinish(state)) throw new Error('The pond is not finished: catch a different fish for every meaning.');
  return state.meanings.map((meaning) => ({ word_id: state.caught[meaning], meaning }));
}

// The fish (word id) on one meaning, or null.
export function fishForMeaning(state, meaning) {
  if (!hasMeaning(state, meaning)) return null;
  return state.caught[meaning] ?? null;
}

// The rows for the results card: the server answers with word ids, so we look up
// each word's text in the round's fish. A missing word shows its id instead.
export function matchingRows(results, words) {
  const text = new Map((words ?? []).map((w) => [w.word_id, w.word]));
  return (results ?? []).map((r) => ({
    key: r.word_id,
    word: text.get(r.word_id) ?? `#${r.word_id}`,
    rightMeaning: r.right_meaning,
    yourMeaning: r.your_meaning,
    correct: r.correct === true,
  }));
}

// Seconds as m:ss for the timer, e.g. 65 -> "1:05". Bad or negative input shows "0:00".
export function formatTime(totalSeconds) {
  const s = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
