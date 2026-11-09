"use client";

import { toast } from "sonner";
import { BellRing, CalendarCheck2, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { AREA_LABEL } from "@/lib/nudges";
import { dayName, formatSlotLocal } from "@/lib/time";
import type { BodyArea, LiveSlot } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NativeSelect, PageHeader, Panel, Empty, ctaClass, useNow } from "./kit";

const DAYS = [1, 2, 3, 4, 5, 6, 0] as const; // Monday first

export function Schedule() {
  const { state, hydrated, updateLiveSlot, addLiveSlot, removeLiveSlot } = useStore();
  const now = useNow();
  const slots = [...state.liveSchedule].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.timeUK.localeCompare(b.timeUK));

  const add = () => {
    addLiveSlot({ day: 4, timeUK: "18:00", title: "New live class", bodyArea: "full", durationMin: 30, instructor: "Caroline" });
    toast.success("Slot added", { description: "Edit it below. It's already on the website schedule." });
  };
  const remove = (s: LiveSlot) => {
    removeLiveSlot(s.id);
    toast(`Removed ${s.title}`, {
      description: "Members with reminders have been notified.",
      action: { label: "Undo", onClick: () => addLiveSlot(s) },
    });
  };

  return (
    <>
      <PageHeader
        title="Weekly"
        accent="schedule"
        sub="Times are UK. Members see them in their own timezone."
        stats={[
          { label: "Classes a week", value: slots.length },
          { label: "Live", value: slots.filter((s) => !s.prerecorded).length },
          { label: "Minutes a week", value: slots.reduce((n, s) => n + s.durationMin, 0) },
        ]}
        actions={
          <Button onClick={add} className={cn("h-10 rounded-full px-4 font-bold", ctaClass)}>
            <Plus aria-hidden /> Add slot
          </Button>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-plum-100 bg-blush/60 p-4 text-sm text-plum-800">
        <CalendarCheck2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          Changes save instantly and update the website schedule, the member hub, <strong>calendar invites and reminders automatically</strong>. No need to email anyone.
        </p>
      </div>

      {/* Week strip */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => {
          const today = slots.filter((s) => s.day === d);
          return (
            <div key={d} className="min-h-24 rounded-2xl border border-plum-100 bg-white p-1.5 sm:p-2">
              <p className="mb-1 text-center text-[10px] font-bold tracking-wider text-charcoal/60 uppercase">{dayName(d, true)}</p>
              {today.map((s) => (
                <div key={s.id} className={`mb-1 rounded-lg px-1 py-1 text-center text-[9px] font-bold leading-tight sm:text-[11px] ${s.prerecorded ? "bg-plum-100 text-plum-700" : "bg-plum-500 text-white"}`}>
                  <span className="block tabular-nums">{s.timeUK}</span>
                  <span className="block truncate max-sm:hidden">{s.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {slots.length === 0 && <Empty>No slots yet. Add your first live class.</Empty>}
      <div className="grid gap-3 lg:grid-cols-2">
        {slots.map((s) => (
          <Panel key={s.id}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="col-span-2 space-y-1 text-xs font-semibold text-charcoal/80">
                Title
                <Input value={s.title} onChange={(e) => updateLiveSlot(s.id, { title: e.target.value })} className="h-9 rounded-xl text-sm font-bold" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-charcoal/80">
                Day
                <NativeSelect value={s.day} onChange={(e) => updateLiveSlot(s.id, { day: Number(e.target.value) as LiveSlot["day"] })} className="w-full">
                  {DAYS.map((d) => <option key={d} value={d}>{dayName(d)}</option>)}
                </NativeSelect>
              </label>
              <label className="space-y-1 text-xs font-semibold text-charcoal/80">
                Time (UK)
                <Input type="time" value={s.timeUK} onChange={(e) => e.target.value && updateLiveSlot(s.id, { timeUK: e.target.value })} className="h-9 rounded-xl" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-charcoal/80">
                Body area
                <NativeSelect value={s.bodyArea} onChange={(e) => updateLiveSlot(s.id, { bodyArea: e.target.value as BodyArea })} className="w-full">
                  {(Object.keys(AREA_LABEL) as BodyArea[]).map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
                </NativeSelect>
              </label>
              <label className="space-y-1 text-xs font-semibold text-charcoal/80">
                Minutes
                {/* Uncontrolled so the field can be cleared while typing; commits on blur. */}
                <Input
                  type="number"
                  min={5}
                  max={90}
                  key={s.durationMin}
                  defaultValue={s.durationMin}
                  onBlur={(e) => {
                    const v = e.target.valueAsNumber;
                    if (v >= 5 && v <= 90) updateLiveSlot(s.id, { durationMin: v });
                    else e.target.value = String(s.durationMin);
                  }}
                  className="h-9 rounded-xl"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold text-charcoal/80">
                Instructor
                <Input value={s.instructor ?? ""} onChange={(e) => updateLiveSlot(s.id, { instructor: e.target.value })} className="h-9 rounded-xl" />
              </label>
              <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-charcoal/80">
                <Switch checked={!!s.prerecorded} onCheckedChange={(v) => updateLiveSlot(s.id, { prerecorded: v })} aria-label={`${s.title} is pre-recorded`} />
                Pre-recorded
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-plum-50 pt-3">
              <p className="flex items-center gap-1.5 text-xs text-charcoal/70">
                <BellRing className="size-3.5 text-plum-500" aria-hidden />
                Next: {hydrated ? formatSlotLocal(s, now, "Europe/London") : "…"} · reminders 15 min before
              </p>
              <Button variant="destructive" size="sm" onClick={() => remove(s)} className="rounded-full" aria-label={`Remove ${s.title}`}>
                <Trash2 aria-hidden /> Remove
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
