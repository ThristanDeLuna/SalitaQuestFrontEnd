// Tests for errors.js. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorKind, errorMessage } from './errors.js';

test('errorKind maps status and reason to a kind', () => {
  assert.equal(errorKind({ status: 403, reason: 'coming_soon' }), 'coming_soon');
  assert.equal(errorKind({ status: 403, reason: 'locked' }), 'locked');
  assert.equal(errorKind({ status: 403 }), 'other');      // a 403 without a known reason
  assert.equal(errorKind({ status: 404 }), 'not_found');
  assert.equal(errorKind({ status: 0 }), 'offline');
  assert.equal(errorKind({ status: 500 }), 'server');
  assert.equal(errorKind({ status: 503 }), 'server');
  assert.equal(errorKind({ status: 422 }), 'invalid');
  assert.equal(errorKind({ status: 401 }), 'other');      // client.js already tried the refresh
  assert.equal(errorKind(undefined), 'other');
  assert.equal(errorKind(new Error('plain error')), 'other');
});

test('errorMessage has friendly text for every kind, different for coming_soon and locked', () => {
  const kinds = ['coming_soon', 'locked', 'not_found', 'offline', 'server', 'invalid', 'other'];
  for (const k of kinds) assert.ok(errorMessage(k).length > 0, k);
  assert.notEqual(errorMessage('coming_soon'), errorMessage('locked'));
  assert.equal(errorMessage('nonsense'), errorMessage('other'));
});
