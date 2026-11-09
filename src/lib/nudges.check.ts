// Run: npx tsx src/lib/nudges.check.ts
import assert from "node:assert/strict";
import { buildSeed } from "../data/mock";
import { bodyAreaSplit, computeNudges, computeStreak } from "./nudges";

const now = new Date();
now.setHours(12, 0, 0, 0); // midday, before the "usual day" afternoon rule
const seed = buildSeed(now);
const mine = seed.workouts.filter((w) => w.memberId === "me");

assert.equal(mine.length, 25, "Emma has 25 workouts");
assert.deepEqual(mine.slice(-3).map((w) => w.bodyArea), ["core", "core", "core"], "last 3 are core");
assert.equal(computeStreak(mine, now), 4, "4-day streak");
assert.equal(bodyAreaSplit(mine, 3.5, now).core, 3);

const nudges = computeNudges(seed, now);
const balance = nudges.find((n) => n.ruleId === "balance-area");
assert.ok(balance, "balance nudge fires");
assert.equal(balance.message, "Your core is on fire 🔥 try legs next");
assert.equal(seed.classes.find((c) => c.id === balance.cta.classId)?.bodyArea, "lower", "CTA is a legs class");

for (const id of ["consistency-streak-risk", "balance-rest", "balance-new", "progression-weights", "recognition-milestone", "community-buddy", "community-challenge"]) {
  assert.ok(nudges.some((n) => n.ruleId === id), `${id} fires`);
}

// Admin edits flow through; disabling removes it.
const edited = computeNudges({ ...seed, nudgeRules: seed.nudgeRules.map((r) => (r.id === "balance-area" ? { ...r, message: "Swap {area} for {suggestedArea}!" } : r)) }, now);
assert.equal(edited.find((n) => n.ruleId === "balance-area")?.message, "Swap core for legs!");
const disabled = computeNudges({ ...seed, nudgeRules: seed.nudgeRules.map((r) => ({ ...r, enabled: r.id !== "balance-area" })) }, now);
assert.ok(!disabled.some((n) => n.ruleId === "balance-area"));

// Inactivity: nothing in 30 days -> Caroline's note is top priority.
const lapsed = computeNudges({ ...seed, workouts: mine.map((w) => ({ ...w, completedAt: new Date(new Date(w.completedAt).getTime() - 30 * 86_400_000).toISOString() })) }, now);
assert.equal(lapsed[0].ruleId, "consistency-21d");
assert.ok(!lapsed.some((n) => n.ruleId === "balance-area"));

console.log("nudges ok:", nudges.map((n) => `${n.ruleId} -> ${n.message}`).join("\n  "));

// Emma's usual days are stably Mon/Wed (UK), whatever the demo date.
import { ukWeekday } from "./time";
for (let i = 0; i < 7; i++) {
  const d = new Date(now.getTime() + i * 86_400_000);
  const counts = new Array(7).fill(0);
  buildSeed(d).workouts.filter((w) => w.memberId === "me").forEach((w) => counts[ukWeekday(new Date(w.completedAt))]++);
  const top2 = counts.map((n, wd) => ({ n, wd })).sort((a, b) => b.n - a.n).slice(0, 2).map((x) => x.wd).sort();
  assert.deepEqual(top2, [1, 3], `usual days Mon/Wed on ${d.toDateString()}`);
}
assert.equal(computeNudges({ ...seed, nudgeCap: 2 }, now).length, 2, "nudge cap applied");
console.log("usual days + cap ok");
