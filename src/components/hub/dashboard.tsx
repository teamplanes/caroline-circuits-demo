"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bell, BellRing, CalendarPlus, Check, Download, Flame, Radio, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { AREA_LABEL, bodyAreaSplit, computeStreak } from "@/lib/nudges";
import { useStore } from "@/lib/store";
import { relativeTime } from "@/lib/format";
import { downloadIcs, googleCalendarLink, nextLiveClass, tzAbbrev } from "@/lib/time";
import type { BodyArea } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeMedal, ClassCard, CountUp, Section, btnGlass, btnPrimary, card, challengeProgress, didWorkoutOn, earnedBadges, myWorkouts, planOpts, starterPlan, useNow } from "./bits";
import { useNudges } from "./shell";

const AREAS: BodyArea[] = ["full", "upper", "lower", "core", "hiit", "yoga", "mobility"];

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function LiveCountdown({ className }: { className?: string }) {
  const { state, meMember, rsvp, toggleReminder } = useStore();
  const tz = meMember.timezone;
  const now = useNow(1000);
  const next = now ? nextLiveClass(now, state.liveSchedule) : null;
  if (!now || !next) return <div className={cn(card, "h-64 animate-pulse")} />;
  const { slot, countdown, isLive } = next;
  const going = state.me.rsvps.includes(slot.id);
  const reminded = state.me.reminders.includes(slot.id);
  const recording = state.classes.find((c) => c.series === slot.title && c.isLive);
  const local = next.start.toLocaleString("en-GB", { timeZone: tz, weekday: "long", hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className={cn("grain relative overflow-hidden rounded-3xl text-white", className)}>
      <Image src={recording?.image ?? state.classes[0].image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-plum-950/90 to-plum-800/70" />
      <div className="relative z-10 p-5 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase", isLive ? "bg-red-500" : "glass")}>
            <Radio className={cn("size-3.5", isLive && "animate-pulse")} aria-hidden /> {isLive ? "Live now" : "Next live"}
          </span>
          <span className="text-xs text-white/70">
            {local} {tzAbbrev(next.start, tz)}
          </span>
        </div>
        <h3 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{slot.title}</h3>
        <p className="text-sm text-white/75">with {slot.instructor ?? "Caroline"} · {slot.durationMin} min</p>

        {!isLive && (
          <div className="mt-5 grid grid-cols-4 gap-2" role="timer" aria-label={`Starts in ${countdown.days} days ${countdown.hours} hours ${countdown.minutes} minutes`}>
            {(
              [
                ["days", countdown.days],
                ["hrs", countdown.hours],
                ["min", countdown.minutes],
                ["sec", countdown.seconds],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="glass rounded-2xl py-2 text-center">
                <p className="text-2xl font-black tabular-nums md:text-3xl">{String(v).padStart(2, "0")}</p>
                <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {isLive ? (
            <Link href={recording ? `/hub/class/${recording.id}?live=1` : "/hub/schedule"} className={cn(btnPrimary, "bg-none bg-white text-plum-800")}>
              Join live <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                rsvp(slot.id);
                if (!going) toast.success(`You're going to ${slot.title}! We'll save you a spot.`);
              }}
              aria-pressed={going}
              className={cn(btnGlass, going && "bg-white text-plum-800 hover:bg-white")}
            >
              {going ? <Check className="size-4" aria-hidden /> : null} {going ? "Going" : "RSVP"}
            </button>
          )}
          <button type="button" onClick={() => toggleReminder(slot.id)} aria-pressed={reminded} className={btnGlass} aria-label={reminded ? "Turn off reminder" : "Remind me"}>
            {reminded ? <BellRing className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
            <span className="max-sm:sr-only">{reminded ? "Reminder on" : "Remind me"}</span>
          </button>
          <button type="button" onClick={() => downloadIcs(slot)} className={btnGlass} aria-label="Download calendar file">
            <Download className="size-4" aria-hidden />
          </button>
          <a href={googleCalendarLink(slot, now)} target="_blank" rel="noreferrer" className={btnGlass} aria-label="Add to Google Calendar">
            <CalendarPlus className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { state, meMember, joinChallenge } = useStore();
  const now = useNow();
  const [planWeek, setPlanWeek] = useState(0);
  const mine = myWorkouts(state);
  const nudges = useNudges(now);
  const classById = useMemo(() => new Map(state.classes.map((c) => [c.id, c])), [state.classes]);

  if (!now) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-plum-100/60" />
        <div className="h-72 animate-pulse rounded-3xl bg-plum-100/60" />
      </div>
    );
  }

  const first = meMember.name.split(" ")[0];
  const top = nudges[0];
  const upNextClass = top?.cta.classId ? classById.get(top.cta.classId) : undefined;
  const streak = computeStreak(mine, now);
  const split = bodyAreaSplit(mine, 30, now);
  const maxSplit = Math.max(1, ...Object.values(split));
  const earned = earnedBadges(state, now);

  // Week strip: Monday..Sunday of this week.
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));

  const thisMonth = mine.filter((w) => new Date(w.completedAt).getMonth() === now.getMonth() && new Date(w.completedAt).getFullYear() === now.getFullYear());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = mine.filter((w) => new Date(w.completedAt).getMonth() === lastMonthDate.getMonth() && new Date(w.completedAt).getFullYear() === lastMonthDate.getFullYear());
  const recapSource = thisMonth.length ? thisMonth : lastMonth;
  const recapMinutes = recapSource.reduce((s, w) => s + w.durationMin, 0);
  const topArea = AREAS.map((a) => [a, recapSource.filter((w) => w.bodyArea === a).length] as const).sort((a, b) => b[1] - a[1])[0];

  const challenge = state.challenges.find((c) => state.me.joinedChallenges.includes(c.id)) ?? state.challenges.find((c) => new Date(c.startsAt) <= now && new Date(c.endsAt) > now);
  const joined = !!challenge && state.me.joinedChallenges.includes(challenge.id);
  const challengeDone = challenge ? challengeProgress(challenge, mine) : 0;

  const buddyFeed = state.workouts
    .filter((w) => state.me.buddies.includes(w.memberId))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 4);
  const plan = starterPlan(state.classes, state.me.onboarding, planOpts(meMember));

  return (
    <div className="space-y-8 md:space-y-10">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-plum-600 text-xs font-bold tracking-wider uppercase">
          {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-ink mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          {greeting(now)}, {first}
        </h1>
      </motion.header>

      {/* Up next + streak */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mesh-bg grain relative min-h-[320px] overflow-hidden rounded-[2rem] text-white"
        >
          {upNextClass && <Image src={upNextClass.image} alt="" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover opacity-40 mix-blend-luminosity" />}
          <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-8">
            <div className="glass max-w-xl rounded-3xl p-5 md:p-6">
              <p className="text-[11px] font-black tracking-wider text-white/70 uppercase">Up next · {top?.title ?? "Pick a class"}</p>
              <h2 className="mt-2 text-2xl leading-tight font-black tracking-tight md:text-4xl">{top?.message ?? "Ready when you are."}</h2>
              {upNextClass && (
                <p className="mt-2 text-sm text-white/80">
                  {upNextClass.title} · {upNextClass.durationMin} min · {upNextClass.equipment.join(", ")}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={top?.cta.href ?? "/hub/library"} className={cn(btnPrimary, "bg-none bg-white text-plum-800 shadow-[0_8px_32px_rgb(255_255_255/0.25)]")}>
                  {top?.cta.label ?? "Browse classes"} <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="/hub/library" className={btnGlass}>
                  Something else
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn(card, "flex flex-col")}>
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="grid size-16 place-items-center rounded-2xl bg-warm-500 text-white"
            >
              <Flame className="size-8 fill-white/30" aria-hidden />
            </motion.div>
            <div>
              <CountUp value={streak} className="text-ink block text-5xl leading-none font-black tabular-nums" />
              <p className="text-muted-foreground text-sm font-semibold">day streak</p>
            </div>
          </div>
          <ol className="mt-6 grid grid-cols-7 gap-1.5" aria-label="This week">
            {week.map((d) => {
              const done = didWorkoutOn(mine, d);
              const today = d.toDateString() === now.toDateString();
              return (
                <li key={d.toISOString()} className="flex flex-col items-center gap-1.5">
                  <span className={cn("text-[11px] font-bold", today ? "text-plum-600" : "text-muted-foreground")}>{d.toLocaleDateString("en-GB", { weekday: "narrow" })}</span>
                  <span
                    className={cn(
                      "grid aspect-square w-full max-w-10 place-items-center rounded-xl text-xs font-bold",
                      done ? "bg-plum-500 text-white" : today ? "border-2 border-dashed border-plum-300 text-plum-600" : "bg-plum-50 text-charcoal/60",
                    )}
                  >
                    {done ? <Check className="size-4" aria-label="Trained" /> : d.getDate()}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            {nudges.slice(1, 4).map((n) => (
              <Link key={n.id} href={n.cta.href ?? "/hub"} className="rounded-full border border-plum-100 bg-plum-50 px-3 py-1.5 text-xs font-bold text-plum-800 transition hover:border-plum-300 hover:bg-white">
                {n.title} →
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live + body split + recap */}
      <div className="grid gap-4 lg:grid-cols-3">
        <LiveCountdown />
        <div className={card}>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold">Body balance</h2>
            <Link href="/hub/progress#muscles" className="text-xs font-bold text-plum-600 hover:underline">
              Muscle map →
            </Link>
          </div>
          <p className="text-muted-foreground mb-4 text-xs">Last 30 days</p>
          <ul className="space-y-2.5">
            {AREAS.filter((a) => a !== "mobility").map((a) => (
              <li key={a} className="grid grid-cols-[84px_1fr_20px] items-center gap-2 text-xs">
                <span className="font-semibold capitalize">{AREA_LABEL[a]}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-plum-50">
                  <motion.span
                    className="block h-full rounded-full bg-plum-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(split[a] / maxSplit) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  />
                </span>
                <span className="text-right font-bold tabular-nums">{split[a]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white">
          <p className="relative text-[11px] font-black tracking-wider text-warm-400 uppercase">
            {(thisMonth.length ? now : lastMonthDate).toLocaleDateString("en-GB", { month: "long" })} recap
          </p>
          <div className="relative mt-4 grid grid-cols-2 gap-4">
            <div>
              <CountUp value={recapSource.length} className="block text-5xl font-black tabular-nums" />
              <p className="text-xs text-white/60">classes</p>
            </div>
            <div>
              <CountUp value={recapMinutes} className="block text-5xl font-black tabular-nums" />
              <p className="text-xs text-white/60">minutes</p>
            </div>
          </div>
          <p className="relative mt-5 text-sm text-white/80">
            Most trained: <strong className="text-white capitalize">{topArea && topArea[1] ? AREA_LABEL[topArea[0]] : "—"}</strong>
          </p>
          <Link href="/hub/progress" className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-warm-400 hover:underline">
            Full progress <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {state.me.continueWatching.length > 0 && (
        <Section title="Continue watching">
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
            {state.me.continueWatching.map((cw) => {
              const c = classById.get(cw.classId);
              return c ? <ClassCard key={cw.classId} c={c} progressSec={cw.progressSec} className="w-64 shrink-0 snap-start" /> : null;
            })}
          </div>
        </Section>
      )}

      <Section
        title="Your 4-week starter plan"
        action={
          <div className="flex gap-1">
            {plan.map((w, i) => (
              <button
                key={w.week}
                type="button"
                onClick={() => setPlanWeek(i)}
                aria-pressed={planWeek === i}
                className={cn("size-8 rounded-full text-xs font-bold", planWeek === i ? "bg-ink text-white" : "bg-white/70 text-charcoal")}
              >
                {w.week}
              </button>
            ))}
          </div>
        }
      >
        <p className="text-muted-foreground mb-3 text-sm">
          Week {plan[planWeek].week}: <strong className="text-ink">{plan[planWeek].focus}</strong>
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plan[planWeek].sessions.map((s, i) => {
            const c = classById.get(s.classId);
            if (!c) return null;
            const done = mine.some((w) => w.classId === c.id);
            return (
              <Link key={i} href={`/hub/class/${c.id}`} className={cn(card, "flex items-center gap-3 p-3 transition hover:-translate-y-0.5")}>
                <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={c.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="text-plum-600 block text-[11px] font-black uppercase">{s.day}</span>
                  <span className="block truncate text-sm font-bold">{c.title}</span>
                  <span className="text-muted-foreground block text-xs">{c.durationMin} min {done && "· done ✓"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        {challenge && (
          <Section title="Challenge">
            <div className="relative overflow-hidden rounded-3xl">
              <Image src={challenge.image} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-plum-950/90 to-plum-800/40" />
              <div className="relative p-5 text-white">
                <Trophy className="size-6 text-warm-400" aria-hidden />
                <h3 className="mt-2 text-xl font-black">{challenge.title}</h3>
                <p className="text-sm text-white/75">{challenge.description}</p>
                {joined ? (
                  <>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={challengeDone} aria-valuemax={challenge.targetClasses} aria-label="Challenge progress">
                      <div className="h-full rounded-full bg-warm-400" style={{ width: `${Math.min(100, (challengeDone / challenge.targetClasses) * 100)}%` }} />
                    </div>
                    <p className="mt-2 text-sm font-bold">
                      {Math.min(challengeDone, challenge.targetClasses)} / {challenge.targetClasses} classes
                    </p>
                  </>
                ) : (
                  <button type="button" onClick={() => joinChallenge(challenge.id)} className={cn(btnGlass, "mt-4")}>
                    Join {challenge.participants.toLocaleString("en-GB")} members
                  </button>
                )}
              </div>
            </div>
          </Section>
        )}
        <Section title="Buddy activity" action={<Link href="/hub/community" className="text-plum-600 text-sm font-bold">Find buddies</Link>}>
          <ul className={cn(card, "divide-y divide-plum-100 p-0")}>
            {buddyFeed.length === 0 && <li className="text-muted-foreground p-5 text-sm">No buddy activity yet.</li>}
            {buddyFeed.map((w) => {
              const m = state.members.find((x) => x.id === w.memberId);
              const c = classById.get(w.classId);
              if (!m || !c) return null;
              return (
                <li key={w.id} className="flex items-center gap-3 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host */}
                  <img src={m.avatar} alt="" className="size-10 rounded-full bg-blush" />
                  <p className="min-w-0 flex-1 text-sm">
                    <strong>{m.name.split(" ")[0]}</strong> did <Link href={`/hub/class/${c.id}`} className="text-plum-700 font-semibold hover:underline">{c.title}</Link>
                    <span className="text-muted-foreground block text-xs">{relativeTime(w.completedAt, now)}</span>
                  </p>
                  <button type="button" onClick={() => toast.success(`High five sent to ${m.name.split(" ")[0]} 🙌`)} className="rounded-full bg-plum-50 px-3 py-1.5 text-xs font-bold text-plum-700 hover:bg-plum-100">
                    🙌
                  </button>
                </li>
              );
            })}
            {state.me.buddies.length === 0 && (
              <li className="p-4">
                <Link href="/hub/community" className="text-plum-700 flex items-center gap-2 text-sm font-bold">
                  <Users className="size-4" aria-hidden /> Get matched with a buddy
                </Link>
              </li>
            )}
          </ul>
        </Section>
      </div>

      <Section title="Milestones" action={<Link href="/hub/progress" className="text-plum-600 text-sm font-bold">All badges</Link>}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
          {[...state.badges]
            .sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)))
            .map((b) => (
              <BadgeMedal key={b.id} badge={b} earned={earned.has(b.id)} size="sm" />
            ))}
        </div>
      </Section>
    </div>
  );
}
