"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Check, Download, Mail, MonitorPlay, Music2 } from "lucide-react";
import { toast } from "sonner";
import { brand, images, navLinks, promo, socials } from "@/data/site";
import { usePersistentState } from "@/lib/store";

const GUIDE = [
  "Day 1: Full body sculpt, 30 min",
  "Day 2: 10 minute walk + mobility",
  "Day 3: Legs & glutes",
  "Day 4: Rest and recover",
  "Day 5: Arms & abs",
  "Day 6: Strength HIIT, 20 min",
  "Day 7: Yoga with Amber",
];

/** Newsletter signup that unlocks a free 7-day starter guide. */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = usePersistentState("site-guide-unlocked", false);

  function downloadGuide() {
    const text = `Caroline's Circuits: Your 7-day strength starter\n\n${GUIDE.join("\n")}\n\nKit: a mat, 2kg + 4kg dumbbells, a short loop band.\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "7-day-strength-starter.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="px-4 py-20">
      <div className="mesh-bg grain relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-12 text-white sm:px-12">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-wider text-plum-200 uppercase">Free guide</p>
            <h2 className="mt-2 text-4xl leading-none font-black tracking-tight sm:text-5xl">
              Your 7-day strength starter
            </h2>
            <p className="mt-3 text-white/80">A week of classes, picked by Caroline, plus weekly tips in your inbox. Unsubscribe anytime.</p>
          </div>

          {unlocked ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-6">
              <p className="flex items-center gap-2 font-bold">
                <Check className="size-5 text-plum-200" aria-hidden /> Guide unlocked
              </p>
              <ol className="mt-3 space-y-1.5 text-sm text-white/85">
                {GUIDE.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ol>
              <button type="button" onClick={downloadGuide} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-plum-700 hover:scale-105">
                <Download className="size-4" aria-hidden /> Download the guide
              </button>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUnlocked(true);
                toast.success("You're in! Your guide is unlocked.");
              }}
              className="glass rounded-3xl p-6"
            >
              <label htmlFor="news-email" className="text-sm font-bold">
                Email address
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="news-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-12 flex-1 rounded-full border border-white/30 bg-white/10 px-5 text-white placeholder:text-white/50 outline-none focus-visible:ring-2 focus-visible:ring-white"
                />
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-bold text-plum-700 transition hover:scale-105">
                  <Mail className="size-4" aria-hidden /> Get the guide
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ponytail: lucide dropped brand logos; generic icons + aria-label carry the name.
const SOCIAL_ICON: Record<string, typeof Camera> = { Instagram: Camera, YouTube: MonitorPlay, TikTok: Music2 };

export function SiteFooter() {
  return (
    <footer className="bg-ink px-4 pt-16 pb-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mesh-bg grain flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="relative z-10">
            <p className="text-3xl font-black tracking-tight sm:text-4xl">
              Your first class is on us.
            </p>
            <p className="mt-1 text-white/75">Then {promo.percentOff}% off your first month, applied automatically.</p>
          </div>
          <Link
            href="/checkout?plan=monthly"
            className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-4 font-black text-plum-700 shadow-xl transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
          >
            Start with {promo.percentOff}% off <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-12 text-[clamp(3rem,12vw,9rem)] leading-[0.85] font-black tracking-tight uppercase text-white/10 select-none" aria-hidden>
          Stay strong.
        </p>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          <div>
            <Image src={images.logo} alt={brand.name} width={150} height={40} className="h-9 w-auto brightness-0 invert" />
            <p className="mt-3 text-sm text-white/60">Online strength classes for women, founded by {brand.founder} in {brand.founded}.</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/70 hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-sm font-bold">Follow along</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {socials.map((s) => {
                const Icon = SOCIAL_ICON[s.name] ?? Camera;
                return (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.name}
                      title={s.name}
                      className="glass grid size-12 place-items-center rounded-full transition hover:scale-110 hover:bg-warm-500 focus-visible:ring-2 focus-visible:ring-warm-400 focus-visible:outline-none"
                    >
                      <Icon className="size-5" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
            <a href={`mailto:${brand.email}`} className="mt-4 block text-sm text-white/70 hover:text-white">
              {brand.email}
            </a>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
          © {brand.founded}–present {brand.name}. Demo build: content from carolinescircuits.com, data is mock.
        </p>
      </div>
    </footer>
  );
}
