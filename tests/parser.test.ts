import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseSections, currentTabKey, ORDER, TAB_ORDER, MARKERS } from "../src/lib/cypher";

const FULL_SAMPLE = `[[[INSIGHTS]]]
**Why This Plan:** shaped for you.

[[[STUDY_PLAN]]]
Study plan content, phase 1 through 4.

[[[KNOWLEDGE_CHECK]]]
### Part A
Q1 content
### Part B
Q6 content

[[[TAKEAWAYS]]]
Takeaway bullets here.

[[[ANALYST_TIP]]]
One paragraph tip here.

[[[PROJECT_SCENARIO]]]
### Stage 1: Beginner Project
Beginner stage content.
### Stage 2: Intermediate Project
Intermediate stage content.
### Stage 3: Final Portfolio Project
Final stage content.`;

describe("parseSections", () => {
  test("isolates each of the 6 sections correctly on a well formed response", () => {
    const r = parseSections(FULL_SAMPLE);
    assert.ok(r.insights.includes("Why This Plan"));
    assert.ok(!r.insights.includes("Study plan content"));
    assert.ok(r.studyPlan.includes("phase 1 through 4"));
    assert.ok(!r.studyPlan.includes("Part A"));
    assert.ok(r.knowledgeCheck.includes("Part A") && r.knowledgeCheck.includes("Part B"));
    assert.ok(!r.knowledgeCheck.includes("Takeaway"));
    assert.ok(r.projectScenario.includes("Stage 1"));
    assert.ok(r.projectScenario.includes("Stage 2"));
    assert.ok(r.projectScenario.includes("Stage 3"));
  });

  test("survives a rogue delimiter inserted mid quiz section (the actual bug this was built to fix)", () => {
    const malformed = FULL_SAMPLE.replace("### Part A\nQ1 content", "### Part A\nQ1 content\n<<<SEP>>>");
    const r = parseSections(malformed);
    assert.ok(r.knowledgeCheck.includes("Q1 content") && r.knowledgeCheck.includes("Q6 content"));
    assert.ok(r.takeaways.includes("Takeaway bullets"));
    assert.ok(!r.takeaways.includes("Q6 content"));
  });

  test("returns empty strings for sections that have not streamed in yet", () => {
    const partial = "[[[INSIGHTS]]]\nSome insight text\n\n[[[STUDY_PLAN]]]\nStill writing this pa";
    const r = parseSections(partial);
    assert.equal(r.insights, "Some insight text");
    assert.equal(r.studyPlan, "Still writing this pa");
    assert.equal(r.takeaways, "");
    assert.equal(r.analystTip, "");
    assert.equal(r.projectScenario, "");
  });

  test("every field in ORDER has a corresponding marker", () => {
    for (const key of ORDER) {
      assert.ok(MARKERS[key], `missing marker for ${key}`);
    }
  });
});

describe("currentTabKey", () => {
  test("defaults to studyPlan while only insights (a non-tab section) has streamed", () => {
    const insightsOnly = "[[[INSIGHTS]]]\nPartial insight text still comin";
    assert.equal(currentTabKey(insightsOnly), "studyPlan");
  });

  test("advances to the correct tab as more sections arrive", () => {
    assert.equal(currentTabKey(FULL_SAMPLE), "projectScenario");
  });

  test("never regresses to an earlier tab as text streams in incrementally", () => {
    const chunks = FULL_SAMPLE.match(/.{1,20}/gs) || [];
    let acc = "";
    let lastIdx = 0;
    for (const c of chunks) {
      acc += c;
      const idx = TAB_ORDER.indexOf(currentTabKey(acc));
      assert.ok(idx >= lastIdx, `tab index regressed at chunk boundary: "${c}"`);
      lastIdx = idx;
    }
  });
});
