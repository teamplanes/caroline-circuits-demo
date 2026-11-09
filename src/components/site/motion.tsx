"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

/** Fade + rise into view once. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up from 0 when scrolled into view. */
export function CountUp({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, { duration: 1.6, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {n.toLocaleString("en-GB")}
      {suffix}
    </span>
  );
}

/** Eyebrow + big headline used by every section. `title` is the headline. */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  dark,
  center,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <Reveal className={cn("mb-10 max-w-3xl", center && "mx-auto text-center")}>
      <p className={cn("mb-3 text-xs font-bold tracking-wider uppercase", dark ? "text-plum-200" : "text-plum-500")}>{eyebrow}</p>
      <h2 className={cn("text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl", dark ? "text-white" : "text-ink")}>{title}</h2>
      {sub && <p className={cn("mt-4 text-base sm:text-lg", dark ? "text-white/75" : "text-charcoal")}>{sub}</p>}
    </Reveal>
  );
}

/** Primary pill CTA: solid warm accent with a springy hover. */
export const ctaClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-warm-500 px-6 py-3.5 text-sm font-bold text-on-warm hover:bg-warm-600 transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-warm-400/40";

export const ghostCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.04] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40";

export const Section = ({ id, className, children }: { id?: string; className?: string; children: ReactNode }) => (
  <section id={id} className={cn("px-4 py-20 sm:py-28", className)}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);
