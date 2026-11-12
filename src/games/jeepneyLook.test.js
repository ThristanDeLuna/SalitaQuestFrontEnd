// Tests for jeepneyLook.js (the roof sign text and the progress bar share). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIGN_FALLBACK, SIGN_TEXT_MAX, doneShare, signText, signTextLength } from './jeepneyLook.js';

test('signText puts the region name in capitals', () => {
  assert.equal(signText('Cebuano'), 'CEBUANO');
  assert.equal(signText('  Kapampangan '), 'KAPAMPANGAN');
  assert.equal(signText('tagalog'), 'TAGALOG');   // the code, before the real name arrives
});

test('signText falls back to the game name when there is no region name', () => {
  for (const name of [undefined, null, '', '   ', 42]) assert.equal(signText(name), SIGN_FALLBACK);
});

test('signTextLength gives each letter 7 px and squeezes long names to the panel', () => {
  assert.equal(signTextLength('CEBUANO'), 49);
  assert.ok(signTextLength('KAPAMPANGAN') <= SIGN_TEXT_MAX);
  assert.equal(signTextLength('A VERY LONG REGION NAME'), SIGN_TEXT_MAX);
});

test('doneShare counts the questions already passed', () => {
  assert.equal(doneShare(0, 5), 0);       // question 1: nothing done yet
  assert.equal(doneShare(2, 5), 0.4);     // question 3: 2 of 5 done
  assert.equal(doneShare(4, 5), 0.8);     // question 5: 4 of 5 done
});

test('doneShare stays between 0 and 1 and survives an empty round', () => {
  assert.equal(doneShare(7, 5), 1);
  assert.equal(doneShare(-1, 5), 0);
  assert.equal(doneShare(0, 0), 0);
  assert.equal(doneShare(0, undefined), 0);
});
