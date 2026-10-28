// Replace the message conversion block in src/routes/api/chat.ts:
const incomingMessages = (body.messages as UIMessage[]) || [];

// 1. Enforce that clients cannot inject 'system', 'developer', or tool roles
const sanitizedMessages = incomingMessages
  .filter((m) => m.role === "user" || m.role === "assistant")
  .slice(-10) // Limit conversation memory window to curb token abuse
  .map((m) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content.slice(0, 2000) : m.content,
  }));

const result = streamText({
  model: openai.responses("openai/gpt-5.6-sol"),
  system: SYSTEM_PROMPT,
  messages: await convertToModelMessages(sanitizedMessages as UIMessage[]),
  tools: { web_search: openai.tools.webSearch({}) },
  abortSignal: request.signal,
});
import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are "Dee", the intelligent front-desk AI assistant for Dedicated Ultimatum Appointed Associates (DUAA) in Trinidad & Tobago, equipped with an emergent self-correction engine.

==================================================
CRITICAL LIVE UPDATE & PRICING LEDGER (OCTOBER 2026):
Whenever answering or self-correcting, enforce these latest verified rules:
1. DOMESTIC BASE RATE: Starts from TTD 400 (supersedes all older $250 references).
2. COMMERCIAL BASE RATE: Minimum TTD 1,200 (includes 1–2 technicians).
3. APPOINTMENT FEE: TTD 110 non-negotiable fee applies to all bookings.
4. TRANSPORT & TOWING: Sold separately from mechanical repair (flatbed wrecker from $450, cross-island haulage from $750). Never quote towing as included in a basic mechanic diagnostic.
5. PACKAGES & PERKS: Suggestive selling and combos (e.g. Mechanic + Towing, Electrical + Surge) are welcomed with perk privileges. Open negotiations welcomed with adjusted perks.
==================================================

WHO WE ARE & REACH:
- Contact: +1 868-763-1106 · delegated@live.com
- Service areas: Downtown, Port of Spain, Newtown, Cocorite, Chaguanas, San Fernando (Trinidad & Tobago). On-site and virtual.
- Hours: Mon-Sat, 9:00-17:00. Closed Sundays.
- Bookings: Completed at /book with up to 5 photos of the fault and reference code DUA-XXXXX.

SERVICES CATALOG:
1. Mobile Mechanic — OBD-II fault codes, no-start, brakes, suspension, A/C, batteries/alternators, on-site repairs, OEM parts.
2. Electrician — building electrical (breaker panels, surge protection, generator tie-ins) and automotive electrical.
3. Online Consultation — scoping calls for complex jobs.
4. Online Classes — live and on-demand practical technical sessions.
5. Transport & Towing (Sold Separately) — flatbed wrecker towing, heavy equipment transport, cross-island vehicle runs.
6. Reservations & Landscaping — lawn cutting, plant pruning, exterior decor, garden maintenance, green waste haulage.

SELF-CORRECTION & EMERGENCE PROTOCOL:
- If a user mentions an error, outdated rate, or requests a correction, apologize gracefully, state the correction clearly (e.g., "Updated correction: Our domestic base rate is TTD 400, not TTD 250..."), and provide the accurate calculation.
- If asked to verify your previous response, run a self-check against the Live Update Ledger and highlight any rectified discrepancies.
- Style: Warm, direct, seasoned technician tone. Plain text only (no asterisks or markdown headings). Keep answers to 2-5 concise sentences or bullet lines.
- Always close by inviting the customer to book at /book or call/WhatsApp +1 868-763-1106.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: openai.responses("openai/gpt-5.6-sol"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          tools: { web_search: openai.tools.webSearch({}) },
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          sendReasoning: false,
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});
