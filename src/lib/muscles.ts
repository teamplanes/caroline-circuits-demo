// Muscle map: how hard each muscle group has been worked recently, from the member's completed classes.
// ponytail: weights are hand-set per series (what Caroline's classes actually target). Upgrade path: let the
// admin auto-tag step store per-class muscle weights and read them here instead.
import type { BodyArea, ClassItem, Workout } from "./types";

export type MuscleId =
  | "shoulders" | "chest" | "arms" | "abs" | "obliques" | "upperBack"
  | "lowerBack" | "glutes" | "quads" | "hamstrings" | "calves";

export const MUSCLES: { id: MuscleId; label: string }[] = [
  { id: "shoulders", label: "Shoulders" },
  { id: "chest", label: "Chest" },
  { id: "arms", label: "Arms" },
  { id: "abs", label: "Abs" },
  { id: "obliques", label: "Obliques" },
  { id: "upperBack", label: "Upper back" },
  { id: "lowerBack", label: "Lower back" },
  { id: "glutes", label: "Glutes" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "calves", label: "Calves" },
];

type Weights = Partial<Record<MuscleId, number>>; // 1 = main focus, 0.5 = worked, below = light

const ALL = (w: number): Weights => Object.fromEntries(MUSCLES.map((m) => [m.id, w]));
const UPPER: Weights = { shoulders: 1, arms: 1, chest: 0.8, upperBack: 0.8, abs: 0.6, obliques: 0.4 }; // press-ups, rows, presses + an abs finisher
const LEGS: Weights = { glutes: 1, quads: 1, hamstrings: 1, calves: 0.6 };
const CORE: Weights = { abs: 1, obliques: 1, lowerBack: 0.5 };
const HIIT: Weights = { quads: 0.8, glutes: 0.8, calves: 0.8, abs: 0.5, shoulders: 0.5, chest: 0.5 };
const YOGA: Weights = { lowerBack: 0.4, hamstrings: 0.4, abs: 0.3, shoulders: 0.2 };

const BY_SERIES: Record<string, Weights> = {
  "Arms & Abs": UPPER,
  "Legs & Glutes": LEGS,
  "10 Minute Series": { glutes: 1, quads: 0.6, hamstrings: 0.6 },
  "Abs Only": CORE,
  "Strength HIIT": HIIT,
  Kettlebells: { glutes: 1, hamstrings: 1, lowerBack: 0.8, shoulders: 0.8, upperBack: 0.6, abs: 0.5, quads: 0.5 },
  "Yoga with Amber": YOGA,
};
const BY_AREA: Record<BodyArea, Weights> = {
  full: ALL(0.6),
  upper: UPPER,
  lower: LEGS,
  core: CORE,
  hiit: HIIT,
  yoga: YOGA,
  mobility: YOGA,
};

/** Which muscles a class works, and how hard. Falls back to body area for classes added in admin. */
export const classMuscles = (c: Pick<ClassItem, "series" | "bodyArea">): Weights => BY_SERIES[c.series] ?? BY_AREA[c.bodyArea];

export type MuscleLoad = { score: number; sessions: number; heat: number; lastAt?: string; needsWork: boolean };

/** Per-muscle load over the last `days`. heat is 0..1 relative to the most-worked muscle. */
export function muscleLoad(workouts: Workout[], classes: ClassItem[], days = 30, now = new Date()): Record<MuscleId, MuscleLoad> {
  const byId = new Map(classes.map((c) => [c.id, c]));
  const since = now.getTime() - days * 86_400_000;
  const out = Object.fromEntries(MUSCLES.map((m) => [m.id, { score: 0, sessions: 0, heat: 0, needsWork: true }])) as Record<MuscleId, MuscleLoad>;

  for (const w of workouts) {
    if (new Date(w.completedAt).getTime() < since) continue;
    const c = byId.get(w.classId);
    const weights = c ? classMuscles(c) : BY_AREA[w.bodyArea];
    for (const [id, wt] of Object.entries(weights) as [MuscleId, number][]) {
      const m = out[id];
      m.score += wt;
      if (wt >= 0.5) m.sessions++; // only count classes that properly worked it
      if (!m.lastAt || w.completedAt > m.lastAt) m.lastAt = w.completedAt;
    }
  }
  const max = Math.max(...Object.values(out).map((m) => m.score), 1);
  for (const m of Object.values(out)) {
    m.heat = m.score / max;
    m.needsWork = m.heat < 0.5; // under half the most-worked muscle
  }
  return out;
}

/** Best classes for a muscle: strongest focus first, then ones they haven't done lately. */
export function classesFor(muscle: MuscleId, classes: ClassItem[], recentClassIds: Set<string>, n = 2): ClassItem[] {
  return classes
    .map((c) => ({ c, w: classMuscles(c)[muscle] ?? 0 }))
    .filter((x) => x.w >= 0.5)
    .sort((a, b) => b.w - a.w || Number(recentClassIds.has(a.c.id)) - Number(recentClassIds.has(b.c.id)) || b.c.publishedAt.localeCompare(a.c.publishedAt))
    .slice(0, n)
    .map((x) => x.c);
}
