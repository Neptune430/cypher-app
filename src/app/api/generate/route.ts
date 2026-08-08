import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { validateInputs } from "@/lib/validate";
import { checkRateLimit } from "@/lib/rateLimit";

// Based on real generation cost observed at Sonnet throughput, a full
// generation genuinely takes around 100-110 seconds. 180 gives real
// margin instead of running right up against the ceiling. This still
// requires Fluid Compute enabled on Vercel Hobby (Project Settings ->
// Functions -> Fluid Compute), since the default cap without it is 60s
// regardless of this number. Doesn't apply to local dev at all.
export const maxDuration = 180;

function jsonError(message: string, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function POST(req: NextRequest) {
  // Best-effort first layer, see src/lib/rateLimit.ts for what this does
  // and does not protect against, and the real fix (Vercel Firewall).
  // x-forwarded-for is only meaningfully set behind a real proxy (Vercel
  // in production). Locally every request would share one "unknown" key
  // and falsely rate-limit your own testing, so this only applies in prod.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const isProd = process.env.NODE_ENV === "production";
  const rateLimitStatus = isProd ? checkRateLimit(ip) : null;

  // Exposed so the client can show real usage progress (e.g. "2/4") built
  // from actual server state, not guessed client side. Absent entirely in
  // dev, where rate limiting doesn't apply at all.
  const rateLimitHeaders: Record<string, string> = rateLimitStatus
    ? {
        "X-RateLimit-Count": String(rateLimitStatus.count),
        "X-RateLimit-Max": String(rateLimitStatus.max),
      }
    : {};

  if (rateLimitStatus?.limited) {
    return jsonError(
      "You've generated 4 sessions this hour, nice work. Take a little break, look back over what you've built so far, and come back in a few hours for more.",
      429,
      rateLimitHeaders
    );
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

  const systemPrompt = `You are CYPHER, an expert AI Learning Companion and senior cybersecurity analyst with extensive experience across cybersecurity, IT, networking, cloud computing, Linux, programming, DevOps, digital forensics, penetration testing, and technical education.

Your objective is to turn a learner's goal into a practical, structured, personalized learning journey, adapted to their chosen topic, experience level, available study time, and desired outcome. Never produce a generic roadmap, every journey should feel intentionally designed for this one learner.

Prioritize logical progression from foundational concepts to advanced ones, practical skills before unnecessary theory, real world relevance and current industry best practices, clear explanations in professional but approachable language, and actionable guidance that motivates continued learning.

Rules you always follow:
- Never use em dashes under any circumstance. Use commas, periods, colons, or parentheses instead.
- Never say "search for this" or "look this up." Always give the real, direct, clickable markdown link in the format [Resource Name](https://url.com).
- Never invent or guess a specific URL. Only link to real, well established, stable resources you are genuinely confident exist. If you are not certain a specific link is correct, link to the resource's general homepage or search page instead of a deep link, and describe what to look for once there.
- Prefer natural, concise paragraphs over lists. Use hyphens only for key points that genuinely benefit from separation, never as a default structure.
- Write like an experienced technical mentor, varying sentence structure so nothing reads as robotic, repetitive, or templated. Avoid generic AI sounding phrases like "in today's digital landscape" or "comprehensive."
- Do not include disclaimers, unnecessary introductions, or any mention that you are an AI.
- Never invent certifications or inaccurate technical information. Every recommendation must reflect real, current industry practice.
- Build progressively. Never assume advanced background knowledge with a beginner, and never waste an advanced practitioner's time re-explaining fundamentals.
- Every experience level gets the same length limits. Advanced means more precise and technical, never longer or padded.
- Keep every section purposeful, free of repetition or padding.
- Respect every length limit given below exactly, they exist so the full response completes without being cut off.
- Use clean markdown: headers, bold, and hyphens only where specified below.`;

  const userPrompt = `Design a complete personalized learning journey for these parameters:
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
A tight, scannable brief in the voice of a mentor jotting quick notes for a colleague, not a corporate summary. Plain and direct. Use exactly 4 short points, one line each:

- **Why this plan:** one specific line tying it directly to their level (${level}), time (${time}), and goal (${goal})
- **Estimated completion:** one specific line
- **Biggest challenge:** one specific line naming the real sticking point at this level
- **Tip for success:** one practical, specific line

Keep the whole thing under 60 words total. No paragraphs, no extra commentary, just the 4 points in that exact order.

Content after [[[STUDY_PLAN]]] — PERSONALIZED STUDY ROADMAP:
Time-blocked into 4 phases: Warm-Up, Core Learning, Hands-On Practice, Review. Organize this as a logical progression, foundational concepts first, then practical application, then hands on skill, then review, briefly explaining why each phase comes next.

HARD TIME CONSTRAINT: the learner has exactly ${time} available for this entire roadmap, all 4 phases combined. This is a strict ceiling, not a suggestion, even if the topic would ideally take longer to master in real life. Divide ${time} across the 4 phases and label each phase's time allocation directly in its own header, for example "### Warm-Up (3 minutes)". The 4 phase times must add up to ${time} or less. If ${time} is short (15 or 30 minutes), each phase should only get a few minutes and the content inside must be short enough to genuinely fit. If the value is "No Time Set", use your judgment for a reasonable full session (60 to 90 minutes total) and still label each phase honestly.

For each phase, write in natural paragraph form:
1. A 2 sentence explanation that actually teaches the concept and why it comes next in the sequence, the way a senior analyst would explain it to someone learning it for the first time. For very short phases (under 5 minutes), 1 sentence is enough.
2. Exactly 2 practical action steps.
3. A "Continue Learning" line with exactly 2 direct clickable markdown links to real resources (TryHackMe, HackTheBox, MITRE ATT&CK, official documentation, or a specific YouTube video).
4. A **Confidence Checkpoint:** one specific self-check question.

After all 4 phases, add one **Stretch Goal:** a single sentence naming an optional, more advanced challenge for someone who finishes early.

Calibrate depth, terminology, and pacing to ${level}. Never overwhelm a beginner with advanced level assumptions, and never pad an advanced practitioner's roadmap with material they already know, depth means precision, not extra length.

Before moving on to the next section, check your own work: do the 4 phase times you just labeled actually add up to ${time} or less? If not, shorten them until they genuinely do.

Content after [[[KNOWLEDGE_CHECK]]] — KNOWLEDGE CHECKS (10 Questions Total):
Build a professional, two-part, certification-style set of knowledge checks testing ${topic} at a ${level} level, focused on application and critical thinking rather than simple recall. Format every question exactly like this, with a horizontal rule between each one:

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
Write these in the style of whichever real certification body is most relevant to ${topic}: choose from ISC2 CISSP, Microsoft Azure Security (AZ-500), AWS Certified Security Specialty, or another relevant vendor certification. Never invent a certification that doesn't exist. State which certification body you are drawing from right after the ### Part B header.

Order questions from easier to harder within each part. Every question and explanation must stay tight and scannable. Part A and Part B both belong inside this same section, do not separate them with a bracket tag.

Content after [[[TAKEAWAYS]]] — KEY TAKEAWAYS:
Exactly 5 takeaways covering the most important concepts from this roadmap, each as a concise point. Then suggest 3 logical next topics to study, each with one short clause on why it follows naturally. Close with a single "Skills Unlocked" line: what you can now do, followed by what this enables in a real world context. Keep this section concise and memorable, not repetitive.

Content after [[[ANALYST_TIP]]] — ANALYST INSIGHTS:
Real world insight from a working cybersecurity analyst or IT specialist, tied directly to ${topic}. In one focused paragraph, 4 to 6 sentences, share a practical tip, a common mistake people make at the ${level} level, and a recommended habit or industry perspective worth carrying forward. Write it in the authentic voice of a senior analyst passing on something they actually learned the hard way on the job, specific and grounded, never generic advice. No sub-headers, no bullet list, just the paragraph.

Content after [[[PROJECT_SCENARIO]]] — PROJECT LADDER:
A progressive 3 stage project ladder tied to ${topic}, using a single consistent fictional company across all 3 stages so it reads as one evolving engagement, not three unrelated scenarios. Each stage should build naturally on the last and grow in challenge and portfolio value.

ARTIFACT CHECK, do this before writing each stage: decide honestly whether actually doing this stage's work would require a real artifact to open or examine (a packet capture, a phishing email sample, a log file, a memory or disk image, a malware sample report, and so on). If yes, include one direct clickable markdown link to a real, well established, stable public source where a genuinely suitable practice artifact can be found, for example Wireshark's official Sample Captures page, malware-traffic-analysis.net, PhishTank, a relevant TryHackMe or HackTheBox room, or a comparable well known public source. Never invent or guess a specific file URL, if you are not fully certain a specific link is correct, link to the resource's general page instead of a deep link and briefly say what to look for there. If a stage genuinely does not need an external artifact (a design, policy, or analysis only task), do not force one in, write it exactly as you otherwise would.

Open with a short **Company Profile** (name, industry, headquarters, employee count, 1 to 2 sentence background, kept brief) that applies across all 3 stages. Then use ### markdown headers for each stage, and respect these limits exactly:

### Stage 1: Beginner Project
Keep this to 4 lines maximum: one line scenario, one line role, 2 objectives as short phrases, one line naming the expected artifact and, if one is genuinely needed, where to get it. This is a quick preview, not a full brief.

### Stage 2: Intermediate Project
Keep this to 5 lines maximum: one to two line scenario building on Stage 1, one line role, 3 objectives as short phrases, one line naming the expected artifact and, if one is genuinely needed, where to get it. Still a preview, not a full brief.

### Stage 3: Final Portfolio Project
This is the one full, detailed brief, the actual deliverable someone builds and puts on GitHub. Include Current Infrastructure (bulleted, specific), Security Posture and Pain Points (bulleted, specific), The Scenario (2 to 3 sentences), Your Role, 3 to 4 Project Objectives, Technical Stack, Expected GitHub Artifacts, and 2 Stretch Goals. This is the only stage that should be fully fleshed out.

Every detail across all 3 stages must be specific and believable, never generic placeholders like "various systems." Stages 1 and 2 exist to show progression, keep them genuinely short, all the depth belongs in Stage 3.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: "claude-sonnet-5",
          // Left exactly as it was under Sonnet 4.6, not raised for the
          // model change.
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
      ...rateLimitHeaders,
    },
  });
}
