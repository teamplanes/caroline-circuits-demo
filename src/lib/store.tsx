"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed, ME_ID, type Seed } from "@/data/mock";
import { plans } from "@/data/site";
import type { ChatMessage, ClassItem, LiveSlot, Member, NudgeRule, Plan, Post } from "@/lib/types";

export const STORE_KEY = "cc-demo-v1";
/** Prefix for usePersistentState keys, so "Reset demo data" can wipe them too. */
export const PERSIST_PREFIX = "cc-demo:";

export type DemoSettings = {
  /** Plan prices in GBP, editable in Admin > Settings. Read these, not the static `plans` prices. */
  prices: { monthly: number; annual: number };
  /** Auto-apply the first-month promo (promo.percentOff) at checkout. */
  firstMonthDiscount: boolean;
};

export type DemoState = Seed & {
  chatLog: ChatMessage[];
  settings: DemoSettings;
  /** Max nudges shown to the customer (0 = no cap). Applied inside computeNudges. */
  nudgeCap: number;
  /** When the dates in this state were last re-based to "today" (ISO). */
  seededAt: string;
};
export type MeState = DemoState["me"];
export type Onboarding = MeState["onboarding"];

// Fixed date for the server render; real "now" seed (or saved state) replaces it after mount.
const SSR_SEED_DATE = new Date("2026-11-09T12:00:00Z");
const DEFAULT_SETTINGS: DemoSettings = {
  prices: { monthly: plans[0].price, annual: plans[1].price },
  firstMonthDiscount: true,
};
const fresh = (now: Date): DemoState => ({ ...buildSeed(now), chatLog: [], settings: DEFAULT_SETTINGS, nudgeCap: 3, seededAt: now.toISOString() });

const ISO_DATE = /^\d{4}-\d\d-\d\dT/;
const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Parses saved state and shifts every ISO date by the whole days since it was saved, so the curated
 * "today" story (streak at risk, buddy trained yesterday...) still holds when the demo is opened later.
 * Shifts by calendar days (setDate) so wall-clock times survive DST.
 */
export function parseRebased(raw: string, now: Date): DemoState {
  const savedAt = (JSON.parse(raw) as { seededAt?: string }).seededAt;
  const days = savedAt ? Math.round((startOfDay(now) - startOfDay(new Date(savedAt))) / DAY_MS) : 0;
  const state: DemoState = JSON.parse(raw, (_k, v) => {
    if (!days || typeof v !== "string" || !ISO_DATE.test(v)) return v;
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    d.setDate(d.getDate() + days);
    return d.toISOString();
  });
  return { ...state, seededAt: now.toISOString() };
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function createActions(set: (fn: (s: DemoState) => DemoState) => void) {
  const setMe = (fn: (me: MeState) => Partial<MeState>) => set((s) => ({ ...s, me: { ...s.me, ...fn(s.me) } }));
  const patchMember = (s: DemoState, id: string, patch: Partial<Member>) => s.members.map((m) => (m.id === id ? { ...m, ...patch } : m));
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return {
    completeWorkout(classId: string) {
      set((s) => {
        const c = s.classes.find((x) => x.id === classId);
        if (!c) return s;
        const now = new Date().toISOString();
        const me = s.members.find((m) => m.id === ME_ID);
        return {
          ...s,
          workouts: [...s.workouts, { id: uid("w"), memberId: ME_ID, classId, completedAt: now, bodyArea: c.bodyArea, durationMin: c.durationMin }],
          classes: s.classes.map((x) => (x.id === classId ? { ...x, plays: x.plays + 1 } : x)),
          members: patchMember(s, ME_ID, { lastActiveAt: now, classesCompleted: (me?.classesCompleted ?? 0) + 1 }),
          me: { ...s.me, continueWatching: s.me.continueWatching.filter((x) => x.classId !== classId) },
        };
      });
    },
    toggleFavourite(classId: string) {
      setMe((me) => ({ favourites: toggle(me.favourites, classId) }));
    },
    setProgress(classId: string, progressSec: number) {
      setMe((me) => ({ continueWatching: [{ classId, progressSec }, ...me.continueWatching.filter((x) => x.classId !== classId)] }));
    },
    /** Toggles an RSVP for a live slot id. */
    rsvp(slotId: string) {
      setMe((me) => ({ rsvps: toggle(me.rsvps, slotId) }));
    },
    toggleReminder(slotId: string) {
      setMe((me) => ({ reminders: toggle(me.reminders, slotId) }));
    },
    addPost(input: { group: string; text: string; image?: string }) {
      set((s) => {
        const me = s.members.find((m) => m.id === ME_ID)!;
        const post: Post = { id: uid("p"), authorId: ME_ID, authorName: me.name, avatar: me.avatar, createdAt: new Date().toISOString(), likes: 0, comments: [], ...input };
        return { ...s, posts: [post, ...s.posts] };
      });
    },
    /** Toggles the demo customer's like. */
    likePost(id: string) {
      set((s) => ({
        ...s,
        posts: s.posts.map((p) => (p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p)),
      }));
    },
    commentPost(id: string, text: string, authorName?: string) {
      set((s) => {
        const name = authorName ?? s.members.find((m) => m.id === ME_ID)!.name;
        return { ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, { authorName: name, text }] } : p)) };
      });
    },
    moderatePost(id: string, action: "pin" | "hide" | "unflag" | "delete") {
      set((s) => ({
        ...s,
        posts:
          action === "delete"
            ? s.posts.filter((p) => p.id !== id)
            : s.posts.map((p) =>
                p.id !== id ? p : action === "pin" ? { ...p, pinned: !p.pinned } : action === "hide" ? { ...p, hidden: !p.hidden } : { ...p, flagged: undefined },
              ),
      }));
    },
    updateNudgeRule(id: string, patch: Partial<NudgeRule>) {
      set((s) => ({ ...s, nudgeRules: s.nudgeRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    },
    toggleAutomation(id: string) {
      set((s) => ({ ...s, automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) }));
    },
    updateMember(id: string, patch: Partial<Member>) {
      set((s) => ({ ...s, members: patchMember(s, id, patch) }));
    },
    addClass(c: ClassItem) {
      set((s) => ({ ...s, classes: [c, ...s.classes] }));
    },
    updateLiveSlot(id: string, patch: Partial<LiveSlot>) {
      set((s) => ({ ...s, liveSchedule: s.liveSchedule.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    },
    addLiveSlot(slot: Omit<LiveSlot, "id"> & { id?: string }) {
      set((s) => ({ ...s, liveSchedule: [...s.liveSchedule, { ...slot, id: slot.id ?? uid("slot") }] }));
    },
    removeLiveSlot(id: string) {
      set((s) => ({ ...s, liveSchedule: s.liveSchedule.filter((x) => x.id !== id) }));
    },
    setOnboarding(patch: Partial<Onboarding>) {
      setMe((me) => ({ onboarding: { ...me.onboarding, ...patch } }));
    },
    completeOnboarding() {
      set((s) => ({
        ...s,
        me: { ...s.me, onboarded: true },
        members: patchMember(s, ME_ID, { goals: s.me.onboarding.goals, level: s.me.onboarding.level }),
      }));
    },
    pauseMembership(weeks: number) {
      const until = new Date(Date.now() + weeks * 7 * 86_400_000).toISOString();
      set((s) => ({ ...s, me: { ...s.me, paused: { until } }, members: patchMember(s, ME_ID, { status: "paused" }) }));
    },
    cancelMembership(reason: string, freeText: string) {
      set((s) => ({
        ...s,
        cancellationReasons: [{ memberId: ME_ID, reason, freeText, date: new Date().toISOString() }, ...s.cancellationReasons],
        members: patchMember(s, ME_ID, { status: "cancelled", mrr: 0 }),
      }));
    },
    resumeMembership() {
      set((s) => ({
        ...s,
        me: { ...s.me, paused: undefined },
        members: patchMember(s, ME_ID, { status: "active", mrr: s.me.plan === "annual" ? 32.08 : 35 }),
      }));
    },
    switchPlan(plan: Plan) {
      set((s) => ({
        ...s,
        me: { ...s.me, plan },
        members: patchMember(s, ME_ID, { plan, mrr: plan === "annual" ? 32.08 : plan === "monthly" ? 35 : 0 }),
      }));
    },
    /** Logs the dumbbell weight (kg) Emma is currently lifting. */
    logWeight(kg: number) {
      setMe((me) => ({ weights: [...me.weights, { date: new Date().toISOString(), kg }] }));
    },
    joinChallenge(id: string) {
      set((s) =>
        s.me.joinedChallenges.includes(id)
          ? s
          : {
              ...s,
              me: { ...s.me, joinedChallenges: [...s.me.joinedChallenges, id] },
              challenges: s.challenges.map((c) => (c.id === id ? { ...c, participants: c.participants + 1 } : c)),
            },
      );
    },
    /** Toggles group membership. */
    joinGroup(id: string) {
      setMe((me) => ({ groups: toggle(me.groups, id) }));
    },
    addBuddy(memberId: string) {
      setMe((me) => ({ buddies: me.buddies.includes(memberId) ? me.buddies : [...me.buddies, memberId] }));
    },
    /** Logs a chat turn (Admin > Insights reads the user questions). Keeps the last 200. */
    addChatMessage(role: ChatMessage["role"], content: string, mode?: ChatMessage["mode"]) {
      set((s) => ({ ...s, chatLog: [...s.chatLog, { role, content, mode, at: new Date().toISOString() }].slice(-200) }));
    },
    /** Clears one widget's conversation (or all of them). */
    clearChat(mode?: ChatMessage["mode"]) {
      set((s) => ({ ...s, chatLog: mode ? s.chatLog.filter((m) => m.mode !== mode) : [] }));
    },
    updateSettings(patch: Partial<DemoSettings>) {
      set((s) => ({ ...s, settings: { ...s.settings, ...patch, prices: { ...s.settings.prices, ...patch.prices } } }));
    },
    setNudgeCap(cap: number) {
      set((s) => ({ ...s, nudgeCap: cap }));
    },
    /** Wipes saved demo data and reloads, so view-local usePersistentState values reset too. */
    resetDemo() {
      clearDemoStorage();
      location.reload();
    },
  };
}

export type StoreActions = ReturnType<typeof createActions>;
type StoreValue = StoreActions & {
  state: DemoState;
  /** false during SSR / first client render: date-sensitive UI should wait for it. */
  hydrated: boolean;
  /** Emma Clarke, the demo customer. */
  meMember: Member;
};

const StoreContext = createContext<StoreValue | null>(null);

export function clearDemoStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k === STORE_KEY || k.startsWith(PERSIST_PREFIX) || k === "cc-chatbot-log") // last: legacy chat log key
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => fresh(SSR_SEED_DATE));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const now = new Date();
    let saved: DemoState | null = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) saved = parseRebased(raw, now);
    } catch {}
    const seed = fresh(now);
    // Merge over a fresh seed so fields added since the save still exist.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from localStorage
    setState(saved ? { ...seed, ...saved, me: { ...seed.me, ...saved.me }, settings: { ...seed.settings, ...saved.settings } } : seed);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const actions = useMemo(() => createActions(setState), []);
  const meMember = state.members.find((m) => m.id === ME_ID)!;
  const value = useMemo(() => ({ ...actions, state, hydrated, meMember }), [actions, state, hydrated, meMember]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** View-local state persisted to localStorage (key is auto-prefixed). Returns [value, setValue, hydrated]. */
export function usePersistentState<T>(key: string, initial: T) {
  const fullKey = PERSIST_PREFIX + key;
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from localStorage
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [fullKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {}
  }, [fullKey, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
