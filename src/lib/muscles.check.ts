// Run: npx tsx src/lib/muscles.check.ts
import assert from "node:assert/strict";
import { buildSeed } from "../data/mock";
import { classesFor, classMuscles, MUSCLES, muscleLoad } from "./muscles";
import type { Workout } from "./types";

const now = new Date("2026-11-09T12:00:00Z");
const { classes } = buildSeed(now);
const abs = classes.find((c) => c.series === "Abs Only")!;
const legs = classes.find((c) => c.series === "Legs & Glutes")!;
const w = (c: typeof abs, daysAgo: number, i: number): Workout => ({
  id: `w${i}`, memberId: "me", classId: c.id, bodyArea: c.bodyArea, durationMin: c.durationMin,
  completedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
});

// Three ab classes and one legs class this month, plus an old legs class outside the window.
const load = muscleLoad([w(abs, 1, 1), w(abs, 2, 2), w(abs, 3, 3), w(legs, 5, 4), w(legs, 40, 5)], classes, 30, now);
assert.equal(load.abs.heat, 1, "abs is the most worked");
assert.equal(load.abs.sessions, 3);
assert.equal(load.glutes.sessions, 1, "the 40-day-old class doesn't count");
assert.ok(!load.abs.needsWork && load.chest.needsWork && load.chest.sessions === 0, "untouched chest needs work");
assert.ok(MUSCLES.every((m) => load[m.id].heat >= 0 && load[m.id].heat <= 1));

// Nothing logged: everything needs work, no divide-by-zero.
assert.ok(Object.values(muscleLoad([], classes, 30, now)).every((m) => m.heat === 0 && m.needsWork));

// Suggestions actually target the muscle, and every muscle has at least one class.
for (const m of MUSCLES) {
  const picks = classesFor(m.id, classes, new Set());
  assert.ok(picks.length > 0, `no class for ${m.id}`);
  assert.ok(picks.every((c) => (classMuscles(c)[m.id] ?? 0) >= 0.5), m.id);
}
console.log("muscles ok");
