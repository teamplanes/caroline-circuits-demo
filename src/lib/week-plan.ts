// "Your upcoming week": picks real live classes (spaced out) for the visitor's focus, topping up with on-demand.
import { freeClasses, liveSchedule } from "@/data/site";
import type { Focus } from "./projection";
import { nextOccurrence } from "./time";
import type { LiveSlot } from "./types";

export type PlanItem = { date: Date; title: string; minutes: number; live: boolean };

const DAY = 86_400_000;

/** Which live classes suit each focus, best first. */
const PREF: Record<Focus, string[]> = {
  weight: ["slot-fri", "slot-mon", "slot-wed", "slot-tue"],
  strength: ["slot-mon", "slot-wed", "slot-tue", "slot-fri"],
  tone: ["slot-wed", "slot-tue", "slot-mon", "slot-fri"],
  stamina: ["slot-tue", "slot-fri", "slot-mon", "slot-wed"],
};
/** On-demand top-up when they want more sessions than there are live classes. */
const FILLER: Record<Focus, string> = {
  weight: "20-minute-strength-hiit",
  strength: "upper-body-sculpt",
  tone: "10-minute-glute",
  stamina: "10-minute-abs",
};

const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 7 - Math.abs(a - b)); // days apart, round the week

export function weekPlan(focus: Focus, perWeek: number, level: string, now = new Date(), slots: LiveSlot[] = liveSchedule): PlanItem[] {
  const n = Math.min(Math.max(perWeek, 1), 7);
  const live = slots.filter((s) => !s.prerecorded).sort((a, b) => rank(a) - rank(b));
  function rank(s: LiveSlot) {
    const i = PREF[focus].indexOf(s.id);
    return i < 0 ? 99 : i;
  }

  // Prefer a rest day between sessions; only allow back-to-back if that's the only way to fit them in.
  const picked: LiveSlot[] = [];
  for (const minGap of [2, 1]) {
    for (const s of live) {
      if (picked.length < n && !picked.includes(s) && picked.every((p) => gap(p.day, s.day) >= minGap)) picked.push(s);
    }
  }
  const items: PlanItem[] = picked.map((s) => ({ date: nextOccurrence(s, now), title: s.title, minutes: s.durationMin, live: true }));

  // Top up on the free days furthest from anything already planned (days 1..7 from now).
  const filler = freeClasses.find((c) => c.slug === FILLER[focus])!;
  while (items.length < n) {
    const used = items.map((i) => i.date.getDay());
    const options = Array.from({ length: 7 }, (_, i) => new Date(now.getTime() + (i + 1) * DAY)).filter((d) => !used.includes(d.getDay()));
    const best = options.sort((a, b) => minGap(b, used) - minGap(a, used))[0];
    items.push({ date: best, title: filler.title, minutes: filler.durationMin, live: false });
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  if (level === "Complete beginner") {
    const beginner = freeClasses.find((c) => c.slug === "beginner")!;
    items[0] = { date: items[0].date, title: beginner.title, minutes: beginner.durationMin, live: false };
  }
  return items;
}

const minGap = (d: Date, used: number[]) => (used.length ? Math.min(...used.map((u) => gap(u, d.getDay()))) : 7);

/** e.g. "Mon 10 Nov" in the viewer's timezone. */
export const planDay = (d: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(d);
/** e.g. "9:00 am" in the viewer's timezone. */
export const planTime = (d: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
