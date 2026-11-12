import test from 'node:test';
import assert from 'node:assert/strict';
import { islandPercent, nextGoal, questCount, questRows } from './railLogic.js';

const medal = { best: 30, max: 40, medal: 'bronze' };
const fail = { best: 10, max: 40, medal: null };
const names = { tagalog: 'Tagalog', cebuano: 'Cebuano' };

test('questCount counts done quests out of three', () => {
  assert.deepEqual(questCount({ play_one: true, pass_one: true, both_games: false }), { done: 2, total: 3 });
  assert.deepEqual(questCount({ play_one: false, pass_one: false, both_games: false }), { done: 0, total: 3 });
  assert.deepEqual(questCount({ play_one: true, pass_one: true, both_games: true }), { done: 3, total: 3 });
});

test('questCount and questRows survive a missing object', () => {
  assert.deepEqual(questCount(undefined), { done: 0, total: 3 });
  assert.deepEqual(questCount(null), { done: 0, total: 3 });
  assert.deepEqual(questRows({}).map((r) => r.text), ['Play one game', 'Pass one game', 'Play both games']);
});

test('islandPercent for each status', () => {
  assert.equal(islandPercent({ status: 'not_started', games_passed: 0 }), 0);
  assert.equal(islandPercent({ status: 'in_progress', games_passed: 1 }), 50);
  assert.equal(islandPercent({ status: 'stamped', games_passed: 2 }), 100);
  assert.equal(islandPercent({ status: 'locked', games_passed: 0 }), null);
  assert.equal(islandPercent({ status: 'coming_soon' }), null);
  assert.equal(islandPercent(undefined), null);
  assert.equal(islandPercent({ status: 'in_progress' }), 0);                      // missing games_passed
  assert.equal(islandPercent({ status: 'in_progress', games_passed: 9 }), 100);   // clamped
});

test('nextGoal: in_progress with nothing passed asks for Word Pond', () => {
  const r = [{ code: 'tagalog', status: 'in_progress', matching: null, listening: null }];
  assert.equal(nextGoal(r, names), 'Pass Word Pond to stamp Tagalog.');
  const failed = [{ code: 'tagalog', status: 'in_progress', matching: fail }];
  assert.equal(nextGoal(failed, names), 'Pass Word Pond to stamp Tagalog.');
});

test('nextGoal: in_progress with Word Pond passed asks for Jeepney stop', () => {
  const r = [{ code: 'cebuano', status: 'in_progress', matching: medal, listening: null }];
  assert.equal(nextGoal(r, names), 'Pass Jeepney stop to stamp Cebuano.');
});

test('nextGoal: in_progress comes before not_started', () => {
  const r = [
    { code: 'a', status: 'not_started' },
    { code: 'cebuano', status: 'in_progress', matching: medal },
  ];
  assert.equal(nextGoal(r, names), 'Pass Jeepney stop to stamp Cebuano.');
});

test('nextGoal: not_started region, the name falls back to the code', () => {
  assert.equal(nextGoal([{ code: 'tagalog', status: 'not_started' }], names), 'Start Tagalog: play Word Pond.');
  assert.equal(nextGoal([{ code: 'ilocano', status: 'not_started' }], {}), 'Start ilocano: play Word Pond.');
});

test('nextGoal: every open island stamped, others locked or coming soon', () => {
  const r = [
    { code: 'tagalog', status: 'stamped' },
    { code: 'hiligaynon', status: 'locked' },
    { code: 'ilocano', status: 'coming_soon' },
  ];
  const text = nextGoal(r, names);
  assert.equal(text, 'Every open island is stamped. More islands are coming soon.');
  assert.doesNotMatch(text, /hiligaynon|ilocano|unlock/i);
});

test('nextGoal never names a locked island, and handles empty or missing lists', () => {
  const r = [{ code: 'hiligaynon', status: 'locked' }, { code: 'tagalog', status: 'stamped' }];
  assert.doesNotMatch(nextGoal(r, { hiligaynon: 'Hiligaynon' }), /Hiligaynon/);
  assert.equal(nextGoal([], names), 'Play Word Pond to begin.');
  assert.equal(nextGoal(undefined), 'Play Word Pond to begin.');
});
