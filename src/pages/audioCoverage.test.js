import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageByRegion, filterOptions, regionLabel } from './audioCoverage.js';

const regions = [
  { code: 'tagalog', name: 'Tagalog' },
  { code: 'cebuano', name: 'Cebuano' },
  { code: 'ilocano', name: 'Ilocano' },
];
const audio = [
  { region_code: 'tagalog', has_audio: true },
  { region_code: 'tagalog', has_audio: true },
  { region_code: 'tagalog', has_audio: false },
  { region_code: 'cebuano', has_audio: true },
  { region_code: 'zzz', has_audio: true },
];

test('regionLabel: the API name, or the code when the region is unknown', () => {
  assert.equal(regionLabel(regions, 'cebuano'), 'Cebuano');
  assert.equal(regionLabel(regions, 'zzz'), 'zzz');
  assert.equal(regionLabel(null, 'zzz'), 'zzz');
});

test('coverageByRegion: one row per API region, in order, counting only words with audio', () => {
  const rows = coverageByRegion(regions, audio, 5);
  assert.deepEqual(rows.map((r) => r.code), ['tagalog', 'cebuano', 'ilocano']);
  assert.deepEqual(rows.map((r) => r.count), [2, 1, 0]);
  assert.deepEqual(rows.map((r) => r.missing), [3, 4, 5]);
  assert.equal(rows[0].name, 'Tagalog');
});

test('coverageByRegion: ready when the needed number is reached; missing never goes below 0', () => {
  const many = Array.from({ length: 7 }, () => ({ region_code: 'tagalog', has_audio: true }));
  const [row] = coverageByRegion(regions, many, 5);
  assert.equal(row.count, 7);
  assert.equal(row.missing, 0);
  assert.equal(row.ready, true);
});

test('coverageByRegion: no regions or no audio list gives no crash', () => {
  assert.deepEqual(coverageByRegion(null, audio, 5), []);
  assert.deepEqual(coverageByRegion(regions, null, 5).map((r) => r.count), [0, 0, 0]);
});

test('filterOptions: All, the API regions, then unknown codes from the audio list', () => {
  assert.deepEqual(filterOptions(regions, audio).map((o) => o.code), ['all', 'tagalog', 'cebuano', 'ilocano', 'zzz']);
  assert.equal(filterOptions(regions, audio).at(-1).label, 'zzz');
});

test('filterOptions: while regions are missing, the chips still come from the audio list', () => {
  assert.deepEqual(filterOptions(null, audio).map((o) => o.code), ['all', 'tagalog', 'cebuano', 'zzz']);
  assert.deepEqual(filterOptions(null, null).map((o) => o.code), ['all']);
});
