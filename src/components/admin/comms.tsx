"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2, Mail, MessageSquare, Send, Smartphone, Wand2 } from "lucide-react";
import { useStore, usePersistentState } from "@/lib/store";
import { computeNudges } from "@/lib/nudges";
import { aiDraftContent } from "@/lib/ai-client";
import type { Automation, Member, NudgeCategory } from "@/lib/types";
import { num, pct, relativeTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiBadge, NativeSelect, PageHeader, Panel, ctaClass, daysSince, isAtRisk, useNow } from "./kit";

const CHANNEL_ICON: Record<Automation["channel"], typeof Mail> = { email: Mail, push: Bell, sms: Smartphone, "in-app": MessageSquare };
type Sent = { segment: string; subject: string; count: number; at: string };

// Segment-aware topic + subject for "Draft it for me", so at-risk/lapsed members don't get a generic newsletter.
const SEGMENT_DRAFT: Record<string, { topic: string; subject: string }> = {
  "at-risk": { topic: "a gentle 10-minute comeback circuit", subject: "We miss you! Here's 10 minutes to get back into it" },
  lapsed: { topic: "a welcome-back week with a returning-member offer", subject: "Your mat misses you: come back this week" },
  trial: { topic: "the best classes for your first week of strength", subject: "Make the most of your free trial" },
  new: { topic: "your first month of building the habit", subject: "Your first month: here's how to keep going" },
};

export function Comms() {
  const { state } = useStore();
  const running = state.automations.filter((a) => a.enabled);
  const sentTotal = state.automations.reduce((n, a) => n + a.sent, 0);
  const avgOpen = running.reduce((n, a) => n + a.openRate, 0) / Math.max(1, running.length);
  return (
    <>
      <PageHeader
        title="Comms &"
        accent="nudges"
        sub="Email a segment, run automations on autopilot, and tune the nudges members see in the hub."
        stats={[
          { label: "Automations running", value: running.length },
          { label: "Messages sent", value: num(sentTotal) },
          { label: "Avg open rate", value: pct(avgOpen) },
          { label: "Nudge rules on", value: state.nudgeRules.filter((r) => r.enabled).length },
        ]}
      />
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-5">
          <Compose />
          <Automations />
        </div>
        <NudgeManager />
      </div>
    </>
  );
}

function useSegments() {
  const { state } = useStore();
  const now = useNow();
  return useMemo(() => {
    const seg = (id: string, label: string, pred: (m: Member) => boolean) => ({ id, label, members: state.members.filter(pred) });
    const goals = [...new Set(state.members.flatMap((m) => m.goals))].sort();
    return [
      seg("all", "Everyone", (m) => m.status !== "cancelled"),
      seg("trial", "On free trial", (m) => m.status === "trial"),
      seg("new", "New (last 30 days)", (m) => daysSince(m.joinedAt, now) <= 30 && m.status !== "cancelled"),
      seg("active", "Active", (m) => m.status === "active"),
      seg("at-risk", "At risk (14+ days quiet)", (m) => isAtRisk(m, now)),
      seg("lapsed", "Lapsed / cancelled", (m) => m.status === "cancelled"),
      ...goals.map((g) => seg(`goal:${g}`, `Goal: ${g}`, (m) => m.goals.includes(g))),
    ];
  }, [state.members, now]);
}

function Compose() {
  const segments = useSegments();
  const now = useNow();
  const [segment, setSegment] = useState("at-risk");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = usePersistentState<Sent[]>("admin-sent-emails", []);
  const seg = segments.find((s) => s.id === segment)!;

  async function draft() {
    setBusy(true);
    try {
      const preset = SEGMENT_DRAFT[segment];
      const topic = subject || preset?.topic || (segment.startsWith("goal:") ? `classes to help you ${segment.slice(5).toLowerCase()}` : "This week's live classes");
      setBody(await aiDraftContent({ classTitle: topic, kind: "newsletter" }));
      if (!subject) setSubject(preset?.subject ?? "This week at Caroline's Circuits 💪");
    } catch {
      toast.error("Couldn't draft right now");
    } finally {
      setBusy(false);
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setSent([{ segment: seg.label, subject, count: seg.members.length, at: new Date().toISOString() }, ...sent].slice(0, 6));
    toast.success(`Sent to ${seg.members.length} members`, { description: `${seg.label}: “${subject}”` });
    setSubject("");
    setBody("");
  }

  return (
    <Panel title="Email a segment" className="lg:col-span-3">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {segments.slice(0, 6).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSegment(s.id)}
            aria-pressed={segment === s.id}
            className={cn(
              "shrink-0 rounded-2xl border px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-plum-400",
              segment === s.id ? "border-plum-500 bg-plum-500 text-white shadow-[0_6px_20px_rgb(155_63_140/0.3)]" : "border-plum-100 bg-white hover:bg-plum-50",
            )}
          >
            <p className="text-lg font-black tabular-nums">{s.members.length}</p>
            <p className={cn("text-[11px] font-semibold", segment === s.id ? "text-white/80" : "text-charcoal/70")}>{s.label}</p>
          </button>
        ))}
      </div>
      <form onSubmit={send} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="seg">Segment</Label>
          <NativeSelect id="seg" value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full">
            {segments.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.members.length})</option>)}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subj">Subject</Label>
          <Input id="subj" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="We miss you! Here's 10 minutes to get back into it" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Message</Label>
            <button type="button" onClick={draft} disabled={busy} className="flex items-center gap-1.5 text-xs font-bold text-plum-600 hover:underline disabled:opacity-50">
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Wand2 className="size-3.5" aria-hidden />} Draft it for me <AiBadge />
            </button>
          </div>
          <Textarea id="body" required value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32 rounded-xl" placeholder="Hi {first name}, ..." />
        </div>
        <Button type="submit" disabled={!seg.members.length} className={cn("h-11 w-full rounded-xl font-bold", ctaClass)}>
          <Send aria-hidden /> Send to {seg.members.length} members
        </Button>
      </form>
      {sent.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-plum-50 pt-3">
          {sent.map((s, i) => (
            <li key={i} className="flex justify-between gap-2 text-xs">
              <span className="truncate text-ink"><strong>{s.subject}</strong> → {s.segment}</span>
              <span className="shrink-0 text-charcoal/60">{s.count} · {relativeTime(s.at, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Automations() {
  const { state, toggleAutomation } = useStore();
  return (
    <Panel title="Automations" className="lg:col-span-2" action={<span className="text-[11px] font-semibold text-emerald-600">{state.automations.filter((a) => a.enabled).length} running</span>}>
      <ul className="space-y-2">
        {state.automations.map((a) => {
          const Icon = CHANNEL_ICON[a.channel];
          return (
            <li key={a.id} className={cn("flex items-center gap-3 rounded-2xl border border-plum-50 p-3 transition", !a.enabled && "opacity-55")}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-plum-50 text-plum-600">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{a.name}</p>
                <p className="truncate text-[11px] text-charcoal/70">{a.trigger}</p>
                <p className="text-[11px] font-semibold text-plum-600">
                  {num(a.sent)} sent · {pct(a.openRate)} opened
                </p>
              </div>
              <Switch
                checked={a.enabled}
                onCheckedChange={() => {
                  toggleAutomation(a.id);
                  toast.success(`${a.name} ${a.enabled ? "paused" : "running"}`);
                }}
                aria-label={`${a.name} automation`}
              />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function NudgeManager() {
  const { state, meMember, updateNudgeRule, setNudgeCap, hydrated } = useStore();
  const now = useNow();
  const cap = state.nudgeCap;
  // Uncapped list for the "rules firing" count; the hub applies state.nudgeCap inside computeNudges.
  const nudges = useMemo(() => computeNudges({ ...state, nudgeCap: 0 }, now), [state, now]);
  const firing = new Map(nudges.map((n) => [n.ruleId, n]));
  const shown = cap > 0 ? nudges.slice(0, cap) : nudges;
  const categories = [...new Set(state.nudgeRules.map((r) => r.category))] as NudgeCategory[];

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          Nudge manager <AiBadge />
        </span>
      }
      action={
        <label className="flex items-center gap-2 text-xs font-semibold text-charcoal/80">
          Frequency cap
          <NativeSelect value={cap} onChange={(e) => { setNudgeCap(Number(e.target.value)); toast.success("Frequency cap saved", { description: "The Customer hub shows this many nudges." }); }} className="h-8 text-xs">
            <option value={1}>Max 1 / day</option>
            <option value={2}>Max 2 / day</option>
            <option value={3}>Max 3 / day</option>
            <option value={0}>No cap</option>
          </NativeSelect>
        </label>
      }
    >
      {/* Live preview for Emma */}
      <div className="mesh-bg grain relative mb-5 overflow-hidden rounded-3xl p-4 text-white sm:p-5">
        <div className="relative z-[2] flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- dicebear avatar */}
            <img src={meMember.avatar} alt="" className="size-12 rounded-2xl bg-blush" />
            <div>
              <p className="text-xs font-bold tracking-widest text-white/70 uppercase">Live preview</p>
              <p className="font-black">What {meMember.name.split(" ")[0]} sees today</p>
              <p className="text-[11px] text-white/70">{nudges.length} rules firing · showing {shown.length}</p>
            </div>
          </div>
          <ul className="grid flex-1 gap-2 sm:grid-cols-2">
            {hydrated &&
              shown.map((n) => (
                <li key={n.id} className="glass rounded-2xl p-3">
                  <p className="text-[10px] font-bold tracking-widest text-warm-400 uppercase">{n.category}</p>
                  <p className="text-sm font-extrabold">{n.title}</p>
                  <p className="mt-0.5 text-sm text-white/85">{n.message}</p>
                  <span className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-[11px] font-bold text-plum-700">{n.cta.label}</span>
                </li>
              ))}
            {hydrated && shown.length === 0 && <li className="text-sm text-white/75">No nudges fire for Emma right now.</li>}
          </ul>
        </div>
      </div>

      <p className="mb-3 text-xs text-charcoal/70">
        Edit any message and it updates in the Customer view instantly. Placeholders like <code className="rounded bg-plum-50 px-1">{"{area}"}</code>,{" "}
        <code className="rounded bg-plum-50 px-1">{"{kg}"}</code> and <code className="rounded bg-plum-50 px-1">{"{buddy}"}</code> are filled in per member.
      </p>

      <div className="space-y-5">
        {categories.map((cat) => (
          <section key={cat}>
            <h3 className="mb-2 text-xs font-bold tracking-wider text-plum-600 uppercase">{cat}</h3>
            <ul className="grid gap-2 lg:grid-cols-2">
              {state.nudgeRules
                .filter((r) => r.category === cat)
                .map((r) => {
                  const live = firing.get(r.id);
                  return (
                    <li key={r.id} className={cn("rounded-2xl border p-3 transition", r.enabled ? "border-plum-100 bg-white" : "border-dashed border-plum-100 bg-plum-50/40 opacity-70")}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-semibold text-charcoal/80">When: {r.trigger}</p>
                        <Switch
                          checked={r.enabled}
                          onCheckedChange={(v) => updateNudgeRule(r.id, { enabled: v })}
                          aria-label={`Enable nudge: ${r.trigger}`}
                        />
                      </div>
                      <Input
                        aria-label={`Message for: ${r.trigger}`}
                        value={r.message}
                        onChange={(e) => updateNudgeRule(r.id, { message: e.target.value })}
                        className="mt-2 rounded-xl border-plum-100 text-sm"
                      />
                      {hydrated && live && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-blush/70 px-2.5 py-1.5 text-xs text-plum-800">
                          <span className="mt-1 size-1.5 shrink-0 animate-pulse rounded-full bg-warm-500" aria-hidden />
                          <span>
                            <strong>Firing for Emma:</strong> {live.message}
                          </span>
                        </p>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}
