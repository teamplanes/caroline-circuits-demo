"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pause, Play, RefreshCcw, Repeat, Search, XCircle } from "lucide-react";
import { useStore, usePersistentState } from "@/lib/store";
import { ME_ID } from "@/data/mock";
import type { Member, Plan } from "@/lib/types";
import { gbp, relativeTime, shortDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NativeSelect, PageHeader, Pill, isAtRisk, statusTone, useNow, Empty } from "./kit";

const DAY = 86_400_000;
const MRR_FOR: Record<Plan, number> = { monthly: 35, annual: 32.08, trial: 0 };

export function Members() {
  const { state, hydrated } = useStore();
  const now = useNow();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [country, setCountry] = useState("all");
  const [risk, setRisk] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const countries = useMemo(() => [...new Set(state.members.map((m) => m.country))].sort(), [state.members]);
  const rows = state.members.filter(
    (m) =>
      (!q || `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase())) &&
      (status === "all" || m.status === status) &&
      (plan === "all" || m.plan === plan) &&
      (country === "all" || m.country === country) &&
      (risk === "all" || (risk === "at-risk") === isAtRisk(m, now)),
  );
  const open = state.members.find((m) => m.id === openId);

  return (
    <>
      <PageHeader
        title="Your"
        accent="members"
        sub={`${state.members.length} members in this demo sample · tap anyone to open their profile`}
        stats={[
          ...(["active", "trial", "paused"] as const).map((st) => ({
            label: st[0].toUpperCase() + st.slice(1),
            value: state.members.filter((m) => m.status === st).length,
            active: status === st,
            onClick: () => (setStatus(status === st ? "all" : st), setRisk("all")),
          })),
          {
            label: "At risk",
            value: state.members.filter((m) => isAtRisk(m, now)).length,
            active: risk === "at-risk",
            onClick: () => (setRisk(risk === "at-risk" ? "all" : "at-risk"), setStatus("all")),
          },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-1 basis-full sm:basis-64">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-charcoal/50" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="h-9 rounded-xl border-plum-100 bg-white pl-9" />
        </label>
        <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {["active", "trial", "paused", "cancelled"].map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">All plans</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
          <option value="trial">Trial</option>
        </NativeSelect>
        <NativeSelect aria-label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Risk" value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="all">Any risk</option>
          <option value="at-risk">At risk</option>
          <option value="healthy">Healthy</option>
        </NativeSelect>
      </div>

      {rows.length === 0 && <Empty>No members match those filters.</Empty>}

      {/* Mobile cards */}
      <ul className="space-y-2 lg:hidden">
        {rows.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => setOpenId(m.id)} className="flex w-full items-center gap-3 rounded-2xl border border-plum-100 bg-white p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-plum-400">
              {/* eslint-disable-next-line @next/next/no-img-element -- dicebear avatar */}
              <img src={m.avatar} alt="" className="size-10 rounded-full bg-blush" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{m.name}</p>
                <p className="truncate text-xs text-charcoal/70">
                  {m.plan} · {m.country} · {m.classesCompleted} classes
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pill tone={statusTone(m.status)}>{m.status}</Pill>
                {isAtRisk(m, now) && <Pill tone="red">at risk</Pill>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-3xl border border-plum-100 bg-white lg:block">
        <table className="w-full text-sm">
          <thead className="bg-plum-50/60 text-left text-[11px] font-bold tracking-wider text-charcoal/70 uppercase">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3 text-right">Classes</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3 text-right">MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-50">
            {rows.map((m) => (
              <tr key={m.id} onClick={() => setOpenId(m.id)} className="cursor-pointer transition-colors hover:bg-plum-50/50">
                <td className="px-4 py-2.5">
                  <button type="button" onClick={() => setOpenId(m.id)} className="flex items-center gap-3 text-left outline-none focus-visible:underline">
                    {/* eslint-disable-next-line @next/next/no-img-element -- dicebear avatar */}
                    <img src={m.avatar} alt="" className="size-8 rounded-full bg-blush" />
                    <span>
                      <span className="block font-bold text-ink">
                        {m.name} {m.id === ME_ID && <span className="text-[10px] font-semibold text-plum-500">(demo customer)</span>}
                      </span>
                      <span className="block text-xs text-charcoal/60">{m.email}</span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <Pill tone={statusTone(m.status)}>{m.status}</Pill>
                    {isAtRisk(m, now) && <Pill tone="red">at risk</Pill>}
                  </div>
                </td>
                <td className="px-4 py-2.5 capitalize">{m.plan}</td>
                <td className="px-4 py-2.5">{m.country}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{m.classesCompleted}</td>
                <td className="px-4 py-2.5 text-charcoal/70">{hydrated ? relativeTime(m.lastActiveAt, now) : ""}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{gbp(m.mrr, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md [&>[data-slot=sheet-close]]:z-10 [&>[data-slot=sheet-close]]:text-white [&>[data-slot=sheet-close]]:hover:bg-white/15">{open && <Profile key={open.id} m={open} now={now} />}</SheetContent>
      </Sheet>
    </>
  );
}

function Profile({ m, now }: { m: Member; now: Date }) {
  const { state, updateMember, pauseMembership, resumeMembership, switchPlan } = useStore();
  // ponytail: refunds live in an admin key (no store action for payments); Dashboard reads the same key.
  const [refunded, setRefunded] = usePersistentState<string[]>("admin-refunds", []);
  const payments = state.payments.filter((p) => p.memberId === m.id);
  const isMe = m.id === ME_ID;

  // Attendance heatmap: last 12 weeks x 7 days.
  // ponytail: only Emma (and buddies) have real workout rows; others get a deterministic pattern scaled by classesCompleted.
  const real = new Set(state.workouts.filter((w) => w.memberId === m.id).map((w) => new Date(w.completedAt).toDateString()));
  const seed = [...m.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const inactiveFor = (now.getTime() - new Date(m.lastActiveAt).getTime()) / DAY;
  const cells = Array.from({ length: 84 }, (_, i) => {
    const daysAgo = 83 - i;
    const d = new Date(now.getTime() - daysAgo * DAY);
    if (real.size) return real.has(d.toDateString());
    if (daysAgo < inactiveFor) return false;
    return ((seed * 31 + i * 17) % 10) < Math.min(6, m.classesCompleted / 25);
  });
  const attended = cells.filter(Boolean).length;

  // Every action snapshots the member so the toast can undo it.
  const act = (label: string, fn: () => void) => {
    const snap = { ...m };
    fn();
    toast.success(label, {
      description: `${m.name}${isMe ? " (shows in the Customer view)" : ""}`,
      action: {
        label: "Undo",
        onClick: () => {
          if (isMe) {
            if (snap.status === "paused") pauseMembership(4);
            else resumeMembership();
            switchPlan(snap.plan);
          }
          updateMember(snap.id, snap);
        },
      },
    });
  };
  const pause = () =>
    act("Membership paused for 4 weeks", () => {
      if (isMe) pauseMembership(4);
      updateMember(m.id, { status: "paused", mrr: 0 });
    });
  // Admin cancels add no cancellation reason, so the Insights chart only shows member-given reasons.
  const cancel = () => act("Membership cancelled", () => updateMember(m.id, { status: "cancelled", mrr: 0 }));
  const resume = () => act("Membership resumed", () => (isMe ? resumeMembership() : updateMember(m.id, { status: "active", mrr: MRR_FOR[m.plan === "trial" ? "monthly" : m.plan], plan: m.plan === "trial" ? "monthly" : m.plan })));
  const otherPlan: Plan = m.plan === "annual" ? "monthly" : "annual";
  const swap = () => act(`Switched to ${otherPlan} plan`, () => (isMe ? switchPlan(otherPlan) : updateMember(m.id, { plan: otherPlan, mrr: m.status === "active" ? MRR_FOR[otherPlan] : 0 })));
  const lastPaid = payments.find((p) => p.status === "paid" && !refunded.includes(p.id));
  const refund = () => {
    if (!lastPaid) return toast.error("No refundable payment");
    const id = lastPaid.id;
    setRefunded((r) => [...r, id]);
    toast.success(`Refunded ${gbp(lastPaid.amount)}`, {
      description: `${m.name} · ${shortDate(lastPaid.date)}`,
      action: { label: "Undo", onClick: () => setRefunded((r) => r.filter((x) => x !== id)) },
    });
  };

  const actions = [
    m.status === "active" || m.status === "trial" ? { label: "Pause", icon: Pause, onClick: pause } : { label: "Resume", icon: Play, onClick: resume },
    { label: "Refund last", icon: RefreshCcw, onClick: refund },
    { label: `Switch to ${otherPlan}`, icon: Repeat, onClick: swap },
    ...(m.status !== "cancelled" ? [{ label: "Cancel", icon: XCircle, onClick: cancel, danger: true }] : []),
  ];

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="mesh-bg grain relative px-5 pt-10 pb-6 text-white">
        <SheetHeader className="relative z-[2] flex-row items-center gap-4 p-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- dicebear avatar */}
          <img src={m.avatar} alt="" className="size-16 rounded-2xl bg-blush ring-2 ring-white/40" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-xl font-black text-white">{m.name}</SheetTitle>
            <SheetDescription className="truncate text-white/75">{m.email}</SheetDescription>
            <div className="mt-1.5 flex gap-1">
              <Pill tone={statusTone(m.status)}>{m.status}</Pill>
              <Pill tone="grey">{m.plan}</Pill>
            </div>
          </div>
        </SheetHeader>
        <dl className="relative z-[2] mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ["Classes", m.classesCompleted],
            ["MRR", gbp(m.mrr, true)],
            ["Joined", shortDate(m.joinedAt)],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-xl px-2 py-2">
              <dt className="text-[10px] font-semibold tracking-wider text-white/65 uppercase">{k}</dt>
              <dd className="truncate text-sm font-black">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-bold capitalize outline-none transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-plum-400",
              "danger" in a ? "border-rose-200 bg-rose-50 text-rose-700" : "border-plum-100 bg-plum-50 text-plum-700",
            )}
          >
            <a.icon className="size-4" aria-hidden /> {a.label}
          </button>
        ))}
      </div>

      <section className="px-5">
        <h3 className="mb-2 text-xs font-bold tracking-wider text-charcoal/70 uppercase">Attendance · last 12 weeks · {attended} classes</h3>
        <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${attended} classes in the last 12 weeks`}>
          {cells.map((on, i) => (
            <div key={i} className={cn("aspect-square rounded-[3px]", on ? "bg-plum-500" : "bg-plum-50")} />
          ))}
        </div>
      </section>

      <section className="px-5">
        <h3 className="mb-2 text-xs font-bold tracking-wider text-charcoal/70 uppercase">Goals</h3>
        <div className="flex flex-wrap gap-1.5">
          {m.goals.map((g) => (
            <span key={g} className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-plum-700">{g}</span>
          ))}
          {m.tags.map((t) => (
            <span key={t} className="rounded-full border border-plum-100 px-3 py-1 text-xs text-charcoal">#{t}</span>
          ))}
        </div>
      </section>

      <section className="px-5">
        <label htmlFor="member-notes" className="mb-2 block text-xs font-bold tracking-wider text-charcoal/70 uppercase">Notes</label>
        <Textarea
          id="member-notes"
          value={m.notes}
          onChange={(e) => updateMember(m.id, { notes: e.target.value })}
          className="min-h-20 rounded-2xl border-plum-100"
        />
        <p className="mt-1 text-[11px] text-charcoal/60">Saved as you type.</p>
      </section>

      <section className="px-5">
        <h3 className="mb-2 text-xs font-bold tracking-wider text-charcoal/70 uppercase">Payments</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-charcoal/70">No payments yet{m.status === "trial" ? " (on free trial)" : ""}.</p>
        ) : (
          <ul className="divide-y divide-plum-50 rounded-2xl border border-plum-100">
            {payments.map((p) => {
              const status = refunded.includes(p.id) ? "refunded" : p.status;
              return (
                <li key={p.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span>
                    <span className="font-bold text-ink">{gbp(p.amount)}</span> <span className="text-charcoal/60">· {p.plan} · {shortDate(p.date)}</span>
                  </span>
                  <Pill tone={status === "paid" ? "green" : status === "failed" ? "red" : "grey"}>{status}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="px-5 text-[11px] text-charcoal/60">
        {m.country} · {m.timezone} · level: {m.level} · last active {relativeTime(m.lastActiveAt, now)}
      </p>
    </div>
  );
}
