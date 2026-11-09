"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CalendarPlus, Clock } from "lucide-react";
import { toast } from "sonner";
import { scheduleDescriptions } from "@/data/site";
import { useStore } from "@/lib/store";
import { UK_TZ, dayName, downloadIcs, googleCalendarLink, nextOccurrence, tzAbbrev, userTimeZone } from "@/lib/time";
import { Reveal, Section, SectionHeading } from "./motion";

const fmt = (d: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(d);

/** Weekly live timetable in UK time and the visitor's own timezone. */
export function Schedule() {
  // Reminders live on the demo customer, so they show up in the hub too.
  const { state, toggleReminder } = useStore();
  const [now, setNow] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- timezone + date are browser-only
  useEffect(() => setNow(new Date()), []);

  const tz = now ? userTimeZone() : UK_TZ;
  const sameAsUk = now ? tzAbbrev(now, tz) === tzAbbrev(now, UK_TZ) : true;
  const slots = [...state.liveSchedule].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));

  return (
    <Section id="schedule" className="bg-ink text-white">
      <SectionHeading
        dark
        eyebrow="Weekly timetable"
        title={
          <>
            Train live, wherever you are.
          </>
        }
        sub={
          now ? (
            <>
              Times converted for you: <strong className="text-white">{tz.replace(/_/g, " ")}</strong>
              {sameAsUk ? " (same as UK)." : `, alongside UK time.`} Missed one? Every class is recorded.
            </>
          ) : (
            "Every class is recorded, so you can train any time."
          )
        }
      />

      <div className="grid gap-3">
        {slots.map((slot, i) => {
          const start = now ? nextOccurrence(slot, now) : null;
          const on = state.me.reminders.includes(slot.id);
          return (
            <Reveal key={slot.id} delay={i * 0.05}>
              <div className="group grid items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-plum-400/60 hover:bg-white/[0.07] md:grid-cols-[120px_1fr_auto]">
                <div>
                  <p className="text-3xl font-black tracking-tight text-white transition group-hover:text-warm-300 group-focus-within:text-warm-300">
                    {dayName(slot.day, true)}
                  </p>
                  <p className="text-sm text-white/60">{slot.timeUK} UK</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold">
                    {slot.title}
                    {slot.prerecorded && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 align-middle text-[10px] font-bold tracking-wider uppercase">Pre-recorded</span>}
                  </p>
                  <p className="mt-1 text-sm text-white/65">{scheduleDescriptions[slot.id] ?? `${slot.durationMin} minutes with ${slot.instructor ?? "Caroline"}.`}</p>
                  {start && !sameAsUk && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-plum-500/25 px-3 py-1 text-xs font-bold text-plum-100">
                      <Clock className="size-3.5" aria-hidden /> Your time: {fmt(start, tz)} {tzAbbrev(start, tz)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      downloadIcs(slot);
                      toast.success(`${slot.title} added`, { description: "Weekly repeat with a 15 minute alarm (.ics)." });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-ink transition hover:scale-105"
                  >
                    <CalendarPlus className="size-3.5" aria-hidden /> .ics
                  </button>
                  {now && (
                    <a
                      href={googleCalendarLink(slot, now)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-white/25 px-3 py-2 text-xs font-bold hover:bg-white/10"
                    >
                      Google
                    </a>
                  )}
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      toggleReminder(slot.id);
                      toast(on ? "Reminder removed" : `We'll nudge you 15 min before ${slot.title}`);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${on ? "bg-warm-500 text-white" : "border border-white/25 hover:bg-white/10"}`}
                  >
                    {on ? <BellRing className="size-3.5" aria-hidden /> : <Bell className="size-3.5" aria-hidden />}
                    {on ? "Reminder on" : "Remind me"}
                  </button>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
