"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, BookOpen, Play, Plus } from "lucide-react";
import { blogPosts, extras, faqs, freeClasses, story } from "@/data/site";
import type { BodyArea } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal, Section, SectionHeading, ctaClass } from "./motion";

export function Story() {
  return (
    <Section id="story" className="overflow-hidden">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={story.images[0]}
              alt="Caroline Idiens"
              fill
              sizes="(min-width:1024px) 520px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-plum-950/60 to-transparent" />
          </div>
          <div className="glass-light absolute -right-2 bottom-8 max-w-[260px] rounded-2xl p-4 sm:-right-8">
            <p className="font-serif text-sm text-ink italic">
              &ldquo;{story.mission}&rdquo;
            </p>
          </div>
          <div className="absolute -top-4 -left-2 rotate-[-6deg] rounded-2xl bg-ink px-4 py-3 text-white shadow-xl sm:-left-6">
            <p className="text-3xl font-black">2020</p>
            <p className="text-[11px] font-bold tracking-widest text-plum-200 uppercase">
              Founded
            </p>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="Meet Caroline"
            title={<>Strong for life, not just for summer.</>}
          />
          <Reveal>
            <p className="text-lg text-charcoal">{story.summary}</p>
            <blockquote className="mt-6 border-l-4 border-warm-400 pl-4 font-serif text-xl text-ink italic">
              {story.quote}
            </blockquote>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {story.facts.map((f, i) => (
                <li
                  key={f}
                  className="flex items-center gap-3 rounded-2xl bg-plum-50 p-4 text-sm font-bold text-ink"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-plum-500 text-xs text-white">
                    {i + 1}
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-plum-100 p-4">
              <Image
                src={extras.fitAt50.images[1]}
                alt="Fit at 50 book cover"
                width={72}
                height={90}
                className="rounded-lg object-cover"
              />
              <div className="text-sm">
                <p className="font-black text-ink">
                  <BookOpen
                    className="mr-1 inline size-4 text-plum-500"
                    aria-hidden
                  />
                  {extras.fitAt50.title}
                </p>
                <p className="text-charcoal">{extras.fitAt50.subtitle}</p>
                <a
                  href={extras.fitAt50.cta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-plum-600 underline underline-offset-4"
                >
                  {extras.fitAt50.cta.label}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

// Date-only strings parse as UTC midnight, so format in UTC too (no off-by-one or hydration mismatch).
const blogDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const HOOK: Partial<Record<BodyArea, string>> = {
  lower: "Legs hurt? Try this class",
  core: "Work on it",
  upper: "Put it into practice",
  full: "Start here",
  hiit: "Get your heart going",
};

/** Blog cards, each linked to a related free class. */
export function Blog({ onWatch }: { onWatch: (slug: string) => void }) {
  return (
    <Section id="blog">
      <SectionHeading
        eyebrow="From the blog"
        title={<>Read it. Then do it.</>}
        sub="Every article links to a class that puts it into practice."
      />
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
        {blogPosts.slice(0, 8).map((b, i) => {
          const cls =
            b.relatedBodyArea &&
            freeClasses.find((c) => c.bodyArea === b.relatedBodyArea);
          return (
            <Reveal
              key={b.id}
              delay={i * 0.04}
              className="w-[300px] shrink-0 snap-start sm:w-[340px]"
            >
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-plum-100 bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgb(155_63_140/0.45)]">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-[16/10] overflow-hidden"
                >
                  <Image
                    src={b.cover}
                    alt=""
                    fill
                    sizes="340px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </a>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold text-charcoal">
                    {blogDate(b.date)}
                  </p>
                  <h3 className="mt-1 font-extrabold leading-snug text-ink">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-plum-600"
                    >
                      {b.title}
                      <ArrowUpRight
                        className="ml-1 inline size-4"
                        aria-hidden
                      />
                    </a>
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-charcoal">
                    {b.excerpt}
                  </p>
                  {cls && (
                    <button
                      type="button"
                      onClick={() => onWatch(cls.slug)}
                      className="mt-4 flex items-center gap-2 rounded-2xl bg-blush p-2 pr-3 text-left transition hover:bg-plum-100"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={cls.image}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                        <Play
                          className="absolute inset-0 m-auto size-4 fill-white text-white"
                          aria-hidden
                        />
                      </span>
                      <span className="text-xs">
                        <span className="block font-bold text-plum-700">
                          {HOOK[b.relatedBodyArea!] ?? "Try the class"}
                        </span>
                        <span className="text-charcoal">
                          {cls.title} · {cls.durationMin} min · free
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/** Scraped FAQs, native <details> accordion with category filter. */
// The six questions visitors ask first; the rest sit behind "Show all".
const TOP_FAQS = [
  "Can I try a class for free?",
  "I'm a beginner, can I still join?",
  "What equipment do I need to get started?",
  "What time are the live classes?",
  "What's included in the membership?",
  "Can I cancel anytime?",
];

export function Faq() {
  const [all, setAll] = useState(false);
  const shown = all
    ? faqs
    : TOP_FAQS.map((q) => faqs.find((f) => f.question === q)!);
  return (
    <Section id="faq" className="bg-plum-50/60">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeading
            eyebrow="FAQ"
            title={<>Questions? Answered.</>}
            sub="Can't find it? Ask our assistant in the corner, or email hello@carolinescircuits.com."
          />
          <a href="#pricing" className={cn(ctaClass, "mt-2")}>
            See membership
          </a>
        </div>
        <div className="space-y-3">
          {shown.map((f) => (
            <details
              key={f.question}
              className="group rounded-2xl bg-white p-5 shadow-sm open:shadow-[0_10px_40px_-20px_rgb(155_63_140/0.4)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink [&::-webkit-details-marker]:hidden">
                {f.question}
                <Plus
                  className="size-5 shrink-0 text-plum-500 transition group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-charcoal">{f.answer}</p>
            </details>
          ))}
          {!all && (
            <button
              type="button"
              onClick={() => setAll(true)}
              className="pt-2 text-sm font-bold text-plum-600 underline underline-offset-4 hover:text-plum-800"
            >
              Show all {faqs.length} questions
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}
