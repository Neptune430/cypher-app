"use client";
import { Loader2, Play } from "lucide-react";
import { Inputs } from "@/lib/cypher";

interface Props {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string;
  loadingMessage?: string;
}

const LEVELS = ["Absolute Beginner", "Junior Analyst", "Intermediate", "Advanced Practitioner"];
const TIMES  = ["No Time Set", "15", "30", "45", "60", "90", "120"];
const TOPICS = [
  "SQL Injection", "Phishing Investigation", "MITRE ATT&CK",
  "Network Traffic Analysis", "SIEM Log Analysis", "Malware Analysis",
  "Threat Hunting", "Incident Response", "Zero Trust", "Buffer Overflow",
];

const LEVEL_DESC: Record<string, string> = {
  "Absolute Beginner":     "Just starting out",
  "Junior Analyst":        "Building core skills",
  "Intermediate":          "Deepening knowledge",
  "Advanced Practitioner": "Expert refinement",
};

export default function InputPanel({ inputs, setInputs, onGenerate, loading, error, loadingMessage }: Props) {
  const set   = (k: keyof Inputs, v: string) => setInputs({ ...inputs, [k]: v });
  const ready = inputs.topic && inputs.level && inputs.time && inputs.goal;

  return (
    <div className="flex flex-col gap-6">

      {/* Topic */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          IT or Cybersecurity Topic
        </label>
        <textarea
          value={inputs.topic}
          onChange={(e) => set("topic", e.target.value)}
          placeholder="e.g. How firewalls work and how to detect/block IPS threats..."
          rows={3}
          className="w-full bg-white/80 border border-green-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#3db534] focus:ring-2 focus:ring-[#3db534]/15 resize-none transition-all shadow-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => set("topic", t)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all duration-200 font-medium ${
                inputs.topic === t
                  ? "bg-[#3db534]/15 border-[#3db534]/50 text-[#3db534]"
                  : "bg-white border-green-100 text-gray-500 hover:border-[#3db534]/40 hover:text-[#3db534] hover:bg-green-50/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Experience Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((l) => {
            const active = inputs.level === l;
            return (
              <button
                key={l}
                onClick={() => set("level", l)}
                className={`group relative py-3 px-4 rounded-xl text-left border transition-all duration-200 overflow-hidden ${
                  active
                    ? "bg-[#3db534]/10 border-[#3db534]/50 shadow-sm"
                    : "bg-white/80 border-green-100 hover:border-green-300 hover:bg-green-50/40"
                }`}
              >
                {!active && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(120deg, transparent 30%, rgba(61,181,52,0.06) 50%, transparent 70%)" }}
                  />
                )}
                <p className={`text-sm font-bold ${active ? "text-[#3db534]" : "text-gray-700"}`}>{l}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{LEVEL_DESC[l]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Available Study Time
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIMES.map((t) => {
            const active = inputs.time === t;
            const isNone = t === "No Time Set";
            return (
              <button
                key={t}
                onClick={() => set("time", t)}
                className={`group relative py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 overflow-hidden ${
                  isNone ? "col-span-2" : ""
                } ${
                  active
                    ? "bg-[#3db534]/10 border-[#3db534]/50 text-[#3db534] shadow-sm"
                    : "bg-white/80 border-green-100 text-gray-600 hover:border-green-300 hover:text-[#3db534] hover:bg-green-50/40"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {!active && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(120deg, transparent 30%, rgba(61,181,52,0.07) 50%, transparent 70%)" }}
                  />
                )}
                {isNone ? t : `${t} min`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Learning Goal
        </label>
        <textarea
          value={inputs.goal}
          onChange={(e) => set("goal", e.target.value)}
          placeholder="e.g. Be able to configure a firewall and write basic detection rules..."
          rows={3}
          className="w-full bg-white/80 border border-green-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#3db534] focus:ring-2 focus:ring-[#3db534]/15 resize-none transition-all shadow-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-500 font-medium">
          {error}
        </div>
      )}

      {/* Play App */}
      <button
        onClick={onGenerate}
        disabled={loading || !ready}
        className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
          ready && !loading
            ? "bg-[#3db534] text-white hover:bg-[#35a02d] shadow-lg shadow-[#3db534]/30 hover:shadow-[#3db534]/40 hover:scale-[1.01] active:scale-[0.98]"
            : "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200"
        }`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="spin" />
            {loadingMessage || "Generating Session..."}
          </>
        ) : (
          <>
            <Play size={15} fill="currentColor" />
            Play App
          </>
        )}
      </button>

      {!ready && !loading && (
        <p className="text-center text-xs text-gray-400 font-medium">Complete all fields to unlock your session</p>
      )}
    </div>
  );
}
