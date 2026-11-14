// Tests for the Ranks tab helpers in leaderboardLogic.js. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState, errorText, medalFor, podiumOrder, readBoard, restRows, rowLabel, showYourPlace, starsLabel,
  yourPlaceLabel, yourPlaceRow,
} from './leaderboardLogic.js';

const e = (rank, name, stars, you = false) => ({ rank, name, stars, you });
const FULL = [
  e(1, 'Ana R.', 90), e(2, 'Ben T.', 50), e(2, 'You Me', 50, true), e(4, 'Cara', 40), e(5, 'Dino', 30),
  e(6, 'Eli', 25), e(7, 'Fe', 20), e(8, 'Gino', 15), e(9, 'Hana', 10), e(10, 'Ivo', 5),
];

test('starsLabel: singular, plural, and bad input', () => {
  assert.equal(starsLabel(1), '1 star');
  assert.equal(starsLabel(0), '0 stars');
  assert.equal(starsLabel(90), '90 stars');
  assert.equal(starsLabel(undefined), '0 stars');
  assert.equal(starsLabel(-3), '0 stars');
  assert.equal(starsLabel(2.5), '0 stars');
});

test('readBoard: keeps good entries, caps at 10, cleans me, never throws', () => {
  const b = readBoard({ top: [...FULL, e(11, 'Extra', 1)], me: { rank: 2, stars: 50 } });
  assert.equal(b.top.length, 10);
  assert.deepEqual(b.top[2], { rank: 2, name: 'You Me', stars: 50, you: true });
  assert.deepEqual(b.me, { rank: 2, stars: 50 });
  assert.deepEqual(readBoard({ top: [], me: { rank: null, stars: 0 } }), { top: [], me: { rank: null, stars: 0 } });
  assert.deepEqual(readBoard({ top: [], me: null }), { top: [], me: null });
  assert.deepEqual(readBoard(null), { top: [], me: null });
  assert.deepEqual(readBoard({ top: [null, { rank: 'x' }, { rank: 1, name: '' }] }).top,
    [{ rank: 1, name: 'Player', stars: 0, you: false }]);
});

test('medalFor: gold, silver, bronze', () => {
  assert.equal(medalFor(1), 'gold');
  assert.equal(medalFor(2), 'silver');
  assert.equal(medalFor(3), 'bronze');
});

test('podiumOrder: 2nd left, 1st middle, 3rd right; a tie shares the colour', () => {
  const p = podiumOrder(FULL);
  assert.deepEqual(p.map((c) => c.place), [1, 2, 3]);               // reading order
  const visual = [...p].sort((a, b) => a.order - b.order).map((c) => c.entry.name);
  assert.deepEqual(visual, ['Ben T.', 'Ana R.', 'You Me']);
  assert.deepEqual(p.map((c) => c.height), ['tall', 'mid', 'short']);
  assert.deepEqual(p.map((c) => c.medal), ['gold', 'silver', 'silver']);   // the tie at rank 2
  assert.equal(p[2].entry.you, true);                                     // the caller is the 2nd of the tie
});

test('podiumOrder: with 2 entries and 1 entry, only those', () => {
  const two = podiumOrder([e(1, 'Ana', 9), e(2, 'Ben', 3)]);
  assert.deepEqual([...two].sort((a, b) => a.order - b.order).map((c) => c.entry.name), ['Ben', 'Ana']);
  const one = podiumOrder([e(1, 'Ana', 9)]);
  assert.equal(one.length, 1);
  assert.equal(one[0].order, 1);
  assert.equal(one[0].height, 'tall');
  assert.deepEqual(podiumOrder([]), []);
  assert.deepEqual(podiumOrder(undefined), []);
});

test('restRows: entries 4 to 10', () => {
  assert.deepEqual(restRows(FULL).map((r) => r.rank), [4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(restRows(FULL.slice(0, 3)), []);
  assert.deepEqual(restRows(null), []);
});

test('yourPlaceRow / showYourPlace: outside the top, in a tie, no stars, admin, empty board', () => {
  const others = FULL.map((x) => ({ ...x, you: false }));
  assert.deepEqual(yourPlaceRow(others, { rank: 14, stars: 3 }), { kind: 'row', rank: 14, stars: 3 });
  assert.equal(showYourPlace(others, { rank: 14, stars: 3 }), true);
  // The caller is in the list (2nd of a tie): no extra row.
  assert.deepEqual(yourPlaceRow(FULL, { rank: 2, stars: 50 }), { kind: 'none' });
  assert.equal(showYourPlace(FULL, { rank: 2, stars: 50 }), false);
  assert.deepEqual(yourPlaceRow(others, { rank: null, stars: 0 }), { kind: 'no-stars' });
  assert.deepEqual(yourPlaceRow(others, null), { kind: 'none' });
  assert.equal(showYourPlace(others, null), false);
  assert.deepEqual(yourPlaceRow([], { rank: null, stars: 0 }), { kind: 'none' });
});

test('yourPlaceLabel', () => {
  assert.equal(yourPlaceLabel({ rank: 14, stars: 1 }), 'Your place: rank 14, 1 star');
});

test('emptyState', () => {
  assert.deepEqual(emptyState([]), { title: 'No one is on the board yet.', line: 'Play a game to be first.' });
  assert.deepEqual(emptyState(undefined), { title: 'No one is on the board yet.', line: 'Play a game to be first.' });
  assert.equal(emptyState(FULL), null);
});

test('rowLabel: with and without "you"', () => {
  assert.equal(rowLabel(e(1, 'Ana R.', 90)), 'Rank 1, Ana R., 90 stars');
  assert.equal(rowLabel(e(2, 'You Me', 1, true)), 'Rank 2, You Me, 1 star, you');
});

test('errorText: 404, no answer, other', () => {
  assert.equal(errorText(404), 'Ranks are not available yet.');
  assert.equal(errorText(0), 'Cannot reach the server. Check your connection and try again.');
  assert.equal(errorText(500), 'Could not load the ranks. Please try again.');
});
