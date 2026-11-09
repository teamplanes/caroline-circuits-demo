// Pure nudge engine. Reads the editable NudgeRule list, so admin copy edits show up in the hub.
import type { BodyArea, Challenge, ClassItem, LiveSlot, Member, Nudge, NudgeRule, Workout } from "./types";
import { previousOccurrence, ukWeekday, dayName } from "./time";

export type NudgeState = {
  classes: ClassItem[];
  workouts: Workout[];
  members: Member[];
  nudgeRules: NudgeRule[];
  challenges: Challenge[];
  liveSchedule: LiveSlot[];
  /** Admin frequency cap: max nudges returned (0 or missing = no cap). */
  nudgeCap?: number;
  me: {
    memberId: string;
    favourites: string[];
    reminders: string[];
    weights: { date: string; kg: number }[];
    buddies: string[];
    joinedChallenges: string[];
  };
};

const DAY = 86_400_000;
const STRENGTH: BodyArea[] = ["full", "upper", "lower", "core", "hiit"];

export const AREA_LABEL: Record<BodyArea, string> = {
  full: "full body",
  upper: "upper body",
  lower: "legs",
  core: "core",
  hiit: "cardio",
  yoga: "flexibility",
  mobility: "mobility",
};

// ponytail: fixed complement map, swap for "least trained area" scoring if it feels too predictable.
const COMPLEMENT: Record<BodyArea, BodyArea> = {
  core: "lower",
  upper: "lower",
  lower: "upper",
  full: "yoga",
  hiit: "yoga",
  yoga: "full",
  mobility: "full",
};

const TITLES: Record<string, string> = {
  "balance-area": "Balance your week",
  "balance-rest": "Time to recover",
  "balance-new": "Try something new",
  "consistency-missed-live": "Catch up on the live class",
  "consistency-usual-day": "Your usual workout day",
  "consistency-7d": "Welcome back",
  "consistency-21d": "A note from Caroline",
  "consistency-streak-risk": "Streak at risk",
  "progression-beginner": "Level up",
  "progression-weights": "Ready to go heavier?",
  "progression-duration": "Step it up",
  "personal-similar": "Picked for you",
  "personal-time": "Set a reminder",
  "personal-sunday": "Your week ahead",
  "recognition-milestone": "Milestone unlocked",
  "recognition-recap": "Your monthly recap",
  "community-buddy": "Your buddy is training",
  "community-challenge": "A challenge for you",
};

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Consecutive days (local time) with a workout, ending today, or yesterday if nothing yet today. */
export function computeStreak(workouts: Workout[], now: Date = new Date()): number {
  const days = new Set(workouts.map((w) => dayKey(new Date(w.completedAt))));
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return streak;
}

/** Count of workouts per body area over the last `days` days. */
export function bodyAreaSplit(workouts: Workout[], days: number, now: Date = new Date()): Record<BodyArea, number> {
  const out: Record<BodyArea, number> = { full: 0, upper: 0, lower: 0, core: 0, hiit: 0, yoga: 0, mobility: 0 };
  const since = now.getTime() - days * DAY;
  for (const w of workouts) if (new Date(w.completedAt).getTime() >= since) out[w.bodyArea]++;
  return out;
}

export function computeNudges(state: NudgeState, now: Date = new Date()): Nudge[] {
  const rules = new Map(state.nudgeRules.filter((r) => r.enabled).map((r) => [r.id, r]));
  const classById = new Map(state.classes.map((c) => [c.id, c]));
  const mine = state.workouts
    .filter((w) => w.memberId === state.me.memberId)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const done = new Set(mine.map((w) => w.classId));
  const last = mine[mine.length - 1];
  const daysSinceLast = last ? (now.getTime() - new Date(last.completedAt).getTime()) / DAY : Infinity;
  const trainedToday = !!last && dayKey(new Date(last.completedAt)) === dayKey(now);
  const out: Nudge[] = [];

  const add = (ruleId: string, priority: number, vars: Record<string, string | number>, cta: Nudge["cta"]) => {
    const rule = rules.get(ruleId);
    if (!rule) return;
    out.push({ id: `nudge-${ruleId}`, ruleId, category: rule.category, title: TITLES[ruleId] ?? rule.category, message: fill(rule.message, vars), cta, priority });
  };
  // First matching class she hasn't done yet, else any match.
  const pickClass = (pred: (c: ClassItem) => boolean) =>
    state.classes.find((c) => pred(c) && !done.has(c.id)) ?? state.classes.find(pred);
  const classCta = (c: ClassItem | undefined, label = "Start class"): Nudge["cta"] =>
    c ? { label, classId: c.id, href: `/hub/class/${c.id}` } : { label: "Browse classes", href: "/hub/library" };

  // ---- Consistency: inactivity (if inactive, nothing else matters much) ----
  if (daysSinceLast >= 21) {
    add("consistency-21d", 100, { days: Math.floor(daysSinceLast) }, classCta(pickClass((c) => c.durationMin <= 10), "Do 10 minutes"));
  } else if (daysSinceLast >= 7) {
    add("consistency-7d", 95, { days: Math.floor(daysSinceLast) }, { label: "See comeback plan", href: "/hub/library?plan=comeback" });
  }

  // ---- Consistency: missed usual live class ----
  const weekdayCounts = new Array(7).fill(0);
  mine.forEach((w) => weekdayCounts[ukWeekday(new Date(w.completedAt))]++); // UK days, to match slot.day
  const usualDays = weekdayCounts
    .map((n, d) => ({ n, d }))
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
    .map((x) => x.d);
  for (const slot of state.liveSchedule.filter((s) => !s.prerecorded && usualDays.includes(s.day))) {
    const prev = previousOccurrence(slot, now);
    const sinceSlot = now.getTime() - prev.getTime();
    const didSince = mine.some((w) => new Date(w.completedAt) >= prev);
    if (sinceSlot > slot.durationMin * 60_000 && sinceSlot < 2 * DAY && !didSince) {
      const rec = state.classes.find((c) => c.series === slot.title && c.isLive) ?? pickClass((c) => c.series === slot.title);
      add("consistency-missed-live", 80, { className: slot.title }, classCta(rec, "Watch recording"));
      break;
    }
  }

  // ---- Consistency: usual day passing with no class ----
  const todayUK = ukWeekday(now);
  if (!trainedToday && usualDays.includes(todayUK) && now.getHours() >= 15) {
    add("consistency-usual-day", 72, { day: dayName(todayUK) }, classCta(pickClass((c) => c.durationMin === 15), "Do 15 minutes"));
  }

  // ---- Consistency: streak at risk ----
  const streak = computeStreak(mine, now);
  if (streak >= 2 && !trainedToday) {
    add("consistency-streak-risk", 75, { days: streak }, classCta(pickClass((c) => c.durationMin <= 10), "Keep it going"));
  }

  // ---- Balance: last 3 on the same area ----
  const last3 = mine.slice(-3);
  if (last3.length === 3 && last3.every((w) => w.bodyArea === last3[0].bodyArea) && daysSinceLast < 7) {
    const area = last3[0].bodyArea;
    const suggested = COMPLEMENT[area];
    add(
      "balance-area",
      90, // ponytail: headline demo nudge; outranks milestones, not comeback nudges
      { area: AREA_LABEL[area], suggestedArea: AREA_LABEL[suggested] },
      classCta(pickClass((c) => c.bodyArea === suggested && c.durationMin >= 20), `Try ${AREA_LABEL[suggested]}`),
    );
  }

  // ---- Balance: 3+ strength days in a row -> yoga/mobility ----
  let strengthRun = 0;
  {
    let cursor = startOfDay(last ? new Date(last.completedAt) : now);
    const byDay = new Map<string, Workout[]>();
    mine.forEach((w) => {
      const k = dayKey(new Date(w.completedAt));
      byDay.set(k, [...(byDay.get(k) ?? []), w]);
    });
    while (byDay.get(dayKey(cursor))?.some((w) => STRENGTH.includes(w.bodyArea))) {
      strengthRun++;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }
  }
  if (strengthRun >= 3 && daysSinceLast < 2) {
    const yoga = pickClass((c) => c.bodyArea === "yoga" || c.bodyArea === "mobility");
    add("balance-rest", 65, { count: strengthRun, className: yoga?.title ?? "a yoga class" }, classCta(yoga, "Stretch it out"));
  }

  // ---- Balance: never tried kettlebells ----
  if (mine.length >= 5 && !mine.some((w) => classById.get(w.classId)?.series === "Kettlebells")) {
    add("balance-new", 40, {}, classCta(pickClass((c) => c.series === "Kettlebells" && c.durationMin <= 10), "Try it"));
  }

  // ---- Progression: finished Beginners series ----
  const beginners = state.classes.filter((c) => c.series === "Beginners");
  if (beginners.length && beginners.every((c) => done.has(c.id)) && !mine.some((w) => w.durationMin >= 30)) {
    add("progression-beginner", 68, {}, classCta(pickClass((c) => c.durationMin === 30 && c.level === "all"), "Try 30 minutes"));
  }

  // ---- Progression: same dumbbell weight for 6+ weeks ----
  const weights = [...state.me.weights].sort((a, b) => a.date.localeCompare(b.date));
  if (weights.length) {
    const kg = weights[weights.length - 1].kg;
    let firstSame = weights.length - 1;
    while (firstSame > 0 && weights[firstSame - 1].kg === kg) firstSame--;
    const weeks = Math.floor((now.getTime() - new Date(weights[firstSame].date).getTime()) / (7 * DAY));
    if (weeks >= 6) {
      add("progression-weights", 60, { kg, weeks, nextKg: kg + 1 }, { label: `Log ${kg + 1}kg`, href: "/hub/progress" });
    }
  }

  // ---- Progression: mostly short classes ----
  const recent10 = mine.slice(-10);
  if (recent10.length >= 5 && recent10.filter((w) => w.durationMin <= 15).length / recent10.length >= 0.7) {
    add("progression-duration", 55, {}, classCta(pickClass((c) => c.durationMin === 20), "Try 20 minutes"));
  }

  // ---- Personalisation: similar to a favourite ----
  const fav = state.me.favourites.map((id) => classById.get(id)).find(Boolean);
  if (fav) {
    const similar = pickClass((c) => c.series === fav.series && c.id !== fav.id && !state.me.favourites.includes(c.id));
    if (similar) add("personal-similar", 35, { className: fav.title }, classCta(similar, "Watch now"));
  }

  // ---- Personalisation: regular time of day, no reminders set ----
  if (mine.length >= 6 && state.me.reminders.length === 0) {
    const hours = mine.slice(-10).map((w) => new Date(w.completedAt).getHours());
    const mode = hours.sort((a, b) => hours.filter((h) => h === b).length - hours.filter((h) => h === a).length)[0];
    if (hours.filter((h) => Math.abs(h - mode) <= 1).length / hours.length >= 0.6) {
      const time = new Date(2000, 0, 1, mode).toLocaleTimeString("en-GB", { hour: "numeric", hour12: true });
      add("personal-time", 30, { time }, { label: "Set reminder", href: "/hub/schedule" });
    }
  }

  // ---- Personalisation: Sunday plan ----
  if (todayUK === 0) add("personal-sunday", 50, {}, { label: "See my week", href: "/hub" });

  // ---- Recognition: milestones ----
  const MILESTONES = [10, 25, 50, 100, 150, 200, 250, 500];
  if (MILESTONES.includes(mine.length) && daysSinceLast < 2) {
    add("recognition-milestone", 85, { count: mine.length }, { label: "See badges", href: "/hub/progress" });
  }

  // ---- Recognition: monthly recap (first 3 days of month) ----
  if (now.getDate() <= 3) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const count = mine.filter((w) => {
      const d = new Date(w.completedAt);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).length;
    if (count) add("recognition-recap", 45, { count }, { label: "View recap", href: "/hub/progress" });
  }

  // ---- Community: buddy trained in the last 48h ----
  const buddyW = state.workouts
    .filter((w) => state.me.buddies.includes(w.memberId) && now.getTime() - new Date(w.completedAt).getTime() < 2 * DAY)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  if (buddyW) {
    const buddy = state.members.find((m) => m.id === buddyW.memberId);
    const c = classById.get(buddyW.classId);
    if (buddy && c) add("community-buddy", 48, { buddy: buddy.name.split(" ")[0], className: c.title }, classCta(c, "Do it too"));
  }

  // ---- Community: challenge that fits a gap ----
  const split = bodyAreaSplit(mine, 14, now);
  const challenge = state.challenges.find(
    (ch) => !state.me.joinedChallenges.includes(ch.id) && new Date(ch.endsAt) > now && split[ch.bodyArea] <= 1,
  );
  if (challenge) {
    add("community-challenge", 52, { challenge: challenge.title, area: AREA_LABEL[challenge.bodyArea] }, { label: "Join challenge", href: "/hub/community" });
  }

  out.sort((a, b) => b.priority - a.priority);
  return state.nudgeCap ? out.slice(0, state.nudgeCap) : out;
}
