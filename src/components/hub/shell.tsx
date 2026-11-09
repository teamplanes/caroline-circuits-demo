"use client";

import { createContext, Suspense, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, Home, Library, PauseCircle, TrendingUp, UserRound, Users } from "lucide-react";
import { ChatWidget } from "@/components/ai/chat-widget";
import { computeNudges } from "@/lib/nudges";
import { usePersistentState, useStore } from "@/lib/store";
import type { NudgeCategory } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNow } from "./bits";
import { Onboarding } from "./onboarding";

const NAV = [
  { href: "/hub", label: "Home", icon: Home },
  { href: "/hub/library", label: "Library", icon: Library },
  { href: "/hub/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/hub/community", label: "Community", icon: Users },
  { href: "/hub/progress", label: "Progress", icon: TrendingUp },
  { href: "/hub/account", label: "Account", icon: UserRound },
];

export const NOTIF_CATEGORIES: { id: NudgeCategory; blurb: string }[] = [
  { id: "Consistency", blurb: "Streak reminders and catch-ups" },
  { id: "Balance", blurb: "Suggestions to train your whole body" },
  { id: "Progression", blurb: "When you're ready to level up" },
  { id: "Personalisation", blurb: "Classes picked for you" },
  { id: "Recognition", blurb: "Milestones and monthly recaps" },
  { id: "Community", blurb: "Buddies, challenges and Q&As" },
];
export type NotifPrefs = Record<string, { push: boolean; email: boolean }>;
const DEFAULT_PREFS: NotifPrefs = Object.fromEntries(
  NOTIF_CATEGORIES.map((c) => [c.id, { push: true, email: c.id === "Recognition" || c.id === "Community" }]),
);

type HubCtx = { openOnboarding: () => void; prefs: NotifPrefs; setPrefs: Dispatch<SetStateAction<NotifPrefs>> };
const HubContext = createContext<HubCtx>({ openOnboarding: () => {}, prefs: DEFAULT_PREFS, setPrefs: () => {} });
export const useHub = () => useContext(HubContext);

/** Nudges for the demo member, minus categories she switched off ("push" = in-app). */
export function useNudges(now: Date | null) {
  const { state } = useStore();
  const { prefs } = useHub();
  return useMemo(() => (now ? computeNudges(state, now).filter((n) => prefs[n.category]?.push !== false) : []), [state, now, prefs]);
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/hub") return pathname === "/hub";
  if (href === "/hub/library") return pathname.startsWith("/hub/library") || pathname.startsWith("/hub/class");
  return pathname.startsWith(href);
}

function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Member hub" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition outline-none focus-visible:ring-3 focus-visible:ring-plum-300",
              active ? "text-white" : "text-charcoal hover:bg-white/70",
            )}
          >
            {active && (
              <motion.span
                layoutId="hub-side-pill"
                className="absolute inset-0 rounded-2xl bg-plum-500 shadow-[0_8px_24px_rgb(155_63_140/0.35)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Member hub"
      className="glass-light fixed inset-x-3 bottom-3 z-40 flex justify-between rounded-3xl px-2 py-1.5 lg:hidden"
    >
      {NAV.filter((n) => n.href !== "/hub/account").map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-plum-300",
              active ? "text-plum-700" : "text-charcoal/70",
            )}
          >
            <span className={cn("relative grid h-7 w-12 place-items-center rounded-full transition", active && "text-white")}>
              {active && (
                <motion.span
                  layoutId="hub-bottom-pill"
                  className="absolute inset-0 rounded-full bg-plum-500"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <Icon className="relative size-[18px]" aria-hidden />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationsBell() {
  const now = useNow();
  const nudges = useNudges(now);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Notifications (${nudges.length})`}
        className="relative grid size-10 place-items-center rounded-full border border-white/70 bg-white/70 text-plum-800 shadow-sm backdrop-blur-xl transition hover:bg-white focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none"
      >
        <Bell className="size-[18px]" aria-hidden />
        {nudges.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-warm-500 text-[10px] font-black text-white ring-2 ring-white">
            {nudges.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-white/60 bg-white/85 p-0 shadow-[0_16px_48px_rgb(155_63_140/0.2)] ring-0 backdrop-blur-xl"
      >
        <p className="border-b border-plum-100 px-4 py-3 text-sm font-extrabold">For you</p>
        <div className="max-h-[60vh] divide-y divide-plum-100/70 overflow-y-auto">
          {nudges.length === 0 && <p className="text-muted-foreground p-4 text-sm">All caught up.</p>}
          {nudges.map((n) => (
            <DropdownMenuItem
              key={n.id}
              render={<Link href={n.cta.href ?? "/hub"} />}
              className="block rounded-none px-4 py-3 focus:bg-plum-50"
            >
              <span className="text-plum-600 block text-[10px] font-bold tracking-widest uppercase">{n.category}</span>
              <span className="block text-sm font-bold">{n.title}</span>
              <span className="text-muted-foreground block text-xs">{n.message}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HubShell({ children }: { children: ReactNode }) {
  const { state, hydrated, meMember, resumeMembership } = useStore();
  const [replay, setReplay] = useState(false);
  const [prefs, setPrefs] = usePersistentState<NotifPrefs>("notif-prefs", DEFAULT_PREFS);
  const showOnboarding = (hydrated && !state.me.onboarded) || replay;
  const ctx = useMemo(() => ({ openOnboarding: () => setReplay(true), prefs, setPrefs }), [prefs, setPrefs]);
  // Member status is the source of truth (the admin can pause or cancel her too); me.paused only holds the date.
  const paused = hydrated && meMember.status === "paused";

  return (
    <HubContext.Provider value={ctx}>
      <div className="relative min-h-[calc(100vh-var(--demo-bar-h))] overflow-x-clip bg-gradient-to-br from-plum-50 via-white to-blush">
        {/* Soft colour behind the glass */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        </div>

        <div className="relative mx-auto flex max-w-[1400px] gap-6 px-4 pb-28 lg:px-6 lg:pb-12">
          <aside className="glass-light sticky top-[calc(var(--demo-bar-h)+16px)] mt-4 hidden h-[calc(100vh-var(--demo-bar-h)-32px)] w-60 shrink-0 flex-col rounded-3xl p-4 lg:flex">
            <Link href="/hub" className="mb-6 flex items-center gap-2 px-2 pt-1">
              <span className="grid size-9 place-items-center rounded-xl bg-plum-500 text-xs font-black text-white">CC</span>
              <span className="leading-tight">
                <span className="block text-sm font-black tracking-tight">Caroline&apos;s Circuits</span>
                <span className="text-muted-foreground block text-[11px] font-semibold">Member hub</span>
              </span>
            </Link>
            <Suspense fallback={null}>
              <SideNav />
            </Suspense>
            <Link href="/hub/account" className="mt-auto flex items-center gap-3 rounded-2xl bg-white/70 p-3 transition hover:bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host not in remotePatterns */}
              <img src={meMember.avatar} alt="" className="size-10 rounded-full bg-blush" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-bold">{meMember.name}</span>
                <span className="text-muted-foreground block text-xs capitalize">
                  {state.me.plan} · {meMember.status}
                </span>
              </span>
            </Link>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="sticky top-[var(--demo-bar-h)] z-30 -mx-4 mb-4 flex items-center justify-between gap-3 rounded-b-3xl border-b border-white/60 bg-white/70 px-4 py-3 shadow-[0_8px_24px_rgb(155_63_140/0.08)] backdrop-blur-xl lg:static lg:mx-0 lg:mb-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:pt-6 lg:shadow-none lg:backdrop-blur-none">
              <Link href="/hub" className="flex items-center gap-2 lg:hidden">
                <span className="grid size-9 place-items-center rounded-xl bg-plum-500 text-xs font-black text-white">CC</span>
                <span className="text-sm font-black tracking-tight">Member hub</span>
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <NotificationsBell />
                <Link href="/hub/account" aria-label="Account" className="lg:hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dicebear host not in remotePatterns */}
                  <img src={meMember.avatar} alt="" className="size-10 rounded-full border-2 border-white bg-blush shadow-sm" />
                </Link>
              </div>
            </div>

            {paused && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-plum-200 bg-plum-50/90 px-4 py-3 text-sm">
                <PauseCircle className="text-plum-600 size-5" aria-hidden />
                <p className="flex-1">
                  Your membership is paused{state.me.paused ? <> until <strong>{shortDate(state.me.paused.until)}</strong></> : null}. Your progress and favourites are safe.
                </p>
                <button type="button" onClick={resumeMembership} className="text-plum-700 font-bold underline underline-offset-4">
                  Resume now
                </button>
              </div>
            )}

            <main id="main">{children}</main>
          </div>
        </div>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
        {/* Below lg, lift the chat bubble above the bottom tab bar so it doesn't cover "Progress". */}
        <div className="max-lg:[&>button]:bottom-24">
          <ChatWidget mode="support" floating />
        </div>
        <AnimatePresence>{showOnboarding && <Onboarding onClose={() => setReplay(false)} />}</AnimatePresence>
      </div>
    </HubContext.Provider>
  );
}
