// Tests for the Passport helpers in passportLogic.js. Run with: npm test
// They use only Node's built-in test runner (node:test), so no extra packages are needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  badgeInfo, bestScoreLine, comingSoonLabel, daysLabel, questList, regionChipText, starsPercent, stickerHeading,
  weekDotLabel,
} from './passportLogic.js';

test('daysLabel', () => {
  assert.equal(daysLabel(0), '0 days');
  assert.equal(daysLabel(1), '1 day');
  assert.equal(daysLabel(3), '3 days');
  assert.equal(daysLabel(undefined), '0 days');
  assert.equal(daysLabel(-2), '0 days');
});

test('regionChipText for every status and an unknown one', () => {
  assert.equal(regionChipText({ status: 'stamped', games_passed: 2 }), 'Stamped');
  assert.equal(regionChipText({ status: 'in_progress', games_passed: 1 }), '1 of 2');
  assert.equal(regionChipText({ status: 'in_progress' }), '0 of 2');
  assert.equal(regionChipText({ status: 'not_started', games_passed: 0 }), 'Not started');
  assert.equal(regionChipText({ status: 'locked', games_passed: 0 }), 'Locked');
  assert.equal(regionChipText({ status: 'coming_soon', games_passed: 0 }), 'Coming soon');
  assert.equal(regionChipText({ status: 'flying', games_passed: 0 }), 'Not available');
});

test('bestScoreLine: scores, a game never played, and no line for locked / coming soon', () => {
  const both = { status: 'stamped', matching: { best: 30, max: 40 }, listening: { best: 50, max: 50 } };
  assert.equal(bestScoreLine(both), 'Word Pond 30/40 · Jeepney 50/50');
  assert.equal(bestScoreLine({ status: 'in_progress', matching: { best: 30, max: 40 }, listening: null }),
    'Word Pond 30/40 · Jeepney —');
  assert.equal(bestScoreLine({ status: 'not_started', matching: null, listening: null }),
    'Word Pond — · Jeepney —');
  assert.equal(bestScoreLine({ status: 'locked' }), null);
  assert.equal(bestScoreLine({ status: 'coming_soon' }), null);
  assert.equal(bestScoreLine(undefined), null);
});

test('comingSoonLabel: none, one, many', () => {
  assert.equal(comingSoonLabel([{ status: 'stamped' }]), '');
  assert.equal(comingSoonLabel([]), '');
  assert.equal(comingSoonLabel(undefined), '');
  assert.equal(comingSoonLabel([{ status: 'coming_soon' }, { status: 'stamped' }]), '1 island coming soon');
  assert.equal(comingSoonLabel([{ status: 'coming_soon' }, { status: 'coming_soon' }]), '2 islands coming soon');
});

test('starsPercent never divides by zero', () => {
  assert.equal(starsPercent(110, 450), 24);
  assert.equal(starsPercent(0, 450), 0);
  assert.equal(starsPercent(500, 450), 100);
  assert.equal(starsPercent(10, 0), null);
  assert.equal(starsPercent(10, undefined), null);
  assert.equal(starsPercent(undefined, 450), 0);
});

test('badgeInfo for every badge key the server sends, and an unknown key', () => {
  assert.deepEqual(badgeInfo('first_stamp'), { title: 'First Stamp', description: 'Earn a stamp' });
  assert.deepEqual(badgeInfo('sailor_3'), {
    title: '3-day Sailor', description: 'Reach a 3-day streak (it is kept even if the streak later breaks)',
  });
  assert.deepEqual(badgeInfo('gold_catcher'), { title: 'Gold Catcher', description: 'Full marks in any game' });
  assert.deepEqual(badgeInfo('sharp_ears'), { title: 'Sharp Ears', description: 'Pass a Jeepney stop quiz' });
  assert.deepEqual(badgeInfo('island_hopper'), {
    title: 'Island Hopper', description: 'Play games in 3 different regions',
  });
  assert.deepEqual(badgeInfo('moon_walker'), { title: 'moon_walker', description: '' });
});

test('stickerHeading for an unlocked and a locked region', () => {
  assert.equal(stickerHeading('Tagalog', { unlocked: true, total: 6 }), 'Tagalog 6 of 6');
  assert.equal(stickerHeading('Cebuano', { unlocked: false, total: 5 }), 'Cebuano 0 of 5');
});

test('questList uses the server keys in a fixed order', () => {
  const allFalse = questList({ play_one: false, pass_one: false, both_games: false });
  assert.deepEqual(allFalse.map((q) => q.key), ['play_one', 'pass_one', 'both_games']);
  assert.ok(allFalse.every((q) => q.done === false && q.text.length > 0));

  // A different key order in the object does not change the list order.
  const mixed = questList({ both_games: false, pass_one: true, play_one: true });
  assert.deepEqual(mixed.map((q) => [q.key, q.done]), [['play_one', true], ['pass_one', true], ['both_games', false]]);

  assert.deepEqual(questList(null), []);
  assert.deepEqual(questList(undefined), []);
});

test('weekDotLabel for a played and a not played day', () => {
  assert.equal(weekDotLabel({ date: '2026-11-02', day: 'M', active: true }), 'Monday, played');
  assert.equal(weekDotLabel({ date: '2026-11-05', day: 'T', active: false }), 'Thursday, not played');
  assert.equal(weekDotLabel({ day: 'S', active: false }), 'S, not played');   // no date: the letter
});
