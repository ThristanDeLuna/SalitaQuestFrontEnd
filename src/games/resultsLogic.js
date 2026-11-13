// Pure helpers for the results pop-up (ResultsCard / StampMoment). No React, no requests.

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const points = (n) => `${n} more ${n === 1 ? 'point' : 'points'}`;

// One coaching line under the score, worked out ONLY from the server's submit answer (DEC-13):
// score, max_score, pass_mark, passed and medal ('gold' | 'silver' | 'bronze' | null).
// The silver threshold is not sent, so bronze gets no number; gold means full marks.
// Any field missing (or a combination with nothing true to say): null, and the card shows nothing.
//   coachingLine({ score: 20, max_score: 40, pass_mark: 24, passed: false, medal: null }) -> '4 more points to pass.'
export function coachingLine(result) {
  if (!result || typeof result !== 'object') return null;
  const { score, max_score: max, pass_mark: passMark, passed, medal } = result;
  if (!isNum(score) || !isNum(max) || !isNum(passMark) || typeof passed !== 'boolean' || medal === undefined) {
    return null;
  }
  if (!passed) return passMark > score ? `${points(passMark - score)} to pass.` : null;
  if (medal === 'bronze') return 'Passed! Try again for Silver.';
  if (medal === 'silver') return score < max ? `So close! ${points(max - score)} for Gold.` : null;
  if (medal === 'gold') return 'Full marks!';
  return null;
}

// Font size (SVG units in the stamp's 200-unit viewBox) for the region name on the stamp's top arc.
// The stamp is drawn at 168 px (0.84 px per unit), so the smallest size, 17, is still 14.3 px.
// Names longer than 12 letters also get squeezed to the arc's length (see STAMP_ARC).
export const STAMP_ARC = 172;   // usable length of the top arc, in viewBox units
export function stampNameSize(name) {
  const len = typeof name === 'string' ? name.length : 0;
  return len <= 8 ? 20 : 17;
}
export const stampNameFits = (name) => typeof name === 'string' && name.length <= 12;
