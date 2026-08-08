"use client";
import { Outputs, ORDER } from "@/lib/cypher";

interface Props {
  currentKey: keyof Outputs;
}

const SHORT_LABELS: Record<keyof Outputs, string> = {
  insights: "Brief",
  studyPlan: "Plan",
  knowledgeCheck: "Quiz",
  takeaways: "Takeaways",
  analystTip: "Tip",
  projectScenario: "Project",
};

// currentKey is the section currently being written (derived from which
// named markers have actually appeared in the stream so far, see
// currentSectionKey in lib/cypher.ts). Everything before it in ORDER is
// genuinely finished, not estimated.
export default function GenerationProgress({ currentKey }: Props) {
  const currentIdx = ORDER.indexOf(currentKey);

  return (
    <div className="bg-white/70 border border-green-100 rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm fade-up">
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="text-xs font-bold text-gray-500 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Building your session
        </span>
        <span className="text-xs font-bold text-[#3db534]" style={{ fontFamily: "var(--font-mono)" }}>
          {currentIdx} of {ORDER.length} complete
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {ORDER.map((key, i) => {
          const state = i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-colors duration-500 ${
                  state === "done"
                    ? "bg-[#3db534]"
                    : state === "active"
                    ? "bg-[#3db534]/40 progress-active"
                    : "bg-gray-200"
                }`}
              />
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  state === "done"
                    ? "text-[#3db534]"
                    : state === "active"
                    ? "text-gray-700"
                    : "text-gray-300"
                }`}
              >
                {SHORT_LABELS[key]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
