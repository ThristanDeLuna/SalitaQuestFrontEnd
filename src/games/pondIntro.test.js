import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pondIntro } from './pondIntro.js';

const BASE = 'Match each meaning with its fish.';

test('4 meanings and 6 fish: 4 right, 2 decoys', () => {
  assert.equal(pondIntro(4, 6), `${BASE} 4 are right, 2 are decoys.`);
});

test('the numbers come from the round', () => {
  assert.equal(pondIntro(4, 7), `${BASE} 4 are right, 3 are decoys.`);
  assert.equal(pondIntro(4, 5), `${BASE} 4 are right, 1 is a decoy.`);
});

test('no decoys, or counts that make no sense: only the first sentence', () => {
  assert.equal(pondIntro(4, 4), BASE);
  assert.equal(pondIntro(4, 3), BASE);
  assert.equal(pondIntro(0, 6), BASE);
  assert.equal(pondIntro(undefined, 6), BASE);
  assert.equal(pondIntro(4, null), BASE);
});
