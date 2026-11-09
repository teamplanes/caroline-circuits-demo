// Run: npx tsx src/lib/ai-fallback.check.ts
import assert from "node:assert/strict";
import { defaultLibrary, fallbackChat, fallbackModerate, fallbackSearch, fallbackSummarise, fallbackTag } from "./ai-prompts";

const lib = defaultLibrary();
const byId = new Map(lib.map((c) => [c.id, c]));

const res = fallbackSearch("15 min no weights");
assert.ok(res.classIds.length > 0, "returns classes");
for (const id of res.classIds) {
  const c = byId.get(id)!;
  assert.ok(c.durationMin <= 15, `${id} is short`);
  assert.ok(!c.equipment.some((e) => /dumbbell|kettlebell/i.test(e)), `${id} needs no weights`);
}

assert.equal(byId.get(fallbackSearch("legs and glutes").classIds[0])?.bodyArea, "lower");
assert.equal(fallbackTag({ title: "20 min Glute Burn", description: "Band work for legs" }).bodyArea, "lower");
assert.match(fallbackChat("sales", "I'm pregnant, can I join?"), /GP/);
assert.match(fallbackChat("sales", "How much is it?"), /£35/);
assert.match(fallbackChat("sales", "Is there a sauna?"), /pass this to Caroline/);
assert.equal(fallbackModerate("DM me for crypto gains www.x.com").flagged, true);
assert.equal(fallbackModerate("Loved today's class!").flagged, false);
assert.equal(fallbackSummarise(["too expensive", "price went up", "no time with kids"]).themes[0].theme, "Price & value");

console.log("ai fallback checks passed:", res.explanation);
