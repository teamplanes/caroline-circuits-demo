"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Quote, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { images, testimonials } from "@/data/site";
import type { Testimonial } from "@/lib/types";
import { CountUp, Reveal, Section, SectionHeading } from "./motion";

const TAGS: { id: Testimonial["tag"] | "all"; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "beginner", label: "Beginners" },
  { id: "midlife", label: "Midlife" },
  { id: "runner", label: "Runners" },
  { id: "busy", label: "Busy lives" },
  { id: "60+", label: "60+" },
];

// Testimonials with a result get a "video" poster card. ponytail: posters are class images, no real videos.
const posterFor = (i: number) => images.classes[i % images.classes.length];

export function Testimonials() {
  const [tag, setTag] = useState<(typeof TAGS)[number]["id"]>("all");
  const [video, setVideo] = useState<{ t: Testimonial; poster: string } | null>(
    null,
  );
  const [more, setMore] = useState(false);
  const matching = testimonials.filter((t) => tag === "all" || t.tag === tag);
  const list = more ? matching : matching.slice(0, 3);

  return (
    <Section id="results" className="bg-plum-50/60">
      <SectionHeading
        eyebrow="Real members, real results"
        title={<>Women like you, getting stronger.</>}
      />

      {/* Featured story: the hero moment of the section. */}
      <Reveal className="mb-10">
        <figure className="mesh-bg grain overflow-hidden rounded-[2rem] p-8 text-white sm:p-12">
          <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <Quote className="size-10 text-plum-200" aria-hidden />
              <blockquote className="mt-4 font-serif text-3xl leading-tight italic sm:text-5xl">
                &ldquo;I am so impressed how my strength has increased.&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm font-bold text-plum-100">
                Catherine, UK · midlife member
              </figcaption>
            </div>
            <div className="glass rounded-3xl p-6">
              <p className="text-xs font-bold tracking-wider text-plum-200 uppercase">
                Dumbbells
              </p>
              <p className="mt-2 flex items-baseline gap-3 text-6xl font-black tracking-tighter sm:text-7xl">
                <span className="text-white/50">3kg</span>
                <span aria-hidden className="text-3xl text-warm-400">
                  →
                </span>
                <CountUp value={4} suffix="kg" />
              </p>
              <p className="mt-2 text-sm text-white/75">
                Stronger, and recovering quicker, in her first months.
              </p>
            </div>
          </div>
        </figure>
      </Reveal>

      <div
        role="group"
        aria-label="Filter stories"
        className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2"
      >
        {TAGS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tag === t.id}
            onClick={() => (setTag(t.id), setMore(false))}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:outline-none ${tag === t.id ? "text-white" : "bg-white text-charcoal hover:bg-plum-100"}`}
          >
            {tag === t.id && (
              <motion.span
                layoutId="story-chip"
                className="absolute inset-0 rounded-full bg-plum-500"
                transition={{ type: "spring", bounce: 0.2 }}
              />
            )}
            <span className="relative">
              {t.label}
              <span className="ml-1.5 opacity-70">
                {t.id === "all"
                  ? testimonials.length
                  : testimonials.filter((x) => x.tag === t.id).length}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        <AnimatePresence initial={false} mode="popLayout">
          {list.map((t) => {
            const i = testimonials.indexOf(t);
            const poster = posterFor(i);
            return (
              <motion.figure
                key={i}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_-20px_rgb(155_63_140/0.35)]"
              >
                {t.result && (
                  <button
                    type="button"
                    onClick={() => setVideo({ t, poster })}
                    className="group relative block aspect-video w-full"
                    aria-label={`Play ${t.name}'s story`}
                  >
                    <Image
                      src={poster}
                      alt=""
                      fill
                      sizes="400px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-plum-950/80 to-transparent" />
                    <span className="glass absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white transition group-hover:scale-110">
                      <Play
                        className="ml-0.5 size-6 fill-current"
                        aria-hidden
                      />
                    </span>
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-warm-500 px-2.5 py-1 text-xs font-bold text-white">
                      <TrendingUp className="size-3.5" aria-hidden /> {t.result}
                    </span>
                  </button>
                )}
                <div className="p-6">
                  <Quote className="mb-2 size-6 text-plum-300" aria-hidden />
                  <blockquote
                    className="line-clamp-4 text-[15px] leading-relaxed text-ink"
                    title={t.quote}
                  >
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-bold text-ink">
                      {t.name}
                      {t.age ? `, ${t.age}` : ""}
                      <span className="block text-xs font-medium text-charcoal">
                        {t.location}
                      </span>
                    </span>
                    <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-bold text-plum-700 uppercase">
                      {t.tag}
                    </span>
                  </figcaption>
                </div>
              </motion.figure>
            );
          })}
        </AnimatePresence>
      </div>

      {matching.length > list.length && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setMore(true)}
            className="rounded-full border border-plum-200 bg-white px-5 py-2.5 text-sm font-bold text-plum-700 hover:bg-plum-50"
          >
            Show {matching.length - list.length} more stories
          </button>
        </div>
      )}

      <Dialog open={!!video} onOpenChange={(o) => !o && setVideo(null)}>
        <DialogContent className="overflow-hidden rounded-3xl border-0 bg-ink p-0 text-white sm:max-w-2xl">
          {video && (
            <div className="relative aspect-video">
              <Image
                src={video.poster}
                alt=""
                fill
                sizes="700px"
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 p-6">
                <DialogTitle className="text-2xl font-black">
                  {video.t.result}
                </DialogTitle>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-white/85"
                >
                  &ldquo;{video.t.quote}&rdquo;
                </motion.p>
                <p className="mt-2 text-sm font-bold text-plum-200">
                  {video.t.name}
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    className="h-full bg-warm-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 12, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
