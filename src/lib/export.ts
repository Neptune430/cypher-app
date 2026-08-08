import { Inputs, Outputs, ORDER } from "./cypher";

export const SECTION_TITLES: Record<keyof Outputs, string> = {
  insights: "Session Brief",
  studyPlan: "Personalized Study Plan",
  knowledgeCheck: "Knowledge Check",
  takeaways: "Key Takeaways & Next Steps",
  analystTip: "Analyst Tip",
  projectScenario: "Project Ladder",
};

// Pure function, no browser APIs, so it's directly unit-testable.
export function buildMarkdownExport(inputs: Inputs, outputs: Outputs, generatedOn: string): string {
  const header = `# CYPHER Study Session

**Topic:** ${inputs.topic}
**Experience Level:** ${inputs.level}
**Available Time:** ${inputs.time}
**Learning Goal:** ${inputs.goal}
**Generated:** ${generatedOn}

---
`;

  const sections = ORDER
    .map((key) => {
      const content = outputs[key]?.trim();
      if (!content) return "";
      return `## ${SECTION_TITLES[key]}\n\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  return `${header}\n${sections}\n`;
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return slug || "session";
}

// Browser-only: builds the markdown and triggers a file download. Not unit
// tested directly since it needs a real DOM, buildMarkdownExport above is
// where the actual logic lives and is tested.
export function downloadMarkdown(inputs: Inputs, outputs: Outputs): void {
  const generatedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const markdown = buildMarkdownExport(inputs, outputs, generatedOn);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `cypher-${slugify(inputs.topic)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
