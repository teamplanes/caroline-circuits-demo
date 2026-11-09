"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CalendarPlus, Check, ChevronLeft, ChevronRight, Download, PlayCircle, Radio } from "lucide-react";
import { toast } from "sonner";
import { scheduleDescriptions } from "@/data/site";
import { useStore } from "@/lib/store";
import { downloadIcs, googleCalendarLink, nextOccurrence, tzAbbrev } from "@/lib/time";
import type { LiveSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LiveCountdown } from "./dashboard";
import { PageHeader, dayKeyIn, myWorkouts, useNow } from "./bits";

const DAY = 86_400_000;

export function ScheduleView() {
  const { state, meMember, rsvp, toggleReminder } = useStore();
  const now = useNow(30_000);
  const [weekOffset, setWeekOffset] = useState(0);
  const tz = meMember.timezone;

  if (!now) return <div className="h-96 animate-pulse rounded-3xl bg-plum-100/60" aria-busy="true" />;

  const mine = myWorkouts(state);
  // Days are calendar days in the member's timezone (from onboarding), not the browser's.
  // ponytail: each day is a UTC-noon Date used only as a label/key, never as an instant.
  const [y, m, d] = dayKeyIn(now, tz).split("-").map(Number);
  const todayNoon = Date.UTC(y, m - 1, d, 12);
  const mondayNoon = todayNoon - ((new Date(todayNoon).getUTCDay() + 6) % 7) * DAY + weekOffset * 7 * DAY;
  const days = Array.from({ length: 7 }, (_, i) => new Date(mondayNoon + i * DAY));
  const keys = new Set(days.map((x) => x.toISOString().slice(0, 10)));
  const todayKey = dayKeyIn(now, tz);

  // Two occurrences per slot starting a bit before Monday covers any timezone offset; keep the ones in this week.
  const events = state.liveSchedule
    .flatMap((slot) => {
      const first = nextOccurrence(slot, new Date(mondayNoon - 2 * DAY));
      const second = nextOccurrence(slot, new Date(first.getTime() + DAY));
      return [first, second].map((start) => ({ slot, start, key: dayKeyIn(start, tz) }));
    })
    .filter((e) => keys.has(e.key))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const recordingFor = (slot: LiveSlot) =>
    state.classes.find((c) => c.series === slot.title && c.isLive) ?? state.classes.find((c) => c.series === slot.title || c.bodyArea === slot.bodyArea);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Live classes" title={<>This week</>}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold">
            Times in {tz.replace("_", " ")} ({tzAbbrev(now, tz)})
          </span>
          <button type="button" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week" className="grid size-9 place-items-center rounded-full bg-white/80 hover:bg-white focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => setWeekOffset(0)} className="h-9 rounded-full bg-white/80 px-3 text-xs font-bold hover:bg-white focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none">
            Today
          </button>
          <button type="button" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week" className="grid size-9 place-items-center rounded-full bg-white/80 hover:bg-white focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </PageHeader>

      <LiveCountdown className="rounded-[2rem] shadow-[0_24px_60px_rgb(42_15_38/0.25)]" />

      {/* Vertical day list below xl, 7 columns at xl. */}
      <div className="grid gap-3 xl:grid-cols-7">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const isToday = key === todayKey;
          const dayEvents = events.filter((e) => e.key === key);
          const label = (o: Intl.DateTimeFormatOptions) => day.toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
          return (
            <section
              key={key}
              aria-label={label({ weekday: "long", day: "numeric", month: "long" })}
              className={cn(
                "flex gap-4 rounded-3xl p-3 xl:block xl:min-h-28",
                isToday ? "border-2 border-warm-300 shadow-[0_12px_40px_rgb(155_63_140/0.18)]" : "glass-light",
                !dayEvents.length && "max-sm:hidden",
              )}
            >
              <div className="w-12 shrink-0 xl:w-auto">
                <p className={cn("text-xs font-bold uppercase", isToday ? "text-plum-600" : "text-muted-foreground")}>{label({ weekday: "short" })}</p>
                <p className={cn("text-2xl font-black", isToday ? "text-warm-600" : "text-ink")}>{day.getUTCDate()}</p>
              </div>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:mt-2 xl:grid-cols-1">
                {dayEvents.map(({ slot, start }) => {
                  const end = start.getTime() + slot.durationMin * 60_000;
                  const live = !slot.prerecorded && now.getTime() >= start.getTime() && now.getTime() < end;
                  const past = now.getTime() >= end;
                  const rec = recordingFor(slot);
                  // Only that class's recording (or the live class itself), done after it started, counts.
                  const did = !!rec && mine.some((w) => w.classId === rec.id && new Date(w.completedAt).getTime() >= start.getTime());
                  const going = state.me.rsvps.includes(slot.id);
                  const reminded = state.me.reminders.includes(slot.id);
                  return (
                    <article
                      key={`${slot.id}-${start.getTime()}`}
                      className={cn(
                        "relative overflow-hidden rounded-2xl p-3",
                        live ? "mesh-bg grain text-white shadow-[0_12px_32px_rgb(155_63_140/0.4)]" : past ? "bg-plum-50/70" : "bg-white/80",
                      )}
                    >
                      <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {live && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white uppercase shadow-[0_0_16px_rgb(239_68_68/0.7)]">
                              <Radio className="size-3 animate-pulse" aria-hidden /> Live
                            </span>
                          )}
                          {slot.prerecorded && <span className="rounded-full bg-blush px-2 py-0.5 text-[10px] font-bold text-plum-700">Pre-recorded</span>}
                          <span className={cn("text-xs font-bold tabular-nums", live ? "text-white/85" : "text-plum-700")}>
                            {start.toLocaleTimeString("en-GB", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm leading-tight font-extrabold">{slot.title}</h3>
                        <p className={cn("text-[11px]", live ? "text-white/75" : "text-muted-foreground")}>
                          {slot.instructor ?? "Caroline"} · {slot.durationMin} min
                        </p>
                        <p className={cn("mt-1 line-clamp-2 text-[11px]", live ? "text-white/75" : "text-muted-foreground")}>{scheduleDescriptions[slot.id]}</p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {live && rec && (
                            <Link href={`/hub/class/${rec.id}?live=1`} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-black text-plum-800 focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none">
                              Join now
                            </Link>
                          )}
                          {past &&
                            (did ? (
                              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-xs font-bold text-plum-700">
                                <Check className="size-3.5" aria-hidden /> Done
                              </span>
                            ) : (
                              rec && (
                                <Link href={`/hub/class/${rec.id}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-ink px-3 text-xs font-bold text-white">
                                  <PlayCircle className="size-3.5" aria-hidden /> Watch recording
                                </Link>
                              )
                            ))}
                          {!past && !live && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  rsvp(slot.id);
                                  if (!going) toast.success(`RSVP'd to ${slot.title}`);
                                }}
                                aria-pressed={going}
                                className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold", going ? "bg-plum-500 text-white" : "bg-plum-50 text-plum-800")}
                              >
                                {going && <Check className="size-3.5" aria-hidden />} {going ? "Going" : "RSVP"}
                              </button>
                              <button type="button" onClick={() => toggleReminder(slot.id)} aria-pressed={reminded} aria-label={reminded ? `Reminder on for ${slot.title}` : `Remind me about ${slot.title}`} className="grid size-8 place-items-center rounded-full bg-plum-50 text-plum-700">
                                {reminded ? <BellRing className="size-3.5" aria-hidden /> : <Bell className="size-3.5" aria-hidden />}
                              </button>
                              <button type="button" onClick={() => downloadIcs(slot)} aria-label={`Download ${slot.title} calendar file`} className="grid size-8 place-items-center rounded-full bg-plum-50 text-plum-700">
                                <Download className="size-3.5" aria-hidden />
                              </button>
                              <a href={googleCalendarLink(slot, now)} target="_blank" rel="noreferrer" aria-label={`Add ${slot.title} to Google Calendar`} className="grid size-8 place-items-center rounded-full bg-plum-50 text-plum-700">
                                <CalendarPlus className="size-3.5" aria-hidden />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!dayEvents.length && <p className="text-muted-foreground self-center text-xs">Rest day · on-demand anytime</p>}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-muted-foreground text-sm">
        Can&apos;t make it live? Every class is recorded and in your library straight after. <Link href="/hub/library" className="text-plum-700 font-bold hover:underline">Browse on-demand →</Link>
      </p>
    </div>
  );
}
