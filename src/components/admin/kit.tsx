"use client";

// Small shared building blocks for the admin portal: page header, panels, AI badge, tiny charts.
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

const DAY = 86_400_000;
// Matches the store's SSR seed date so server and first client render agree.
const SSR_NOW = new Date("2026-11-09T12:00:00Z");

/** Current time, but only after mount (Cache Components forbid new Date() during prerender). */
export function useNow(tickMs?: number) {
  const [now, setNow] = useState(SSR_NOW);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- swap the fixed SSR date for the real one
    setNow(new Date());
    if (!tickMs) return;
    const t = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(t);
  }, [tickMs]);
  return now;
}

export const daysSince = (iso: string, now: Date) => Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);

/** "At risk" = not cancelled and no class in 14+ days. */
export const isAtRisk = (m: Member, now: Date) => m.status !== "cancelled" && daysSince(m.lastActiveAt, now) >= 14;

export type HeaderStat = { label: string; value: ReactNode; onClick?: () => void; active?: boolean };

/** Local-time month label for "YYYY-MM" (avoids the UTC parse that shows the previous month west of UTC). */
export const monthLabel = (ym: string, opts: Intl.DateTimeFormatOptions = { month: "short" }) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", opts);
};

/** Compact money for tight spaces: £110.6k. */
export const gbpCompact = (n: number) => (Math.abs(n) >= 10_000 ? `£${(n / 1000).toFixed(1)}k` : `£${Math.round(n).toLocaleString("en-GB")}`);

/** Plum mesh band with serif accent and optional glass stat chips (clickable when onClick is given). */
export function PageHeader({ title, accent, sub, actions, stats }: { title: string; accent?: string; sub?: string; actions?: ReactNode; stats?: HeaderStat[] }) {
  return (
    <header className="mesh-bg grain relative mb-6 overflow-hidden rounded-3xl p-5 text-white sm:p-6">
      <div className="relative z-[2] flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {title} {accent}
          </h1>
          {sub && <p className="mt-1 max-w-xl text-sm text-white/75">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {stats && stats.length > 0 && (
        <div className="relative z-[2] mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {stats.map((s) => {
            const body = (
              <>
                <span className="block truncate text-xl font-black tabular-nums sm:text-2xl">{s.value}</span>
                <span className="block truncate text-[11px] font-semibold text-white/75">{s.label}</span>
              </>
            );
            const cls = cn("glass min-w-0 rounded-2xl px-4 py-2.5 text-left sm:min-w-32", s.active && "bg-white/25 ring-2 ring-warm-400");
            return s.onClick ? (
              <button key={s.label} type="button" onClick={s.onClick} aria-pressed={!!s.active} className={cn(cls, "outline-none transition hover:scale-[1.03] hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white")}>
                {body}
              </button>
            ) : (
              <div key={s.label} className={cls}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("rounded-3xl border border-plum-100 bg-white p-4 shadow-[0_1px_2px_rgb(42_15_38/0.04),0_12px_32px_-16px_rgb(155_63_140/0.18)] sm:p-5", className)}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-extrabold tracking-tight text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/** Primary CTA look: solid warm accent + lift on hover. Add to Button/Link className. */
export const ctaClass = "bg-warm-500 text-on-warm hover:bg-warm-600 transition hover:scale-[1.03]";

export { AiBadge } from "@/components/ai/ai-badge";

export function Pill({ children, tone = "plum" }: { children: ReactNode; tone?: "plum" | "green" | "amber" | "red" | "grey" }) {
  const tones = {
    plum: "bg-plum-50 text-plum-700 ring-plum-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    grey: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export const statusTone = (s: Member["status"]) => (s === "active" ? "green" : s === "trial" ? "plum" : s === "paused" ? "amber" : "red");

/** Line sparkline with soft area fill. `values` drawn left to right. */
export function Sparkline({ values, className, stroke = "currentColor" }: { values: number[]; className?: string; stroke?: string }) {
  const w = 100;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 4) - 2]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-full overflow-visible", className)} aria-hidden>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={stroke} opacity={0.15} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Tiny bar chart made of divs. */
export function MiniBars({ values, className, barClass = "bg-current" }: { values: number[]; className?: string; barClass?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex h-8 items-end gap-0.5", className)} aria-hidden>
      {values.map((v, i) => (
        <div key={i} className={cn("flex-1 rounded-t-sm", barClass, i === values.length - 1 ? "opacity-100" : "opacity-50")} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

/** Horizontal labelled bars, e.g. cancellation reasons. */
export function HBars({ rows, format = String }: { rows: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate font-medium text-charcoal">{r.label}</span>
            <span className="font-bold text-ink tabular-nums">{format(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-plum-50">
            <div className="h-full rounded-full bg-plum-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Native select styled to match. Native = free mobile picker + accessibility. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 rounded-xl border border-plum-100 bg-white px-3 text-sm font-medium text-ink outline-none focus-visible:border-plum-400 focus-visible:ring-3 focus-visible:ring-plum-500/25",
        className,
      )}
      {...props}
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-plum-200 p-6 text-center text-sm text-charcoal/70">{children}</p>;
}
