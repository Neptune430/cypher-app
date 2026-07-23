import { Github, Twitter, Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-green-100 mt-12 bg-white/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <span>Made with</span>
            <Heart size={12} className="text-red-400 fill-red-400" />
            <span>by</span>
            <span className="font-bold text-gray-600">John Ofulue,</span>
            <span>Cybersecurity Analyst &amp; Instructor</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Neptune430"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-[#3db534] transition-colors"
            >
              <Github size={15} />
            </a>
            <a
              href="https://x.com/cyph3r_AI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-[#3db534] transition-colors"
            >
              <Twitter size={15} />
            </a>
            <span className="text-gray-300 text-xs">Powered by Claude AI</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 pt-1">
          <Link href="/privacy" className="hover:text-[#3db534] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#3db534] transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-[#3db534] transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}
