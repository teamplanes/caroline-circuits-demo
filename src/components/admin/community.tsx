"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, MessageCircle, Pin, ShieldCheck, Sparkles, Trash2, Trophy, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { aiModerate } from "@/lib/ai-client";
import type { Post } from "@/lib/types";
import { num, relativeTime, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiBadge, Empty, PageHeader, Panel, Pill, useNow } from "./kit";

export function Community() {
  const { state, hydrated } = useStore();
  const now = useNow();
  const flagged = state.posts.filter((p) => p.flagged);
  const today = hydrated ? state.posts.filter((p) => new Date(p.createdAt).toDateString() === now.toDateString()).length : 0;
  const tabs = [
    { id: "queue", label: "Needs review", count: flagged.length },
    { id: "all", label: "All posts", count: state.posts.length },
    { id: "groups", label: "Groups & challenges" },
  ];

  return (
    <>
      <PageHeader
        title="Community"
        accent="moderation"
        sub="AI watches every post and flags spam, scams and unkind comments for you."
        stats={[
          { label: "Need review", value: flagged.length },
          { label: "Posts today", value: today },
          { label: "Groups", value: state.groups.length },
          { label: "Challenge sign-ups", value: num(state.challenges.reduce((n, c) => n + c.participants, 0)) },
        ]}
      />
      <Tabs defaultValue="queue" className="gap-5">
        <TabsList aria-label="Community" className="h-auto w-full justify-start overflow-x-auto rounded-2xl bg-plum-50 p-1 sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-9 flex-none gap-2 rounded-xl px-4 font-bold text-charcoal/70 data-active:text-plum-700">
              {t.label}
              {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px]", t.id === "queue" && t.count ? "bg-warm-500 text-white" : "bg-plum-100")}>{t.count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="queue">
          {flagged.length ? (
            <div className="grid gap-3 lg:grid-cols-2">{flagged.map((p) => <PostCard key={p.id} p={p} />)}</div>
          ) : (
            <Empty>
              <ShieldCheck className="mx-auto mb-2 size-8 text-emerald-500" aria-hidden />
              All clear. Nothing needs your attention.
            </Empty>
          )}
        </TabsContent>
        <TabsContent value="all">
          <div className="grid gap-3 lg:grid-cols-2">{state.posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </TabsContent>
        <TabsContent value="groups">
          <Groups />
        </TabsContent>
      </Tabs>
    </>
  );
}

function PostCard({ p }: { p: Post }) {
  const { state, moderatePost, hydrated } = useStore();
  const groupName = state.groups.find((g) => g.id === p.group)?.name ?? p.group;
  const now = useNow();
  const [checking, setChecking] = useState(false);

  async function recheck() {
    setChecking(true);
    try {
      const r = await aiModerate(p.text);
      if (r.flagged)
        toast.warning("AI says: flag it", {
          description: r.reason ?? "Looks like it breaks the community guidelines.",
          // ponytail: no "flag" store action; hiding is the closest moderation path.
          action: p.hidden ? undefined : { label: "Hide post", onClick: () => moderatePost(p.id, "hide") },
        });
      else toast.success("AI says: looks fine", { description: "No spam, scams or unkind language found." });
    } catch {
      toast.error("Couldn't check right now");
    } finally {
      setChecking(false);
    }
  }

  const act = (action: "pin" | "hide" | "unflag" | "delete", msg: string) => {
    moderatePost(p.id, action);
    toast.success(msg);
  };
  const btn = "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-plum-400";

  return (
    <article className={cn("rounded-3xl border bg-white p-4", p.flagged ? "border-warm-400/50" : "border-plum-100", p.hidden && "opacity-60")}>
      <header className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- dicebear avatar */}
        <img src={p.avatar} alt="" className="size-9 rounded-full bg-blush" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{p.authorName}</p>
          <p className="text-[11px] text-charcoal/60">
            in {groupName} · {hydrated ? relativeTime(p.createdAt, now) : ""}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {p.flagged && (
            <span className="flex items-center gap-1">
              <AiBadge /> <Pill tone="red">{p.flagged}</Pill>
            </span>
          )}
          {p.pinned && <Pill>pinned</Pill>}
          {p.hidden && <Pill tone="grey">hidden</Pill>}
        </div>
      </header>
      <p className="mt-3 text-sm text-ink">{p.text}</p>
      {p.image && <Image src={p.image} alt="" width={400} height={200} className="mt-3 h-32 w-full rounded-2xl object-cover" />}
      <p className="mt-2 flex gap-3 text-[11px] text-charcoal/60">
        <span>♥ {p.likes}</span>
        <span className="flex items-center gap-1"><MessageCircle className="size-3" aria-hidden /> {p.comments.length}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-plum-50 pt-3">
        {p.flagged && (
          <button type="button" onClick={() => act("unflag", "Approved: post is back in the feed")} className={cn(btn, "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>
            <Check className="size-3.5" aria-hidden /> Approve
          </button>
        )}
        <button type="button" onClick={() => act("pin", p.pinned ? "Unpinned" : "Pinned to the top of the group")} className={cn(btn, "bg-plum-50 text-plum-700 hover:bg-plum-100")}>
          <Pin className="size-3.5" aria-hidden /> {p.pinned ? "Unpin" : "Pin"}
        </button>
        <button type="button" onClick={() => act("hide", p.hidden ? "Visible again" : "Hidden from members")} className={cn(btn, "bg-plum-50 text-plum-700 hover:bg-plum-100")}>
          {p.hidden ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />} {p.hidden ? "Unhide" : "Hide"}
        </button>
        <button type="button" onClick={recheck} disabled={checking} className={cn(btn, "bg-plum-500 text-white")}>
          {checking ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />} AI check
        </button>
        <button
          type="button"
          onClick={() => confirm("Delete this post for everyone?") && act("delete", "Post deleted")}
          className={cn(btn, "ml-auto bg-rose-50 text-rose-700 hover:bg-rose-100")}
        >
          <Trash2 className="size-3.5" aria-hidden /> Delete
        </button>
      </div>
    </article>
  );
}

function Groups() {
  const { state, hydrated } = useStore();
  const now = useNow();
  const postsIn = (g: string) => state.posts.filter((p) => p.group === g).length;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title={<span className="flex items-center gap-2"><Users className="size-4 text-plum-500" aria-hidden /> Groups</span>}>
        <ul className="space-y-2">
          {state.groups.map((g) => (
            <li key={g.id} className="flex items-center gap-3 rounded-2xl border border-plum-50 p-2">
              <Image src={g.image} alt="" width={56} height={56} className="size-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{g.name}</p>
                <p className="truncate text-xs text-charcoal/70">{g.description}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-black text-ink">{num(g.members)}</p>
                <p className="text-charcoal/60">{postsIn(g.id)} posts</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={<span className="flex items-center gap-2"><Trophy className="size-4 text-plum-500" aria-hidden /> Challenges</span>}>
        <ul className="space-y-3">
          {state.challenges.map((c) => {
            const start = new Date(c.startsAt).getTime();
            const end = new Date(c.endsAt).getTime();
            const progress = hydrated ? Math.min(1, Math.max(0, (now.getTime() - start) / (end - start))) : 0;
            const upcoming = hydrated && now.getTime() < start;
            return (
              <li key={c.id} className="overflow-hidden rounded-2xl border border-plum-50">
                <div className="relative h-24">
                  <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum-950/85 to-transparent" />
                  <p className="absolute bottom-2 left-3 text-sm font-black text-white">{c.title}</p>
                  <span className="glass absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">{num(c.participants)} joined</span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-charcoal/80">{c.description}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-plum-50">
                    <div className="h-full rounded-full bg-plum-500" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-charcoal/60">
                    {upcoming ? "Starts" : "Running"} {shortDate(c.startsAt)} to {shortDate(c.endsAt)} · {c.targetClasses} classes
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
