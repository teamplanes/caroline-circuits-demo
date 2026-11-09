"use client";

import { Check, Heart, MessageCircle, PartyPopper } from "lucide-react";
import { kit } from "@/data/site";
import { groups } from "@/data/mock";
import { usePersistentState, useStore } from "@/lib/store";
import { num, relativeTime } from "@/lib/format";
import { Reveal, Section, SectionHeading } from "./motion";

/** Interactive "do you have the kit?" check-off. */
export function KitChecklist() {
  const [have, setHave] = usePersistentState<string[]>("site-kit", []);
  const ready = have.length === kit.length;
  return (
    <Reveal>
      <div className="h-full rounded-3xl bg-white p-6 shadow-[0_20px_60px_-30px_rgb(155_63_140/0.5)] sm:p-8">
        <p className="text-xs font-bold tracking-wider text-plum-500 uppercase">Kit check</p>
        <h3 className="mt-2 text-3xl font-black tracking-tight text-ink">
          All you need
        </h3>
        <ul className="mt-6 space-y-3">
          {kit.map((k) => {
            const on = have.includes(k.item);
            return (
              <li key={k.item}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-plum-500 ${on ? "border-plum-300 bg-plum-50" : "border-plum-100 hover:border-plum-200"}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => setHave((h) => (on ? h.filter((x) => x !== k.item) : [...h, k.item]))}
                  />
                  <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-plum-500 bg-plum-500 text-white" : "border-plum-200"}`}>
                    {on && <Check className="size-3.5" aria-hidden />}
                  </span>
                  <span>
                    <span className={`block font-bold ${on ? "text-plum-700" : "text-ink"}`}>{k.item}</span>
                    <span className="text-sm text-charcoal">{k.note}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-plum-100" aria-hidden>
          <div className="h-full rounded-full bg-plum-500 transition-all duration-500" style={{ width: `${(have.length / kit.length) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm font-semibold text-charcoal" aria-live="polite">
          {ready ? (
            <span className="text-plum-600">
              <PartyPopper className="mr-1 inline size-4" aria-hidden /> You&rsquo;re ready. No kit? Every class works with bodyweight too.
            </span>
          ) : (
            `${have.length} of ${kit.length} ticked. Every class also works with no equipment.`
          )}
        </p>
      </div>
    </Reveal>
  );
}

/** Recent wins pulled from the community feed in the demo store. */
export function CommunityTeaser() {
  const { state, hydrated } = useStore();
  // Wins only: pinned posts first, then posts that read like a win. ponytail: keyword match, swap for a "win" flag on posts if it misfires.
  const visible = state.posts.filter((p) => !p.hidden && !p.flagged);
  const isWin = (t: string) => /\b(win|wins|done|pb|stronger|first|finished|completed)\b|\dkg|✅|🎉|💪/i.test(t);
  const posts = [...visible.filter((p) => p.pinned), ...visible.filter((p) => !p.pinned && isWin(p.text))].slice(0, 3);
  const total = groups.reduce((n, g) => n + g.members, 0);
  return (
    <Reveal delay={0.1}>
      <div className="mesh-bg grain h-full overflow-hidden rounded-3xl p-6 text-white sm:p-8">
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-wider text-plum-200 uppercase">Community wins</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight">
            {num(total)}+ women cheering you on
          </h3>
          <ul className="mt-6 space-y-3">
            {posts.map((p) => (
              <li key={p.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dicebear SVG */}
                  <img src={p.avatar} alt="" className="size-9 rounded-full bg-blush" />
                  <div className="min-w-0 text-sm">
                    <p className="font-bold">{p.authorName.split(" ")[0]}</p>
                    <p className="text-xs text-white/60">{hydrated ? relativeTime(p.createdAt) : "recently"}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-white/90">{p.text}</p>
                <p className="mt-2 flex gap-4 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3.5" aria-hidden /> {p.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-3.5" aria-hidden /> {p.comments.length}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

export function KitAndCommunity() {
  return (
    <Section className="bg-blush/50">
      <SectionHeading
        eyebrow="Getting started"
        title={
          <>
            Minimal kit. Maximum support.
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <KitChecklist />
        <CommunityTeaser />
      </div>
    </Section>
  );
}
