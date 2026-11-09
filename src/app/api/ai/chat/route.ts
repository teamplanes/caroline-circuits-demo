// POST /api/ai/chat  body {mode, messages, timeZone?, live?} -> streamed plain text.
// `live` = admin-editable schedule/prices from the demo store (validated by parseLive).
// Node runtime is the default (Cache Components forbids the `runtime` export).
import {
  FALLBACK_PARAMS,
  LIMITS,
  MODEL,
  badRequest,
  chatSystem,
  claude,
  cleanStr,
  fallbackChat,
  hasKey,
  parseLive,
  type ChatMode,
  type ChatTurn,
} from "@/lib/ai-prompts";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const mode: ChatMode | null = body?.mode === "sales" || body?.mode === "support" ? body.mode : null;
  if (!mode || !Array.isArray(body?.messages)) return badRequest("Expected {mode, messages}");

  const messages: ChatTurn[] = [];
  for (const m of body.messages.slice(-LIMITS.turns)) {
    const content = cleanStr(m?.content, LIMITS.message);
    if ((m?.role !== "user" && m?.role !== "assistant") || !content) return badRequest("Invalid message");
    messages.push({ role: m.role, content });
  }
  while (messages[0]?.role === "assistant") messages.shift(); // must start with a user turn
  if (messages.at(-1)?.role !== "user") return badRequest("Last message must be from the user");

  const timeZone = cleanStr(body.timeZone, 64) ?? undefined;
  const live = parseLive(body.live);
  const question = messages.at(-1)!.content;
  const enc = new TextEncoder();
  const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

  if (!hasKey()) {
    return new Response(fakeStream(fallbackChat(mode, question, timeZone, live)), { headers: { ...headers, "x-ai-fallback": "1" } });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      try {
        const s = claude().beta.messages.stream(
          {
            ...FALLBACK_PARAMS,
            model: MODEL,
            max_tokens: 64000,
            output_config: { effort: "low" }, // chat: fast and short
            system: chatSystem(mode, timeZone, live),
            messages,
          },
          { signal: req.signal },
        );
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(enc.encode(ev.delta.text));
            sent = true;
          }
        }
        const final = await s.finalMessage();
        if (!sent && final.stop_reason === "refusal") throw new Error("refusal");
      } catch (err) {
        if (req.signal.aborted) return controller.close();
        console.error("[ai/chat] falling back:", err instanceof Error ? err.message : err);
        if (!sent) controller.enqueue(enc.encode(fallbackChat(mode, question, timeZone, live)));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers });
}

/** Streams canned text word by word so the fallback feels the same as the real thing. */
function fakeStream(text: string) {
  const enc = new TextEncoder();
  const parts = text.split(/(?<=\s)/);
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next = parts.shift();
      if (next === undefined) return controller.close();
      controller.enqueue(enc.encode(next));
      await new Promise((r) => setTimeout(r, 18));
    },
  });
}
