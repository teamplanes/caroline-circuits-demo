"use client";

import Image from "next/image";
import { toast } from "sonner";
import { BadgePercent } from "lucide-react";
import { useStore } from "@/lib/store";
import { brand, images, plans, promo } from "@/data/site";
import { gbp } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "./kit";

const SWATCHES = [
  ["Plum", "#9B3F8C"],
  ["Orchid", "#D25BC0"],
  ["Mauve", "#814359"],
  ["Blush", "#F7E9F3"],
  ["Charcoal", "#45484E"],
  ["Ink", "#121014"],
];

/** Writes to state.settings in the shared store; Website pricing and checkout read it from there. */
export function Settings() {
  const { state, updateSettings } = useStore();
  const prices = state.settings.prices;
  const discount = state.settings.firstMonthDiscount;

  return (
    <>
      <PageHeader
        title="Studio"
        accent="settings"
        sub="Pricing, offers and how your brand looks everywhere."
        stats={[
          { label: "Monthly", value: gbp(prices.monthly) },
          { label: "Annual", value: gbp(prices.annual) },
          { label: "First-month offer", value: discount ? `${promo.percentOff}% off` : "Off" },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Plans & pricing">
          <ul className="space-y-3">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-plum-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    {p.name} {"badge" in p && p.badge && <span className="rounded-full bg-warm-500 px-2 text-[10px] font-bold text-white">{p.badge}</span>}
                  </p>
                  <p className="truncate text-xs text-charcoal/70">{p.billing}</p>
                </div>
                <label className="flex items-center gap-1 text-sm font-bold text-ink">
                  <span aria-hidden>£</span>
                  <span className="sr-only">{p.name} price in pounds</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={prices[p.id]}
                    key={prices[p.id]}
                    onBlur={(e) => {
                      const v = e.target.valueAsNumber;
                      if (!(v > 0)) return void (e.target.value = String(prices[p.id]));
                      if (v === prices[p.id]) return;
                      updateSettings({ prices: { ...prices, [p.id]: v } });
                      toast.success(`${p.name} price saved`, { description: "Website pricing and checkout now use it." });
                    }}
                    className="h-9 w-24 rounded-xl text-right font-bold"
                  />
                  <span className="text-xs font-medium text-charcoal/60">/{p.period}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-charcoal/60">
            Annual = {gbp(prices.annual / 12, true)}/month, saving {gbp(Math.max(0, prices.monthly * 12 - prices.annual))} a year.
          </p>
        </Panel>

        <section className="mesh-bg grain relative overflow-hidden rounded-3xl p-5 text-white">
          <div className="relative z-[2] flex items-start justify-between gap-4">
            <div>
              <BadgePercent className="mb-2 size-8 text-warm-400" aria-hidden />
              <p className="text-lg font-black">First-month discount</p>
              <p className="mt-1 text-sm text-white/75">
                {discount
                  ? `${promo.percentOff}% off the first month is applied automatically at checkout. No code needed.`
                  : `Off. Members can still type ${promo.code} at checkout.`}
              </p>
              {discount && (
                <p className="glass mt-4 inline-block rounded-2xl px-4 py-2 text-sm">
                  First month <s className="text-white/60">{gbp(prices.monthly)}</s>{" "}
                  <strong className="text-xl">{gbp((prices.monthly * (100 - promo.percentOff)) / 100, true)}</strong>
                </p>
              )}
            </div>
            <Switch
              checked={discount}
              onCheckedChange={(v) => {
                updateSettings({ firstMonthDiscount: v });
                toast.success(v ? "Discount auto-applied at checkout" : "Discount off");
              }}
              aria-label="Auto-apply first-month discount"
              className="data-unchecked:bg-white/30"
            />
          </div>
        </section>

        <Panel title="Branding preview" className="lg:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Image src={images.logo} alt={`${brand.name} logo`} width={160} height={48} className="h-10 w-auto" />
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {SWATCHES.map(([name, hex]) => (
                  <li key={name} className="overflow-hidden rounded-2xl border border-plum-100">
                    <div className="h-14" style={{ background: hex }} />
                    <p className="px-2 pt-1.5 text-xs font-bold text-ink">{name}</p>
                    <p className="px-2 pb-1.5 font-mono text-[10px] text-charcoal/60">{hex}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-charcoal/70">
                Headlines: <strong className="font-black">Montserrat Black</strong> · Accent: <span className="font-bold text-warm-600">Terracotta</span>
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl">
              <Image src={images.heroBanner} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-plum-950/90 via-plum-900/50 to-transparent" />
              <div className="relative flex min-h-64 flex-col justify-end p-5 text-white">
                <h3 className="text-3xl leading-none font-black tracking-tight">
                  Get stronger at home
                </h3>
                <p className="mt-2 text-sm text-white/80">4 live classes a week · hundreds on demand</p>
                <span className="mt-4 inline-flex w-fit rounded-full bg-plum-500 px-5 py-2.5 text-sm font-bold">
                  Start free trial
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
