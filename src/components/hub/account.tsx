"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Copy, CreditCard, Gift, Mail, PauseCircle, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { plans } from "@/data/site";
import { useStore } from "@/lib/store";
import { gbp, shortDate } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PageHeader, Section, btnGhost, btnPrimary, card, useNow } from "./bits";
import { NOTIF_CATEGORIES as CATEGORIES, useHub } from "./shell";

const REASONS = ["Too expensive", "Not enough time", "Injury / health", "Classes too hard", "Travelling", "Technical issues", "Other"];

type Offer = { title: string; body: string; cta: string; act: () => void };

export function AccountView() {
  const { state, meMember, switchPlan, pauseMembership, resumeMembership, cancelMembership, updateMember } = useStore();
  const { openOnboarding, prefs, setPrefs } = useHub();
  const now = useNow();
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2 | 3>(0); // 0 closed, 1 reason, 2 offer, 3 confirm
  const [reason, setReason] = useState("");
  const [freeText, setFreeText] = useState("");
  const [gift, setGift] = useState({ name: "", email: "", months: "3" });

  const plan = plans.find((p) => p.id === state.me.plan) ?? plans[0];
  const annual = plans.find((p) => p.id === "annual")!;
  const monthly = plans.find((p) => p.id === "monthly")!;
  const status = meMember.status;
  const nextBill = (() => {
    if (!now) return null;
    const j = new Date(meMember.joinedAt);
    // Billing day, clamped to short months (joined on the 31st -> 30th/28th).
    const on = (y: number, m: number) => new Date(y, m, Math.min(j.getDate(), new Date(y, m + 1, 0).getDate()));
    if (state.me.plan === "annual") {
      let y = now.getFullYear();
      while (on(y, j.getMonth()) <= now) y++;
      return on(y, j.getMonth());
    }
    const d = on(now.getFullYear(), now.getMonth());
    return d > now ? d : on(now.getFullYear(), now.getMonth() + 1);
  })();
  const paused = status === "paused";
  const halfPrice = meMember.tags.includes("offer-50-off");
  const addTag = (tag: string, patch: Partial<typeof meMember> = {}) =>
    updateMember(meMember.id, { ...patch, tags: [...meMember.tags.filter((t) => t !== tag), tag] });
  const referral = `https://carolinescircuits.com/r/${meMember.name.toLowerCase().replace(/\s+/g, "-")}`;

  const offers: Record<string, Offer> = {
    "Too expensive": { title: "How about 50% off your next 2 months?", body: "We'd hate money to be the reason you stop. Keep everything for half price.", cta: "Claim 50% off", act: () => {
        addTag("offer-50-off", { mrr: Math.round(meMember.mrr * 50) / 100, notes: `${meMember.notes} Took 50% off for 2 months instead of cancelling.`.trim() });
        toast.success("50% off applied to your next 2 months 💜");
      } },
    "Not enough time": { title: "Try the 10-minute plan", body: "Three 10-minute classes a week still builds strength. We'll set it up for you.", cta: "Switch me to 10-minute classes", act: () => {
        addTag("plan-10-min");
        toast.success("Your plan now favours 10 and 15 minute classes");
      } },
    "Injury / health": { title: "Pause while you recover", body: "Pause for up to 4 weeks for free, then come back to our low-impact beginner series.", cta: "Pause for 4 weeks", act: () => pauseMembership(4) },
    "Classes too hard": { title: "Start the Beginners series", body: "Five gentle classes that build up step by step. Most members feel the difference in 2 weeks.", cta: "Go to Beginners 1", act: () => {
        addTag("plan-beginners");
        toast.success("Beginners series added to your plan");
      } },
    Travelling: { title: "Pause instead", body: "Keep your streak history, favourites and price. Pause for 1, 2 or 4 weeks.", cta: "Pause for 4 weeks", act: () => pauseMembership(4) },
    "Technical issues": { title: "Let us fix it", body: "Our team replies within a few hours. Ask Caroline's assistant (bottom right) or email us.", cta: "Email support", act: () => toast.success("Support ticket opened. We'll be in touch today.") },
    Other: { title: "Take a break instead?", body: "A pause keeps everything as it is, ready for when you're back.", cta: "Pause for 2 weeks", act: () => pauseMembership(2) },
  };
  const offer = offers[reason] ?? offers.Other;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Account" title={<>Your membership</>}>
        <button type="button" onClick={openOnboarding} className={btnGhost}>
          <RotateCcw className="size-4" aria-hidden /> Replay onboarding
        </button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Plan */}
        <div className="mesh-bg grain relative overflow-hidden rounded-[2rem] p-6 text-white md:p-8">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="glass rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase">{plan.name} plan</span>
              <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase", status === "active" ? "bg-emerald-400/90 text-emerald-950" : status === "paused" ? "bg-amber-300 text-amber-950" : "bg-white/20")}>
                {status}
              </span>
            </div>
            <p className="mt-6 text-6xl font-black tracking-tight">
              {gbp(halfPrice ? plan.price / 2 : plan.price, halfPrice)}
              <span className="text-lg font-bold text-white/70">/{plan.period}</span>
            </p>
            {halfPrice && <p className="glass mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold">50% off your next 2 payments</p>}
            <p className="mt-2 text-sm text-white/80">{plan.billing}</p>
            <div className="glass mt-6 grid grid-cols-2 gap-3 rounded-2xl p-4 text-sm">
              <div>
                <p className="text-xs text-white/60">Member since</p>
                <p className="font-bold">{shortDate(meMember.joinedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">{status === "cancelled" ? "Access until" : "Next payment"}</p>
                <p className="font-bold">{nextBill ? shortDate(nextBill) : "…"}</p>
              </div>
              <div className="col-span-2 flex items-center gap-2 text-white/80">
                <CreditCard className="size-4" aria-hidden /> Visa ending 4242
              </div>
            </div>
            {status === "cancelled" && (
              <button type="button" onClick={() => { resumeMembership(); toast.success("Welcome back! 💜"); }} className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-black text-plum-800">
                Rejoin
              </button>
            )}
          </div>
        </div>

        {/* Upsell or annual confirmation */}
        {state.me.plan !== "annual" ? (
          <div className="border-2 border-warm-300 flex flex-col rounded-[2rem] p-6 md:p-8">
            <span className="w-fit rounded-full bg-plum-500 px-3 py-1 text-[11px] font-black text-white uppercase">{annual.badge}</span>
            <h2 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
              Go annual, save {gbp(annual.saving ?? 0)}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">{annual.billing}.</p>
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground line-through">{gbp(annual.wasPrice ?? 0)}</span> <strong className="text-2xl font-black">{gbp(annual.price)}</strong>/year
              <span className="text-muted-foreground"> · {gbp(annual.price / 12, true)}/month</span>
            </p>
            <button type="button" onClick={() => { switchPlan("annual"); toast.success("You're on the annual plan. 1 month free! 🎉"); }} className={cn(btnPrimary, "mt-6 self-start")}>
              Switch to annual
            </button>
          </div>
        ) : (
          <div className={cn(card, "flex flex-col")}>
            <h2 className="text-xl font-black">You&apos;re on the best-value plan 🎉</h2>
            <p className="text-muted-foreground mt-2 text-sm">You save {gbp(annual.saving ?? 0)} a year versus monthly.</p>
            <button type="button" onClick={() => switchPlan("monthly")} className={cn(btnGhost, "mt-6 self-start")}>
              Switch to monthly ({gbp(monthly.price)}/month)
            </button>
          </div>
        )}
      </div>

      {/* Pause + cancel */}
      {status !== "cancelled" && (
        <Section title="Need a break?" className={card}>
          {paused ? (
            <div className="flex flex-wrap items-center gap-3">
              <PauseCircle className="text-plum-600 size-6" aria-hidden />
              <p className="flex-1 text-sm">
                Paused{state.me.paused ? <> until <strong>{shortDate(state.me.paused.until)}</strong></> : null}. You won&apos;t be charged.
              </p>
              <button type="button" onClick={resumeMembership} className={btnPrimary}>
                Resume now
              </button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4 text-sm">Pause for free instead of cancelling. Your favourites, plan and history stay put.</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 4].map((w) => (
                  <button key={w} type="button" onClick={() => { pauseMembership(w); toast.success(`Paused for ${w} week${w > 1 ? "s" : ""}. See you soon!`); }} className={btnGhost}>
                    <PauseCircle className="size-4" aria-hidden /> Pause {w} week{w > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 border-t border-plum-100 pt-4">
            {cancelStep === 0 ? (
              <button type="button" onClick={() => setCancelStep(1)} className="text-muted-foreground text-sm font-semibold underline underline-offset-4">
                Cancel membership
              </button>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={cancelStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl bg-plum-50/70 p-5">
                  {cancelStep === 1 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (reason) setCancelStep(2);
                      }}
                    >
                      <fieldset>
                        <legend className="text-lg font-extrabold">Sorry to see you go. Can we ask why?</legend>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {REASONS.map((r) => (
                            <label key={r} className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm font-bold has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-plum-300", reason === r ? "border-plum-500 bg-plum-500 text-white" : "border-plum-200 bg-white")}>
                              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
                              {r}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <label htmlFor="cancel-text" className="mt-4 block text-sm font-bold">
                        Anything else you&apos;d like Caroline to know? (optional)
                      </label>
                      <textarea id="cancel-text" value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-plum-200 bg-white p-3 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
                      <div className="mt-4 flex gap-2">
                        <button type="submit" disabled={!reason} className={btnPrimary}>Continue</button>
                        <button type="button" onClick={() => setCancelStep(0)} className={btnGhost}>Never mind</button>
                      </div>
                    </form>
                  )}
                  {cancelStep === 2 && (
                    <div>
                      <p className="text-plum-600 flex items-center gap-1.5 text-[11px] font-black tracking-widest uppercase">
                        <Wand2 className="size-3.5" aria-hidden /> Before you go
                      </p>
                      <h3 className="mt-1 text-2xl font-black">{offer.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{offer.body}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {reason === "Classes too hard" ? (
                          <Link href="/hub/class/beginners-1" onClick={offer.act} className={btnPrimary}>
                            {offer.cta}
                          </Link>
                        ) : (
                          <button type="button" onClick={() => { offer.act(); setCancelStep(0); }} className={btnPrimary}>
                            {offer.cta}
                          </button>
                        )}
                        <button type="button" onClick={() => setCancelStep(3)} className={btnGhost}>
                          No thanks, cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {cancelStep === 3 && (
                    <div>
                      <h3 className="text-xl font-black">Are you sure?</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        You&apos;ll keep access until {nextBill ? shortDate(nextBill) : "the end of your billing period"}. Your {state.workouts.filter((w) => w.memberId === meMember.id).length} classes of history will be saved if you come back.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setCancelStep(0)} className={btnPrimary}>
                          Keep my membership
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            cancelMembership(reason, freeText);
                            setCancelStep(0);
                            toast("Membership cancelled. We'll miss you, come back any time 💜");
                          }}
                          className="h-11 rounded-full px-5 text-sm font-bold text-red-700 hover:bg-red-50"
                        >
                          Confirm cancellation
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </Section>
      )}

      {/* Notifications */}
      <Section title={<span className="flex items-center gap-2"><Bell className="size-5 text-plum-500" aria-hidden /> Notifications</span>} className={card}>
        <div className="text-muted-foreground mb-2 grid grid-cols-[1fr_56px_56px] text-xs font-bold">
          <span />
          <span className="text-center">Push</span>
          <span className="text-center">Email</span>
        </div>
        <ul className="divide-y divide-plum-100">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="grid grid-cols-[1fr_56px_56px] items-center py-3">
              <div>
                <p className="text-sm font-bold">{c.id}</p>
                <p className="text-muted-foreground text-xs">{c.blurb}</p>
              </div>
              {(["push", "email"] as const).map((ch) => (
                <div key={ch} className="flex justify-center">
                  <Switch
                    checked={prefs[c.id]?.[ch] ?? false}
                    onCheckedChange={(v) => setPrefs((p) => ({ ...p, [c.id]: { ...p[c.id], [ch]: v } }))}
                    aria-label={`${c.id} ${ch} notifications`}
                  />
                </div>
              ))}
            </li>
          ))}
        </ul>
      </Section>

      {/* Referral + gift */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Invite a friend" className={card}>
          <p className="text-muted-foreground mb-3 text-sm">They get their first month for £17.50, you get a month free when they join.</p>
          <div className="flex gap-2">
            <label htmlFor="ref" className="sr-only">Your referral link</label>
            <input id="ref" readOnly value={referral} className="h-11 min-w-0 flex-1 rounded-full border border-plum-100 bg-plum-50/60 px-4 text-sm font-semibold" />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(referral).catch(() => {});
                toast.success("Link copied!");
              }}
              className={btnPrimary}
            >
              <Copy className="size-4" aria-hidden /> Copy
            </button>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">3 friends joined with your link · 2 free months earned</p>
        </Section>

        <Section title={<span className="flex items-center gap-2"><Gift className="size-5 text-plum-500" aria-hidden /> Gift a membership</span>} className={card}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success(`Gift of ${gift.months} month${gift.months === "1" ? "" : "s"} on its way to ${gift.name || "your friend"} 🎁`);
              setGift({ name: "", email: "", months: "3" });
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="g-name" className="text-xs font-bold">Their name</label>
                <input id="g-name" required value={gift.name} onChange={(e) => setGift({ ...gift, name: e.target.value })} className="mt-1 h-11 w-full rounded-full border border-plum-100 bg-white px-4 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
              </div>
              <div>
                <label htmlFor="g-email" className="text-xs font-bold">Their email</label>
                <input id="g-email" required type="email" value={gift.email} onChange={(e) => setGift({ ...gift, email: e.target.value })} className="mt-1 h-11 w-full rounded-full border border-plum-100 bg-white px-4 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["1", gbp(35)],
                ["3", gbp(99)],
                ["12", gbp(385)],
              ].map(([m, price]) => (
                <label key={m} className={cn("cursor-pointer rounded-full border px-4 py-2 text-xs font-bold has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-plum-300", gift.months === m ? "border-plum-500 bg-plum-500 text-white" : "border-plum-200 bg-white")}>
                  <input type="radio" name="gift-months" value={m} checked={gift.months === m} onChange={() => setGift({ ...gift, months: m })} className="sr-only" />
                  {m} month{m === "1" ? "" : "s"} · {price}
                </label>
              ))}
              <button type="submit" className={cn(btnPrimary, "ml-auto")}>
                <Mail className="size-4" aria-hidden /> Send gift
              </button>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}
