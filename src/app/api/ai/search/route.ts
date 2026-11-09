// POST /api/ai/search  body {query, classes?} -> {classIds, explanation, fallback?}
import {
  LIMITS,
  SEARCH_SYSTEM,
  askClaudeJson,
  badRequest,
  cleanStr,
  compactClass,
  defaultLibrary,
  fallbackSearch,
  searchSchema,
  type SearchClass,
} from "@/lib/ai-prompts";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const query = cleanStr(body?.query, LIMITS.query);
  if (!query) return badRequest(`query must be 1-${LIMITS.query} characters`);

  let classes = defaultLibrary();
  if (Array.isArray(body.classes)) {
    if (body.classes.length > LIMITS.classes) return badRequest("Too many classes");
    classes = body.classes.filter(isClass).map(compactClass);
  }

  const res = await askClaudeJson<{ classIds: string[]; explanation: string }>(
    SEARCH_SYSTEM,
    `Classes (JSON):\n${JSON.stringify(classes)}\n\nRequest: ${query}`,
    searchSchema,
  );
  const known = new Set(classes.map((c) => c.id));
  const ids = res?.classIds.filter((id) => known.has(id)).slice(0, 6);
  if (res && ids?.length) return Response.json({ classIds: ids, explanation: res.explanation });
  return Response.json({ ...fallbackSearch(query, classes), fallback: true });
}

const shortStr = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
const shortList = (v: unknown) => Array.isArray(v) && v.length <= 10 && v.every((s) => shortStr(s, 40));

// Bounded sizes: these strings go straight into the prompt.
function isClass(c: unknown): c is SearchClass {
  const x = c as SearchClass;
  return (
    shortStr(x?.id, 80) &&
    shortStr(x.title, 200) &&
    shortStr(x.series, 80) &&
    shortStr(x.bodyArea, 40) &&
    typeof x.durationMin === "number" &&
    shortStr(x.level, 40) &&
    shortList(x.equipment) &&
    shortList(x.tags)
  );
}
