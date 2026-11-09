"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Flame, Target } from "lucide-react";
import { classesFor, MUSCLES, muscleLoad, type MuscleId, type MuscleLoad } from "@/lib/muscles";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { card, myWorkouts, useNow } from "./bits";

// ---------- Body drawing ----------
// Three views on a 160 × 430 canvas each. Front and back are drawn as the left half and mirrored across x = 80;
// the side view (facing right) is drawn whole. Layers paint in order: grey "base" shapes, then muscles on top.

type Layer = { base: string } | { muscle: MuscleId; d: string };
type View = { title: string; mirror: boolean; layers: Layer[]; detail?: string[]; widen?: number };

const HEAD = "M63,32 C63,18 70,9 80,9 C90,9 97,18 97,32 C97,44 90,55 80,56 C70,55 63,44 63,32 Z";

// Left half of a front/back figure: neck, shoulder, arm hanging with a slight gap, curved waist, hips, legs.
const BODY_HALF =
  "M80,62 L73,62 C73,68 72,72 66,75 C56,78 44,78 39,84 C34,90 33,100 33,110 C32,124 31,140 30,156 C29,170 27,190 26,206 C25,214 24,222 24,230 C22,240 25,252 29,254 C33,255 35,246 34,238 C34,232 35,226 36,220 C38,204 40,188 41,172 C42,160 44,148 45,136 C46,126 47,116 48,108 C49,124 52,140 56,156 C57,164 57,170 55,180 C49,192 43,204 42,216 C41,230 43,246 46,262 C49,280 51,296 52,312 C52,326 50,338 51,352 C52,368 56,384 58,398 C56,408 54,416 58,420 L72,420 C73,412 71,404 70,398 C71,384 73,368 73,352 C73,338 72,326 73,314 C75,296 77,276 78,258 C79,248 80,240 80,236 Z";

const DELT = "M50,79 C43,79 37,84 35,92 C33,100 33,110 35,118 C40,116 45,108 47,100 C49,93 51,86 50,79 Z";
const UPPER_ARM = "M36,122 C40,118 45,118 46,124 C46,136 44,148 42,156 C38,161 33,159 32,151 C32,141 33,131 36,122 Z";
const CALF_FRONT = "M53,330 C57,322 66,322 69,330 C70,350 68,370 65,388 C62,392 58,392 57,386 C54,368 52,348 53,330 Z";

const FRONT: View = {
  title: "Front",
  mirror: true,
  layers: [
    { base: HEAD },
    { base: BODY_HALF },
    { muscle: "shoulders", d: DELT },
    { muscle: "chest", d: "M52,84 C60,80 72,82 79,86 L79,112 C76,122 66,126 58,122 C52,118 49,110 48,102 C48,94 49,88 52,84 Z" },
    { muscle: "arms", d: UPPER_ARM },
    { muscle: "abs", d: "M70,130 C74,128 77,128 79,128 L79,200 C76,203 72,201 71,197 C70,175 69,152 70,130 Z" },
    { muscle: "obliques", d: "M55,126 C60,129 65,131 67,133 C66,156 67,178 68,196 C64,194 60,190 58,184 C58,172 57,160 55,150 C53,140 53,131 55,126 Z" },
    { muscle: "quads", d: "M48,228 C56,223 70,227 75,236 C76,258 74,282 70,302 C66,310 58,310 54,302 C49,282 46,256 48,228 Z" },
    { muscle: "calves", d: CALF_FRONT },
  ],
  detail: ["M70,150 L90,150", "M70,168 L90,168", "M71,184 L89,184"], // six-pack
};

const BACK: View = {
  title: "Back",
  mirror: true,
  layers: [
    { base: HEAD },
    { base: BODY_HALF },
    { muscle: "upperBack", d: "M80,64 L73,66 C70,72 62,78 52,82 C62,88 72,100 79,128 L80,128 Z" },
    { muscle: "upperBack", d: "M50,96 C58,104 68,116 74,134 C74,150 70,162 62,170 C58,160 56,146 54,134 C52,122 50,108 50,96 Z" },
    { muscle: "shoulders", d: DELT },
    { muscle: "arms", d: UPPER_ARM },
    { muscle: "lowerBack", d: "M71,138 L79,138 L79,194 C75,197 70,195 68,191 C68,173 68,155 71,138 Z" },
    { muscle: "glutes", d: "M52,198 C62,191 76,195 79,201 L79,240 C72,250 58,250 50,240 C46,226 47,209 52,198 Z" },
    { muscle: "hamstrings", d: "M49,252 C57,249 72,251 76,257 C76,277 74,294 71,306 C66,312 58,312 54,306 C50,288 48,268 49,252 Z" },
    { muscle: "calves", d: "M52,326 C58,318 70,320 72,332 C72,350 69,366 64,380 C60,384 56,380 55,374 C52,358 51,342 52,326 Z" },
  ],
};

const SIDE: View = {
  title: "Side",
  mirror: false,
  widen: 1.4, // drawn narrow; stretched sideways so the profile has real depth
  layers: [
    { base: "M70,32 C70,18 75,9 82,9 C90,9 95,18 95,30 C95,34 97,37 96,40 C95,42 95,46 94,50 C93,56 88,58 85,58 C80,58 71,48 70,32 Z" }, // pre-narrowed: widen stretches it
    {
      base: "M76,56 C75,64 72,72 70,80 C66,92 64,108 66,124 C68,140 71,152 72,164 C70,180 62,196 60,214 C59,232 64,246 66,262 C68,282 70,298 71,314 C68,330 66,346 68,362 C70,380 72,392 72,402 C70,412 72,420 78,420 L102,420 C102,414 94,410 86,404 C85,388 84,368 84,350 C84,334 86,322 86,312 C88,292 92,268 92,250 C92,236 92,224 90,212 C92,198 92,184 90,172 C90,160 92,150 96,140 C102,132 104,118 100,108 C96,100 92,96 90,90 C90,80 88,70 88,58 Z",
    },
    { muscle: "chest", d: "M91,96 C97,100 103,110 102,120 C100,130 96,136 91,138 C89,126 89,110 91,96 Z" },
    { muscle: "lowerBack", d: "M66,128 C70,138 72,152 72,166 C70,174 68,180 65,184 C63,168 63,148 66,128 Z" },
    { muscle: "abs", d: "M91,146 C93,156 93,170 91,182 C91,192 92,200 91,206 C88,200 87,188 87,174 C87,162 88,152 91,146 Z" },
    { muscle: "glutes", d: "M70,186 C64,196 60,208 61,222 C62,234 66,242 72,246 C76,236 78,222 78,206 C78,198 76,190 70,186 Z" },
    { muscle: "quads", d: "M81,222 C86,224 91,232 92,246 C92,266 89,288 86,306 C82,310 79,304 79,296 C78,276 78,250 81,222 Z" },
    { muscle: "hamstrings", d: "M66,252 C70,253 76,257 78,263 C78,281 76,298 73,311 C70,309 68,300 67,290 C66,276 65,263 66,252 Z" },
    { muscle: "calves", d: "M70,322 C67,334 66,348 68,362 C69,372 71,380 73,384 C76,370 78,354 78,340 C78,330 75,322 70,322 Z" },
    // Arm hangs in front of the torso, so it paints last.
    {
      base: "M72,82 C70,96 72,120 74,140 C75,152 75,160 76,168 C77,186 78,204 79,222 C78,232 79,244 83,250 C88,250 89,240 88,232 C88,214 88,196 87,176 C87,164 88,152 88,140 C89,118 90,98 88,84 C84,76 76,76 72,82 Z",
    },
    { muscle: "shoulders", d: "M72,82 C76,76 86,76 89,84 C90,94 88,104 84,110 C78,108 74,100 72,92 Z" },
    { muscle: "arms", d: "M74,114 C78,111 86,111 88,117 C88,132 87,146 86,156 C82,160 77,160 75,156 C74,142 73,127 74,114 Z" },
  ],
};

const VIEWS = [FRONT, SIDE, BACK];

// Sequential terracotta ramp, light → dark = less → more. Grey = not worked at all.
const RAMP = ["var(--color-warm-100)", "var(--color-warm-200)", "var(--color-warm-300)", "var(--color-warm-400)", "var(--color-warm-600)"];
const NONE = "#e4dee2";
const BASE = "#d9d2d7";
const heatFill = (m: MuscleLoad) => (m.sessions === 0 && m.score === 0 ? NONE : RAMP[Math.min(4, Math.floor(m.heat * 5))]);

const LABEL = Object.fromEntries(MUSCLES.map((m) => [m.id, m.label])) as Record<MuscleId, string>;

function Figure({
  view,
  x,
  load,
  active,
  onPick,
}: {
  view: View;
  x: number;
  load: Record<MuscleId, MuscleLoad>;
  active: MuscleId | null;
  onPick: (m: MuscleId | null) => void;
}) {
  const paint = (mirror: boolean) => (
    <g transform={mirror ? "translate(160 0) scale(-1 1)" : undefined}>
      {view.layers.map((l, i) =>
        "base" in l ? (
          <path key={i} d={l.base} fill={BASE} stroke="#fff" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ) : (
          <path
            key={i}
            d={l.d}
            fill={heatFill(load[l.muscle])}
            stroke={active === l.muscle ? "var(--color-ink)" : "#fff"}
            strokeWidth={active === l.muscle ? 1.75 : 1.25}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer transition-[fill] duration-500 outline-none"
            onMouseEnter={() => onPick(l.muscle)}
            onClick={() => onPick(l.muscle)}
          />
        ),
      )}
      {view.detail?.map((d) => <path key={d} d={d} stroke="#fff" strokeWidth={1.25} strokeLinecap="round" pointerEvents="none" />)}
    </g>
  );
  return (
    <g transform={`translate(${x} 0)`}>
      <g transform={view.widen ? `translate(80 0) scale(${view.widen} 1) translate(-80 0)` : undefined}>
        {paint(false)}
        {view.mirror && paint(true)}
      </g>
      <text x={80} y={446} textAnchor="middle" className="fill-charcoal text-[13px] font-semibold">
        {view.title}
      </text>
    </g>
  );
}

// ---------- Card ----------

const ago = (iso: string, now: Date) => {
  const d = Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

export function MuscleMap({ className }: { className?: string }) {
  const { state } = useStore();
  const now = useNow();
  const [days, setDays] = useState<14 | 30>(14);
  // Sticky selection: hovering picks a muscle and it stays picked, so the mouse can travel to the suggestions.
  const [active, setActive] = useState<MuscleId | null>(null);
  if (!now) return <div className={cn(card, "h-[520px] animate-pulse")} aria-busy="true" />;

  const mine = myWorkouts(state);
  const load = muscleLoad(mine, state.classes, days, now);
  const recent = new Set(mine.filter((w) => now.getTime() - new Date(w.completedAt).getTime() < days * 86_400_000).map((w) => w.classId));
  const ranked = [...MUSCLES].sort((a, b) => load[b.id].score - load[a.id].score);
  const most = ranked.slice(0, 2);
  const weak = ranked.filter((m) => load[m.id].needsWork).reverse();
  const pick = (m: MuscleId | null) => setActive(m);

  return (
    <section id="muscles" className={cn(card, "scroll-mt-24", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-ink text-lg font-extrabold tracking-tight md:text-xl">Your muscle map</h2>
          <p className="text-charcoal text-sm">Which muscles you&apos;ve worked most, and which need some love.</p>
        </div>
        <div role="group" aria-label="Time period" className="flex rounded-full bg-plum-50 p-1 text-xs font-bold">
          {([14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
              className={cn("rounded-full px-3 py-1.5 transition", days === d ? "bg-white text-ink shadow-sm" : "text-charcoal hover:text-ink")}
            >
              {d === 14 ? "2 weeks" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-center">
        <div>
          <svg viewBox="0 0 500 456" className="mx-auto w-full max-w-[560px]" role="img" aria-label="Front, side and back body map coloured by how much each muscle group has been worked">
            {VIEWS.map((v, i) => (
              <Figure key={v.title} view={v} x={i * 170} load={load} active={active} onPick={pick} />
            ))}
          </svg>
          <div className="text-charcoal mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1">
              <span className="size-3 rounded-sm" style={{ background: NONE }} /> Not worked
            </span>
            <span className="ml-2">Less</span>
            <span className="flex gap-0.5">
              {RAMP.map((c) => (
                <span key={c} className="h-3 w-5 first:rounded-l-sm last:rounded-r-sm" style={{ background: c }} />
              ))}
            </span>
            <span>More</span>
          </div>
        </div>

        {/* Info panel: what you're hovering/tapping, else the summary. Also the keyboard/screen-reader route in. */}
        <div className="min-h-[300px]" aria-live="polite">
          <AnimatePresence mode="wait">
            {active ? (
              <Detail key={active} id={active} m={load[active]} days={days} now={now} suggest={classesFor(active, state.classes, recent)} onClose={() => setActive(null)} />
            ) : (
              <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                <div>
                  <p className="text-charcoal flex items-center gap-1.5 text-xs font-bold uppercase">
                    <Flame className="size-4 text-warm-500" aria-hidden /> Most worked
                  </p>
                  <MuscleChips ids={most.map((m) => m.id)} load={load} onPick={pick} />
                </div>
                <div>
                  <p className="text-charcoal flex items-center gap-1.5 text-xs font-bold uppercase">
                    <Target className="size-4 text-plum-500" aria-hidden /> Needs more work
                  </p>
                  {weak.length ? (
                    <MuscleChips ids={weak.map((m) => m.id)} load={load} onPick={pick} />
                  ) : (
                    <p className="text-charcoal mt-2 text-sm">Nicely balanced. Keep mixing it up.</p>
                  )}
                </div>
                <p className="text-charcoal rounded-2xl bg-plum-50 p-3 text-sm">
                  Hover or tap a muscle to see how often you&apos;ve trained it{weak.length ? ", and the classes that will even things out" : ""}.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function MuscleChips({ ids, load, onPick }: { ids: MuscleId[]; load: Record<MuscleId, MuscleLoad>; onPick: (id: MuscleId) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(id)}
          className="text-ink inline-flex items-center gap-2 rounded-full border border-plum-100 bg-white px-3 py-1.5 text-sm font-semibold hover:border-plum-300 focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:outline-none"
        >
          <span className="size-2.5 rounded-full" style={{ background: heatFill(load[id]) }} />
          {LABEL[id]}
          <span className="text-charcoal text-xs tabular-nums">{load[id].sessions}</span>
        </button>
      ))}
    </div>
  );
}

function Detail({
  id,
  m,
  days,
  now,
  suggest,
  onClose,
}: {
  id: MuscleId;
  m: MuscleLoad;
  days: number;
  now: Date;
  suggest: ReturnType<typeof classesFor>;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-ink text-2xl font-black tracking-tight">{LABEL[id]}</h3>
        <button type="button" onClick={onClose} className="text-charcoal text-xs font-semibold hover:text-plum-600">
          Back to summary
        </button>
      </div>
      <p className="mt-2 text-4xl font-black tracking-tight text-ink tabular-nums">
        {m.sessions}
        <span className="text-charcoal ml-2 text-base font-semibold">
          {m.sessions === 1 ? "class" : "classes"} in the last {days === 14 ? "2 weeks" : "30 days"}
        </span>
      </p>
      <p className="text-charcoal mt-1 text-sm">{m.lastAt ? `Last worked ${ago(m.lastAt, now)}.` : "Not worked in this period."}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-plum-50" aria-hidden>
        <motion.div className="h-full rounded-full" style={{ background: heatFill(m) }} initial={{ width: 0 }} animate={{ width: `${Math.max(4, m.heat * 100)}%` }} />
      </div>

      {m.needsWork ? (
        <div className="mt-5">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-warm-50 px-2.5 py-1 text-xs font-bold text-warm-700">
            <Target className="size-3.5" aria-hidden /> Needs more work
          </p>
          <p className="text-charcoal mt-2 text-sm">Add one of these this week to balance things out:</p>
          <ul className="mt-2 space-y-2">
            {suggest.map((c) => (
              <li key={c.id}>
                <Link href={`/hub/class/${c.id}`} className="group flex items-center gap-3 rounded-2xl border border-plum-100 bg-white p-3 hover:border-plum-300">
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate text-sm font-bold">{c.title}</span>
                    <span className="text-charcoal text-xs">
                      {c.series} · {c.durationMin} min
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-plum-500 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-charcoal mt-5 rounded-2xl bg-plum-50 p-3 text-sm">
          Well worked. Give it a rest day or two before you hit it hard again.
        </p>
      )}
    </motion.div>
  );
}
