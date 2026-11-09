"use client";

import Image from "next/image";
import { Download, Globe2, PauseCircle, Radio, Users, Video } from "lucide-react";
import { images, onDemandSeries } from "@/data/site";
import { groups } from "@/data/mock";
import { num } from "@/lib/format";
import { CountUp, Reveal, Section, SectionHeading } from "./motion";

const tile = "group relative overflow-hidden rounded-3xl p-6 transition duration-500 hover:-translate-y-1";

/** Bento grid: what membership includes. */
export function Included() {
  const community = groups.reduce((n, g) => n + g.members, 0);
  return (
    <Section id="classes">
      <SectionHeading
        eyebrow="What's included"
        title={
          <>
            Everything you need. Nothing you don&rsquo;t.
          </>
        }
        sub="One membership, every class. 30 minute strength workouts for all levels, with minimal kit."
      />

      <div className="grid auto-rows-[minmax(180px,auto)] gap-4 md:grid-cols-4">
        <Reveal className="md:col-span-2 md:row-span-2">
          <div className={`${tile} grain mesh-bg flex h-full min-h-[360px] flex-col justify-end text-white`}>
            <Image src={images.onlineClasses} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover opacity-40 mix-blend-luminosity transition duration-700 group-hover:scale-105" />
            <div className="relative z-10">
              <Radio className="mb-3 size-8" aria-hidden />
              <p className="text-6xl font-black tracking-tight">
                <CountUp value={4} /> live
              </p>
              <p className="text-2xl font-extrabold">classes every week with Caroline</p>
              <p className="mt-2 max-w-sm text-white/75">Recorded and ready straight after, so you never miss one. Plus weekly yoga with Amber.</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.05}>
          <div className={`${tile} h-full bg-ink text-white`}>
            <Video className="mb-3 size-7 text-warm-400" aria-hidden />
            <p className="text-3xl font-black">
              <CountUp value={500} suffix="+" /> on demand
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {onDemandSeries.slice(0, 7).map((s) => (
                <span key={s.name} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className={`${tile} h-full bg-blush`}>
            <Download className="mb-3 size-7 text-plum-500" aria-hidden />
            <p className="text-xl font-black text-ink">Download & go</p>
            <p className="mt-1 text-sm text-charcoal">Save classes offline for holidays, hotels and patchy Wi-Fi.</p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className={`${tile} border-2 border-warm-300 h-full`}>
            <PauseCircle className="mb-3 size-7 text-plum-500" aria-hidden />
            <p className="text-xl font-black text-ink">Pause or cancel anytime</p>
            <p className="mt-1 text-sm text-charcoal">No minimum term. Pause from your account in two taps.</p>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.05}>
          <div className={`${tile} h-full bg-plum-500 text-white`}>
            <Users className="mb-3 size-7" aria-hidden />
            <p className="text-3xl font-black">{num(community)}+ women</p>
            <p className="mt-1 text-white/85">in the community: beginners, midlife, runners and over 60s groups. Cheering each other on daily.</p>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.1}>
          <div className={`${tile} relative h-full overflow-hidden bg-plum-950 text-white`}>
            <Globe2 className="absolute -right-10 -bottom-10 size-56 text-white/5" aria-hidden />
            <Globe2 className="mb-3 size-7 text-plum-200" aria-hidden />
            <p className="text-3xl font-black">
              <CountUp value={40} suffix="+" /> countries
            </p>
            <p className="mt-1 text-white/75">Live times shown in your timezone, and every class is on demand.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
