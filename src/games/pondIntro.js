// The one-line Word Pond intro under the title, worked out from the round itself (nothing hard-coded).
// targets = how many meanings there are (one right fish each); decoys = the fish left over.
//   pondIntro(4, 6) -> 'Match each meaning with its fish. 4 are right, 2 are decoys.'
// When the counts do not describe real targets and decoys (no meanings, no spare fish, or bad input),
// only the first sentence is shown, so the line never states something untrue.
export function pondIntro(meaningCount, fishCount) {
  const base = 'Match each meaning with its fish.';
  const targets = Number.isInteger(meaningCount) ? meaningCount : 0;
  const decoys = Number.isInteger(fishCount) ? fishCount - targets : 0;
  if (targets < 2 || decoys < 1) return base;
  return `${base} ${targets} are right, ${decoys} ${decoys === 1 ? 'is a decoy' : 'are decoys'}.`;
}
