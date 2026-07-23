import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { validateInputs } from "@/lib/validate";
import { isRateLimited } from "@/lib/rateLimit";

// Based on real generation cost (~5100 output tokens observed at current
// Sonnet 4.6 throughput), a full generation genuinely takes around
// 100-110 seconds. 180 gives real margin instead of running right up
// against the ceiling. This still requires Fluid Compute enabled on
// Vercel Hobby (Project Settings -> Functions -> Fluid Compute), since
// the default cap without it is 60s regardless of this number. Doesn't
// apply to local dev at all.
export const maxDuration = 180;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  // Best-effort first layer, see src/lib/rateLimit.ts for what this does
  // and does not protect against, and the real fix (Vercel Firewall).
  // x-forwarded-for is only meaningfully set behind a real proxy (Vercel
  // in production). Locally every request would share one "unknown" key
  // and falsely rate-limit your own testing, so this only applies in prod.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (process.env.NODE_ENV === "production" && isRateLimited(ip)) {
    return jsonError("You've generated 3 sessions this hour, nice work. Take a little break, look back over what you've built so far, and come back in a few hours for more.", 429);
  }

  // Reject oversized request bodies before doing any parsing work. 4 short
  // text fields never need anywhere close to this, it's just a guard
  // against someone sending a huge payload to burn server resources.
  const MAX_BODY_BYTES = 10_000;
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Request body too large.", 413);
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const result = validateInputs(rawBody);
  if (!result.valid || !result.data) {
    return jsonError(result.error || "Invalid input.", 400);
  }
  const { topic, level, time, goal } = result.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError("API key not configured on the server.", 500);
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are CYPHER, an expert curriculum architect and senior SOC mentor who designs personalized learning roadmaps for cybersecurity and IT practitioners. You do not write generic study advice, you design a specific, sequenced path calibrated to one learner's stated level, time, and goal, the way a real instructional designer would.

Rules you always follow:
- Never use em dashes under any circumstance. Use commas, periods, colons, or parentheses instead.
- Never say "search for this" or "look this up." Always give the real, direct, clickable markdown link in the format [Resource Name](https://url.com).
- Explain concepts in your own words before linking out. The explanation is the product, the links are a bonus for going deeper.
- Build progressively. Never assume advanced background knowledge with a beginner, and never waste an advanced practitioner's time re-explaining fundamentals.
- Detect and respect prerequisites. If a topic genuinely depends on a foundational concept, say so briefly rather than skipping straight to the advanced material.
- Be disciplined and tight. No filler, no repeated phrasing, no generic AI-sounding statements like "in today's digital landscape."
- Respect every length limit given below exactly.
- Every experience level gets the same length limits. Advanced does not mean longer, it means more precise and technical, not padded.
- Use clean markdown throughout: headers, bold, numbered and bulleted lists, and horizontal rules exactly where instructed.`;

  const userPrompt = `Design a complete personalized learning roadmap for these parameters:
- Topic: ${topic}
- Experience Level: ${level}
- Available Time: ${time}
- Learning Goal: ${goal}

Structure your entire response using these six exact tags, each alone on its own line, in this exact order, with nothing else before, between, or after them:

[[[INSIGHTS]]]
[[[STUDY_PLAN]]]
[[[KNOWLEDGE_CHECK]]]
[[[TAKEAWAYS]]]
[[[ANALYST_TIP]]]
[[[PROJECT_SCENARIO]]]

These six tags are the ONLY bracket style tags allowed anywhere in your response. Use each exactly once, only as the very first line of its section. Do not use any bracket tag, marker, or similar separator for anything else, including inside the Knowledge Check or Project Scenario sections. No em dashes anywhere in the output.

Here is exactly what belongs in each section:

Content after [[[INSIGHTS]]] — SESSION BRIEF:
A tight, scannable brief, written like a SOC practitioner jotting quick notes for a colleague, not a polished corporate summary. Plain, direct, a little informal is fine. Avoid AI-sounding phrases like "tailored to your needs," "comprehensive," or "in today's landscape." Use exactly 4 bullet points, one line each, nothing more:

- **Why this plan:** one specific line tying it directly to their level (${level}), time (${time}), and goal (${goal})
- **Estimated completion:** one specific line
- **Biggest challenge:** one specific line naming the real sticking point at this level
- **Tip for success:** one practical, specific line

Keep the whole thing under 60 words total. No paragraphs, no extra commentary, just the 4 bullets in that exact order.

Content after [[[STUDY_PLAN]]] — PERSONALIZED STUDY PLAN:
Time-blocked into 4 phases: Warm-Up, Core Learning, Hands-On Practice, Review.

HARD TIME CONSTRAINT: the learner has exactly ${time} available for this entire session, all 4 phases combined. This is a strict ceiling, not a suggestion, even if the topic would ideally take longer to master in real life. Divide ${time} across the 4 phases and label each phase's time allocation directly in its own header, for example "### Warm-Up (3 minutes)". The 4 phase times must add up to ${time} or less. If ${time} is short (15 or 30 minutes), each phase should only get a few minutes and the content inside must be short enough to genuinely fit, do not write phase content that would realistically take far longer than its stated time. If the value is "No Time Set", use your judgment for a reasonable full session (60 to 90 minutes total) and still label each phase honestly.

For each phase, keep it tight:
1. A 2 sentence explanation that actually teaches the concept for that phase, the way a senior analyst would explain it to someone learning it for the first time. For very short phases (under 5 minutes), 1 sentence is enough.
2. Exactly 2 numbered action steps.
3. A "Continue Learning" list of exactly 2 direct clickable markdown links to real resources (TryHackMe, HackTheBox, MITRE ATT&CK, official documentation, or a specific YouTube video).
4. A **Confidence Checkpoint:** one specific self-check question, one line.

After all 4 phases, add one **Stretch Goal:** a single sentence naming an optional, more advanced challenge for someone who finishes early.

Calibrate depth, terminology, and pacing to ${level}. Never overwhelm a beginner with advanced level assumptions, and never pad an advanced practitioner's plan with material they already know, depth means precision, not extra length.

Before moving on to the next section, check your own work: do the 4 phase times you just labeled actually add up to ${time} or less? If not, shorten them until they genuinely do.

Content after [[[KNOWLEDGE_CHECK]]] — KNOWLEDGE CHECK (10 Questions Total):
Build a professional, two-part, certification-style knowledge check testing ${topic} at a ${level} level. Format every question exactly like this, with a horizontal rule between each one:

**Q[number].** [question text]
A) [option]
B) [option]
C) [option]
D) [option]
**Correct Answer: [letter].** [one sentence explanation of why this is correct]

Use a ### markdown header (not a bracket tag) to introduce each part:

### Part A: CompTIA Security+ Style (5 Questions)
Scenario based, practical, testing applied understanding rather than pure memorization.

### Part B: Industry Certification Style (5 Questions)
Write these in the style of whichever certification body is most relevant to ${topic}: choose from ISC2 CISSP, Microsoft Azure Security (AZ-500), AWS Certified Security Specialty, or another relevant vendor certification. State which certification body you are drawing from right after the ### Part B header.

Order questions from easier to harder within each part. Every question and explanation must stay tight and scannable. Part A and Part B both belong inside this same Knowledge Check section, do not separate them with a bracket tag.

Content after [[[TAKEAWAYS]]] — KEY TAKEAWAYS & NEXT STEPS:
Exactly 5 bullet point takeaways covering the most important concepts from this roadmap. Then 3 logical next topics to study, each with one short clause on why. Close with a single "Skills Unlocked" line in the format: what you can now do, followed by what this enables in a real SOC context.

Content after [[[ANALYST_TIP]]] — ANALYST TIP:
One tight, real world tip that a working cybersecurity analyst or IT specialist could apply immediately, tied directly to ${topic}. Write it as a single sharp paragraph, 3 to 4 sentences maximum, in the authentic voice of a senior SOC analyst passing on something they actually learned the hard way on the job, specific and grounded, never generic advice. No sub-headers, no bullet list, just the paragraph.

Content after [[[PROJECT_SCENARIO]]] — PROJECT LADDER:
Instead of one flat project, build a progressive 3 stage project ladder tied to ${topic}, using a single consistent fictional company across all 3 stages so it reads as one evolving engagement, not three unrelated scenarios.

Open with a short **Company Profile** (name, industry, headquarters, employee count, 1 to 2 sentence background, kept brief) that applies across all 3 stages. Then use ### markdown headers for each stage, and respect these limits exactly:

### Stage 1: Beginner Project
Keep this to 4 lines maximum: one line scenario, one line role, 2 objectives as short bullet phrases (not full sentences), one line naming the expected artifact. This is a quick preview, not a full brief.

### Stage 2: Intermediate Project
Keep this to 5 lines maximum: one to two line scenario building on Stage 1, one line role, 3 objectives as short bullet phrases, one line naming the expected artifact. Still a preview, not a full brief.

### Stage 3: Final Portfolio Project
This is the one full, detailed brief, the actual deliverable someone builds and puts on GitHub. Include Current Infrastructure (bulleted, specific), Security Posture and Pain Points (bulleted), The Scenario (2 to 3 sentences), Your Role, 3 to 4 Project Objectives, Technical Stack, Expected GitHub Artifacts, and 2 Stretch Goals (one line each). This is the only stage that should be fully fleshed out.

Every detail across all 3 stages must be specific and believable, never generic placeholders like "various systems." Stages 1 and 2 exist to show progression, keep them genuinely short, all the depth belongs in Stage 3.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          // Raised from 5500: real usage was landing around ~5100 tokens,
          // leaving almost no margin and causing Project Scenario (the
          // last section generated) to get cut off before it finished.
          max_tokens: 6500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        claudeStream.on("text", (text) => {
          controller.enqueue(encoder.encode(text));
        });

        await claudeStream.finalMessage();
      } catch (err) {
        console.error("CYPHER generation error:", err);
        controller.enqueue(encoder.encode("\n<<<STREAM_ERROR>>>\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      // Standard signal to reverse proxies / CDNs not to buffer this
      // response before forwarding it, on top of disabling compression
      // in next.config.js.
      "X-Accel-Buffering": "no",
    },
  });
}
