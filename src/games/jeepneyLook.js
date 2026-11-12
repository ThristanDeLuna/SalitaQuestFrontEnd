// Small pure helpers for the Jeepney stop's look (no React, so node:test can check them).
//   signText('Cebuano')            -> 'CEBUANO'      (the roof sign of JeepneyArt)
//   signTextLength('KAPAMPANGAN')  -> 76            (how wide the sign text is drawn, in art px)
//   doneShare(2, 5)                -> 0.4           (the progress bar: questions done / all)

export const SIGN_FALLBACK = 'SALITA QUEST';
export const SIGN_TEXT_MAX = 76;     // the sign's inner width (JeepneyArt: 84 px panel, 4 px each side)
const SIGN_CHAR_W = 7;               // about one bold capital at the sign's 11 px font

// The region name in capitals for the roof sign; the game's name when there is none.
export function signText(name) {
  const text = typeof name === 'string' ? name.trim().toUpperCase() : '';
  return text || SIGN_FALLBACK;
}

// Every letter gets the same width, and a long name is squeezed to fit the panel instead of spilling over.
export function signTextLength(text) {
  return Math.min(SIGN_TEXT_MAX, text.length * SIGN_CHAR_W);
}

// Share of the round already done, 0 to 1. At the start of question N (index N-1) that is N-1 of total.
// It only counts questions passed, never right or wrong (DEC-56).
export function doneShare(index, total) {
  if (!(total > 0)) return 0;
  return Math.min(1, Math.max(0, index / total));
}
