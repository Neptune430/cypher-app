import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateInputs, ALLOWED_LEVELS, MAX_TOPIC_LENGTH, MAX_GOAL_LENGTH } from "../src/lib/validate";

const VALID = {
  topic: "SQL Injection",
  level: "Junior Analyst",
  time: "45",
  goal: "Understand how it works",
};

describe("validateInputs", () => {
  test("accepts a well formed request", () => {
    const r = validateInputs(VALID);
    assert.equal(r.valid, true);
    assert.deepEqual(r.data, VALID);
  });

  test("rejects a non-object body", () => {
    assert.equal(validateInputs(null).valid, false);
    assert.equal(validateInputs("a string").valid, false);
    assert.equal(validateInputs(42).valid, false);
  });

  test("rejects missing fields", () => {
    const r = validateInputs({ topic: "X", level: "Y", time: "45" });
    assert.equal(r.valid, false);
  });

  test("rejects non-string field types", () => {
    const r = validateInputs({ ...VALID, topic: 12345 });
    assert.equal(r.valid, false);
  });

  test("rejects empty or whitespace-only fields", () => {
    const r = validateInputs({ ...VALID, topic: "   " });
    assert.equal(r.valid, false);
  });

  test("rejects a topic over the max length", () => {
    const r = validateInputs({ ...VALID, topic: "a".repeat(MAX_TOPIC_LENGTH + 1) });
    assert.equal(r.valid, false);
    assert.match(r.error || "", /300/);
  });

  test("accepts a topic exactly at the max length", () => {
    const r = validateInputs({ ...VALID, topic: "a".repeat(MAX_TOPIC_LENGTH) });
    assert.equal(r.valid, true);
  });

  test("rejects a goal over the max length", () => {
    const r = validateInputs({ ...VALID, goal: "a".repeat(MAX_GOAL_LENGTH + 1) });
    assert.equal(r.valid, false);
  });

  test("rejects a level that is not one of the 4 allowed values", () => {
    const r = validateInputs({ ...VALID, level: "Super Expert Wizard" });
    assert.equal(r.valid, false);
  });

  test("accepts every value in ALLOWED_LEVELS", () => {
    for (const level of ALLOWED_LEVELS) {
      const r = validateInputs({ ...VALID, level });
      assert.equal(r.valid, true, `expected ${level} to be accepted`);
    }
  });

  test("accepts 'No Time Set' and valid numeric time strings", () => {
    assert.equal(validateInputs({ ...VALID, time: "No Time Set" }).valid, true);
    assert.equal(validateInputs({ ...VALID, time: "120" }).valid, true);
    assert.equal(validateInputs({ ...VALID, time: "1" }).valid, true);
  });

  test("rejects nonsensical or out of range time values", () => {
    assert.equal(validateInputs({ ...VALID, time: "abc" }).valid, false);
    assert.equal(validateInputs({ ...VALID, time: "-5" }).valid, false);
    assert.equal(validateInputs({ ...VALID, time: "99999" }).valid, false);
    assert.equal(validateInputs({ ...VALID, time: "45 minutes please" }).valid, false);
  });

  test("trims surrounding whitespace on accepted fields", () => {
    const r = validateInputs({ ...VALID, topic: "  SQL Injection  " });
    assert.equal(r.valid, true);
    assert.equal(r.data?.topic, "SQL Injection");
  });
});
