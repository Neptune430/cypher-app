import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { tokenizeToWords } from "../src/lib/pdfExport";

describe("tokenizeToWords", () => {
  test("splits plain text into individual words, none bold, no links", () => {
    const words = tokenizeToWords("This is plain text");
    assert.equal(words.length, 4);
    assert.ok(words.every((w) => !w.bold && !w.link));
    assert.equal(words.map((w) => w.text).join(" "), "This is plain text");
  });

  test("marks a bold span correctly and splits it into separate words", () => {
    const words = tokenizeToWords("**Correct Answer: B.** because reasons");
    const boldWords = words.filter((w) => w.bold);
    assert.equal(boldWords.map((w) => w.text).join(" "), "Correct Answer: B.");
    assert.ok(words.some((w) => !w.bold && w.text === "because"));
  });

  test("extracts link text and URL separately from markdown link syntax", () => {
    const words = tokenizeToWords("[OWASP Guide](https://owasp.org/guide)");
    assert.ok(words.every((w) => w.link === "https://owasp.org/guide"));
    assert.equal(words.map((w) => w.text).join(" "), "OWASP Guide");
  });

  test("handles a line mixing plain text, bold, and a link together", () => {
    const words = tokenizeToWords("See **this resource** at [OWASP](https://owasp.org) for more.");
    const plain = words.filter((w) => !w.bold && !w.link).map((w) => w.text);
    const bold = words.filter((w) => w.bold).map((w) => w.text);
    const linked = words.filter((w) => w.link).map((w) => w.text);
    assert.ok(plain.includes("See"));
    assert.deepEqual(bold, ["this", "resource"]);
    assert.deepEqual(linked, ["OWASP"]);
  });

  test("handles multiple separate bold spans on the same line", () => {
    const words = tokenizeToWords("**Q1.** What is this? **Correct Answer: A.** Explanation.");
    const bold = words.filter((w) => w.bold).map((w) => w.text);
    assert.deepEqual(bold, ["Q1.", "Correct", "Answer:", "A."]);
    const plain = words.filter((w) => !w.bold).map((w) => w.text);
    assert.deepEqual(plain, ["What", "is", "this?", "Explanation."]);
  });

  test("returns an empty array for an empty string", () => {
    assert.deepEqual(tokenizeToWords(""), []);
  });

  test("does not treat a lone asterisk or unmatched bold marker as bold", () => {
    const words = tokenizeToWords("This * is not bold");
    assert.ok(words.every((w) => !w.bold));
  });
});
