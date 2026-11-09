// POST /api/ai/draft  body {classTitle, kind} -> {text, fallback?}
import { askClaudeJson, badRequest, cleanStr, fallbackDraft, type DraftKind } from "@/lib/ai-prompts";

const KINDS: Record<DraftKind, string> = {
  description: "a class description for the library: 2-3 sentences, what to expect, kit, low-impact options",
  newsletter: "a short member newsletter section (under 120 words) with a bold title line, signed 'Caroline x'",
  social: "an Instagram caption (under 60 words) with 2-3 hashtags including #CarolinesCircuits",
};

const schema = {
  type: "object",
  properties: { text: { type: "string" } },
  required: ["text"],
  additionalProperties: false,
};

const SYSTEM = `You write content for Caroline Idiens of Caroline's Circuits: warm, upbeat, encouraging, British spelling.
At-home strength classes, 4 live a week (recorded straight after), all levels, minimal kit. Don't invent prices, dates or claims.
Formatting: plain text, **bold** allowed.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const classTitle = cleanStr(body?.classTitle, 200);
  const kind = body?.kind as DraftKind;
  if (!classTitle || !Object.hasOwn(KINDS, kind)) return badRequest("Expected {classTitle, kind: 'description' | 'newsletter' | 'social'}");

  const res = await askClaudeJson<{ text: string }>(SYSTEM, `Write ${KINDS[kind]} for the class "${classTitle}".`, schema);
  if (res?.text) return Response.json({ text: res.text });
  return Response.json({ text: fallbackDraft({ classTitle, kind }), fallback: true });
}
