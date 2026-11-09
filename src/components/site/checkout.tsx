"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Gift, Loader2, Lock, PartyPopper } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { membershipIncludes, plans, promo } from "@/data/site";
import { gbp } from "@/lib/format";
import { STORE_KEY, useStore } from "@/lib/store";
import { ME_ID } from "@/data/mock";
import { cn } from "@/lib/utils";
import { userTimeZone } from "@/lib/time";
import { firstMonth } from "./pricing";
import { ctaClass } from "./motion";

// ponytail: rough static rates keyed off the visitor's timezone; swap for a rates API if this goes live.
const CURRENCIES: [prefix: string, code: string, rate: number][] = [
  ["Europe/London", "GBP", 1],
  ["America/", "USD", 1.27],
  ["Australia/", "AUD", 1.95],
  ["Pacific/Auckland", "NZD", 2.1],
  ["Asia/Dubai", "AED", 4.66],
  ["Asia/Singapore", "SGD", 1.71],
  ["Africa/Johannesburg", "ZAR", 23.4],
  ["Europe/", "EUR", 1.17],
];

function localEstimate(gbpAmount: number) {
  const tz = userTimeZone();
  const hit = CURRENCIES.find(([p]) => tz.startsWith(p));
  if (!hit || hit[1] === "GBP") return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: hit[1] }).format(gbpAmount * hit[2]);
}

const field =
  "h-12 w-full rounded-xl border border-plum-100 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-charcoal/50 focus-visible:border-plum-400 focus-visible:ring-3 focus-visible:ring-plum-500/20";

export function Checkout() {
  const params = useSearchParams();
  const [planId, setPlanId] = useState<"monthly" | "annual">(params.get("plan") === "annual" ? "annual" : "monthly");
  const plan = planId === "annual" ? plans[1] : plans[0];
  const dueToday = planId === "annual" ? plan.price : firstMonth(plan.price);
  const { state, switchPlan, resumeMembership, updateMember } = useStore();

  const [gift, setGift] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "done">("idle");
  const [local, setLocal] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- timezone is browser-only
  useEffect(() => setLocal(localEstimate(dueToday)), [dueToday]);

  function pay(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus("paying");
    setTimeout(() => {
      // A gift doesn't touch Emma's own membership.
      if (!gift) {
        switchPlan(planId);
        if (state.me.paused) resumeMembership();
        else updateMember(ME_ID, { status: "active" });
      }
      setStatus("done");
    }, 1400);
  }

  // Wallet buttons skip the submit button, so run native validation first (gift fields are required).
  function payWallet(e: React.MouseEvent<HTMLButtonElement>) {
    const giftFields = [...(e.currentTarget.form?.querySelectorAll<HTMLInputElement>("[data-gift]") ?? [])];
    if (!giftFields.every((f) => f.reportValidity())) return;
    pay();
  }

  // Full page load to /hub so the store re-reads storage with onboarding switched back on.
  function goToHub() {
    if (gift) return;
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
      if (s?.me) localStorage.setItem(STORE_KEY, JSON.stringify({ ...s, me: { ...s.me, onboarded: false } }));
    } catch {}
  }

  if (status === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mesh-bg grain mx-auto max-w-xl overflow-hidden rounded-[2rem] p-10 text-center text-white">
        <div className="relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="glass mx-auto grid size-20 place-items-center rounded-full">
            <PartyPopper className="size-9" aria-hidden />
          </motion.div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            {gift ? (
              <>
                Gift sent!
              </>
            ) : (
              <>
                Welcome to the club!
              </>
            )}
          </h1>
          <p className="mt-3 text-white/80">
            {gift
              ? "We've emailed your gift with a personal note. You can still explore the hub yourself."
              : `Your ${plan.name.toLowerCase()} membership is active. Let's set up your plan in 60 seconds.`}
          </p>
          <a href="/hub" onClick={goToHub} className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-black text-plum-700 transition hover:scale-105">
            Go to your hub
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Summary */}
      <aside className="mesh-bg grain h-fit overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 lg:sticky lg:top-[calc(var(--demo-bar-h)+100px)]">
        <div className="relative z-10">
          <Link href="/#pricing" className="inline-flex items-center gap-1 text-sm font-semibold text-white/75 hover:text-white">
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            Your membership
          </h1>
          <div role="radiogroup" aria-label="Plan" className="mt-5 grid grid-cols-2 gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={planId === p.id}
                onClick={() => setPlanId(p.id)}
                className={`rounded-2xl border p-3 text-left transition ${planId === p.id ? "border-white bg-white text-plum-800" : "glass border-white/20"}`}
              >
                <span className="block text-sm font-bold">{p.name}</span>
                <span className="text-xs opacity-80">
                  {gbp(p.price)}/{p.period}
                </span>
              </button>
            ))}
          </div>

          <dl className="glass mt-5 space-y-2 rounded-2xl p-4 text-sm">
            <div className="flex justify-between">
              <dt>{plan.name} plan</dt>
              <dd>{gbp(planId === "annual" ? plans[1].wasPrice! : plan.price)}</dd>
            </div>
            <div className="flex justify-between text-plum-100">
              <dt>{planId === "annual" ? "1 month free" : `${promo.percentOff}% off first month (auto-applied)`}</dt>
              <dd>-{gbp(planId === "annual" ? plans[1].saving! : plan.price - dueToday, true)}</dd>
            </div>
            <div className="flex items-end justify-between border-t border-white/20 pt-2">
              <dt className="font-bold">Due today</dt>
              <dd className="text-right">
                <span className="text-3xl font-black">{gbp(dueToday, !Number.isInteger(dueToday))}</span>
                {local && <span className="block text-xs text-white/70">≈ {local} (your bank converts)</span>}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-white/70">
            {planId === "annual" ? "Renews yearly." : `Then ${gbp(plan.price)}/month.`} Cancel or pause anytime.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-white/85">
            {membershipIncludes.slice(0, 5).map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-plum-200" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Payment */}
      <form onSubmit={pay} className="rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_-40px_rgb(155_63_140/0.5)] sm:p-8">
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Demo checkout: test mode, no real payment is taken.</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={payWallet} className="h-12 rounded-xl bg-black text-sm font-bold text-white transition hover:bg-black/85">
            Apple Pay
          </button>
          <button type="button" onClick={payWallet} className="h-12 rounded-xl border border-black/15 bg-white text-sm font-bold text-ink transition hover:bg-black/5">
            Google Pay
          </button>
        </div>
        <p className="my-5 flex items-center gap-3 text-xs font-semibold text-charcoal before:h-px before:flex-1 before:bg-plum-100 after:h-px after:flex-1 after:bg-plum-100">or pay by card</p>

        <div className="grid gap-3">
          <div>
            <label htmlFor="co-name" className="mb-1 block text-xs font-bold text-ink">
              Full name
            </label>
            <input id="co-name" required autoComplete="name" className={field} />
          </div>
          <div>
            <label htmlFor="co-email" className="mb-1 block text-xs font-bold text-ink">
              Email
            </label>
            <input id="co-email" type="email" required autoComplete="email" className={field} />
          </div>
          <div>
            <label htmlFor="co-card" className="mb-1 block text-xs font-bold text-ink">
              Card number <span className="font-medium text-charcoal">(test mode: use 4242 4242 4242 4242)</span>
            </label>
            <div className="relative">
              <input id="co-card" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" className={field} />
              <CreditCard className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-charcoal/50" aria-hidden />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="co-exp" className="mb-1 block text-xs font-bold text-ink">
                Expiry (test)
              </label>
              <input id="co-exp" autoComplete="off" placeholder="12 / 30" className={field} />
            </div>
            <div>
              <label htmlFor="co-cvc" className="mb-1 block text-xs font-bold text-ink">
                CVC (test)
              </label>
              <input id="co-cvc" autoComplete="off" inputMode="numeric" placeholder="123" className={field} />
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-plum-100 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                <Gift className="size-4 text-plum-500" aria-hidden /> Give this as a gift
              </span>
              <Switch checked={gift} onCheckedChange={(c) => setGift(c)} aria-label="Give this as a gift" />
            </label>
            {gift && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 grid gap-3 overflow-hidden">
                <div>
                  <label htmlFor="gift-name" className="mb-1 block text-xs font-bold text-ink">
                    Their name
                  </label>
                  <input id="gift-name" data-gift required className={field} />
                </div>
                <div>
                  <label htmlFor="gift-email" className="mb-1 block text-xs font-bold text-ink">
                    Their email
                  </label>
                  <input id="gift-email" data-gift type="email" required className={field} />
                </div>
                <div>
                  <label htmlFor="gift-note" className="mb-1 block text-xs font-bold text-ink">
                    Personal note
                  </label>
                  <textarea id="gift-note" rows={2} className={`${field} h-auto py-3`} placeholder="Happy birthday! Let's get strong together x" />
                </div>
              </motion.div>
            )}
          </div>

          <button type="submit" disabled={status === "paying"} className={cn(ctaClass, "mt-2 w-full py-4 text-base disabled:opacity-70")}>
            {status === "paying" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            {status === "paying" ? "Processing…" : `Pay ${gbp(dueToday, !Number.isInteger(dueToday))}`}
          </button>
          <p className="text-center text-xs text-charcoal">Secure checkout · Cancel anytime · No minimum term</p>
        </div>
      </form>
    </div>
  );
}
