"use client";
import { useEffect, useRef, useState } from "react";
import { Download, FileDown } from "lucide-react";
import Header from "@/components/Header";
import InputPanel from "@/components/InputPanel";
import OutputPanel from "@/components/OutputPanel";
import SessionInsights from "@/components/SessionInsights";
import Footer from "@/components/Footer";
import { Inputs, Outputs, ORDER, parseSections, currentTabKey, currentSectionKey } from "@/lib/cypher";
import { downloadMarkdown } from "@/lib/export";
import { generateSessionPdf } from "@/lib/pdfExport";
import GenerationProgress from "@/components/GenerationProgress";
import ConsentGate from "@/components/ConsentGate";

const LOADING_MESSAGES = [
  "Analyzing your goal...",
  "Architecting your roadmap...",
  "Calibrating to your level...",
  "Sequencing your sessions...",
  "Assembling your plan...",
];

export default function Home() {
  const [inputs, setInputs]   = useState<Inputs>({ topic: "", level: "", time: "", goal: "" });
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [loading, setLoading]     = useState(false); // true only until the first byte arrives
  const [streaming, setStreaming] = useState(false); // true while content is actively arriving
  const [error, setError] = useState("");
  const [activeTab, setActiveTabState] = useState<keyof Outputs>("studyPlan");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [generatingKey, setGeneratingKey] = useState<keyof Outputs>("insights");
  const autoFollow = useRef(true);

  // Cycle the loading message every 2.2s while we're waiting on the first byte
  useEffect(() => {
    if (!loading) {
      setLoadingMsgIdx(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [loading]);

  const setActiveTab = (tab: string) => {
    autoFollow.current = false; // user took manual control of the tabs
    setActiveTabState(tab as keyof Outputs);
  };

  const generate = async () => {
    if (!inputs.topic || !inputs.level || !inputs.time || !inputs.goal) {
      setError("Please fill in all four fields.");
      return;
    }
    setError("");
    setLoading(true);
    setStreaming(false);
    setOutputs(null);
    autoFollow.current = true;
    setActiveTabState("studyPlan");
    setGeneratingKey("insights");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Request failed. Please try again.");
      }
      if (!res.body) throw new Error("No response received. Please try again.");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!started) {
          started = true;
          setLoading(false);
          setStreaming(true);
        }

        accumulated += decoder.decode(value, { stream: true });

        if (accumulated.includes("<<<STREAM_ERROR>>>")) {
          throw new Error("Something went wrong while generating. Please try again.");
        }

        setOutputs(parseSections(accumulated));
        setGeneratingKey(currentSectionKey(accumulated));

        if (autoFollow.current) {
          setActiveTabState(currentTabKey(accumulated));
        }
      }

      accumulated += decoder.decode(); // flush any remaining buffered bytes
      const finalOutputs = parseSections(accumulated);
      setOutputs(finalOutputs);

      const missing = ORDER.filter((k) => finalOutputs[k].trim().length < 20);
      if (missing.length > 0) {
        setError("The session came back incomplete. You can still read what generated, or try again.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const sessionReady = !!outputs && !streaming && !loading;

  return (
    <div className="page-wrapper min-h-screen flex flex-col">
      <ConsentGate />
      <div className="fixed inset-0 pointer-events-none cypher-dots-page print:hidden" aria-hidden />
      <div className="fixed top-1/4 -left-32 w-96 h-96 pointer-events-none orb-float print:hidden" style={{ background: "radial-gradient(circle, rgba(61,181,52,0.10) 0%, transparent 70%)" }} />
      <div className="fixed bottom-1/4 -right-32 w-80 h-80 pointer-events-none orb-float-reverse print:hidden" style={{ background: "radial-gradient(circle, rgba(61,181,52,0.08) 0%, transparent 70%)" }} />

      <div className="print:hidden flex flex-col flex-1">
        <Header />
        <main className="relative flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <InputPanel
                inputs={inputs}
                setInputs={setInputs}
                onGenerate={generate}
                loading={loading || streaming}
                error={error}
                loadingMessage={loading ? LOADING_MESSAGES[loadingMsgIdx] : undefined}
              />
            </div>
            <div className="lg:col-span-3 flex flex-col gap-4">
              {streaming && (
                <GenerationProgress currentKey={generatingKey} />
              )}

              {outputs?.insights && (
                <SessionInsights content={outputs.insights} streaming={streaming} />
              )}

              {sessionReady && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => downloadMarkdown(inputs, outputs)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-green-100 text-gray-500 hover:text-gray-800 hover:border-green-300 active:scale-95 transition-all shadow-sm"
                  >
                    <Download size={13} /> Markdown
                  </button>
                  <button
                    onClick={() => generateSessionPdf(inputs, outputs)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-green-100 text-gray-500 hover:text-gray-800 hover:border-green-300 active:scale-95 transition-all shadow-sm"
                  >
                    <FileDown size={13} /> Export PDF
                  </button>
                </div>
              )}

              <OutputPanel
                outputs={outputs}
                loading={loading}
                streaming={streaming}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
