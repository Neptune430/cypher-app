# 🛡️ CYPHER — AI Learning Companion for Cybersecurity & IT

> Stop winging your study sessions. CYPHER builds a full personalized learning roadmap tailored to your topic, level, and time, cybersecurity or any other technical skill.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Claude](https://img.shields.io/badge/Claude-Sonnet-orange?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)

---

## What is CYPHER?

CYPHER is an AI-powered learning companion for cybersecurity and technical skills. Enter your topic, experience level, available time, and learning goal, and get back a complete personalized roadmap: a session brief, a time-matched study plan that actually teaches before it links out, a certification-style knowledge check, key takeaways, a practitioner tip, and a portfolio-ready project ladder.

It started as a cybersecurity study planner. The engine underneath was never actually specific to security, the same four inputs work for cloud, networking, Linux, DevOps, or any other technical topic, and the branding is catching up to that.

### 6 Output Modules

| Module | What You Get |
|---|---|
| **Session Brief** | A tight 4-bullet brief: why this plan, estimated completion, biggest challenge, tip for success |
| **Study Plan** | 4 time-blocked phases, each explained before it links anywhere, with a confidence checkpoint and honest time labels that add up to what you actually have |
| **Knowledge Check** | 10 questions in two parts: CompTIA Security+ style, then whichever certification body actually fits your topic (ISC2, Azure, AWS, etc.) |
| **Takeaways** | Key concepts distilled, plus logical next topics |
| **Analyst Tip** | One tight, real-world insight in a practitioner's voice |
| **Project Ladder** | A 3-stage progressive project, beginner through a full portfolio-ready brief, one consistent fictional company throughout |

### Export

Once a session finishes generating, download the whole thing as a **Markdown file** or export it as a **PDF**, every section included, ready to save, share, or drop straight into your notes.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **AI:** Anthropic Claude Sonnet via SDK, streamed live section by section
- **Styling:** Tailwind CSS 3.4
- **Fonts:** JetBrains Mono + Inter
- **Deploy:** Vercel

### Also built in

- **Input validation** with length limits and strict allowed-value checks on every field
- **Rate limiting** (best-effort in-memory layer, production-only, with Vercel Firewall recommended as the real backstop)
- **A real test suite** covering the section parser, validation, and rate limiter, `npm test`

---

## Getting Started

```bash
git clone https://github.com/Neptune430/cypher-app.git
cd cypher-app
npm install
cp .env.local.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Run the test suite:

```bash
npm test
```

---

## Deploy on Vercel

1. Push repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Enable **Fluid Compute** in Project Settings → Functions (needed since a full generation can take 1-2 minutes)
5. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── api/generate/route.ts   ← AI endpoint, streamed generation
│   ├── globals.css             ← Design system
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── InputPanel.tsx
│   ├── OutputPanel.tsx
│   ├── SessionInsights.tsx
│   ├── PrintableSession.tsx    ← Hidden print layout, powers PDF export
│   └── Footer.tsx
└── lib/
    ├── cypher.ts                ← Section parsing (marker-based, not positional)
    ├── validate.ts               ← Input validation
    ├── rateLimit.ts              ← Rate limiting
    └── export.ts                 ← Markdown export
tests/
├── parser.test.ts
├── validate.test.ts
├── rateLimit.test.ts
└── export.test.ts
```

---

Built by **John Ofulue** — Cybersecurity Analyst | SOC | Pentest | GRC | AI Applications

[![GitHub](https://img.shields.io/badge/GitHub-Neptune430-black?style=flat&logo=github)](https://github.com/Neptune430)
