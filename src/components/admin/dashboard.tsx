"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowUpRight, CalendarClock, CreditCard, Dumbbell, HeartCrack, MailCheck, MessageCircle, Radio, Send, TrendingDown, TrendingUp } from "lucide-react";
import { useStore, usePersistentState } from "@/lib/store";
import { buildSeed } from "@/data/mock";
import type { LiveSlot } from "@/lib/types";
import { nextLiveClass, splitMs, formatSlotLocal } from "@/lib/time";
import { gbp, num, pct, relativeTime } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HBars, MiniBars, Panel, Sparkline, ctaClass, daysSince, gbpCompact, isAtRisk, monthLabel, useNow } from "./kit";

// ponytail: funnel ratios are mock multipliers on real sign-up numbers; swap for analytics events when tracked.
export const FUNNEL_RATES = { visitsPerSignup: 14.2, trialsPerSignup: 1.47, threeMonthRetained: 0.72 };

// Seed member totals: the static metrics already include these, so live KPIs add only the difference.
// ponytail: seed members don't depend on the date, so any fixed date works here.
const SEED_MEMBERS = buildSeed(new Date("2026-11-09T12:00:00Z")).members;
const SEED_MRR = SEED_MEMBERS.reduce((s, x) => s + x.mrr, 0);
const SEED_ACTIVE = SEED_MEMBERS.filter((x) => x.status === "active").length;
const SEED_CANCELLED = SEED_MEMBERS.filter((x) => x.status === "cancelled").length;

export function Dashboard() {
  const { state, hydrated, updateMember } = useStore();
  const now = useNow(60_000);
  const [refunded] = usePersistentState<string[]>("admin-refunds", []);
  // Static history, with the current month moved by whatever admins/customers changed in this demo.
  const lastSeed = state.metrics[state.metrics.length - 1];
  const live = {
    ...lastSeed,
    mrr: Math.round(lastSeed.mrr + state.members.reduce((s, x) => s + x.mrr, 0) - SEED_MRR),
    activeMembers: lastSeed.activeMembers + state.members.filter((x) => x.status === "active").length - SEED_ACTIVE,
    cancellations: lastSeed.cancellations + state.members.filter((x) => x.status === "cancelled").length - SEED_CANCELLED,
  };
  const m = [...state.metrics.slice(0, -1), live];
  const last = live;
  const prev = m[m.length - 2];
  const delta = (a: number, b: number) => (b ? (a - b) / b : 0);

  const trials = Math.round(last.signups * FUNNEL_RATES.trialsPerSignup);
  const trialToPaid = last.signups / trials;
  const paying = state.members.filter((x) => x.status === "active");
  const avgClasses =
    paying.reduce((sum, x) => sum + x.classesCompleted / Math.max(1, daysSince(x.joinedAt, now) / 30), 0) / Math.max(1, paying.length);

  const kpis = [
    { label: "MRR", value: gbpCompact(last.mrr), change: delta(last.mrr, prev.mrr), chart: <Sparkline values={m.map((x) => x.mrr)} stroke="#fff" /> },
    { label: "Active members", value: num(last.activeMembers), change: delta(last.activeMembers, prev.activeMembers), chart: <Sparkline values={m.map((x) => x.activeMembers)} stroke="#fff" /> },
    { label: "Sign-ups this week", value: num(Math.round(last.signups / 4.3)), change: delta(last.signups, prev.signups), chart: <MiniBars values={m.map((x) => x.signups)} barClass="bg-white" /> },
    { label: "Cancellations (mo)", value: num(last.cancellations), change: delta(last.cancellations, prev.cancellations), invert: true, chart: <MiniBars values={m.map((x) => x.cancellations)} barClass="bg-white" /> },
    { label: "Trial → paid", value: pct(trialToPaid), change: 0.04, chart: <Sparkline values={[0.58, 0.6, 0.61, 0.63, 0.62, 0.65, 0.66, trialToPaid]} stroke="#fff" /> },
    { label: "Avg classes / member / mo", value: avgClasses.toFixed(1), change: 0.06, chart: <MiniBars values={[6.1, 6.4, 6.2, 6.9, 7.3, 7.1, avgClasses]} barClass="bg-white" /> },
  ];

  const atRisk = state.members.filter((x) => isAtRisk(x, now)).sort((a, b) => a.lastActiveAt.localeCompare(b.lastActiveAt));
  const greeting = !hydrated ? "Hello" : now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const groupName = (id: string) => state.groups.find((g) => g.id === id)?.name ?? id;

  const memberName = (id: string) => state.members.find((x) => x.id === id)?.name ?? "A member";
  const classTitle = (id: string) => state.classes.find((c) => c.id === id)?.title ?? id;
  const activity = [
    ...state.workouts.slice(-8).map((w) => ({ at: w.completedAt, icon: Dumbbell, text: `${memberName(w.memberId)} completed ${classTitle(w.classId)}` })),
    ...state.posts.slice(0, 6).map((p) => ({ at: p.createdAt, icon: MessageCircle, text: `${p.authorName} posted in ${groupName(p.group)}` })),
    ...state.payments.slice(0, 6).map((p) => ({ at: p.date, icon: CreditCard, text: `${p.memberName}: ${gbp(p.amount)} ${refunded.includes(p.id) ? "refunded" : p.status}` })),
    ...state.cancellationReasons.slice(0, 3).map((c) => ({ at: c.date, icon: HeartCrack, text: `${memberName(c.memberId)} cancelled: ${c.reason}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 9);

  const funnel = [
    { label: "Website visits", value: Math.round(last.signups * FUNNEL_RATES.visitsPerSignup) },
    { label: "Free trials", value: trials },
    { label: "Paid members", value: last.signups },
    { label: "Active at 3 months", value: Math.round(last.signups * FUNNEL_RATES.threeMonthRetained) },
  ];
  const maxMrr = Math.max(...m.map((x) => x.mrr));

  function sendComeback(id: string) {
    const member = state.members.find((x) => x.id === id)!;
    updateMember(id, { tags: [...member.tags.filter((t) => t !== "comeback-sent"), "comeback-sent"] });
    toast.success(`Comeback email sent to ${member.name.split(" ")[0]}`, { description: "“No guilt, just come back for 10 minutes today x”" });
  }

  return (
    <div className="space-y-5">
      {/* Glass KPI header */}
      <section className="mesh-bg grain relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
        <div className="relative z-[2]">
          <p className="text-xs font-bold tracking-wider text-white/70 uppercase">{hydrated ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Today"}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            {greeting}, Caroline
          </h1>
          <p className="mt-1 text-sm text-white/75">Here&apos;s your studio at a glance. Everything below is one tap away.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((k, i) => {
              const good = k.invert ? k.change <= 0 : k.change >= 0;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass flex min-w-0 flex-col justify-between gap-3 rounded-2xl p-3.5"
                >
                  <p className="text-[11px] font-semibold text-white/75">{k.label}</p>
                  <div>
                    <p className="truncate text-xl font-black tracking-tight tabular-nums sm:text-2xl">{k.value}</p>
                    <p className={cn("mt-0.5 flex items-center gap-1 text-[11px] font-bold", good ? "text-emerald-200" : "text-rose-200")}>
                      {k.change >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                      {k.change >= 0 ? "+" : ""}
                      {pct(k.change)} <span className="font-medium text-white/60">vs last mo</span>
                    </p>
                  </div>
                  <div className="text-white">{k.chart}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* MRR chart */}
        <Panel title="MRR, last 12 months" className="lg:col-span-2" action={<span className="text-xs font-bold text-emerald-600">+{pct(delta(last.mrr, m[0].mrr))} YoY</span>}>
          <div className="flex h-48 items-end gap-1.5 sm:gap-2" role="img" aria-label={`MRR grew from ${gbp(m[0].mrr)} to ${gbp(last.mrr)} over 12 months`}>
            {m.map((x, i) => (
              <div key={x.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[9px] font-bold text-plum-700 opacity-0 transition-opacity group-hover:opacity-100 max-sm:hidden">{gbp(x.mrr / 1000)}k</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(x.mrr / maxMrr) * 100}%` }}
                  transition={{ delay: i * 0.03, type: "spring", bounce: 0.2 }}
                  className={cn("w-full rounded-t-lg", i === m.length - 1 ? "bg-plum-500" : "bg-plum-200 group-hover:bg-plum-300")}
                />
                <span className="text-[9px] font-semibold text-charcoal/60 uppercase">
                  {monthLabel(x.month).slice(0, 1)}
                  <span className="max-sm:hidden">{monthLabel(x.month).slice(1)}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <NextLive slots={state.liveSchedule} rsvps={state.me.rsvps.length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* At risk */}
        <Panel
          title={
            <span className="flex items-center gap-2">
              At risk <span className="rounded-full bg-rose-100 px-2 text-[11px] text-rose-700">{atRisk.length}</span>
            </span>
          }
          action={<span className="text-[11px] text-charcoal/60">No class in 14+ days</span>}
          className="lg:col-span-2"
        >
          {atRisk.length === 0 ? (
            <p className="text-sm text-charcoal/70">Everyone has trained in the last two weeks. 🎉</p>
          ) : (
            <ul className="divide-y divide-plum-50">
              {atRisk.slice(0, 6).map((x) => {
                const sent = x.tags.includes("comeback-sent");
                return (
                  <li key={x.id} className="flex items-center gap-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element -- dicebear avatar, not in remotePatterns */}
                    <img src={x.avatar} alt="" className="size-9 rounded-full bg-blush" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{x.name}</p>
                      <p className="truncate text-xs text-charcoal/70">
                        Last class {hydrated ? relativeTime(x.lastActiveAt, now) : "recently"} &middot; {x.status} &middot; {x.country}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={sent}
                      onClick={() => sendComeback(x.id)}
                      className={cn(
                        "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-plum-400",
                        sent ? "bg-emerald-50 text-emerald-700" : "bg-plum-500 text-white hover:scale-[1.03] hover:bg-plum-600",
                      )}
                    >
                      {sent ? <MailCheck className="size-3.5" aria-hidden /> : <Send className="size-3.5" aria-hidden />}
                      <span className="max-sm:hidden">{sent ? "Sent" : "Send comeback email"}</span>
                      <span className="sm:hidden">{sent ? "Sent" : "Email"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Funnel */}
        <Panel title="Funnel this month">
          <ol className="space-y-2">
            {funnel.map((f, i) => (
              <li key={f.label}>
                <div
                  className="flex items-center justify-between rounded-xl bg-plum-500 px-3 py-2 text-white"
                  style={{ width: `${100 - i * 14}%`, opacity: 1 - i * 0.12 }}
                >
                  <span className="truncate text-xs font-semibold">{f.label}</span>
                  <span className="text-sm font-black tabular-nums">{num(f.value)}</span>
                </div>
                {i > 0 && <p className="mt-0.5 pl-1 text-[10px] font-semibold text-charcoal/60">{pct(f.value / funnel[i - 1].value)} of previous step</p>}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Top chatbot questions" action={<Link href="/admin/insights" className="text-xs font-bold text-plum-600 hover:underline">All questions</Link>}>
          <HBars rows={state.chatbotQuestions.slice(0, 6).map((q) => ({ label: q.q, value: q.count }))} format={num} />
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-plum-50 text-plum-600">
                  <a.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{a.text}</p>
                  <p className="text-[11px] text-charcoal/60">{hydrated ? relativeTime(a.at, now) : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/content" className={cn(buttonVariants({ size: "lg" }), ctaClass, "rounded-full px-4 font-bold")}>
          Upload a class
        </Link>
        <Link href="/admin/comms" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-4 font-bold")}>
          Email members
        </Link>
        <Link href="/admin/schedule" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-4 font-bold")}>
          <CalendarClock aria-hidden /> Edit schedule
        </Link>
      </div>
    </div>
  );
}

/** Owns the 1s tick so only the countdown re-renders every second. */
function NextLive({ slots, rsvps }: { slots: LiveSlot[]; rsvps: number }) {
  const { hydrated } = useStore();
  const now = useNow(1000);
  const live = nextLiveClass(now, slots);
  const cd = live ? splitMs(live.msUntil) : null;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white">
      <div className="relative">
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-warm-400 uppercase">
          <Radio className="size-3.5" aria-hidden /> {live?.isLive ? "Live now" : "Next live class"}
        </p>
        {live ? (
          <>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{live.slot.title}</h2>
            <p className="text-sm text-white/70">
              {hydrated ? formatSlotLocal(live.slot, now, "Europe/London") : ""} UK &middot; {live.slot.durationMin} min with {live.slot.instructor ?? "Caroline"}
            </p>
            {cd && !live.isLive && (
              <div className="mt-4 grid grid-cols-4 gap-2 text-center" role="timer" aria-label="Time until the next live class">
                {(["days", "hours", "minutes", "seconds"] as const).map((u) => (
                  <div key={u} className="glass rounded-xl py-2">
                    <p className="text-xl font-black tabular-nums">{hydrated ? String(cd[u]).padStart(2, "0") : "--"}</p>
                    <p className="text-[9px] font-semibold tracking-wider text-white/60 uppercase">{u}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-white/70">
              <span>
                <strong className="text-white">{num(412 + rsvps)}</strong> RSVPs &middot; auto-records
              </span>
              <Link href="/admin/schedule" className="flex items-center gap-1 font-bold text-warm-400 hover:underline">
                Schedule <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-white/70">No live classes scheduled.</p>
        )}
      </div>
    </section>
  );
}
