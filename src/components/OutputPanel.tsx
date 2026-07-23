"use client";
import { BookOpen, CheckSquare, Lightbulb, Shield, FolderGit2 } from "lucide-react";
import { Outputs } from "@/lib/cypher";
import ReactMarkdown from "react-markdown";
import { isSafeHref } from "@/lib/security";

interface Props {
  outputs: Outputs | null;
  loading: boolean;
  streaming: boolean;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const TABS = [
  { id: "studyPlan",       label: "Study Plan",       icon: BookOpen,    color: "#3db534" },
  { id: "knowledgeCheck",  label: "Knowledge Check",  icon: CheckSquare, color: "#2563eb" },
  { id: "takeaways",       label: "Takeaways",        icon: Lightbulb,   color: "#ea580c" },
  { id: "analystTip",      label: "Analyst Tip",      icon: Shield,      color: "#059669" },
  { id: "projectScenario", label: "Project Scenario", icon: FolderGit2,  color: "#7c3aed" },
];

function Spinner() {
  return (
    <div className="flex-1 flex flex-col gap-4 p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-[#3db534]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#3db534] spin" />
        </div>
        <div>
          <p className="text-[#3db534] font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>
            Decoding your session...
          </p>
          <p className="text-gray-400 text-xs">Building your personalized plan</p>
        </div>
      </div>
      {/* Skeleton lines, gives a sense of real content about to arrive */}
      {[100, 90, 95, 60, 80, 70].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded-full shimmer-bar"
          style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-100 flex items-center justify-center shadow-sm">
        <span className="text-2xl">🛡️</span>
      </div>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed font-medium">
        Fill in your parameters and click{" "}
        <span className="font-bold text-[#3db534]">Play App</span>{" "}
        to build your personalized study session.
      </p>
    </div>
  );
}

export default function OutputPanel({ outputs, loading, streaming, activeTab, setActiveTab }: Props) {
  const active  = TABS.find((t) => t.id === activeTab)!;
  const content = outputs?.[activeTab as keyof Outputs] ?? "";

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/60 rounded-2xl p-1 border border-green-100 shadow-sm backdrop-blur-sm">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => outputs && setActiveTab(id)}
            disabled={!outputs}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold flex-1 justify-center transition-all duration-200 active:scale-95 ${
              activeTab === id && outputs
                ? "bg-white border border-green-100 shadow-sm"
                : outputs
                ? "text-gray-400 hover:text-gray-700 hover:bg-white/70"
                : "text-gray-300 cursor-not-allowed"
            }`}
            style={activeTab === id && outputs ? { color } : {}}
          >
            <Icon size={12} />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Module position counter */}
      {outputs && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-gray-400 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
            {TABS.findIndex((t) => t.id === activeTab) + 1} / {TABS.length} modules
          </span>
        </div>
      )}

      {/* Content card */}
      <div
        className={`bg-white/80 border rounded-2xl flex flex-col overflow-hidden shadow-sm transition-all duration-300 backdrop-blur-sm ${streaming ? "glow-pulse" : ""}`}
        style={{
          borderColor: outputs ? `${active.color}25` : "#dcfce7",
          minHeight: "560px",
          boxShadow: outputs ? `0 2px 24px ${active.color}12` : "0 1px 8px rgba(61,181,52,0.06)",
        }}
      >
        {/* Coloured header bar */}
        {outputs && (
          <div
            className="flex items-center gap-2 px-5 py-3 border-b"
            style={{ background: `${active.color}08`, borderColor: `${active.color}18` }}
          >
            {(() => { const Icon = active.icon; return <Icon size={13} style={{ color: active.color }} />; })()}
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: active.color, fontFamily: "var(--font-mono)" }}
            >
              {active.label}
            </span>
          </div>
        )}

        {loading  ? <Spinner /> :
         !outputs ? <Empty />  :
         (streaming && !content) ? (
          <div className="flex-1 flex items-center justify-center gap-2 p-12">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 blink" />
            <span className="text-gray-400 text-sm font-medium">Coming up next...</span>
          </div>
        ) : (
          <div key={activeTab} className="flex-1 overflow-y-auto p-6 fade-up">
            <div className="md-output">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) =>
                    isSafeHref(href) ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                    ) : (
                      <span>{children}</span>
                    ),
                }}
              >
                {content}
              </ReactMarkdown>
              {streaming && (
                <span className="blink" style={{ color: active.color, fontWeight: 700 }}>▍</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Prev / Next */}
      {outputs && (
        <div className="flex gap-2 justify-between">
          <button
            onClick={() => { const i = TABS.findIndex((t) => t.id === activeTab); if (i > 0) setActiveTab(TABS[i - 1].id); }}
            disabled={TABS[0].id === activeTab}
            className="text-xs px-4 py-2 rounded-xl bg-white border border-green-100 text-gray-500 font-semibold hover:text-gray-800 hover:border-green-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Previous
          </button>
          <button
            onClick={() => { const i = TABS.findIndex((t) => t.id === activeTab); if (i < TABS.length - 1) setActiveTab(TABS[i + 1].id); }}
            disabled={TABS[TABS.length - 1].id === activeTab}
            className="text-xs px-4 py-2 rounded-xl bg-white border border-green-100 text-gray-500 font-semibold hover:text-gray-800 hover:border-green-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
