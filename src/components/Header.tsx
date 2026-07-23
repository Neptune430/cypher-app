"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const WORDS = ["Introducing,", "Welcome."];
  const [typed, setTyped] = useState("");
  const [cursorOn, setCursorOn] = useState(true);
  const [introVisible, setIntroVisible] = useState(true);
  const [introRemoved, setIntroRemoved] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);

  useEffect(() => {
    let wordIdx = 0;
    let charIdx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      const word = WORDS[wordIdx];

      if (charIdx <= word.length) {
        setTyped(word.slice(0, charIdx));
        charIdx++;
        timer = setTimeout(typeNext, 75);
      } else if (wordIdx < WORDS.length - 1) {
        timer = setTimeout(() => {
          wordIdx++;
          charIdx = 0;
          typeNext();
        }, 1100);
      } else {
        // Welcome has finished typing
        timer = setTimeout(() => {
          // Hide the cursor
          setCursorOn(false);

          // Brief pause
          timer = setTimeout(() => {
            // Fade Welcome out first
            setIntroVisible(false);

            // After Welcome has completely faded away,
            // fade CYPHER in.
            timer = setTimeout(() => {
              setWordmarkVisible(true);
            }, 900); // Match Welcome's fade duration
          }, 250);
        }, 800);
      }
    };

    timer = setTimeout(typeNext, 400);

    return () => clearTimeout(timer);
  }, []);

  const isWelcome = typed === "Welcome.";

  return (
    <header
      className="relative border-b border-green-100 overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Animated dot grid */}
      <div
        className="absolute inset-0 pointer-events-none cypher-dots"
        aria-hidden
      />

      {/* Green glow blobs */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(61,181,52,0.13) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-12 right-1/4 w-64 h-64 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(61,181,52,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Nav */}
        <div className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex-shrink-0">
            <Image
              src="/logo.png"
              alt="CYPHER"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative" style={{ minHeight: "1.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "1.4rem",
                letterSpacing: "0.02em",
                color: "#141414",
                WebkitTextStroke: "0.4px #141414",
                textShadow:
                  "0 0 16px rgba(61,181,52,0.35), 0 2px 6px rgba(61,181,52,0.2)",
                opacity: wordmarkVisible ? 1 : 0,
                transition: "opacity 600ms ease",
              }}
            >
              CYPHER
            </span>

            {!introRemoved && (
              <span
                className="absolute top-0 left-0"
                style={{
                  fontStyle: "italic",
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.05rem",
                  letterSpacing: "0.01em",
                  color: isWelcome ? "#3db534" : "#6b7280",
                  opacity: introVisible ? 1 : 0,
                  transition: "opacity 900ms ease",
                }}
                onTransitionEnd={() => {
                  if (!introVisible) {
                    setIntroRemoved(true);
                  }
                }}
              >
                {typed}
                {cursorOn && (
                  <span
                    className="blink"
                    style={{
                      color: "#3db534",
                      marginLeft: "2px",
                    }}
                  >
                    |
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="py-10 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-800 text-base sm:text-lg font-semibold leading-relaxed">
              Your AI-Powered Learning Companion for Cybersecurity and IT Skills.
            </p>

            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-2">
              Enter your topic, experience level, available time, and learning
              goal below to receive a personalized study plan, knowledge check
              questions, key takeaways, a practical analyst tip and a real world
              project scenario for your portfolio. 
              Everything is tailored to your session.
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {[
              { v: "Any Topic", l: "Cybersecurity or IT" },
              { v: "4 Levels", l: "Beginner to Advanced" },
              { v: "6 Modules", l: "Per Session" },
            ].map((s) => (
              <div
                key={s.l}
                className="flex items-center gap-2 bg-white/70 border border-green-200 rounded-full px-4 py-1.5 hover:border-green-400 transition-colors shadow-sm"
              >
                <span
                  className="text-sm font-bold text-[#3db534]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {s.v}
                </span>

                <span className="text-xs text-gray-400">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}