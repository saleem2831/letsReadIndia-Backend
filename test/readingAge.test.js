import test from "node:test";
import assert from "node:assert/strict";
import { READING_AGE_ITEMS } from "../config/readingAgeItems.js";
import { calculateReadingAge, readingAgeToMonths } from "../utils/readingAge.js";

test("assessment contains the complete 132-item sequence", () => {
  assert.equal(READING_AGE_ITEMS.length, 132);
  assert.equal(READING_AGE_ITEMS[0].text, "yak");
  assert.equal(READING_AGE_ITEMS.at(-1).ra, "12.6");
});

test("three consecutive mistakes stop the test and use the last correct item", () => {
  const result = calculateReadingAge([
    { item_index: 0, correct: true }, { item_index: 1, correct: true },
    { item_index: 2, correct: false }, { item_index: 3, correct: false }, { item_index: 4, correct: false },
  ]);
  assert.equal(result.stoppedByThreeErrors, true);
  assert.equal(result.readingAge, "4.1");
});

test("responses must be sequential and cannot skip items", () => {
  assert.throws(() => calculateReadingAge([{ item_index: 1, correct: true }]), /sequence/i);
});

test("reading age notation converts years and months", () => {
  assert.equal(readingAgeToMonths("7.10"), 94);
  assert.equal(readingAgeToMonths("B4"), null);
});
