"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Loader2, MessageCircle, Mic, Pin, ShieldAlert, Trophy, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { ME_ID } from "@/data/mock";
import { aiModerate } from "@/lib/ai-client";
import { AREA_LABEL } from "@/lib/nudges";
import { usePersistentState, useStore } from "@/lib/store";
import { relativeTime } from "@/lib/format";
import { ukWallTimeToDate } from "@/lib/time";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { AiBadge, PageHeader, Pill, btnGhost, btnPrimary, card, challengeProgress, myWorkouts, useNow } from "./bits";

const TEAMS = [
  { name: "Team Plum", colour: "from-plum-500 to-plum-700", base: 412 },
  { name: "Team Orchid", colour: "from-orchid to-plum-400", base: 398 },
  { name: "Team Mauve", colour: "from-mauve to-plum-800", base: 371 },
];

/** Monthly live Q&A: last Thursday of the month, 7pm UK. */
function nextQandA(now: Date) {
  for (let i = 0; i < 2; i++) {
    const y = now.getFullYear();
    const m = now.getMonth() + i;
    const last = new Date(y, m + 1, 0);
    last.setDate(last.getDate() - ((last.getDay() + 3) % 7)); // back to Thursday
    const at = ukWallTimeToDate(last.getFullYear(), last.getMonth(), last.getDate(), 19, 0);
    if (at > now) return at;
  }
  return now;
}

function PostCard({ p, now }: { p: Post; now: Date }) {
  const { state, likePost, commentPost } = useStore();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const group = state.groups.find((g) => g.id === p.group);

  if (p.flagged) {
    return (
      <li className={cn(card, "text-muted-foreground flex items-center gap-3 py-4 text-sm")}>
        <ShieldAlert className="size-5 text-plum-400" aria-hidden /> A post is being reviewed by the team.
      </li>
    );
  }

  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn(card, p.pinned && "border-2 border-warm-300")}>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host */}
        <img src={p.avatar} alt="" className="size-11 rounded-full bg-blush" />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <strong>{p.authorName}</strong>
            {p.authorId === ME_ID && <span className="text-plum-600 ml-1 text-xs font-bold">(you)</span>}
          </p>
          <p className="text-muted-foreground text-xs">
            {group?.name} · {relativeTime(p.createdAt, now)}
          </p>
        </div>
        {p.pinned && (
          <span className="text-plum-700 flex items-center gap-1 rounded-full bg-plum-50 px-2.5 py-1 text-[11px] font-bold">
            <Pin className="size-3" aria-hidden /> Pinned
          </span>
        )}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{p.text}</p>
      {p.image && (
        <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 600px, 90vw" className="object-cover" />
        </div>
      )}
      <div className="mt-3 flex items-center gap-1">
        <motion.button
          type="button"
          onClick={() => likePost(p.id)}
          whileTap={{ scale: 1.15 }}
          aria-pressed={!!p.likedByMe}
          className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition hover:bg-plum-50 focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none", p.likedByMe ? "text-warm-400" : "text-charcoal")}
        >
          <span className="relative grid place-items-center">
            <motion.span key={String(p.likedByMe)} initial={{ scale: p.likedByMe ? 0.4 : 1 }} animate={{ scale: [null, p.likedByMe ? 1.4 : 1, 1] }} transition={{ duration: 0.35 }}>
              <Heart className={cn("size-4", p.likedByMe && "fill-warm-400")} aria-hidden />
            </motion.span>
            {/* Little ring burst on like. */}
            {p.likedByMe && (
              <motion.span
                key="burst"
                aria-hidden
                className="absolute size-4 rounded-full border-2 border-warm-400"
                initial={{ scale: 0.6, opacity: 0.9 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}
          </span>
          {p.likes}
          <span className="sr-only">likes</span>
        </motion.button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-charcoal flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold hover:bg-plum-50">
          <MessageCircle className="size-4" aria-hidden /> {p.comments.length}
          <span className="sr-only">comments</span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="mt-2 space-y-2 border-t border-plum-100 pt-3">
              {p.comments.map((c, i) => (
                <li key={i} className="rounded-2xl bg-plum-50/70 px-3 py-2 text-sm">
                  <strong>{c.authorName}</strong> {c.text}
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                commentPost(p.id, reply.trim());
                setReply("");
              }}
              className="mt-2 flex gap-2"
            >
              <label htmlFor={`reply-${p.id}`} className="sr-only">Write a comment</label>
              <input id={`reply-${p.id}`} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a comment…" className="h-10 flex-1 rounded-full border border-plum-100 bg-white px-4 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
              <button type="submit" className="h-10 rounded-full bg-ink px-4 text-sm font-bold text-white">
                Reply
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function CommunityView() {
  const { state, meMember, addPost, joinGroup, joinChallenge, addBuddy } = useStore();
  const now = useNow();
  const [tab, setTab] = useState<"feed" | "groups" | "challenges" | "buddies">("feed");
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [group, setGroup] = useState("general");
  const [posting, setPosting] = useState(false);
  const [qaGoing, setQaGoing] = usePersistentState("qa-rsvp", false);
  const [question, setQuestion] = useState("");
  // Per challenge: which team she's on and whether she shows on the leaderboard (opt-in, off by default).
  const [teamPrefs, setTeamPrefs] = usePersistentState<Record<string, { team: string; visible: boolean }>>("challenge-teams", {});

  if (!now) return <div className="h-96 animate-pulse rounded-3xl bg-plum-100/60" aria-busy="true" />;

  const posts = state.posts
    .filter((p) => !p.hidden && (filter === "all" || p.group === filter))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt));
  const qa = nextQandA(now);
  const mine = myWorkouts(state);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      // ponytail: if the moderation call fails, post anyway; admin moderation is the backstop.
      const mod = await aiModerate(text).catch(() => ({ flagged: false, reason: undefined }));
      if (mod.flagged) {
        toast.error(`Hmm, this one needs a tweak before posting${mod.reason ? `: ${mod.reason}` : "."}`);
        return;
      }
      addPost({ group, text: text.trim() });
      setText("");
      toast.success("Posted 💜");
    } finally {
      setPosting(false);
    }
  }

  const matches = state.members
    .filter((m) => m.id !== ME_ID && m.status === "active" && !state.me.buddies.includes(m.id))
    .map((m) => ({ m, score: (m.timezone === meMember.timezone ? 2 : 0) + (m.level === meMember.level ? 1 : 0) + (m.goals.some((g) => meMember.goals.includes(g)) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Community" title={<>Stronger together</>} />

      {/* Monthly Q&A */}
      <div className="mesh-bg grain relative overflow-hidden rounded-[2rem] text-white">
        <div className="relative z-10 grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
          <div>
            <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase">
              <Mic className="size-3.5" aria-hidden /> Monthly live Q&amp;A
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
              Ask Caroline anything
            </h2>
            <p className="mt-1 text-white/80">
              {qa.toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true })} · this month: strength &amp; menopause
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!question.trim()) return;
                setQuestion("");
                toast.success("Question sent! Caroline answers the most popular ones live.");
              }}
              className="glass mt-4 flex max-w-lg gap-2 rounded-full p-1.5 pl-4"
            >
              <label htmlFor="qa-q" className="sr-only">Submit a question</label>
              <input id="qa-q" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Submit a question in advance…" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none" />
              <button type="submit" className="h-9 rounded-full bg-white px-4 text-xs font-black text-plum-800">Send</button>
            </form>
          </div>
          <button type="button" onClick={() => setQaGoing((g) => !g)} aria-pressed={qaGoing} className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-black", qaGoing ? "bg-white text-plum-800" : "glass")}>
            {qaGoing ? <><Check className="size-4" aria-hidden /> You&apos;re going</> : "Count me in"}
          </button>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {(
          [
            ["feed", "Feed"],
            ["groups", "Groups"],
            ["challenges", "Challenges"],
            ["buddies", "Buddies"],
          ] as const
        ).map(([id, label]) => (
          <Pill key={id} active={tab === id} onClick={() => setTab(id)}>
            {label}
          </Pill>
        ))}
      </div>

      {tab === "feed" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <form onSubmit={submit} className="border-2 border-warm-300 rounded-3xl p-5 shadow-[0_12px_40px_rgb(155_63_140/0.12)]">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host */}
                <img src={meMember.avatar} alt="" className="size-11 rounded-full bg-blush" />
                <div className="flex-1">
                  <label htmlFor="composer" className="sr-only">Share something</label>
                  <textarea id="composer" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Share a win, ask a question…" className="w-full resize-none rounded-2xl border border-plum-100 bg-white p-3 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {["Done today ✅", "New PB 💪", "Feeling strong 🔥"].map((q) => (
                  <button key={q} type="button" onClick={() => setText((t) => (t ? `${t} ${q}` : q))} className="rounded-full bg-plum-500 px-3 py-1.5 text-xs font-bold text-white transition hover:scale-105 focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none">
                    {q}
                  </button>
                ))}
                <label htmlFor="composer-group" className="sr-only">Group</label>
                <select id="composer-group" value={group} onChange={(e) => setGroup(e.target.value)} className="ml-auto h-9 rounded-full border border-plum-100 bg-white px-3 text-xs font-bold">
                  {state.groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button type="submit" disabled={posting || !text.trim()} className={cn(btnPrimary, "h-9 px-5")}>
                  {posting && <Loader2 className="size-4 animate-spin" aria-hidden />} Post
                </button>
              </div>
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[11px]">
                <AiBadge /> Posts are checked to keep this a kind, spam-free space.
              </p>
            </form>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
              <Pill active={filter === "all"} onClick={() => setFilter("all")}>All</Pill>
              {state.groups.map((g) => (
                <Pill key={g.id} active={filter === g.id} onClick={() => setFilter(g.id)}>
                  {g.name}
                </Pill>
              ))}
            </div>

            <ul className="space-y-4">
              {posts.map((p) => (
                <PostCard key={p.id} p={p} now={now} />
              ))}
            </ul>
          </div>

          <aside className="space-y-4 max-lg:hidden">
            <div className={card}>
              <h2 className="mb-3 font-extrabold">Your groups</h2>
              <ul className="space-y-2">
                {state.groups.filter((g) => state.me.groups.includes(g.id)).map((g) => (
                  <li key={g.id}>
                    <button type="button" onClick={() => setFilter(g.id)} className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left hover:bg-plum-50">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-xl">
                        <Image src={g.image} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                      <span className="text-sm font-bold">{g.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setTab("groups")} className="text-plum-700 mt-3 text-sm font-bold">
                Discover groups →
              </button>
            </div>
          </aside>
        </div>
      )}

      {tab === "groups" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.groups.map((g) => {
            const joined = state.me.groups.includes(g.id);
            return (
              <article key={g.id} className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(42_15_38/0.08)]">
                <div className="relative aspect-[16/9]">
                  <Image src={g.image} alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum-950/80 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 text-xl font-black text-white">{g.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground text-sm">{g.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs font-bold">
                      <Users className="size-3.5" aria-hidden /> {(g.members + (joined ? 1 : 0)).toLocaleString("en-GB")}
                    </span>
                    <button type="button" onClick={() => joinGroup(g.id)} aria-pressed={joined} className={joined ? btnGhost + " h-9" : btnPrimary + " h-9"}>
                      {joined ? "Joined ✓" : "Join"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "challenges" && (
        <div className="space-y-5">
          {state.challenges.map((ch) => {
            const joined = state.me.joinedChallenges.includes(ch.id);
            const started = new Date(ch.startsAt) <= now;
            const done = challengeProgress(ch, mine);
            const pref = teamPrefs[ch.id] ?? { team: TEAMS[0].name, visible: false };
            const setPref = (patch: Partial<typeof pref>) => setTeamPrefs((all) => ({ ...all, [ch.id]: { ...pref, ...patch } }));
            const teams = TEAMS.map((t, i) => {
              const mineHere = joined && pref.visible && t.name === pref.team;
              return { ...t, mineHere, points: t.base + (mineHere ? done * 10 : 0) + Math.round(ch.participants / (5 + i)) };
            }).sort((a, b) => b.points - a.points);
            const maxPts = teams[0].points;
            return (
              <article key={ch.id} className="grain relative overflow-hidden rounded-[2rem] text-white shadow-[0_20px_50px_rgb(42_15_38/0.25)]">
                <Image src={ch.image} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-plum-950/95 to-plum-800/70" />
                <div className="relative z-10 grid gap-5 p-5 md:grid-cols-[1fr_minmax(0,340px)] md:p-7">
                  <div>
                    <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase">
                      <Trophy className="size-3.5" aria-hidden /> {started ? "Live now" : "Starts soon"}
                    </span>
                    <h3 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{ch.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{ch.description}</p>
                    <p className="mt-2 text-xs font-bold text-white/70">
                      {AREA_LABEL[ch.bodyArea]} · {ch.targetClasses} classes · {ch.participants.toLocaleString("en-GB")} taking part
                    </p>
                    {joined ? (
                      <div className="mt-5 max-w-sm">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Your progress</span>
                          <span className="tabular-nums">{Math.min(done, ch.targetClasses)} / {ch.targetClasses}</span>
                        </div>
                        <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={done} aria-valuemax={ch.targetClasses} aria-label={`${ch.title} progress`}>
                          <motion.div className="h-full rounded-full bg-warm-400" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (done / ch.targetClasses) * 100)}%` }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          joinChallenge(ch.id);
                          toast.success(`You're in! Pick a team if you want to appear on the leaderboard 💜`);
                        }}
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-black text-plum-800 shadow-[0_8px_32px_rgb(255_255_255/0.25)] transition hover:scale-105 focus-visible:ring-3 focus-visible:ring-warm-400 focus-visible:outline-none"
                      >
                        <Trophy className="size-4" aria-hidden /> Join challenge
                      </button>
                    )}
                  </div>

                  <div className="glass rounded-3xl p-4">
                    <p className="mb-3 text-[11px] font-black tracking-widest text-white/70 uppercase">Team leaderboard</p>
                    <ol className="space-y-2">
                      {teams.map((t, i) => (
                        <li key={t.name} className="grid grid-cols-[18px_92px_1fr_40px] items-center gap-2 text-xs">
                          <span className="font-black">{i + 1}</span>
                          <span className="truncate font-bold">
                            {t.name}
                            {t.mineHere && <span className="text-warm-400"> · you</span>}
                          </span>
                          <span className="h-2 overflow-hidden rounded-full bg-white/15">
                            <motion.span className={cn("block h-full rounded-full bg-gradient-to-r", t.colour)} initial={{ width: 0 }} animate={{ width: `${(t.points / maxPts) * 100}%` }} transition={{ duration: 0.8 }} />
                          </span>
                          <span className="text-right font-bold tabular-nums">{t.points}</span>
                        </li>
                      ))}
                    </ol>
                    {joined && (
                      <div className="mt-4 space-y-3 border-t border-white/15 pt-3">
                        <label className="flex items-center justify-between gap-3 text-xs font-bold">
                          Show me on the leaderboard
                          <Switch checked={pref.visible} onCheckedChange={(v) => setPref({ visible: v })} aria-label={`Show me on the ${ch.title} leaderboard`} />
                        </label>
                        {pref.visible && (
                          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Your team">
                            {TEAMS.map((t) => (
                              <button
                                key={t.name}
                                type="button"
                                role="radio"
                                aria-checked={pref.team === t.name}
                                onClick={() => setPref({ team: t.name })}
                                className={cn("h-8 rounded-full px-3 text-[11px] font-bold transition", pref.team === t.name ? "bg-white text-plum-800" : "bg-white/10 hover:bg-white/20")}
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {!pref.visible && <p className="text-[11px] text-white/60">You&apos;re hidden. Your classes still count towards your own progress.</p>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "buddies" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-extrabold">Your buddies</h2>
            <ul className="space-y-3">
              {state.me.buddies.map((id) => {
                const m = state.members.find((x) => x.id === id);
                if (!m) return null;
                const last = state.workouts.filter((w) => w.memberId === id).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
                return (
                  <li key={id} className={cn(card, "flex items-center gap-3 p-4")}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host */}
                    <img src={m.avatar} alt="" className="size-12 rounded-full bg-blush" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{m.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {m.country} · {last ? `trained ${relativeTime(last.completedAt, now)}` : "no classes yet this week"}
                      </p>
                    </div>
                    <button type="button" onClick={() => toast.success(`Nudge sent to ${m.name.split(" ")[0]} 👋`)} className="rounded-full bg-plum-50 px-3 py-2 text-xs font-bold text-plum-800 hover:bg-plum-100">
                      Nudge 👋
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h2 className="mb-1 text-lg font-extrabold">Suggested buddies</h2>
            <p className="text-muted-foreground mb-3 text-sm">Matched by timezone, level and goals, so you can train at the same time.</p>
            <ul className="space-y-3">
              {matches.map(({ m, score }) => (
                <li key={m.id} className={cn(card, "flex items-center gap-3 p-4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host */}
                  <img src={m.avatar} alt="" className="size-12 rounded-full bg-blush" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{m.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.timezone.split("/")[1]?.replace("_", " ")} · {m.level === "all" ? "all levels" : m.level} · {Math.min(99, 60 + score * 10)}% match
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addBuddy(m.id);
                      toast.success(`${m.name.split(" ")[0]} is now your buddy!`);
                    }}
                    className="grid size-10 place-items-center rounded-full bg-plum-500 text-white"
                    aria-label={`Add ${m.name} as a buddy`}
                  >
                    <UserPlus className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
