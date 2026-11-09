// Run: npx tsx src/lib/projection.check.ts
import assert from "node:assert/strict";
import { FOCI, MONTHS, plankProjection, strengthProjection, waistProjection, weightProjection } from "./projection";

const up = (p: { value: number }[]) => p.every((x, i) => i === 0 || x.value >= p[i - 1].value);
const down = (p: { value: number }[]) => p.every((x, i) => i === 0 || x.value <= p[i - 1].value);

const s = strengthProjection(4, 3);
assert.equal(s.length, MONTHS + 1);
assert.equal(s[0].value, 4);
assert.ok(up(s), "strength never drops");
assert.ok(s[MONTHS].value >= 6 && s[MONTHS].value <= 7, `4kg at 3x/week lands ~6.5kg, got ${s[MONTHS].value}`);
assert.ok(s.every((p) => p.value % 0.5 === 0), "rounded to real dumbbell steps");
assert.ok(strengthProjection(4, 5)[MONTHS].value > s[MONTHS].value, "more sessions, more gain");

const w = weightProjection(75, 3);
assert.equal(w[0].value, 75);
assert.ok(down(w) && w[MONTHS].value < 75, "weight falls");
assert.ok(75 - w[MONTHS].value > 2 && 75 - w[MONTHS].value < 6, `sensible loss, got ${75 - w[MONTHS].value}kg`);
assert.ok(75 - weightProjection(75, 10)[MONTHS].value < 6, "capped: 10x/week is no miracle");

const waist = waistProjection(84, 3);
assert.ok(down(waist), "waist shrinks");
const cm = 84 - waist[MONTHS].value;
assert.ok(cm >= 3 && cm <= 7, `sensible waist change, got ${cm}cm`);

const plank = plankProjection(30, 3);
assert.ok(up(plank) && plank.every((p) => p.value % 5 === 0), "plank grows in 5s steps");
assert.ok(plank[MONTHS].value >= 55 && plank[MONTHS].value <= 75, `30s plank lands ~65s, got ${plank[MONTHS].value}`);

// Every focus produces a chart, a headline and a caveat that says it's an average.
for (const [k, f] of Object.entries(FOCI)) {
  const start = f.input.kind === "chips" ? f.input.options[1][1] : f.input.min + 20;
  const p = f.project(start, 3);
  assert.equal(p.length, MONTHS + 1, k);
  assert.ok(f.headline(start, p[MONTHS].value).every(Boolean), k);
  assert.match(f.caveat(3), /average/, k);
}

console.log("projection ok");
