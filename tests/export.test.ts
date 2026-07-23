import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildMarkdownExport, slugify } from "../src/lib/export";
import { Inputs, Outputs } from "../src/lib/cypher";

const INPUTS: Inputs = {
  topic: "SQL Injection",
  level: "Junior Analyst",
  time: "45",
  goal: "Understand how it works",
};

const OUTPUTS: Outputs = {
  insights: "- Why this plan: because you're a junior analyst.",
  studyPlan: "### Warm-Up (5 minutes)\nSome content here.",
  knowledgeCheck: "### Part A\nQ1 content",
  takeaways: "- Takeaway one",
  analystTip: "One paragraph tip.",
  projectScenario: "### Stage 1: Beginner Project\nDetails here.",
};

describe("buildMarkdownExport", () => {
  test("includes the topic, level, time, and goal in the header", () => {
    const md = buildMarkdownExport(INPUTS, OUTPUTS, "January 1, 2026");
    assert.ok(md.includes("SQL Injection"));
    assert.ok(md.includes("Junior Analyst"));
    assert.ok(md.includes("45"));
    assert.ok(md.includes("Understand how it works"));
    assert.ok(md.includes("January 1, 2026"));
  });

  test("includes every section's content under its own heading", () => {
    const md = buildMarkdownExport(INPUTS, OUTPUTS, "January 1, 2026");
    assert.ok(md.includes("## Session Brief"));
    assert.ok(md.includes("## Personalized Study Plan"));
    assert.ok(md.includes("## Knowledge Check"));
    assert.ok(md.includes("## Key Takeaways & Next Steps"));
    assert.ok(md.includes("## Analyst Tip"));
    assert.ok(md.includes("## Project Ladder"));
    assert.ok(md.includes("Q1 content"));
    assert.ok(md.includes("Stage 1: Beginner Project"));
  });

  test("skips sections that are empty rather than printing an empty heading with nothing under it", () => {
    const partial: Outputs = { ...OUTPUTS, projectScenario: "" };
    const md = buildMarkdownExport(INPUTS, partial, "January 1, 2026");
    assert.ok(!md.includes("## Project Ladder"));
  });

  test("preserves section order", () => {
    const md = buildMarkdownExport(INPUTS, OUTPUTS, "January 1, 2026");
    const briefIdx = md.indexOf("## Session Brief");
    const planIdx = md.indexOf("## Personalized Study Plan");
    const quizIdx = md.indexOf("## Knowledge Check");
    const ladderIdx = md.indexOf("## Project Ladder");
    assert.ok(briefIdx < planIdx);
    assert.ok(planIdx < quizIdx);
    assert.ok(quizIdx < ladderIdx);
  });
});

describe("slugify", () => {
  test("lowercases and replaces spaces with hyphens", () => {
    assert.equal(slugify("SQL Injection"), "sql-injection");
  });

  test("strips characters that are not letters, numbers, or hyphens", () => {
    assert.equal(slugify("Active Directory & Kerberos!"), "active-directory-kerberos");
  });

  test("falls back to 'session' for an empty or fully-stripped string", () => {
    assert.equal(slugify(""), "session");
    assert.equal(slugify("!!!"), "session");
  });

  test("caps length at 40 characters", () => {
    const long = "a".repeat(100);
    assert.ok(slugify(long).length <= 40);
  });
});
