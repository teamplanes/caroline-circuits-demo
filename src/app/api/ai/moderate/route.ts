// POST /api/ai/moderate  body {text} -> {flagged, reason?, fallback?}
import { LIMITS, askClaudeJson, badRequest, cleanStr, fallbackModerate, type ModerationResult } from "@/lib/ai-prompts";

const schema = {
  type: "object",
  properties: { flagged: { type: "boolean" }, reason: { type: "string" } },
  required: ["flagged", "reason"],
  additionalProperties: false,
};

const SYSTEM = `You moderate posts in a friendly women's fitness community (Caroline's Circuits).
Flag only: spam or self-promotion, abuse or body-shaming, unsafe health or diet advice, or sharing personal/contact details.
Normal chat, honest struggles and mild language are fine. reason: a short label when flagged, otherwise an empty string.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = cleanStr(body?.text, LIMITS.text);
  if (!text) return badRequest(`text must be 1-${LIMITS.text} characters`);

  const res = await askClaudeJson<{ flagged: boolean; reason: string }>(SYSTEM, `Post:\n${text}`, schema);
  if (res) {
    const out: ModerationResult = res.flagged ? { flagged: true, reason: res.reason || "Needs review" } : { flagged: false };
    return Response.json(out);
  }
  return Response.json({ ...fallbackModerate(text), fallback: true });
}
