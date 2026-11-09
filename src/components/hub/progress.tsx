"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Flame, Plus, Timer, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { computeStreak } from "@/lib/nudges";
import { useStore } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MuscleMap } from "./muscle-map";
import { BadgeMedal, CountUp, PageHeader, Section, btnPrimary, card, didWorkoutOn, earnedBadges, longestStreak, myWorkouts, useNow } from "./bits";

const DAY = 86_400_000;

function WeightChart({ points }: { points: { date: string; kg: number }[] }) {
  const W = 600;
  const H = 200;
  const pad = 28;
  if (points.length < 2) return <p className="text-muted-foreground text-sm">Log a couple of weights to see your chart.</p>;
  const t0 = new Date(points[0].date).getTime();
  const t1 = new Date(points[points.length - 1].date).getTime() || t0 + 1;
  const maxKg = Math.max(...points.map((p) => p.kg)) + 1;
  const x = (d: string) => pad + ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - pad * 2);
  const y = (kg: number) => H - pad - (kg / maxKg) * (H - pad * 2);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.date)},${y(p.kg)}`).join(" ");
  const area = `${line} L${x(points[points.length - 1].date)},${H - pad} L${x(points[0].date)},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Dumbbell weight over time, now ${points[points.length - 1].kg}kg`}>
      <defs>
        <linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#D25BC0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#D25BC0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wline" x1="0" x2="1">
          <stop offset="0" stopColor="#9B3F8C" />
          <stop offset="1" stopColor="#D25BC0" />
        </linearGradient>
      </defs>
      {Array.from({ length: maxKg + 1 }, (_, kg) => (
        <g key={kg}>
          <line x1={pad} x2={W - pad} y1={y(kg)} y2={y(kg)} stroke="#eadfe7" strokeDasharray="4 4" />
          <text x={4} y={y(kg) + 4} fontSize="11" fill="#45484e">
            {kg}kg
          </text>
        </g>
      ))}
      <path d={area} fill="url(#wfill)" />
      <motion.path d={line} fill="none" stroke="url(#wline)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.date)} cy={y(p.kg)} r="5" fill="#fff" stroke="#9B3F8C" strokeWidth="3" />
      ))}
    </svg>
  );
}

export function ProgressView() {
  const { state, logWeight } = useStore();
  const now = useNow();
  const [kg, setKg] = useState("");

  if (!now) return <div className="h-96 animate-pulse rounded-3xl bg-plum-100/60" aria-busy="true" />;

  const mine = myWorkouts(state);
  const minutes = mine.reduce((s, w) => s + w.durationMin, 0);
  const streak = computeStreak(mine, now);
  const longest = Math.max(streak, longestStreak(mine));
  const earned = earnedBadges(state, now);
  const weights = [...state.me.weights].sort((a, b) => a.date.localeCompare(b.date));
  const current = weights[weights.length - 1]?.kg ?? 0;
  let firstSame = weights.length - 1;
  while (firstSame > 0 && weights[firstSame - 1].kg === current) firstSame--;
  const weeksSame = weights.length ? Math.floor((now.getTime() - new Date(weights[firstSame].date).getTime()) / (7 * DAY)) : 0;

  // 12-week heatmap, Monday-first columns.
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const weeks = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - (11 - w) * 7 + d)),
  );

  const months = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const count = mine.filter((w) => {
      const d = new Date(w.completedAt);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }).length;
    return { label: m.toLocaleDateString("en-GB", { month: "short" }), count };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  const stats = [
    { label: "Classes", value: mine.length, icon: Trophy },
    { label: "Minutes", value: minutes, icon: Timer },
    { label: "Day streak", value: streak, icon: Flame },
    { label: "Best streak", value: longest, icon: TrendingUp },
  ];

  function log(value: number) {
    if (!(value > 0 && value < 50)) return toast.error("Enter a weight between 0.5 and 50kg");
    logWeight(value);
    setKg("");
    toast.success(value > current ? `${value}kg logged. Look at you go! 💪` : `${value}kg logged`);
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Progress" title={<>Look how strong you&apos;re getting</>} />

      <MuscleMap />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className={cn("rounded-3xl p-5", i === 0 ? "mesh-bg grain text-white shadow-[0_16px_40px_rgb(155_63_140/0.35)]" : "glass-light")}
          >
            <span className={cn("relative z-10 grid size-10 place-items-center rounded-2xl text-white", i === 0 ? "glass" : "bg-plum-500")}>
              <Icon className="size-5" aria-hidden />
            </span>
            <CountUp value={value} className="relative z-10 mt-3 block text-4xl font-black tracking-tight tabular-nums md:text-5xl" />
            <p className={cn("relative z-10 text-sm font-semibold", i === 0 ? "text-white/70" : "text-muted-foreground")}>{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Streak history" className={card}>
          <p className="text-muted-foreground -mt-2 mb-4 text-xs">Last 12 weeks</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="img" aria-label={`${mine.filter((w) => now.getTime() - new Date(w.completedAt).getTime() < 84 * DAY).length} workouts in the last 12 weeks`}>
            <div className="text-muted-foreground grid shrink-0 grid-rows-7 gap-1.5 pr-1 text-[10px] font-bold">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="grid h-5 place-items-center">{d}</span>
              ))}
            </div>
            {weeks.map((wk, i) => (
              <div key={i} className="grid shrink-0 grid-rows-7 gap-1.5">
                {wk.map((d) => {
                  const done = didWorkoutOn(mine, d);
                  const future = d > now;
                  return (
                    <span
                      key={d.toISOString()}
                      aria-hidden
                      title={`${shortDate(d)}${done ? ": trained" : ""}`}
                      className={cn("size-5 rounded-md", future ? "bg-transparent" : done ? "bg-plum-500" : "bg-plum-50")}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Classes per month" className={card}>
          <div className="flex h-40 items-end gap-3">
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-bold tabular-nums">{m.count}</span>
                <motion.div className="w-full rounded-t-xl bg-plum-500" initial={{ height: 0 }} whileInView={{ height: `${(m.count / maxMonth) * 100}px` }} viewport={{ once: true }} transition={{ duration: 0.7 }} />
                <span className="text-muted-foreground text-[11px] font-bold">{m.label}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title={<span className="flex items-center gap-2"><Dumbbell className="size-5 text-plum-500" aria-hidden /> Dumbbell weights</span>} className={card}>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <WeightChart points={weights} />
          <div className="space-y-4">
            {weeksSame >= 6 && (
              <div className="rounded-3xl bg-plum-500 p-4 text-white">
                <p className="text-[11px] font-black tracking-widest text-white/70 uppercase">Ready to progress?</p>
                <p className="mt-1 font-bold">
                  You&apos;ve lifted {current}kg for {weeksSame} weeks. Time to try {current + 1}kg?
                </p>
                <button type="button" onClick={() => log(current + 1)} className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-white px-4 text-xs font-black text-plum-800">
                  <Plus className="size-3.5" aria-hidden /> Log {current + 1}kg
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                log(Number(kg));
              }}
              className="flex gap-2"
            >
              <label htmlFor="kg" className="sr-only">Weight in kg</label>
              <input id="kg" type="number" inputMode="decimal" step="0.5" min="0.5" max="50" value={kg} onChange={(e) => setKg(e.target.value)} placeholder={`${current || 2} kg`} className="h-11 w-full rounded-full border border-plum-100 bg-white px-4 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
              <button type="submit" className={btnPrimary}>Log</button>
            </form>
            <ul className="text-muted-foreground max-h-36 space-y-1 overflow-y-auto text-xs">
              {[...weights].reverse().map((w, i) => (
                <li key={i} className="flex justify-between">
                  <span>{shortDate(w.date)}</span>
                  <strong className="text-ink">{w.kg}kg</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className={cn(card, "flex flex-wrap justify-center gap-6 sm:justify-start")}>
          {state.badges.map((b) => (
            <BadgeMedal key={b.id} badge={b} earned={earned.has(b.id)} />
          ))}
        </div>
      </Section>
    </div>
  );
}
