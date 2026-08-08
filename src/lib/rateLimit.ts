// Best-effort, in-memory rate limiter. This is NOT sufficient protection on
// its own: on Vercel, serverless invocations can spin up fresh instances
// with their own memory, so this map does not reliably share state across
// all traffic hitting the route. Over a short window it still catches
// obvious abuse within a single warm instance at close to zero cost. Over
// a full hour, some requests may land on a fresh instance that has no
// memory of earlier ones, so this is real, immediate protection, not a
// guarantee. The real, reliable fix is a Vercel Firewall rate limit rule
// (Project -> Firewall -> Configure -> New Rule), or persistent storage
// like Vercel KV, which holds the count across every instance and region.
//
// This module is a cheap, deployable-right-now first layer, not a
// replacement for that.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_REQUESTS_PER_WINDOW = 4;

let callsSinceLastPrune = 0;

export interface RateLimitStatus {
  limited: boolean;
  count: number;
  max: number;
}

// Core check, returns the full picture (whether this request is blocked,
// the current count, and the max), so callers can surface progress to the
// user, not just a yes/no.
export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  windowMs: number = WINDOW_MS,
  maxRequests: number = MAX_REQUESTS_PER_WINDOW
): RateLimitStatus {
  // Cheap defensive cleanup so this map can't grow unbounded on a
  // long-lived instance. Not load bearing, just housekeeping.
  callsSinceLastPrune += 1;
  if (callsSinceLastPrune >= 200) {
    callsSinceLastPrune = 0;
    for (const [k, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, count: 1, max: maxRequests };
  }

  existing.count += 1;
  return { limited: existing.count > maxRequests, count: existing.count, max: maxRequests };
}

// Thin boolean wrapper kept for backward compatibility with existing call
// sites and tests that only need the yes/no answer.
export function isRateLimited(
  key: string,
  now: number = Date.now(),
  windowMs: number = WINDOW_MS,
  maxRequests: number = MAX_REQUESTS_PER_WINDOW
): boolean {
  return checkRateLimit(key, now, windowMs, maxRequests).limited;
}

// Exposed for tests, so a suite can reset state between cases without
// waiting out a real 60 second window.
export function _resetRateLimitStore(): void {
  buckets.clear();
}
