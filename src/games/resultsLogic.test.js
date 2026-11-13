import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coachingLine, stampNameSize, stampNameFits } from './resultsLogic.js';

const r = (over) => ({ score: 20, max_score: 40, pass_mark: 24, passed: false, medal: null, ...over });

test('not passed: how many points to the pass mark', () => {
  assert.equal(coachingLine(r()), '4 more points to pass.');
  assert.equal(coachingLine(r({ score: 0 })), '24 more points to pass.');
});

test('not passed, one point short: singular', () => {
  assert.equal(coachingLine(r({ score: 23 })), '1 more point to pass.');
});

test('not passed but already at the pass mark (nothing true to say): null', () => {
  assert.equal(coachingLine(r({ score: 24 })), null);
});

test('bronze: no number, the silver threshold is not sent', () => {
  assert.equal(coachingLine(r({ score: 28, passed: true, medal: 'bronze' })), 'Passed! Try again for Silver.');
});

test('silver below full marks: points to gold', () => {
  assert.equal(coachingLine(r({ score: 36, passed: true, medal: 'silver' })), 'So close! 4 more points for Gold.');
  assert.equal(coachingLine(r({ score: 40, max_score: 50, pass_mark: 30, passed: true, medal: 'silver' })),
    'So close! 10 more points for Gold.');
});

test('silver one point short: singular', () => {
  assert.equal(coachingLine(r({ score: 39, passed: true, medal: 'silver' })), 'So close! 1 more point for Gold.');
});

test('silver at full marks (inconsistent): null', () => {
  assert.equal(coachingLine(r({ score: 40, passed: true, medal: 'silver' })), null);
});

test('gold: full marks', () => {
  assert.equal(coachingLine(r({ score: 40, passed: true, medal: 'gold' })), 'Full marks!');
});

test('passed with no medal or an unknown medal: null', () => {
  assert.equal(coachingLine(r({ score: 30, passed: true, medal: null })), null);
  assert.equal(coachingLine(r({ score: 30, passed: true, medal: 'platinum' })), null);
});

test('any field missing: null', () => {
  for (const key of ['score', 'max_score', 'pass_mark', 'passed', 'medal']) {
    const res = r({ score: 36, passed: true, medal: 'silver' });
    delete res[key];
    assert.equal(coachingLine(res), null, `without ${key}`);
  }
  assert.equal(coachingLine(r({ score: '20' })), null);
  assert.equal(coachingLine(r({ passed: 'no' })), null);
  assert.equal(coachingLine(null), null);
  assert.equal(coachingLine(undefined), null);
});

test('stamp name size: short names bigger, long names smaller', () => {
  assert.equal(stampNameSize('Cebuano'), 20);
  assert.equal(stampNameSize('KAPAMPANGAN'), 17);
  assert.equal(stampNameSize(null), 20);
  assert.equal(stampNameFits('KAPAMPANGAN'), true);
  assert.equal(stampNameFits('Chavacano de Zamboanga'), false);
});
