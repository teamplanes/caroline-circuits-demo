// Live slots are defined in UK time (Europe/London). These helpers turn them into real instants
// so they can be shown in the viewer's timezone, counted down to, and added to calendars.
import type { LiveSlot } from "./types";
import { liveSchedule } from "../data/site";

export const UK_TZ = "Europe/London";
const DAY = 86_400_000;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const dayName = (day: number, short = false) => (short ? DAY_NAMES[day].slice(0, 3) : DAY_NAMES[day]);

export const userTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Wall-clock parts of `date` in `timeZone`. */
function partsIn(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    y: +get("year"),
    m: +get("month") - 1,
    d: +get("day"),
    hh: +get("hour"),
    mm: +get("minute"),
    ss: +get("second"),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
  };
}

/** The instant when the UK wall clock shows y-m-d hh:mm (handles GMT/BST). */
export function ukWallTimeToDate(y: number, m: number, d: number, hh: number, mm: number): Date {
  const guess = Date.UTC(y, m, d, hh, mm);
  const p = partsIn(new Date(guess), UK_TZ);
  const offset = Date.UTC(p.y, p.m, p.d, p.hh, p.mm) - guess; // UK offset from UTC in ms
  return new Date(guess - offset);
}

/** Next start of `slot` at or after `now` (or the one in progress, if it hasn't ended). */
export function nextOccurrence(slot: LiveSlot, now: Date = new Date()): Date {
  const uk = partsIn(now, UK_TZ);
  const [hh, mm] = slot.timeUK.split(":").map(Number);
  for (let i = 0; i <= 7; i++) {
    const weekday = (uk.weekday + i) % 7;
    if (weekday !== slot.day) continue;
    const base = new Date(Date.UTC(uk.y, uk.m, uk.d) + i * DAY);
    const start = ukWallTimeToDate(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hh, mm);
    if (start.getTime() + slot.durationMin * 60_000 > now.getTime()) return start;
  }
  // Same weekday but already finished today -> next week.
  const base = new Date(Date.UTC(uk.y, uk.m, uk.d) + 7 * DAY);
  return ukWallTimeToDate(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hh, mm);
}

/** Most recent start of `slot` strictly before `now`. */
export function previousOccurrence(slot: LiveSlot, now: Date = new Date()): Date {
  const next = nextOccurrence(slot, now);
  return next.getTime() <= now.getTime() ? next : nextOccurrence(slot, new Date(now.getTime() - 7 * DAY));
}

export type NextLive = {
  slot: LiveSlot;
  start: Date;
  end: Date;
  isLive: boolean;
  msUntil: number;
  countdown: { days: number; hours: number; minutes: number; seconds: number };
};

/** The next (or currently running) live class. Pre-recorded slots are skipped. */
export function nextLiveClass(now: Date = new Date(), slots: LiveSlot[] = liveSchedule): NextLive | null {
  const live = slots.filter((s) => !s.prerecorded);
  if (!live.length) return null;
  const [best] = live
    .map((slot) => ({ slot, start: nextOccurrence(slot, now) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const end = new Date(best.start.getTime() + best.slot.durationMin * 60_000);
  const msUntil = Math.max(0, best.start.getTime() - now.getTime());
  return { ...best, end, isLive: msUntil === 0, msUntil, countdown: splitMs(msUntil) };
}

export function splitMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** e.g. "Mon 9:00 am" in the viewer's timezone (or `timeZone`). */
export function formatSlotLocal(slot: LiveSlot, now: Date = new Date(), timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(
    nextOccurrence(slot, now),
  );
}

/** Short tz label, e.g. "GMT", "BST", "EST". */
export function tzAbbrev(date: Date = new Date(), timeZone?: string): string {
  return (
    new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? ""
  );
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const pad = (n: number) => String(n).padStart(2, "0");
/** UK wall time as a floating ICS date-time, e.g. 20261111T090000 (pair with TZID / ctz Europe/London). */
const ukLocal = (d: Date) => {
  const p = partsIn(d, UK_TZ);
  return `${p.y}${pad(p.m + 1)}${pad(p.d)}T${pad(p.hh)}${pad(p.mm)}${pad(p.ss)}`;
};
const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

// Recurrence is in UK wall time so a 09:00 class stays 09:00 UK across the clock changes.
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/London",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0000",
  "TZOFFSETTO:+0100",
  "TZNAME:BST",
  "DTSTART:19700329T010000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0000",
  "TZNAME:GMT",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** Weekly recurring .ics event starting at the slot's next occurrence. */
export function buildIcs(slot: LiveSlot, now: Date = new Date()): string {
  const start = nextOccurrence(slot, now);
  const end = new Date(start.getTime() + slot.durationMin * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Caroline's Circuits//Demo//EN",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${slot.id}@carolinescircuits.demo`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART;TZID=${UK_TZ}:${ukLocal(start)}`,
    `DTEND;TZID=${UK_TZ}:${ukLocal(end)}`,
    "RRULE:FREQ=WEEKLY",
    `SUMMARY:${icsText(`${slot.title} with ${slot.instructor ?? "Caroline"} (live)`)}`,
    "DESCRIPTION:Live class on Caroline's Circuits. Recording available straight after.",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Class starts in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Browser-only: download the slot as an .ics file. */
export function downloadIcs(slot: LiveSlot) {
  const blob = new Blob([buildIcs(slot)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slot.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  document.body.append(a); // Safari/Firefox cancel clicks on detached anchors
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function googleCalendarLink(slot: LiveSlot, now: Date = new Date()): string {
  const start = nextOccurrence(slot, now);
  const end = new Date(start.getTime() + slot.durationMin * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${slot.title} with ${slot.instructor ?? "Caroline"} (live)`,
    dates: `${ukLocal(start)}/${ukLocal(end)}`,
    ctz: UK_TZ,
    details: "Live class on Caroline's Circuits. Recording available straight after.",
    recur: "RRULE:FREQ=WEEKLY",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** UK weekday (0 = Sunday) of `date`. */
export const ukWeekday = (date: Date = new Date()) => partsIn(date, UK_TZ).weekday;
