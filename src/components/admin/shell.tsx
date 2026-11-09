"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarClock,
  ChevronsLeft,
  Clapperboard,
  Home,
  Mail,
  MessagesSquare,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePersistentState, useStore } from "@/lib/store";
import { images } from "@/data/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Home", icon: Home },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/content", label: "Content", icon: Clapperboard },
  { href: "/admin/comms", label: "Comms", icon: Mail },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/admin/community", label: "Community", icon: MessagesSquare },
  { href: "/admin/insights", label: "Insights", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
const MOBILE_MAIN = NAV.slice(0, 4);
const MOBILE_MORE = NAV.slice(4);

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const [collapsed, setCollapsed, sidebarReady] = usePersistentState("admin-sidebar-collapsed", false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const flagged = state.posts.filter((p) => p.flagged).length;

  return (
    <div className="flex min-h-[calc(100dvh-var(--demo-bar-h))] bg-[linear-gradient(180deg,var(--color-plum-50),#fff_40%)]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          // No width animation until the saved state loads, so a collapsed sidebar doesn't visibly slide shut on reload.
          "sticky top-[var(--demo-bar-h)] hidden h-[calc(100dvh-var(--demo-bar-h))] shrink-0 flex-col border-r border-plum-100 bg-white/70 backdrop-blur-xl md:flex",
          sidebarReady && "transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-plum-500 text-xs font-black text-white shadow-[0_6px_20px_rgb(155_63_140/0.35)]">
            CC
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-ink">Studio</p>
              <p className="truncate text-[11px] text-charcoal/70">Caroline&apos;s Circuits</p>
            </div>
          )}
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-plum-400",
                isActive(href) ? "bg-plum-500 text-white shadow-[0_6px_20px_rgb(155_63_140/0.3)]" : "text-charcoal hover:bg-plum-50 hover:text-plum-700",
              )}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
              {label === "Community" && flagged > 0 && (
                <span className={cn("ml-auto grid min-w-5 place-items-center rounded-full bg-warm-500 px-1 text-[10px] font-bold text-white", collapsed && "absolute top-1 right-1")}>
                  {flagged}
                </span>
              )}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 p-3">
          {!collapsed && (
            <div className="flex items-center gap-2 rounded-2xl bg-plum-50 p-2">
              <Image src={images.about} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">Caroline Idiens</p>
                <p className="truncate text-[11px] text-charcoal/70">Owner</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-charcoal/70 outline-none hover:bg-plum-50 focus-visible:ring-2 focus-visible:ring-plum-400"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} aria-hidden />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-6 md:pb-10 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Admin"
        className="glass-light fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl p-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {MOBILE_MAIN.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
              isActive(href) ? "bg-plum-500 text-white" : "text-charcoal",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            "relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
            MOBILE_MORE.some((n) => isActive(n.href)) ? "bg-plum-500 text-white" : "text-charcoal",
          )}
        >
          <MoreHorizontal className="size-5" aria-hidden />
          More
          {flagged > 0 && <span className="absolute top-1 right-3 size-2 rounded-full bg-warm-500" aria-label={`${flagged} flagged posts`} />}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle className="font-extrabold">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4">
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
                  isActive(href) ? "border-plum-500 bg-plum-500 text-white" : "border-plum-100 bg-plum-50/60 text-ink",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
                {label === "Community" && flagged > 0 && <span className="ml-auto rounded-full bg-warm-500 px-1.5 text-[10px] text-white">{flagged}</span>}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
