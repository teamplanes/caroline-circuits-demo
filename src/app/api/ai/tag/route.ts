// POST /api/ai/tag  body {title, description} -> {bodyArea, level, equipment, tags, chapters, fallback?}
import { LIMITS, askClaudeJson, badRequest, cleanStr, fallbackTag, type TagResult } from "@/lib/ai-prompts";

const schema = {
  type: "object",
  properties: {
    bodyArea: { type: "string", enum: ["full", "upper", "lower", "core", "hiit", "yoga", "mobility"] },
    level: { type: "string", enum: ["beginner", "all", "intermediate"] },
    equipment: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, atSec: { type: "integer" } },
        required: ["label", "atSec"],
        additionalProperties: false,
      },
    },
  },
  required: ["bodyArea", "level", "equipment", "tags", "chapters"],
  additionalProperties: false,
};

const SYSTEM = `You tag new workout classes for Caroline's Circuits, an at-home strength platform.
Equipment uses these names where possible: Dumbbells, Kettlebell, Resistance band, Mat.
Tags are 3-6 short lowercase keywords. Chapters cover the whole class (warm-up first at 0s, cool-down last), using the duration in the text or 30 minutes if none.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const title = cleanStr(body?.title, 200);
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, LIMITS.text) : "";
  if (!title) return badRequest("title is required (max 200 characters)");

  const res = await askClaudeJson<TagResult>(SYSTEM, `Title: ${title}\nDescription: ${description || "(none)"}`, schema);
  if (res) return Response.json(res);
  return Response.json({ ...fallbackTag({ title, description }), fallback: true });
}
