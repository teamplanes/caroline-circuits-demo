"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { images, navLinks, promo } from "@/data/site";
import { cn } from "@/lib/utils";
import { ctaClass } from "./motion";

/** Thin gradient bar: the discount is applied automatically, no code needed. */
export function PromoBanner() {
  return (
    <div className="relative overflow-hidden bg-plum-800 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
            {promo.percentOff}% off your first month, <span className="underline decoration-white/50 underline-offset-4">applied automatically</span>. No code needed.
    </div>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-[var(--demo-bar-h)] z-50 px-3 pt-3">
      <nav
        aria-label="Main"
        className="glass-light mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-2xl px-4"
      >
        <Link href="/" className="flex shrink-0 items-center rounded-lg focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:outline-none">
          <Image src={images.logo} alt="Caroline's Circuits" width={150} height={40} className="h-9 w-auto brightness-0" priority />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-plum-50 hover:text-plum-600">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/#free"
            className="hidden rounded-full border border-plum-200 px-4 py-2 text-sm font-bold text-plum-600 transition-colors hover:bg-plum-50 sm:inline-flex"
          >
            Free class
          </Link>
          <Link href="/checkout?plan=monthly" className={cn(ctaClass, "px-4 py-2.5 max-sm:text-xs")}>
            Join now
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="grid size-10 place-items-center rounded-full text-ink hover:bg-plum-50 focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:outline-none lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="mesh-bg border-none p-6 pt-16 text-white">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <ul className="space-y-1">
                {[...navLinks, { label: "Free class", href: "/#free" }].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-2xl font-black tracking-tight hover:bg-white/10">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <Link href="/checkout?plan=monthly" className={cn(ctaClass, "mt-6 w-full")}>
                Join now, {promo.percentOff}% off
              </Link>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
