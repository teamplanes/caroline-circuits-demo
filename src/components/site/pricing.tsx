"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { membershipIncludes, plans, promo } from "@/data/site";
import { gbp } from "@/lib/format";
import { Reveal, Section, SectionHeading } from "./motion";

/** First-payment price after the automatic promo (monthly only). */
export const firstMonth = (price: number) => Math.round(price * (1 - promo.percentOff / 100) * 100) / 100;

export function Pricing() {
  const [monthly, annual] = plans;
  const monthlyFirst = firstMonth(monthly.price);

  return (
    <Section id="pricing" className="mesh-bg grain overflow-hidden text-white">
      <div className="relative z-10">
        <SectionHeading
          dark
          center
          eyebrow="Simple pricing"
          title={
            <>
              One membership. Every class.
            </>
          }
          sub="Rolling membership, available worldwide. Cancel or pause anytime."
        />

        <div className="mx-auto grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {/* Monthly */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-[2rem] border border-white/15 bg-white/[0.06] p-8">
              <p className="text-sm font-bold tracking-widest text-plum-100 uppercase">{monthly.name}</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-6xl font-black tracking-tighter">{gbp(monthlyFirst, !Number.isInteger(monthlyFirst))}</span>
                <div className="pb-2">
                  <s className="block text-white/50">{gbp(monthly.price)}</s>
                  <span className="text-sm text-white/75">first month</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-white/70">
                Then {gbp(monthly.price)}/month. {promo.percentOff}% off applied automatically, no code.
              </p>
              <Features list={monthly.features} />
              <Link
                href={`/checkout?plan=${monthly.id}`}
                className="mt-8 flex w-full items-center justify-center rounded-full border border-white/40 py-4 font-black transition hover:scale-[1.03] hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                {monthly.cta}
              </Link>
            </div>
          </Reveal>

          {/* Annual: featured card with a warm border */}
          <Reveal delay={0.1} className="h-full">
            <div className="relative h-full rounded-[2rem] bg-warm-500 p-[2px] md:-my-4">
              <div className="flex h-full flex-col rounded-[calc(2rem-2px)] bg-plum-900 p-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold tracking-widest uppercase">{annual.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-warm-500 px-3 py-1 text-xs font-bold text-on-warm">
                    Best value · {annual.badge}
                  </span>
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-6xl font-black tracking-tighter">{gbp(annual.price)}</span>
                  <div className="pb-2">
                    <s className="block text-white/50">{gbp(annual.wasPrice!)}</s>
                    <span className="text-sm text-white/75">per year</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/80">
                  That&rsquo;s {gbp(annual.price / 12, true)}/month. 12 months for the price of 11, save {gbp(annual.saving!)}.
                </p>
                <Features list={annual.features} />
                <Link
                  href={`/checkout?plan=${annual.id}`}
                  className="mt-8 flex w-full items-center justify-center rounded-full bg-white py-4 font-black text-plum-700 shadow-xl transition hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
                >
                  {annual.cta}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <p className="mt-8 text-center text-xs text-white/60">
          Both plans include everything below · Secure checkout · Apple Pay · Google Pay · Cancel anytime
        </p>
        <ul className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-2">
          {membershipIncludes.map((f) => (
            <li key={f} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function Features({ list }: { list: string[] }) {
  return (
    <ul className="mt-6 grid flex-1 gap-2.5">
      {list.map((f) => (
        <li key={f} className="flex gap-2.5 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-plum-200" aria-hidden /> {f}
        </li>
      ))}
    </ul>
  );
}
