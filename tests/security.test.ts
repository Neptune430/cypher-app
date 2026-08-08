import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isSafeHref } from "../src/lib/security";

describe("isSafeHref", () => {
  test("allows https links", () => {
    assert.equal(isSafeHref("https://owasp.org/guide"), true);
  });

  test("allows http links", () => {
    assert.equal(isSafeHref("http://example.com"), true);
  });

  test("allows mailto links", () => {
    assert.equal(isSafeHref("mailto:test@example.com"), true);
  });

  test("blocks javascript: URIs", () => {
    assert.equal(isSafeHref("javascript:alert(1)"), false);
  });

  test("blocks data: URIs", () => {
    assert.equal(isSafeHref("data:text/html,<script>alert(1)</script>"), false);
  });

  test("blocks vbscript: and file: URIs", () => {
    assert.equal(isSafeHref("vbscript:msgbox(1)"), false);
    assert.equal(isSafeHref("file:///etc/passwd"), false);
  });

  test("rejects undefined, null, and empty string", () => {
    assert.equal(isSafeHref(undefined), false);
    assert.equal(isSafeHref(null), false);
    assert.equal(isSafeHref(""), false);
  });

  test("rejects a genuinely malformed URL rather than throwing", () => {
    assert.equal(isSafeHref("http://"), false);
    assert.equal(isSafeHref("https://[invalid"), false);
  });
});
