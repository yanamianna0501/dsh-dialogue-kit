import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, inject } from './host.js';

test('host exports empty inject and apply without error', () => {
  assert.deepEqual(inject, []);
  assert.equal(typeof apply, 'function');
  apply({});
});
