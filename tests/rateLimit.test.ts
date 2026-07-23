import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isRateLimited, _resetRateLimitStore, WINDOW_MS, MAX_REQUESTS_PER_WINDOW } from "../src/lib/rateLimit";

describe("isRateLimited", () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  test("allows the first request from a new key", () => {
    assert.equal(isRateLimited("1.2.3.4"), false);
  });

  test("allows up to MAX_REQUESTS_PER_WINDOW requests within the window", () => {
    const key = "5.5.5.5";
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      assert.equal(isRateLimited(key), false, `request ${i + 1} should be allowed`);
    }
  });

  test("blocks the request immediately after the limit is reached", () => {
    const key = "9.9.9.9";
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) isRateLimited(key);
    assert.equal(isRateLimited(key), true);
  });

  test("tracks different keys independently", () => {
    const now = Date.now();
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) isRateLimited("keyA", now);
    assert.equal(isRateLimited("keyA", now), true);
    assert.equal(isRateLimited("keyB", now), false);
  });

  test("resets the count once the window has passed", () => {
    const key = "resets.test";
    const start = Date.now();
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) isRateLimited(key, start);
    assert.equal(isRateLimited(key, start), true);
    // Simulate time passing beyond the window
    assert.equal(isRateLimited(key, start + WINDOW_MS + 1), false);
  });
});
