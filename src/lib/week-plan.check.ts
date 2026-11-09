// Run: npx tsx src/lib/week-plan.check.ts
import assert from "node:assert/strict";
import { weekPlan } from "./week-plan";

const now = new Date("2026-11-09T12:00:00Z"); // a Monday, after the 9am class
const days = (p: ReturnType<typeof weekPlan>) => p.map((i) => i.date.getUTCDay());
const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 7 - Math.abs(a - b));

for (const focus of ["weight", "strength", "tone", "stamina"] as const) {
  for (let n = 1; n <= 7; n++) {
    const p = weekPlan(focus, n, "Getting back into it", now);
    assert.equal(p.length, n, `${focus} x${n}`);
    assert.equal(new Set(days(p)).size, n, `${focus} x${n}: one session a day`);
    assert.ok(p.every((i, k) => k === 0 || i.date >= p[k - 1].date), "in date order");
    assert.ok(p.every((i) => i.date > now && i.date.getTime() - now.getTime() <= 8 * 86_400_000), "within the coming week");
  }
  const two = weekPlan(focus, 2, "Getting back into it", now);
  assert.ok(gap(days(two)[0], days(two)[1]) >= 2, `${focus} x2: rest day between`);
  assert.ok(two.every((i) => i.live), `${focus} x2: both live`);
}

assert.equal(weekPlan("strength", 3, "Complete beginner", now)[0].title, "Beginner", "beginners start gently");
console.log("week plan ok", weekPlan("weight", 2, "Getting back into it", now).map((i) => `${i.date.toUTCString().slice(0, 3)} ${i.title}`));
