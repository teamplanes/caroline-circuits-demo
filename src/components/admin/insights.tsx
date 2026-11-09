"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { aiSummariseFeedback, CHATBOT_LOG_KEY } from "@/lib/ai-client";
import { num, pct, relativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiBadge, HBars, PageHeader, Panel, monthLabel, useNow } from "./kit";

// ponytail: traffic-source and cohort numbers are mock; wire to analytics when it exists.
const SOURCES = [
  { source: "This Morning / TV", trials: 640, paid: 502 },
  { source: "Instagram", trials: 1210, paid: 762 },
  { source: "Google search", trials: 520, paid: 349 },
  { source: "Friend referral", trials: 310, paid: 251 },
  { source: "Newsletter", trials: 280, paid: 196 },
  { source: "Facebook ads", trials: 450, paid: 198 },
];
const RETENTION = [1, 0.86, 0.79, 0.74, 0.71, 0.68];

type Summary = Awaited<ReturnType<typeof aiSummariseFeedback>>;

export function Insights() {
  const { state, hydrated } = useStore();
  const now = useNow();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [botLog, setBotLog] = useState<{ q: string; at: string }[]>([]);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the chat widget's question log
      setBotLog(JSON.parse(localStorage.getItem(CHATBOT_LOG_KEY) ?? "[]"));
    } catch {}
  }, []);

  const reasons = Object.entries(
    state.cancellationReasons.reduce<Record<string, number>>((acc, c) => ((acc[c.reason] = (acc[c.reason] ?? 0) + 1), acc), {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  async function summarise() {
    setBusy(true);
    try {
      setSummary(await aiSummariseFeedback(state.cancellationReasons.map((c) => c.freeText).filter(Boolean)));
    } catch {
      toast.error("Couldn't summarise right now");
    } finally {
      setBusy(false);
    }
  }

  const bySource = [...SOURCES].sort((a, b) => b.paid / b.trials - a.paid / a.trials);
  const best = bySource[0];
  const totals = SOURCES.reduce((t, s) => ({ trials: t.trials + s.trials, paid: t.paid + s.paid }), { trials: 0, paid: 0 });

  const cohorts = state.metrics.slice(-6).map((m, i, arr) => {
    const age = arr.length - i; // months since cohort joined (incl. current)
    const wobble = ((m.signups % 7) - 3) / 100;
    return { month: m.month, size: m.signups, cells: RETENTION.slice(0, age).map((r, j) => (j === 0 ? 1 : Math.min(1, r + wobble))) };
  });
  const userQs = [...botLog, ...state.chatLog.filter((c) => c.role === "user").map((c) => ({ q: c.content, at: c.at }))]
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((c, i, arr) => arr.findIndex((x) => x.q === c.q && x.at.slice(0, 16) === c.at.slice(0, 16)) === i)
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Studio"
        accent="insights"
        sub="Why people leave, where good members come from, and what they ask."
        stats={[
          { label: "Trial → paid", value: pct(totals.paid / totals.trials) },
          { label: "Still here at 3 months", value: pct(RETENTION[3]) },
          { label: "Top churn reason", value: reasons[0]?.label ?? "None yet" },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`Cancellation reasons (${state.cancellationReasons.length})`}>
          <HBars rows={reasons} />
        </Panel>

        <Panel
          title={<span className="flex items-center gap-2">Feedback themes <AiBadge /></span>}
          action={
            <Button size="sm" onClick={summarise} disabled={busy} className="rounded-full bg-plum-500 px-3 font-bold">
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} {summary ? "Re-run" : "Summarise feedback"}
            </Button>
          }
        >
          {!summary ? (
            <ul className="space-y-2">
              {state.cancellationReasons.slice(0, 4).map((c, i) => (
                <li key={i} className="rounded-2xl bg-plum-50/60 px-3 py-2 text-sm text-charcoal">
                  “{c.freeText}” <span className="text-[11px] text-charcoal/60">· {c.reason}</span>
                </li>
              ))}
              <li className="text-xs text-charcoal/60">Tap “Summarise feedback” to turn {state.cancellationReasons.length} comments into themes.</li>
            </ul>
          ) : (
            <div className="space-y-3">
              <p className="rounded-2xl bg-blush/70 p-3 text-sm text-plum-900">{summary.summary}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {summary.themes.map((t, i) => (
                  <li key={t.theme} className={cn("border-2 border-warm-300 rounded-2xl p-3", i === 0 && "sm:col-span-2")}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-black text-ink", i === 0 ? "text-base" : "text-sm")}>{t.theme}</p>
                      <span className="grid min-w-7 shrink-0 place-items-center rounded-full bg-plum-500 px-2 py-0.5 text-xs font-black text-white">{t.count}</span>
                    </div>
                    <p className="mt-1 text-xs text-charcoal/70 italic">“{t.example}”</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Trial → paid by traffic source">
          <div className="mb-4 rounded-2xl bg-plum-500 p-4 text-white">
            <p className="text-[11px] font-bold tracking-widest text-white/75 uppercase">Best converting source</p>
            <p className="mt-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-lg font-black">{best.source}</span>
              <span className="text-3xl font-black tabular-nums">{pct(best.paid / best.trials)}</span>
            </p>
            <p className="text-xs text-white/80">{num(best.paid)} of {num(best.trials)} trials became paying members</p>
          </div>
          <ul className="space-y-3">
            {bySource.slice(1).map((s) => {
              const rate = s.paid / s.trials;
              return (
                <li key={s.source}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-charcoal">{s.source}</span>
                    <span className="text-charcoal/60">
                      {num(s.paid)} / {num(s.trials)} · <strong className="text-ink">{pct(rate)}</strong>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-plum-50">
                    <div className="h-full rounded-full bg-plum-500" style={{ width: `${rate * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Retention by sign-up month">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[10px] font-bold tracking-wider text-charcoal/60 uppercase">
                  <th className="py-1 text-left">Cohort</th>
                  <th>Size</th>
                  {RETENTION.map((_, i) => <th key={i}>M{i}</th>)}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.month}>
                    <td className="py-1 pr-2 text-left font-semibold whitespace-nowrap text-ink">
                      {monthLabel(c.month, { month: "short", year: "2-digit" })}
                    </td>
                    <td className="pr-1 text-charcoal/70 tabular-nums">{c.size}</td>
                    {RETENTION.map((_, i) => {
                      const v = c.cells[i];
                      return (
                        <td key={i} className="p-0.5">
                          {v !== undefined && (
                            <div
                              className="rounded-md py-1.5 font-bold tabular-nums"
                              style={{ background: `rgb(155 63 140 / ${0.15 + (v - 0.6) * 2})`, color: v > 0.85 ? "#fff" : "var(--color-plum-900)" }}
                            >
                              {pct(v)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Chatbot question log" className="lg:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold tracking-wider text-charcoal/60 uppercase">Most asked (30 days)</p>
              <HBars rows={state.chatbotQuestions.map((q) => ({ label: q.q, value: q.count }))} format={num} />
            </div>
            <div>
              <p className="mb-3 text-xs font-bold tracking-wider text-charcoal/60 uppercase">Latest from this demo</p>
              {userQs.length === 0 ? (
                <p className="text-sm text-charcoal/70">No questions yet. Try the chat on the Website or Customer view and they&apos;ll appear here.</p>
              ) : (
                <ul className="space-y-2">
                  {userQs.map((c, i) => (
                    <li key={i} className="rounded-2xl bg-plum-50/60 px-3 py-2 text-sm text-ink">
                      {c.q}
                      <span className="block text-[11px] text-charcoal/60">{hydrated ? relativeTime(c.at, now) : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
