import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateSM2 } from './sm2.js';

test('first correct answer creates a short review interval', () => {
  const result = calculateSM2(4, 0, 1, 2.5);

  assert.equal(result.repetition, 1);
  assert.equal(result.interval, 1);
  assert.ok(result.efactor > 2.3);
  assert.match(result.dueDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('low-quality answer resets repetition and interval', () => {
  const result = calculateSM2(1, 2, 6, 2.5);

  assert.equal(result.repetition, 0);
  assert.equal(result.interval, 1);
  assert.ok(result.efactor <= 2.5);
  assert.equal(result.dueDate.length, 10);
});

test('successful review advances to the next planned interval', () => {
  const result = calculateSM2(5, 1, 6, 2.5);

  assert.equal(result.repetition, 2);
  assert.equal(result.interval, 6);
  assert.ok(result.efactor > 2.5);
});
