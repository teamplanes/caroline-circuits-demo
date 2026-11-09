"use client";

// Small shared pieces for the member hub: hooks, cards, badges and pure helpers.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { Cake, Clock, Crown, Flame, Heart, Medal, Radio, Sparkles, Target, Trophy, Zap, type LucideIcon } from "lucide-react";
import { ME_ID } from "@/data/mock";
import { AREA_LABEL, computeStreak } from "@/lib/nudges";
import { useStore, type DemoState, type Onboarding } from "@/lib/store";
import type { Badge, Challenge, ClassItem, Member, Workout } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Current time, null until mounted (cache components: no dates during prerender). */
export function useNow(tickMs = 60_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, tickMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [tickMs]);
  return now;
}

/** Animated number that counts up when it scrolls into view. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(from.current, value, {
      duration: reduce ? 0 : 1.1,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => (from.current = value),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString("en-GB")}
    </span>
  );
}

/** Calendar day of `date` in `timeZone`, as YYYY-MM-DD. */
export const dayKeyIn = (date: Date, timeZone?: string) => date.toLocaleDateString("en-CA", { timeZone });

/** Workouts that count towards a challenge: its classes (or body area), inside its dates. */
export const challengeProgress = (ch: Challenge, workouts: Workout[]) =>
  workouts.filter(
    (w) => (ch.classIds.includes(w.classId) || w.bodyArea === ch.bodyArea) && w.completedAt >= ch.startsAt && w.completedAt <= ch.endsAt,
  ).length;

export const myWorkouts = (state: DemoState): Workout[] =>
  state.workouts.filter((w) => w.memberId === ME_ID).sort((a, b) => a.completedAt.localeCompare(b.completedAt));

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function longestStreak(workouts: Workout[]) {
  const days = [...new Set(workouts.map((w) => new Date(w.completedAt).setHours(0, 0, 0, 0)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((d, i) => {
    // ponytail: 20-26h gap counts as consecutive, covers DST days.
    run = i > 0 && d - days[i - 1] <= 26 * 3_600_000 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export function didWorkoutOn(workouts: Workout[], day: Date) {
  const k = dayKey(day);
  return workouts.some((w) => dayKey(new Date(w.completedAt)) === k);
}

export function earnedBadges(state: DemoState, now: Date): Set<string> {
  const mine = myWorkouts(state);
  const longest = Math.max(longestStreak(mine), computeStreak(mine, now));
  const byId = new Map(state.classes.map((c) => [c.id, c]));
  const recentAreas = new Set(mine.filter((w) => now.getTime() - new Date(w.completedAt).getTime() < 7 * 86_400_000).map((w) => w.bodyArea));
  const joined = state.members.find((m) => m.id === ME_ID)?.joinedAt;
  const out = new Set<string>();
  for (const b of state.badges) {
    const ok =
      b.id.startsWith("streak")
        ? longest >= (b.threshold ?? Infinity)
        : b.id === "first-live"
          ? mine.some((w) => byId.get(w.classId)?.isLive)
          : b.id === "all-rounder"
            ? ["full", "upper", "lower", "core"].every((a) => recentAreas.has(a as Workout["bodyArea"]))
            : b.id === "anniversary"
              ? !!joined && now.getTime() - new Date(joined).getTime() > 365 * 86_400_000
              : mine.length >= (b.threshold ?? Infinity);
    if (ok) out.add(b.id);
  }
  return out;
}

const BADGE_ICONS: Record<string, LucideIcon> = { Sparkles, Medal, Trophy, Crown, Flame, Zap, Radio, Target, Cake };

export function BadgeMedal({ badge, earned, size = "md" }: { badge: Badge; earned: boolean; size?: "sm" | "md" }) {
  const Icon = BADGE_ICONS[badge.icon] ?? Medal;
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", size === "sm" ? "w-20" : "w-28")} title={badge.description}>
      <div
        className={cn(
          "grid place-items-center rounded-full",
          size === "sm" ? "size-14" : "size-20",
          earned
            ? "bg-plum-500 text-white"
            : "border-2 border-dashed border-plum-200 bg-white/50 text-plum-300",
        )}
      >
        <Icon className={size === "sm" ? "size-6" : "size-8"} aria-hidden />
      </div>
      <div>
        <p className={cn("text-xs leading-tight font-bold", !earned && "text-muted-foreground")}>{badge.name}</p>
        {size === "md" && <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">{earned ? badge.description : "Locked"}</p>}
      </div>
      <span className="sr-only">{earned ? "Earned" : "Not yet earned"}</span>
    </div>
  );
}

export { AiBadge } from "@/components/ai/ai-badge";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        {eyebrow && <p className="text-plum-600 mb-1 text-xs font-bold tracking-wider uppercase">{eyebrow}</p>}
        <h1 className="text-ink text-3xl font-black tracking-tight md:text-5xl">
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}

export function Section({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className={className}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-ink text-lg font-extrabold tracking-tight md:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

export const card = "rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_32px_rgb(155_63_140/0.08)] backdrop-blur-xl";

export function ClassCard({ c, progressSec, className }: { c: ClassItem; progressSec?: number; className?: string }) {
  const { state, toggleFavourite } = useStore();
  const fav = state.me.favourites.includes(c.id);
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn("group relative overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(42_15_38/0.08)]", className)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-950/80 via-plum-950/10 to-transparent" />
        <span className="glass absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
          <Clock className="size-3" aria-hidden /> {c.durationMin} min
        </span>
        <p className="absolute bottom-3 left-4 text-[11px] font-bold tracking-widest text-white/80 uppercase">{AREA_LABEL[c.bodyArea]}</p>
        {progressSec !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <div className="h-full bg-warm-500" style={{ width: `${Math.min(100, (progressSec / (c.durationMin * 60)) * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-ink line-clamp-2 text-sm leading-snug font-bold">
          <Link href={`/hub/class/${c.id}`} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-3 focus-visible:after:ring-plum-400">
            {c.title}
          </Link>
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {c.instructor} · {c.level === "all" ? "All levels" : c.level}
        </p>
      </div>
      <button
        type="button"
        onClick={() => toggleFavourite(c.id)}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${c.title} from favourites` : `Add ${c.title} to favourites`}
        className="glass absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full text-white transition hover:scale-110 focus-visible:ring-3 focus-visible:ring-warm-400 focus-visible:outline-none"
      >
        <Heart className={cn("size-4", fav && "fill-warm-400 text-warm-400")} aria-hidden />
      </button>
    </motion.article>
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none",
        active ? "border-transparent bg-ink text-white shadow-lg" : "border-plum-100 bg-white/70 text-charcoal hover:border-plum-300",
      )}
    >
      {children}
    </button>
  );
}

export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-warm-500 px-6 text-sm font-bold text-on-warm hover:bg-warm-600 shadow-[0_8px_24px_rgb(155_63_140/0.35)] transition hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-plum-200 bg-white/70 px-5 text-sm font-bold text-plum-800 transition hover:bg-white focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none disabled:opacity-50";
export const btnGlass =
  "glass inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none";

export const injuryFriendly = (c: ClassItem) => c.tags.includes("low-impact") || c.bodyArea === "yoga" || c.level === "beginner";

const hasKit = (c: ClassItem, kit: string[]) => c.equipment.every((e) => e === "Mat" || e.includes("optional") || kit.includes(e));

/** Plan tweaks the cancel-flow save offers leave on the member (as tags, so the admin sees them too). */
export const planOpts = (m: Member) => ({ maxMin: m.tags.includes("plan-10-min") ? 15 : undefined, beginners: m.tags.includes("plan-beginners") });

/** 4-week starter plan from onboarding answers. Deterministic: same answers, same plan. */
export function starterPlan(classes: ClassItem[], ob: Onboarding, opts: { maxMin?: number; beginners?: boolean } = {}) {
  const days = ob.availability.length ? ob.availability.slice(0, 4) : ["Mon", "Wed", "Fri"];
  const rotation = ["full", "lower", "upper", "core", "yoga", "hiit"] as const;
  const injured = ob.injuries.trim().length > 0;
  const maxMin = [20, 20, 30, 30];
  const pool = classes.filter((c) => hasKit(c, ob.equipment) && (!injured || injuryFriendly(c)) && (ob.level !== "beginner" || c.level !== "intermediate"));
  const beginners = classes.filter((c) => c.series === "Beginners");
  let n = 0;
  return [0, 1, 2, 3].map((week) => ({
    week: week + 1,
    focus: ["Find your feet", "Build the habit", "Add some load", "Feel the strength"][week],
    sessions: days.map((day) => {
      const area = rotation[n % rotation.length];
      const fits = (c: ClassItem) => c.durationMin <= Math.min(opts.maxMin ?? Infinity, ob.level === "beginner" && week < 2 ? 20 : maxMin[week]);
      const list = pool.filter((c) => c.bodyArea === area && fits(c));
      const pick =
        (opts.beginners && week < 2 && beginners.length ? beginners[n % beginners.length] : undefined) ??
        list[(n + week) % Math.max(1, list.length)] ?? pool.filter(fits)[n % Math.max(1, pool.filter(fits).length)] ?? classes[n % classes.length];
      n++;
      return { day, classId: pick.id };
    }),
  }));
}
