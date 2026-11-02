// Tests for the Passport helpers in passportLogic.js. Run with: npm test
// They use only Node's built-in test runner (node:test), so no extra packages are needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  badgeInfo, bestText, daysLabel, questList, regionStatusText, stickerHeading, weekDotLabel,
} from './passportLogic.js';

test('daysLabel', () => {
  assert.equal(daysLabel(0), '0 days');
  assert.equal(daysLabel(1), '1 day');
  assert.equal(daysLabel(3), '3 days');
  assert.equal(daysLabel(undefined), '0 days');
  assert.equal(daysLabel(-2), '0 days');
});

test('regionStatusText for every status and an unknown one', () => {
  assert.equal(regionStatusText({ status: 'stamped', games_passed: 2 }), 'Stamped');
  assert.equal(regionStatusText({ status: 'in_progress', games_passed: 1 }), '1 of 2 games');
  assert.equal(regionStatusText({ status: 'not_started', games_passed: 0 }), 'Not started');
  assert.equal(regionStatusText({ status: 'locked', games_passed: 0 }), 'Locked');
  assert.equal(regionStatusText({ status: 'coming_soon', games_passed: 0 }), 'Coming soon');
  assert.equal(regionStatusText({ status: 'flying', games_passed: 0 }), 'Not available');
});

test('bestText for each medal and for a game never played', () => {
  assert.equal(bestText('Word Pond', { best: 40, max: 40, medal: 'gold' }), 'Word Pond: 40 / 40 (Gold medal)');
  assert.equal(bestText('Word Pond', { best: 40, max: 50, medal: 'silver' }), 'Word Pond: 40 / 50 (Silver medal)');
  assert.equal(bestText('Word Pond', { best: 30, max: 40, medal: 'bronze' }), 'Word Pond: 30 / 40 (Bronze medal)');
  assert.equal(bestText('Jeepney stop', { best: 20, max: 50, medal: null }), 'Jeepney stop: 20 / 50');
  assert.equal(bestText('Jeepney stop', null), 'Jeepney stop: not played yet');
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
  assert.equal(weekDotLabel({ date: '2026-11-02', day: 'M', active: true }), 'Mon: played');
  assert.equal(weekDotLabel({ date: '2026-11-05', day: 'T', active: false }), 'Thu: not played');
  assert.equal(weekDotLabel({ day: 'S', active: false }), 'S: not played');   // no date: the letter
});
