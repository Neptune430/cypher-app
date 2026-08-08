import Link from "next/link";
import Image from "next/image";

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: Props) {
  return (
    <div className="page-wrapper min-h-screen flex flex-col">
      <div className="fixed inset-0 pointer-events-none cypher-dots-page" aria-hidden />

      <header className="relative border-b border-green-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md flex-shrink-0">
              <Image src="/logo.png" alt="CYPHER" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span
              style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.2rem", color: "#141414" }}
            >
              CYPHER
            </span>
          </Link>
        </div>
      </header>

      <main className="relative flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="text-xs font-semibold text-[#3db534] hover:underline">
          ← Back to CYPHER
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 mb-1">{title}</h1>
        <p className="text-xs text-gray-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="legal-content">{children}</div>
      </main>

      <footer className="relative border-t border-green-100 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap gap-4 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-[#3db534]">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#3db534]">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-[#3db534]">Cookie Policy</Link>
        </div>
      </footer>
    </div>
  );
}
