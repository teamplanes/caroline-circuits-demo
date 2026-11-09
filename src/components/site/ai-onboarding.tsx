"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, CalendarDays, Play, Radio, RotateCcw } from "lucide-react";
import { AiBadge } from "@/components/ai/ai-badge";
import { freeClasses, plans, promo } from "@/data/site";
import { gbp } from "@/lib/format";
import { FOCI, type Focus, type Point } from "@/lib/projection";
import { planDay, planTime, weekPlan } from "@/lib/week-plan";
import { useStore } from "@/lib/store";
import type { Level } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Section, ctaClass } from "./motion";

type Answers = {
  level?: string;
  focus?: Focus;
  start?: number;
  perWeek?: number;
  notes?: string;
};
type Msg = { from: "bot" | "you"; body: ReactNode };

const LEVELS = [
  "Complete beginner",
  "Getting back into it",
  "I train regularly",
];
const LEVEL_MAP: Record<string, Level> = {
  "Complete beginner": "beginner",
  "Getting back into it": "all",
  "I train regularly": "intermediate",
};

/** Which question comes next, given what's been answered. The focus answer decides the follow-up. */
function nextQuestion(a: Answers) {
  if (!a.level)
    return {
      key: "level",
      q: "Hi, I'm Caroline's assistant. Where are you starting from?",
    } as const;
  if (!a.focus)
    return { key: "focus", q: "What do you most want to focus on?" } as const;
  if (a.start === undefined)
    return { key: "start", q: FOCI[a.focus].question } as const;
  if (!a.perWeek)
    return {
      key: "perWeek",
      q: "How many times a week could you realistically train?",
    } as const;
  if (a.notes === undefined)
    return {
      key: "notes",
      q: "Anything I should know? Injuries, a bad knee, a busy schedule. Or skip it.",
    } as const;
  return null;
}

function recommendation(a: Required<Omit<Answers, "notes">>) {
  const slug =
    a.level === "Complete beginner" ? "beginner" : FOCI[a.focus].classSlug;
  const cls = freeClasses.find((c) => c.slug === slug)!;
  const plan =
    a.level === "I train regularly" && a.perWeek >= 3 ? plans[1] : plans[0];
  return { cls, plan };
}

export function AiOnboarding({ onWatch }: { onWatch: (slug: string) => void }) {
  const [a, setA] = useState<Answers>({});
  const [log, setLog] = useState<Msg[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const { setOnboarding } = useStore();
  const scroller = useRef<HTMLDivElement>(null);
  const q = nextQuestion(a);
  const done = !q;

  // Keep the newest message in view inside the chat panel (not the page). Once done, park on the chart instead.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const result = el.querySelector<HTMLElement>("[data-result]");
    el.scrollTo({
      top: result
        ? el.scrollTop +
          result.getBoundingClientRect().top -
          el.getBoundingClientRect().top -
          16
        : el.scrollHeight,
      behavior: "smooth",
    });
  }, [log, q?.key]);

  // All answered: ask Claude for the personal note (route falls back to a template without a key).
  useEffect(() => {
    if (!done) return;
    let live = true;
    fetch("/api/ai/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a),
    })
      .then((r) => r.json())
      .then((r) => live && setNote(r.text ?? ""))
      .catch(() => live && setNote(""));
    return () => {
      live = false;
    };
  }, [done, a]);

  function answer(patch: Answers, said: string) {
    setLog((l) => [
      ...l,
      { from: "bot", body: q!.q },
      { from: "you", body: said },
    ]);
    const next = { ...a, ...patch };
    setA(next);
    setDraft("");
    if (patch.level) setOnboarding({ level: LEVEL_MAP[patch.level] });
    if (patch.focus) setOnboarding({ goals: [FOCI[patch.focus].label] });
  }

  function restart() {
    setA({});
    setLog([]);
    setNote(null);
    setDraft("");
  }

  // The follow-up input depends on the focus: a number box (weight, waist) or chips (dumbbells, plank).
  const startInput = a.focus ? FOCI[a.focus].input : null;
  const unit = a.focus ? FOCI[a.focus].unit : "";
  const num = Number(draft);
  const numValid =
    startInput?.kind === "number" &&
    draft !== "" &&
    num >= startInput.min &&
    num <= startInput.max;

  return (
    <Section id="start" className="bg-blush/60">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div className="lg:sticky lg:top-[calc(var(--demo-bar-h)+96px)]">
          <AiBadge />
          <h2 className="mt-3 text-4xl leading-[0.95] font-black tracking-tight text-ink sm:text-5xl">
            Find your starting point
          </h2>
          <p className="mt-4 text-base text-charcoal sm:text-lg">
            Five quick questions about you. See what 6 months could look like
            for you, then start your first class free, right here.
          </p>
        </div>

        <div className="flex h-[min(640px,calc(100svh-160px))] min-h-[460px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_-30px_rgb(42_15_38/0.35)] ring-1 ring-plum-100">
          <div className="flex items-center justify-between border-b border-plum-100 px-5 py-3">
            <p className="text-sm font-bold text-ink">
              Caroline&apos;s assistant
            </p>
            {log.length > 0 && (
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal hover:text-plum-600"
              >
                <RotateCcw className="size-3.5" aria-hidden /> Start again
              </button>
            )}
          </div>

          <div
            ref={scroller}
            className="flex-1 space-y-3 overflow-y-auto px-5 py-5"
            aria-live="polite"
          >
            {log.map((m, i) => (
              <Bubble key={i} from={m.from}>
                {m.body}
              </Bubble>
            ))}
            {q && (
              <Bubble key={q.key} from="bot">
                {q.q}
              </Bubble>
            )}
            {done && (
              <Result
                a={a as Required<Answers>}
                note={note}
                onWatch={onWatch}
              />
            )}
          </div>

          {q && (
            <div className="border-t border-plum-100 p-4">
              {q.key === "level" && (
                <Chips
                  options={LEVELS}
                  onPick={(o) => answer({ level: o }, o)}
                />
              )}
              {q.key === "focus" && (
                <Chips
                  options={Object.values(FOCI).map((f) => f.label)}
                  onPick={(o) =>
                    answer(
                      {
                        focus: (Object.keys(FOCI) as Focus[]).find(
                          (k) => FOCI[k].label === o,
                        ),
                      },
                      o,
                    )
                  }
                />
              )}
              {q.key === "start" && startInput?.kind === "chips" && (
                <Chips
                  options={startInput.options.map(([l]) => l)}
                  onPick={(o) =>
                    answer(
                      { start: startInput.options.find(([l]) => l === o)![1] },
                      o,
                    )
                  }
                />
              )}
              {q.key === "perWeek" && (
                <Chips
                  options={["2", "3", "4", "5"].map((n) => `${n} times`)}
                  onPick={(o) => answer({ perWeek: parseInt(o) }, o)}
                />
              )}
              {((q.key === "start" && startInput?.kind === "number") ||
                q.key === "notes") && (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (q.key === "start" && numValid)
                      answer({ start: num }, `${num}${unit}`);
                    if (q.key === "notes" && draft.trim())
                      answer({ notes: draft.trim() }, draft.trim());
                  }}
                >
                  <label className="sr-only" htmlFor="onboard-input">
                    {q.key === "start" && startInput?.kind === "number"
                      ? startInput.label
                      : "Anything we should know"}
                  </label>
                  <input
                    id="onboard-input"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    type={q.key === "start" ? "number" : "text"}
                    inputMode={q.key === "start" ? "decimal" : undefined}
                    min={
                      startInput?.kind === "number" ? startInput.min : undefined
                    }
                    max={
                      startInput?.kind === "number" ? startInput.max : undefined
                    }
                    maxLength={500}
                    placeholder={
                      q.key === "start" && startInput?.kind === "number"
                        ? startInput.placeholder
                        : "e.g. dodgy left knee"
                    }
                    className="h-11 min-w-0 flex-1 rounded-full border border-plum-200 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-plum-500"
                  />
                  {q.key === "start" && (
                    <span className="text-sm font-semibold text-charcoal">
                      {unit}
                    </span>
                  )}
                  {q.key === "notes" && (
                    <button
                      type="button"
                      onClick={() => answer({ notes: "" }, "Nothing to add")}
                      className="h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-charcoal hover:bg-plum-50"
                    >
                      Skip
                    </button>
                  )}
                  <button
                    type="submit"
                    aria-label="Send"
                    disabled={q.key === "start" ? !numValid : !draft.trim()}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-plum-500 text-white transition hover:bg-plum-600 disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function Bubble({
  from,
  children,
}: {
  from: "bot" | "you";
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-fit max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed",
        from === "bot"
          ? "rounded-bl-md bg-plum-50 text-ink"
          : "ml-auto rounded-br-md bg-plum-500 text-white",
      )}
    >
      {children}
    </motion.div>
  );
}

function Chips({
  options,
  onPick,
}: {
  options: readonly string[];
  onPick: (o: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className="rounded-full border border-plum-200 px-4 py-2 text-sm font-semibold text-plum-700 transition hover:border-plum-500 hover:bg-plum-50 focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:outline-none"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Result({
  a,
  note,
  onWatch,
}: {
  a: Required<Answers>;
  note: string | null;
  onWatch: (slug: string) => void;
}) {
  const f = FOCI[a.focus];
  const data = f.project(a.start, a.perWeek);
  const [big, small] = f.headline(a.start, data.at(-1)!.value);
  const rec = recommendation(a);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        data-result
        className="space-y-3"
      >
        <div className="rounded-3xl border border-plum-100 p-4">
          <p className="text-sm font-semibold text-charcoal">
            {f.metric}, next 6 months
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight text-ink">
            {big}
            <span className="ml-2 text-base font-semibold text-charcoal">
              {small}
            </span>
          </p>
          <ProjectionChart
            data={data}
            unit={f.unit}
            label={f.metric.replace(/^Your /, "")}
          />
          <p className="mt-2 text-xs leading-relaxed text-charcoal">
            {f.caveat(a.perWeek)}
          </p>
        </div>

        <Bubble from="bot">
          {note === null ? (
            <span className="animate-pulse text-charcoal">
              Writing your plan…
            </span>
          ) : (
            note ||
            "Here's the plan we've built for your upcoming week to get you started."
          )}
        </Bubble>

        <WeekPlan a={a} />

        <div className="overflow-hidden rounded-3xl border border-plum-100">
          <div className="relative aspect-[16/7]">
            <Image
              src={rec.cls.image}
              alt=""
              fill
              sizes="560px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-plum-950/85 to-transparent" />
            <p className="absolute bottom-3 left-4 text-white">
              <span className="block text-xs font-semibold text-white/80">
                Your first class, free
              </span>
              <span className="text-xl font-black">{rec.cls.title}</span>{" "}
              <span className="text-sm text-white/80">
                · {rec.cls.durationMin} min
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-charcoal">
              <span className="font-bold text-ink">
                {rec.plan.name}, {gbp(rec.plan.price)}/{rec.plan.period}
              </span>
              <br />
              {rec.plan.id === "annual"
                ? `Saves you ${gbp(rec.plan.saving ?? 0)} a year.`
                : `${promo.percentOff}% off your first month.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onWatch(rec.cls.slug)}
                className={cn(ctaClass, "px-4 py-2.5")}
              >
                <Play className="size-4 fill-current" aria-hidden /> Watch free
              </button>
              <Link
                href={`/checkout?plan=${rec.plan.id}`}
                className="inline-flex items-center rounded-full border border-plum-200 px-4 py-2.5 text-sm font-bold text-plum-700 hover:bg-plum-50"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Single-series line + area. No legend (title names it); hover shows each month; a table for screen readers. */
function ProjectionChart({
  data,
  unit,
  label,
}: {
  data: Point[];
  unit: string;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 520,
    H = 200,
    L = 40,
    R = 16,
    T = 16,
    B = 28;
  const vals = data.map((d) => d.value);
  // Clean axis: a 1/2/5 × 10ⁿ step that splits the range into ~3 gaps, then snap the ends to it.
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const raw = Math.max(0.5, (max - min) / 3);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * mag).find((v) => v >= raw)!;
  const lo = Math.floor(min / step) * step,
    hi = Math.max(Math.ceil(max / step) * step, lo + step);
  const x = (m: number) => L + (m / (data.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = data
    .map((d, i) => `${i ? "L" : "M"}${x(d.month)},${y(d.value)}`)
    .join("");
  const ticks = Array.from(
    { length: Math.round((hi - lo) / step) + 1 },
    (_, i) => Number((lo + i * step).toFixed(2)),
  );
  const last = data.at(-1)!;
  const h = hover === null ? null : data[hover];

  return (
    <figure className="relative mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={`${label} projection over 6 months, from ${data[0].value}${unit} to ${last.value}${unit}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={L}
              x2={W - R}
              y1={y(t)}
              y2={y(t)}
              className="stroke-plum-100"
              strokeWidth={1}
            />
            <text
              x={L - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-charcoal text-[11px]"
            >
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        {data.map((d) => (
          <text
            key={d.month}
            x={x(d.month)}
            y={H - 6}
            textAnchor="middle"
            className="fill-charcoal text-[11px]"
          >
            {d.month === 0 ? "Now" : `M${d.month}`}
          </text>
        ))}
        <path
          d={`${line}L${x(last.month)},${H - B}L${x(0)},${H - B}Z`}
          className="fill-warm-500/10"
        />
        <motion.path
          d={line}
          fill="none"
          className="stroke-warm-500"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {h && (
          <line
            x1={x(h.month)}
            x2={x(h.month)}
            y1={T}
            y2={H - B}
            className="stroke-plum-300"
            strokeDasharray="3 3"
          />
        )}
        <circle
          cx={x((h ?? last).month)}
          cy={y((h ?? last).value)}
          r={5}
          className="fill-warm-500 stroke-white"
          strokeWidth={2}
        />
        {!h && (
          <text
            x={x(last.month)}
            y={y(last.value) - 12}
            textAnchor="end"
            className="fill-ink text-[12px] font-bold"
          >
            {last.value}
            {unit}
          </text>
        )}
        {data.map((d, i) => (
          <rect
            key={d.month}
            x={x(d.month) - (W - L - R) / 12}
            y={0}
            width={(W - L - R) / 6}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(h.month) / W) * 100}%`, top: 0 }}
        >
          {h.month === 0 ? "Now" : `Month ${h.month}`}:{" "}
          <span className="font-bold">
            {h.value}
            {unit}
          </span>
        </div>
      )}
      <table className="sr-only">
        <caption>{label} by month</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{d.month === 0 ? "Now" : `Month ${d.month}`}</th>
              <td>
                {d.value}
                {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** The visitor's upcoming week: real live class times in their timezone, topped up with on-demand classes. */
function WeekPlan({ a }: { a: Required<Answers> }) {
  // Computed once on mount so the dates don't shift while they read.
  const [plan] = useState(() => weekPlan(a.focus, a.perWeek, a.level));
  return (
    <div className="rounded-3xl border border-plum-100 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <CalendarDays className="size-4 text-plum-500" aria-hidden /> Your
        upcoming week
      </p>
      <ol className="mt-3 divide-y divide-plum-100">
        {plan.map((i) => (
          <li
            key={i.date.toISOString()}
            className="flex items-center gap-3 py-2.5"
          >
            <span className="w-24 shrink-0 text-sm font-semibold text-charcoal">
              {planDay(i.date)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">
                {i.title}
              </span>
              <span className="text-xs text-charcoal">
                {i.minutes} min ·{" "}
                {i.live
                  ? `live at ${planTime(i.date)}, or catch up later`
                  : "on demand, any time"}
              </span>
            </span>
            {i.live && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warm-50 px-2 py-0.5 text-[11px] font-bold text-warm-700">
                <Radio className="size-3" aria-hidden /> Live
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
