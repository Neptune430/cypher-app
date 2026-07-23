"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const CONSENT_KEY = "cypher_consent_accepted";

export default function ConsentGate() {
  // null = still checking localStorage, true = accepted, false = not yet decided or declined
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    try {
      setAccepted(localStorage.getItem(CONSENT_KEY) === "true");
    } catch {
      // localStorage unavailable (e.g. private browsing edge cases), default
      // to asking every time rather than blocking the app entirely.
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "true");
    } catch {
      // If storage isn't available, the gate will just ask again next
      // visit, which is an acceptable fallback rather than blocking use.
    }
    setAccepted(true);
    setDeclined(false);
  };

  // Nothing to render until we've checked, or once accepted.
  if (accepted === null || accepted === true) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-green-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="CYPHER" width={24} height={24} className="w-full h-full object-cover" />
          </div>
          <span
            className="text-sm font-bold uppercase tracking-wider text-[#3db534]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Before you continue
          </span>
        </div>

        {!declined ? (
          <>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              CYPHER uses your inputs to generate study sessions via Anthropic&apos;s API, and briefly
              uses your IP address to keep the service fair for everyone. No accounts, no tracking
              cookies, nothing sold to anyone. Full details are in our{" "}
              <Link href="/privacy" target="_blank" className="text-[#3db534] font-semibold hover:underline">Privacy Policy</Link>,{" "}
              <Link href="/terms" target="_blank" className="text-[#3db534] font-semibold hover:underline">Terms of Service</Link>, and{" "}
              <Link href="/cookies" target="_blank" className="text-[#3db534] font-semibold hover:underline">Cookie Policy</Link>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-[#3db534] text-white hover:bg-[#35a02d] active:scale-95 transition-all"
              >
                Accept &amp; Continue
              </button>
              <button
                onClick={() => setDeclined(true)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
              >
                Decline
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              That&apos;s okay. CYPHER can&apos;t generate a session without agreeing to how your inputs
              are used, so there isn&apos;t a way to continue without accepting. You&apos;re welcome to
              change your mind any time.
            </p>
            <button
              onClick={() => setDeclined(false)}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-[#3db534] text-white hover:bg-[#35a02d] active:scale-95 transition-all"
            >
              Reconsider
            </button>
          </>
        )}
      </div>
    </div>
  );
}
