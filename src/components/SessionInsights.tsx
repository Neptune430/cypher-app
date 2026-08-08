"use client";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { isSafeHref } from "@/lib/security";

interface Props {
  content: string;
  streaming: boolean;
}

export default function SessionInsights({ content, streaming }: Props) {
  if (!content) return null;

  return (
    <div
      className="bg-white/85 border rounded-2xl p-5 shadow-sm backdrop-blur-sm fade-up"
      style={{ borderColor: "#3db53430" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[#3db534]" />
        <span
          className="text-xs font-bold tracking-widest uppercase text-[#3db534]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Session Brief
        </span>
        {streaming && <span className="w-1.5 h-1.5 rounded-full bg-[#3db534] blink ml-1" />}
      </div>

      <div className="md-output text-sm">
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
          <span className="blink" style={{ color: "#3db534", fontWeight: 700 }}>▍</span>
        )}
      </div>
    </div>
  );
}
