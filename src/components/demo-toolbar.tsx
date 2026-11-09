"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, LayoutDashboard, RotateCcw, UserRound } from "lucide-react";
import { clearDemoStorage } from "@/lib/store";

const TABS = [
  { label: "Website", href: "/", icon: Globe },
  { label: "Customer", href: "/hub", icon: UserRound },
  { label: "Admin", href: "/admin", icon: LayoutDashboard },
];

/** Fixed demo switcher. Height is --demo-bar-h (44px); body is already offset by it. */
export function DemoToolbar() {
  const pathname = usePathname();
  const active = pathname.startsWith("/admin")
    ? "/admin"
    : pathname.startsWith("/hub")
      ? "/hub"
      : "/";

  function reset() {
    if (!confirm("Reset all demo data back to the starting state?")) return;
    clearDemoStorage();
    location.reload();
  }

  return (
    <header className="glass-dark bg-ink/55 fixed inset-x-0 top-0 z-[100] flex h-[var(--demo-bar-h)] items-center justify-between gap-2 rounded-none border-x-0 border-t-0 px-2 text-white after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-warm-400/70 after:to-transparent sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-plum-500 text-[11px] font-black tracking-tight"
        >
          CC
        </span>
        <span className="text-sm font-black tracking-tight max-lg:hidden">
          Caroline&rsquo;s Circuits
        </span>
        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase max-sm:hidden">
          Demo
        </span>
      </div>

      <nav
        aria-label="Demo view switcher"
        className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5"
      >
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="relative flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-white/70 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-warm-400 sm:px-4"
            >
              {isActive && (
                <motion.span
                  layoutId="demo-tab-pill"
                  className="absolute inset-0 rounded-full bg-plum-500"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className="relative size-3.5 max-sm:hidden" aria-hidden />
              <span className={`relative ${isActive ? "text-white" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={reset}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-white/70 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-warm-400 sm:px-3"
        aria-label="Reset demo data"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        <span className="max-md:hidden">Reset demo data</span>
      </button>
    </header>
  );
}
