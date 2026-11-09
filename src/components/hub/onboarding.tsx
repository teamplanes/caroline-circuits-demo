"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Download, Play, Speaker, Tv, X } from "lucide-react";
import { toast } from "sonner";
import { images } from "@/data/site";
import { useStore } from "@/lib/store";
import { dayName, downloadIcs, formatSlotLocal, googleCalendarLink, nextLiveClass, userTimeZone } from "@/lib/time";
import type { Level } from "@/lib/types";
import { cn } from "@/lib/utils";
import { btnGlass, planOpts, starterPlan, useNow } from "./bits";

const GOALS = ["Get stronger", "Tone up", "Lose weight", "Bone health", "Manage menopause symptoms", "Feel energised", "Run faster", "Build a habit", "Improve posture"];
const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: "beginner", label: "Brand new", blurb: "New to strength training, or coming back after a long break." },
  { id: "all", label: "Getting there", blurb: "I exercise a bit and know my squat from my lunge." },
  { id: "intermediate", label: "Bring it on", blurb: "I train regularly and want to be challenged." },
];
const KIT = ["Mat", "Dumbbells", "Resistance band", "Kettlebell"];
const INJURY_CHIPS = ["Knees", "Lower back", "Shoulders", "Pelvic floor", "Wrists"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ZONES = ["Europe/London", "Europe/Dublin", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "Australia/Sydney", "Asia/Dubai", "Asia/Singapore", "Pacific/Auckland"];
const STEPS = ["Welcome", "Goals", "Level", "Kit", "Injuries", "When", "Your plan", "Calendar", "Device check"];

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none",
        on ? "border-white bg-white text-plum-800 shadow-lg" : "border-white/25 bg-white/10 text-white hover:bg-white/20",
      )}
    >
      {on && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

/** Play a short tone so members know their audio works before class. */
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

export function Onboarding({ onClose }: { onClose: () => void }) {
  const { state, meMember, setOnboarding, completeOnboarding, updateMember, toggleReminder } = useStore();
  const ob = state.me.onboarding;
  const now = useNow();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const detectedTz = now ? userTimeZone() : "Europe/London";
  const tz = meMember.timezone;
  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const plan = starterPlan(state.classes, ob, planOpts(meMember));
  const nextLive = now ? nextLiveClass(now, state.liveSchedule)?.slot : undefined;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Modal basics: focus moves in, page behind doesn't scroll.
  useEffect(() => {
    dialogRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") return finish();
    if (e.key !== "Tab") return;
    // Keep Tab inside the dialog.
    const els = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select, textarea");
    if (!els?.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  const classById = new Map(state.classes.map((c) => [c.id, c]));
  const liveSlots = state.liveSchedule.filter((s) => !s.prerecorded);

  function finish() {
    completeOnboarding();
    toast.success("You're all set, " + meMember.name.split(" ")[0] + "! Your 4-week plan is on your dashboard.");
    onClose();
  }

  const body = [
    // 0 Welcome
    <div key="welcome">
      <h2 className="text-4xl leading-[1.05] font-black tracking-tight md:text-6xl">
        Welcome, {meMember.name.split(" ")[0]}. Let&apos;s get you stronger.
      </h2>
      <p className="mt-4 max-w-lg text-white/80">A quick hello from Caroline, then six questions so we can build a plan that fits your body, kit and week.</p>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="group relative mt-6 block aspect-video w-full overflow-hidden rounded-3xl"
        aria-label={playing ? "Pause welcome video" : "Play welcome video from Caroline"}
      >
        <Image src={images.about} alt="Caroline smiling in her home studio" fill sizes="(min-width: 768px) 640px, 90vw" className="object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-plum-950/70 to-transparent" />
        <span className="glass absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition group-hover:scale-110">
          {playing ? <span className="flex gap-1.5"><span className="h-6 w-1.5 rounded bg-white" /><span className="h-6 w-1.5 rounded bg-white" /></span> : <Play className="ml-1 size-8 fill-white text-white" aria-hidden />}
        </span>
        <span className="absolute bottom-4 left-4 text-left text-sm font-bold">
          {playing ? "“Hi, I'm Caroline! I'm so glad you're here…”" : "A welcome from Caroline · 1:12"}
        </span>
        {playing && <motion.span className="absolute inset-x-0 bottom-0 h-1 origin-left bg-warm-500" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 72, ease: "linear" }} />}
      </button>
    </div>,
    // 1 Goals
    <div key="goals">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        What are you here for?
      </h2>
      <p className="mt-3 text-white/75">Pick as many as you like.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {GOALS.map((g) => (
          <Chip key={g} on={ob.goals.includes(g)} onClick={() => setOnboarding({ goals: toggleIn(ob.goals, g) })}>
            {g}
          </Chip>
        ))}
      </div>
    </div>,
    // 2 Level
    <div key="level">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        Where are you starting?
      </h2>
      <div className="mt-6 grid gap-3">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={ob.level === l.id}
            onClick={() => setOnboarding({ level: l.id })}
            className={cn(
              "rounded-3xl border p-5 text-left transition focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none",
              ob.level === l.id ? "border-white bg-white text-plum-900" : "border-white/20 bg-white/10 hover:bg-white/15",
            )}
          >
            <p className="text-lg font-extrabold">{l.label}</p>
            <p className={cn("text-sm", ob.level === l.id ? "text-plum-700" : "text-white/70")}>{l.blurb}</p>
          </button>
        ))}
      </div>
    </div>,
    // 3 Kit
    <div key="kit">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        What kit have you got?
      </h2>
      <p className="mt-3 text-white/75">No kit? No problem. Every class has a no-equipment option. Caroline suggests 2kg and 4kg dumbbells to start.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {KIT.map((k) => (
          <Chip key={k} on={ob.equipment.includes(k)} onClick={() => setOnboarding({ equipment: toggleIn(ob.equipment, k) })}>
            {k}
          </Chip>
        ))}
      </div>
    </div>,
    // 4 Injuries
    <div key="injuries">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        Anything we should look after?
      </h2>
      <p className="mt-3 text-white/75">We&apos;ll favour low-impact classes and flag modifications.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {INJURY_CHIPS.map((k) => {
          const on = ob.injuries.toLowerCase().includes(k.toLowerCase());
          return (
            <Chip
              key={k}
              on={on}
              onClick={() =>
                setOnboarding({
                  injuries: on
                    ? ob.injuries.split(", ").filter((x) => x.toLowerCase() !== k.toLowerCase()).join(", ")
                    : [ob.injuries, k].filter(Boolean).join(", "),
                })
              }
            >
              {k}
            </Chip>
          );
        })}
      </div>
      <label htmlFor="ob-injuries" className="mt-6 block text-sm font-bold">
        Anything else? (optional)
      </label>
      <textarea
        id="ob-injuries"
        value={ob.injuries}
        onChange={(e) => setOnboarding({ injuries: e.target.value })}
        rows={3}
        placeholder="e.g. recovering from a knee op, 6 months postnatal"
        className="mt-2 w-full rounded-2xl border border-white/25 bg-white/10 p-4 text-white placeholder:text-white/50 focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none"
      />
    </div>,
    // 5 Availability + timezone
    <div key="when">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        When can you train?
      </h2>
      <p className="mt-3 text-white/75">Pick 2 to 4 days. Live classes are recorded, so any time works.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <Chip key={d} on={ob.availability.includes(d)} onClick={() => setOnboarding({ availability: DAYS.filter((x) => (x === d ? !ob.availability.includes(d) : ob.availability.includes(x))) })}>
            {d}
          </Chip>
        ))}
      </div>
      <label htmlFor="ob-tz" className="mt-8 block text-sm font-bold">
        Your timezone
      </label>
      <select
        id="ob-tz"
        value={tz}
        onChange={(e) => updateMember(meMember.id, { timezone: e.target.value })}
        className="mt-2 h-12 w-full rounded-2xl border border-white/25 bg-white/10 px-4 font-semibold text-white focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none [&>option]:text-ink"
      >
        {[...new Set([detectedTz, ...ZONES])].map((z) => (
          <option key={z} value={z}>
            {z.replace("_", " ")}
            {z === detectedTz ? " (detected)" : ""}
          </option>
        ))}
      </select>
      {now && nextLive && (
        <p className="mt-3 text-sm text-white/75">
          Next live class for you: <strong className="text-white">{nextLive.title}, {formatSlotLocal(nextLive, now, tz)}</strong> your time.
        </p>
      )}
    </div>,
    // 6 Plan
    <div key="plan">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        Your 4-week starter plan
      </h2>
      <p className="mt-3 text-white/75">
        Built for <strong className="text-white">{ob.goals.slice(0, 2).join(" & ").toLowerCase() || "getting stronger"}</strong>, {ob.availability.length || 3} days a week
        {ob.injuries ? ", low-impact friendly" : ""}.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {plan.map((w) => (
          <div key={w.week} className="glass rounded-3xl p-4">
            <p className="text-[11px] font-bold tracking-widest text-white/60 uppercase">Week {w.week}</p>
            <p className="mb-2 font-extrabold">{w.focus}</p>
            <ul className="space-y-1.5 text-sm">
              {w.sessions.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-9 shrink-0 font-bold text-warm-400">{s.day}</span>
                  <span className="truncate text-white/85">{classById.get(s.classId)?.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>,
    // 7 Calendar
    <div key="calendar">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        Put it in your calendar
      </h2>
      <p className="mt-3 text-white/75">Members who add classes to their calendar train twice as often. Times shown in {tz.replace("_", " ")}.</p>
      <ul className="mt-6 space-y-2">
        {liveSlots.map((s) => {
          const reminded = state.me.reminders.includes(s.id);
          return (
            <li key={s.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3 pl-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.title}</p>
                <p className="text-xs text-white/70">{now ? formatSlotLocal(s, now, tz) : dayName(s.day)} · {s.durationMin} min</p>
              </div>
              <button type="button" onClick={() => downloadIcs(s)} className="glass grid size-10 place-items-center rounded-full" aria-label={`Download ${s.title} calendar file`}>
                <Download className="size-4" aria-hidden />
              </button>
              <a href={now ? googleCalendarLink(s, now) : "#"} target="_blank" rel="noreferrer" className="glass grid size-10 place-items-center rounded-full" aria-label={`Add ${s.title} to Google Calendar`}>
                <CalendarPlus className="size-4" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => toggleReminder(s.id)}
                aria-pressed={reminded}
                className={cn("h-10 rounded-full px-4 text-xs font-bold", reminded ? "bg-white text-plum-800" : "glass")}
              >
                {reminded ? "Reminder on" : "Remind me"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>,
    // 8 Device check
    <div key="device">
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">
        Quick device check
      </h2>
      <p className="mt-3 text-white/75">Make sure you can hear Caroline over the music.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <Speaker className="mb-3 size-6" aria-hidden />
          <p className="font-extrabold">Sound</p>
          <p className="mb-4 text-sm text-white/70">Play a test tone, turn it up!</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={beep} className={btnGlass}>
              <Play className="size-4" aria-hidden /> Play tone
            </button>
            <button type="button" onClick={() => setHeard(true)} aria-pressed={heard} className={cn(btnGlass, heard && "bg-white text-plum-800 hover:bg-white")}>
              {heard ? <Check className="size-4" aria-hidden /> : null} I heard it
            </button>
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <Tv className="mb-3 size-6" aria-hidden />
          <p className="font-extrabold">Big screen</p>
          <p className="mb-4 text-sm text-white/70">Cast to your TV with AirPlay or Chromecast from the class player.</p>
          <button type="button" onClick={() => toast.success("Found “Living room TV”. You're good to go.")} className={btnGlass}>
            Test casting
          </button>
        </div>
      </div>
    </div>,
  ];

  const last = step === STEPS.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="mesh-bg grain fixed inset-x-0 top-[var(--demo-bar-h)] bottom-0 z-[95] overflow-y-auto text-white outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Caroline's Circuits"
    >
      <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6 md:py-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-white" : "bg-white/20")} />
            ))}
          </div>
          <button type="button" onClick={finish} className="flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white">
            Skip <X className="size-4" aria-hidden />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="flex-1">
            {body[step]}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className={cn(btnGlass, "disabled:opacity-0")}>
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
          <button
            type="button"
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-black text-plum-800 shadow-[0_8px_32px_rgb(255_255_255/0.3)] transition hover:scale-105 focus-visible:ring-3 focus-visible:ring-warm-400 focus-visible:outline-none"
          >
            {step === 0 ? "Let's go" : last ? "Start training" : "Next"} <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
