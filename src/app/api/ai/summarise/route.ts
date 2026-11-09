// POST /api/ai/summarise  body {texts: string[]} -> {themes, summary, fallback?}
import { LIMITS, askClaudeJson, badRequest, fallbackSummarise, type SummaryResult } from "@/lib/ai-prompts";

const schema = {
  type: "object",
  properties: {
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: { theme: { type: "string" }, count: { type: "integer" }, example: { type: "string" } },
        required: ["theme", "count", "example"],
        additionalProperties: false,
      },
    },
    summary: { type: "string" },
  },
  required: ["themes", "summary"],
  additionalProperties: false,
};

const SYSTEM = `You summarise member feedback (e.g. cancellation reasons, survey answers) for the owner of Caroline's Circuits.
Group responses into at most 5 themes, most common first. count = number of responses in that theme; example = a short verbatim quote from one response.
summary = 1-2 plain sentences with one practical suggestion.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const texts: string[] = Array.isArray(body?.texts)
    ? body.texts.filter((t: unknown): t is string => typeof t === "string" && t.trim() !== "").map((t: string) => t.trim().slice(0, 1000))
    : [];
  if (!texts.length || texts.length > LIMITS.feedbackItems) return badRequest(`texts must have 1-${LIMITS.feedbackItems} items`);

  const res = await askClaudeJson<SummaryResult>(SYSTEM, texts.map((t, i) => `${i + 1}. ${t}`).join("\n"), schema);
  if (res) return Response.json(res);
  return Response.json({ ...fallbackSummarise(texts), fallback: true });
}
