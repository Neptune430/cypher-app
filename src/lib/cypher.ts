export interface Inputs {
  topic: string;
  level: string;
  time: string;
  goal: string;
}

export interface Outputs {
  insights: string;
  studyPlan: string;
  knowledgeCheck: string;
  takeaways: string;
  analystTip: string;
  projectScenario: string;
}

// Full generation order, including "insights" which is rendered as a
// dashboard summary above the tabs, not as a tab itself.
export const ORDER: (keyof Outputs)[] = [
  "insights",
  "studyPlan",
  "knowledgeCheck",
  "takeaways",
  "analystTip",
  "projectScenario",
];

// The subset of ORDER that corresponds to actual clickable tabs. Used to
// decide which tab to auto-follow to while streaming, insights is excluded
// since it has no tab of its own.
export const TAB_ORDER: (keyof Outputs)[] = [
  "studyPlan",
  "knowledgeCheck",
  "takeaways",
  "analystTip",
  "projectScenario",
];

// Each section is bounded by a unique named tag, not by counting a repeated
// delimiter. This is what makes it robust against the model adding an extra
// separator somewhere it shouldn't (e.g. inside the two-part quiz section).
export const MARKERS: Record<keyof Outputs, string> = {
  insights: "[[[INSIGHTS]]]",
  studyPlan: "[[[STUDY_PLAN]]]",
  knowledgeCheck: "[[[KNOWLEDGE_CHECK]]]",
  takeaways: "[[[TAKEAWAYS]]]",
  analystTip: "[[[ANALYST_TIP]]]",
  projectScenario: "[[[PROJECT_SCENARIO]]]",
};

// Pulls the text between one named marker and the next named marker (or end
// of string if it's the last / not yet arrived).
export function parseSections(text: string): Outputs {
  const result = {} as Outputs;
  for (let i = 0; i < ORDER.length; i++) {
    const key = ORDER[i];
    const startTag = MARKERS[key];
    const startIdx = text.indexOf(startTag);

    if (startIdx === -1) {
      result[key] = "";
      continue;
    }

    const contentStart = startIdx + startTag.length;
    const nextKey = ORDER[i + 1];
    const endIdx = nextKey ? text.indexOf(MARKERS[nextKey], contentStart) : -1;

    result[key] = (endIdx === -1 ? text.slice(contentStart) : text.slice(contentStart, endIdx)).trim();
  }
  return result;
}

// Which section is currently being written: the highest-index marker that
// has appeared in the text so far. Includes "insights" as a possible result.
export function currentSectionKey(text: string): keyof Outputs {
  let current: keyof Outputs = ORDER[0];
  for (const key of ORDER) {
    if (text.includes(MARKERS[key])) current = key;
  }
  return current;
}

// Same idea, but only ever returns a real tab id, useful for driving which
// tab should be active while auto-following the stream. Falls back to the
// first tab while only "insights" has started.
export function currentTabKey(text: string): keyof Outputs {
  let current: keyof Outputs = TAB_ORDER[0];
  for (const key of TAB_ORDER) {
    if (text.includes(MARKERS[key])) current = key;
  }
  return current;
}
