"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarPlus, Compass, Play, Radio, Star } from "lucide-react";
import { toast } from "sonner";
import { hero, press } from "@/data/site";
import { avatarFor } from "@/data/mock";
import { useStore } from "@/lib/store";
import { downloadIcs, googleCalendarLink, nextLiveClass, splitMs, tzAbbrev, userTimeZone } from "@/lib/time";
import { CountUp, ctaClass, ghostCtaClass } from "./motion";

const pad = (n: number) => String(n).padStart(2, "0");

export function Hero({ onQuiz }: { onQuiz: () => void }) {
  return (
    // Pulled up under the floating glass nav so the image runs full-bleed behind it.
    <section className="grain relative -mt-[76px] overflow-hidden bg-plum-950 pt-[76px] text-white">
      <Image src={hero.image} alt="" fill priority sizes="100vw" className="object-cover object-[70%_center] opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-plum-950 via-plum-900/80 to-plum-700/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-plum-950 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pt-16 pb-16 sm:pt-24 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:pb-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            <span className="flex -space-x-2">
              {["Georgie", "Linda", "Sophia", "Catherine"].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element -- dicebear SVG avatars aren't in remotePatterns
                <img key={n} src={avatarFor(n)} alt="" className="size-6 rounded-full border-2 border-plum-800" />
              ))}
            </span>
            Trusted by thousands of women worldwide
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3.2rem,11vw,8.5rem)] leading-[0.85] font-black tracking-[-0.04em] uppercase"
          >
            Get stronger
            <br />
            at home.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl"
          >
            {hero.sub} Live with Caroline four times a week, or on demand whenever suits you.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-8 flex flex-wrap gap-3">
            <a href="#free" className={ctaClass}>
              <Play className="size-4 fill-current" aria-hidden /> Watch a free class now
            </a>
            <button type="button" onClick={onQuiz} className={ghostCtaClass}>
              <Compass className="size-4" aria-hidden /> Find your class
            </button>
          </motion.div>

          <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
            <span className="flex text-amber-300" aria-label="5 stars">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="size-4 fill-current" aria-hidden />
              ))}
            </span>
            &ldquo;{hero.quotes[1].quote}&rdquo; <span className="font-semibold text-white">{hero.quotes[1].source}</span>
          </p>
        </div>

        <div className="space-y-4">
          <NextLiveCard />
          <div className="grid grid-cols-2 gap-3">
            {hero.stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass rounded-2xl p-4"
              >
                <CountUp value={s.value} suffix={s.suffix} className="block text-3xl font-black tracking-tight sm:text-4xl" />
                <span className="text-xs font-medium text-white/70">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Floating glass countdown to the next live class, shown in the visitor's own timezone. */
function NextLiveCard() {
  const { state, hydrated } = useStore();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock starts after mount (no Date on the server)
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const next = now && hydrated ? nextLiveClass(now, state.liveSchedule) : null;
  const c = next ? splitMs(next.msUntil) : null;
  const local = next
    ? new Intl.DateTimeFormat("en-GB", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(next.start)
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
      transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, default: { delay: 0.4 } }}
      className="glass rounded-3xl p-5"
    >
      {/* Announce only what changes meaningfully, never the per-second timer. */}
      <p className="sr-only" aria-live="polite">
        {next ? (next.isLive ? `${next.slot.title} is live now` : `Next live class: ${next.slot.title}, ${local}`) : ""}
      </p>
      <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-plum-100 uppercase">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-warm-500 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-warm-500" />
        </span>
        {next?.isLive ? "Live now" : "Next live class in"}
      </div>
      {next && next.isLive ? (
        <>
          <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{next.slot.title}</p>
          <p className="mt-1 text-sm text-white/80">
            <Radio className="mr-1 inline size-3.5" aria-hidden />
            {Math.max(1, Math.ceil((next.end.getTime() - now!.getTime()) / 60_000))} minutes left with Caroline
          </p>
          <Link href="/hub" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-black text-plum-700 transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none">
            Join live <ArrowRight className="size-4" aria-hidden />
          </Link>
        </>
      ) : next && c ? (
        <>
          <p className="mt-2 font-mono text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
            {c.days > 0 && `${c.days}d `}
            {pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}
          </p>
          <p className="mt-1 text-sm text-white/80">
            <Radio className="mr-1 inline size-3.5" aria-hidden />
            <span className="font-semibold text-white">{next.slot.title}</span> · {local} {tzAbbrev(next.start)}
            <span className="block text-xs text-white/60">Your timezone: {userTimeZone().replace(/_/g, " ")}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                downloadIcs(next.slot);
                toast.success("Calendar invite downloaded", { description: "Repeats weekly, with a 15 minute reminder." });
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-plum-700 transition hover:scale-105"
            >
              <CalendarPlus className="size-3.5" aria-hidden /> Add to calendar
            </button>
            <a
              href={googleCalendarLink(next.slot, now!)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-white/30 px-3 py-2 text-xs font-bold hover:bg-white/10"
            >
              Google Calendar
            </a>
          </div>
        </>
      ) : (
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-white/10" />
      )}
    </motion.div>
  );
}

/** "As featured in": the real press logos, greyscale, in one static row. multiply drops their white backgrounds. */
export function PressMarquee() {
  return (
    <section aria-label="As featured in" className="border-b border-border bg-white px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:gap-10">
        <p className="shrink-0 text-sm font-semibold text-charcoal">As featured in</p>
        <ul className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-6 md:justify-between">
          {press
            .filter((p) => p.logo)
            .map((p) => (
              <li key={p.name}>
                <Image src={p.logo} alt={p.name} width={140} height={40} unoptimized className="h-7 w-auto object-contain opacity-70 mix-blend-multiply grayscale transition hover:opacity-100 sm:h-8" />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
