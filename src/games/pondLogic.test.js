// Tests for the Word Pond rules in pondLogic.js. Run with: npm test
// They use only Node's built-in test runner (node:test), so no extra packages are needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPairs, canFinish, caughtWordIds, fishForMeaning, formatTime, initialPond, matchingRows, pondReducer,
} from './pondLogic.js';

const MEANINGS = ['water', 'fire', 'house', 'love'];
const start = () => initialPond(MEANINGS);
const catchFish = (state, wordId) => pondReducer(state, { type: 'catch', wordId });
const select = (state, meaning) => pondReducer(state, { type: 'select', meaning });
// Catch the given fish one after another, starting from a fresh pond.
const catchAll = (...ids) => ids.reduce(catchFish, start());

test('initial state selects the first meaning and nothing is caught', () => {
  const s = start();
  assert.equal(s.selected, 'water');
  assert.deepEqual(s.caught, { water: null, fire: null, house: null, love: null });
  assert.deepEqual(caughtWordIds(s), []);
});

test('catching puts the fish on the selected meaning and moves on to the next empty one', () => {
  const s = catchFish(start(), 11);
  assert.equal(fishForMeaning(s, 'water'), 11);
  assert.equal(s.selected, 'fire');
});

test('the selection skips filled meanings and wraps around', () => {
  let s = catchAll(11, 12);              // water, fire filled; selected = house
  s = select(s, 'love');
  s = catchFish(s, 14);                  // love filled; next empty after love wraps to house
  assert.equal(s.selected, 'house');
});

test('when every meaning is full the selection stays where it is', () => {
  const s = catchAll(11, 12, 13, 14);
  assert.equal(s.selected, 'love');
});

test('catching a fish that is already caught MOVES it', () => {
  let s = catchFish(start(), 11);        // 11 on water, selected = fire
  s = catchFish(s, 11);                  // 11 moves to fire
  assert.equal(fishForMeaning(s, 'water'), null);
  assert.equal(fishForMeaning(s, 'fire'), 11);
  assert.equal(caughtWordIds(s).filter((id) => id === 11).length, 1);
  assert.equal(s.selected, 'house');     // next empty after fire
});

test('catching onto an occupied meaning sends the old fish back to the pond', () => {
  let s = catchFish(start(), 11);        // 11 on water
  s = select(s, 'water');
  s = catchFish(s, 22);                  // 22 replaces 11
  assert.equal(fishForMeaning(s, 'water'), 22);
  assert.deepEqual(caughtWordIds(s), [22]);
});

test('with no selected meaning, catching does nothing', () => {
  const s = { ...start(), selected: null };
  assert.equal(catchFish(s, 11), s);
});

test('selecting a meaning that is not in the list is ignored', () => {
  const s = start();
  assert.equal(select(s, 'not a meaning'), s);
  assert.equal(select(s, 'house').selected, 'house');
});

test('canFinish is false at 0, 1, 2 and 3 caught and true at 4', () => {
  const ids = [11, 12, 13, 14];
  for (let n = 0; n < 4; n += 1) assert.equal(canFinish(catchAll(...ids.slice(0, n))), false, `${n} caught`);
  assert.equal(canFinish(catchAll(...ids)), true);
});

test('canFinish is false when a state repeats a word id (never made by the reducer)', () => {
  const s = { ...start(), caught: { water: 1, fire: 1, house: 2, love: 3 } };
  assert.equal(canFinish(s), false);
});

test('buildPairs returns 4 pairs in meaning order with distinct word ids', () => {
  let s = start();
  s = select(s, 'love'); s = catchFish(s, 14);   // filled out of order on purpose
  s = catchFish(s, 11);                          // next empty after love = water
  s = catchFish(s, 12);                          // fire
  s = catchFish(s, 13);                          // house
  const pairs = buildPairs(s);
  assert.deepEqual(pairs, [
    { word_id: 11, meaning: 'water' },
    { word_id: 12, meaning: 'fire' },
    { word_id: 13, meaning: 'house' },
    { word_id: 14, meaning: 'love' },
  ]);
  assert.equal(new Set(pairs.map((p) => p.word_id)).size, 4);
});

test('buildPairs throws when the pond is not finished', () => {
  assert.throws(() => buildPairs(catchAll(11, 12, 13)));
});

test('an unknown action returns the very same state object', () => {
  const s = start();
  assert.equal(pondReducer(s, { type: 'splash' }), s);
  assert.equal(pondReducer(s, undefined), s);
});

test('the reducer never changes the previous state', () => {
  let s = catchAll(11, 12);
  const actions = [
    { type: 'catch', wordId: 11 }, { type: 'select', meaning: 'water' },
    { type: 'catch', wordId: 33 }, { type: 'catch', wordId: 12 }, { type: 'select', meaning: 'nope' },
  ];
  for (const action of actions) {
    const before = structuredClone(s);
    const next = pondReducer(s, action);
    assert.deepEqual(s, before, `state changed by ${JSON.stringify(action)}`);
    s = next;
  }
});

test('matchingRows turns word ids into word text', () => {
  const words = [{ word_id: 1, word: 'tubig', audio_url: null }];
  const rows = matchingRows(
    [{ word_id: 1, your_meaning: 'fire', right_meaning: 'water', correct: false },
     { word_id: 9, your_meaning: 'love', right_meaning: 'love', correct: true }],
    words,
  );
  assert.deepEqual(rows, [
    { key: 1, word: 'tubig', rightMeaning: 'water', yourMeaning: 'fire', correct: false },
    { key: 9, word: '#9', rightMeaning: 'love', yourMeaning: 'love', correct: true },
  ]);
});

test('formatTime shows m:ss', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(5), '0:05');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(600), '10:00');
  assert.equal(formatTime(-3), '0:00');
  assert.equal(formatTime(NaN), '0:00');
});
