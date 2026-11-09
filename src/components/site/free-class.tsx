"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Link2, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { freeClasses, promo } from "@/data/site";
import { mmss } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Reveal, Section, SectionHeading, ctaClass } from "./motion";

const SPEED = 20; // demo: 1 real second = 20 seconds of class

/** Warm up / blocks / cool down, spread over the class length. */
function chaptersFor(min: number) {
  const total = min * 60;
  const blocks = min >= 20 ? ["Block 1: lower body", "Block 2: upper body", "Block 3: core finisher"] : ["Main set"];
  const work = total - 300;
  return [
    { label: "Warm up", atSec: 0 },
    ...blocks.map((label, i) => ({ label, atSec: 180 + Math.round((work / blocks.length) * i) })),
    { label: "Cool down", atSec: total - 120 },
  ];
}

export function FreeClass({ slug, onSelect }: { slug: string; onSelect: (slug: string) => void }) {
  const cls = freeClasses.find((c) => c.slug === slug) ?? freeClasses[0];
  const total = cls.durationMin * 60;
  const chapters = chaptersFor(cls.durationMin);
  const [sec, setSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [email, setEmail] = useState("");
  const [captured, setCaptured] = useState(false);

  // Restart whenever a different class is picked (also when the quiz picks one).
  const [lastSlug, setLastSlug] = useState(slug);
  if (lastSlug !== slug) {
    setLastSlug(slug);
    setSec(0);
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setSec((s) => Math.min(total, s + SPEED / 4)), 250);
    return () => clearInterval(t);
  }, [playing, total]);
  if (playing && sec >= total) setPlaying(false);

  const current = [...chapters].reverse().find((c) => sec >= c.atSec);
  const showCapture = sec > total * 0.25 && !captured;

  return (
    <Section id="free" className="mesh-bg grain overflow-hidden text-white">
      {/* z-10 lifts content above the grain overlay. */}
      <div className="relative z-10">
      <SectionHeading
        dark
        eyebrow="Free trial · no inbox, no card"
        title={
          <>
            Press play. Right now.
          </>
        }
        sub="Pick any class and start moving instantly. No email gate, no waiting for a link that lands in junk."
      />

      <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Reveal className="relative">
          {/* Strong colour behind the player so the glass has something to blur. */}
          {/* Glass video player mock */}
          <div className="glass relative overflow-hidden rounded-3xl">
            <div className="relative aspect-video">
              <Image src={cls.image} alt={`${cls.title} class preview`} fill sizes="(min-width:1024px) 700px, 100vw" className="object-cover" />
              <div className={`absolute inset-0 bg-plum-950/40 transition-opacity ${playing ? "opacity-0" : "opacity-100"}`} />
              {playing && (
                <span className="absolute top-4 left-4 rounded-full bg-warm-500 px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                  Playing · {current?.label}
                </span>
              )}
              <button
                type="button"
                onClick={() => (sec >= total ? (setSec(0), setPlaying(true)) : setPlaying((p) => !p))}
                aria-label={playing ? "Pause" : sec >= total ? "Replay" : "Play"}
                className={`glass absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white transition hover:scale-110 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none ${playing ? "opacity-0 hover:opacity-100 focus-visible:opacity-100" : ""}`}
              >
                {playing ? <Pause className="size-8 fill-current" /> : sec >= total ? <RotateCcw className="size-8" /> : <Play className="ml-1 size-8 fill-current" />}
              </button>
            </div>
            <div className="p-4 text-white">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-white">{cls.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(`${location.origin}/free-class/${cls.slug}`);
                      toast.success("Link copied", { description: "Anyone can open it and press play, no sign-up." });
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-white/25 px-2 py-0.5 text-[11px] font-bold text-white/85 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    <Link2 className="size-3" aria-hidden /> Share
                  </button>
                </span>
                <span className="tabular-nums">
                  {mmss(sec)} / {mmss(total)}
                </span>
              </div>
              <div
                className="relative mt-2 h-2 cursor-pointer rounded-full bg-white/15"
                role="slider"
                aria-label="Progress"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={Math.round(sec)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") setSec((s) => Math.min(total, s + 30));
                  if (e.key === "ArrowLeft") setSec((s) => Math.max(0, s - 30));
                }}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setSec(((e.clientX - r.left) / r.width) * total);
                }}
              >
                <div className="h-full rounded-full bg-warm-400" style={{ width: `${(sec / total) * 100}%` }} />
                {chapters.map((c) => (
                  <span key={c.label} className="absolute top-0 h-full w-0.5 bg-white/50" style={{ left: `${(c.atSec / total) * 100}%` }} />
                ))}
              </div>
              <ol className="mt-4 grid gap-1 sm:grid-cols-2">
                {chapters.map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={() => (setSec(c.atSec), setPlaying(true))}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition hover:bg-white/10 ${current === c ? "bg-white/15 font-bold" : "text-white/75"}`}
                    >
                      {c.label}
                      <span className="tabular-nums">{mmss(c.atSec)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <AnimatePresence>
            {showCapture && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  setCaptured(true);
                  toast.success("Sent! 2 more free classes are on their way", { description: `Plus your ${promo.percentOff}% off is saved for 7 days.` });
                }}
                className="glass-light mt-4 flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center"
              >
                <p className="flex-1 text-sm font-semibold text-ink">
                  <Gift className="mr-1 inline size-4 text-plum-500" aria-hidden /> Enjoying it? Get 2 more free classes (optional).
                </p>
                <label htmlFor="free-email" className="sr-only">
                  Email
                </label>
                <input
                  id="free-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-10 rounded-full border border-plum-200 bg-white px-4 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-plum-500"
                />
                <button className="h-10 rounded-full bg-plum-500 px-4 text-sm font-bold text-white hover:bg-plum-600">Send them</button>
              </motion.form>
            )}
          </AnimatePresence>
          {sec >= total && (
            <div className="glass mt-4 rounded-2xl p-5 text-white">
              <p className="text-xl font-black">That&rsquo;s a class done. Imagine four a week, with Caroline live.</p>
              <Link href="/checkout?plan=monthly" className={cn(ctaClass, "mt-3")}>
                Join with {promo.percentOff}% off
              </Link>
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="grid grid-cols-2 gap-3" aria-label="Free classes">
            {freeClasses.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(c.slug)}
                  aria-pressed={c.slug === cls.slug}
                  className={`group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl text-left ring-offset-2 ring-offset-plum-900 transition focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:outline-none ${c.slug === cls.slug ? "ring-3 ring-warm-400" : ""}`}
                >
                  <Image src={c.image} alt="" fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum-950/90 via-plum-950/20 to-transparent" />
                  <span className="absolute right-2 bottom-2 left-2 text-white">
                    <span className="block text-sm leading-tight font-extrabold">{c.title}</span>
                    <span className="text-[11px] text-white/75">{c.durationMin} min</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      </div>
    </Section>
  );
}
