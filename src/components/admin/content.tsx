"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Copy, Loader2, Search, Sparkles, UploadCloud, Wand2, X } from "lucide-react";
import { useStore, usePersistentState } from "@/lib/store";
import { aiDraftContent, aiTagClass } from "@/lib/ai-client";
import { images } from "@/data/site";
import { AREA_LABEL } from "@/lib/nudges";
import type { BodyArea, ClassItem, Level } from "@/lib/types";
import { num, shortDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiBadge, NativeSelect, PageHeader, Panel, Pill, ctaClass, useNow } from "./kit";

const AREAS = Object.keys(AREA_LABEL) as BodyArea[];
const LEVELS: Level[] = ["beginner", "all", "intermediate"];
const blankForm = { title: "", description: "", bodyArea: "full" as BodyArea, level: "all" as Level, equipment: "", tags: "", durationMin: 30, publishAt: "", chapters: [] as { label: string; atSec: number }[] };

export function Content() {
  const { state, hydrated } = useStore();
  const now = useNow();
  const [autoPublish, setAutoPublish] = usePersistentState("live-autopublish", true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "plays">("new");

  const rows = state.classes
    .filter((c) => !q || `${c.title} ${c.series} ${c.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "plays" ? b.plays - a.plays : b.publishedAt.localeCompare(a.publishedAt)));
  const totalPlays = state.classes.reduce((s, c) => s + c.plays, 0);
  const scheduledCount = hydrated ? state.classes.filter((c) => new Date(c.publishedAt) > now).length : 0;

  return (
    <>
      <PageHeader
        title="Content"
        accent="library"
        sub="Upload, tag and schedule classes. AI does the boring bits."
        stats={[
          { label: "Classes", value: num(state.classes.length) },
          { label: "Total plays", value: num(totalPlays) },
          { label: "Scheduled", value: scheduledCount },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <Uploader />
          <Panel>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-ink">Live classes auto-record &amp; auto-publish</p>
                <p className="mt-1 text-xs text-charcoal/70">
                  {autoPublish ? "Recordings appear in the library and the member hub the moment the live class ends, with chapters." : "Recordings wait in drafts for you to publish."}
                </p>
                <p className="mt-1 text-[11px] text-charcoal/50">Demo setting: no live recordings are made here.</p>
              </div>
              <Switch checked={autoPublish} onCheckedChange={(v) => { setAutoPublish(v); toast.success(v ? "Auto-publish on" : "Auto-publish off"); }} aria-label="Auto-record and auto-publish live classes" />
            </div>
          </Panel>
          <Drafter />
        </div>

        <Panel
          className="lg:col-span-3"
          title="Library"
          action={
            <NativeSelect aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as "new" | "plays")} className="h-8 text-xs">
              <option value="new">Newest</option>
              <option value="plays">Most played</option>
            </NativeSelect>
          }
        >
          <label className="relative mb-3 block">
            <span className="sr-only">Search classes</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-charcoal/50" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, series or tag" className="h-9 rounded-xl border-plum-100 pl-9" />
          </label>
          <ul className="max-h-[720px] divide-y divide-plum-50 overflow-y-auto">
            {rows.map((c) => {
              const scheduled = hydrated && new Date(c.publishedAt) > now;
              return (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <Image src={c.image} alt="" width={56} height={56} className="size-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{c.title}</p>
                    <p className="truncate text-xs text-charcoal/70">
                      {c.durationMin} min · {AREA_LABEL[c.bodyArea]} · {c.level} · {c.instructor}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {scheduled ? (
                        <Pill tone="amber">
                          <CalendarClock className="mr-1 size-3" aria-hidden /> {shortDate(c.publishedAt)}
                        </Pill>
                      ) : (
                        <Pill tone="green">published</Pill>
                      )}
                      {c.isLive && <Pill>live recording</Pill>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-ink tabular-nums">{num(c.plays)}</p>
                    <p className="text-[10px] text-charcoal/60">plays</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Uploader() {
  const { addClass } = useStore();
  const [file, setFile] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [f, setF] = useState(blankForm);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  function pick(name: string) {
    setFile(name);
    const title = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setF({ ...blankForm, title, description: "" });
  }

  async function autoTag() {
    setTagging(true);
    try {
      const r = await aiTagClass({ title: f.title, description: f.description });
      setF((x) => ({
        ...x,
        bodyArea: AREAS.includes(r.bodyArea as BodyArea) ? (r.bodyArea as BodyArea) : x.bodyArea,
        level: LEVELS.includes(r.level as Level) ? (r.level as Level) : x.level,
        equipment: r.equipment.join(", "),
        tags: r.tags.join(", "),
        chapters: r.chapters,
      }));
      toast.success("Tagged by AI", { description: "Check the details, then publish." });
    } catch {
      toast.error("Auto-tag failed, fill it in by hand");
    } finally {
      setTagging(false);
    }
  }

  function publish(e: React.FormEvent) {
    e.preventDefault();
    const publishedAt = f.publishAt ? new Date(f.publishAt).toISOString() : new Date().toISOString();
    const item: ClassItem = {
      id: `upload-${Date.now().toString(36)}`,
      title: f.title.trim(),
      series: "New uploads",
      bodyArea: f.bodyArea,
      durationMin: Number(f.durationMin) || 30,
      level: f.level,
      equipment: f.equipment.split(",").map((s) => s.trim()).filter(Boolean),
      instructor: "Caroline",
      image: images.classes[Math.floor(Math.random() * images.classes.length)],
      description: f.description.trim() || `${f.durationMin} minute class with Caroline.`,
      chapters: f.chapters.length ? f.chapters : [{ label: "Warm-up", atSec: 0 }],
      publishedAt,
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
      plays: 0,
    };
    addClass(item);
    toast.success(f.publishAt ? `Scheduled for ${shortDate(publishedAt)}` : "Published to the library", { description: item.title });
    setFile(null);
    setF(blankForm);
  }

  if (!file) {
    return (
      <label
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) pick(dropped.name);
        }}
        className={cn(
          "border-2 border-warm-300 group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl p-8 text-center transition focus-within:ring-3 focus-within:ring-plum-500/30",
          drag && "scale-[1.02] ring-4 ring-warm-400/40",
        )}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-plum-500 text-white shadow-[0_10px_30px_rgb(155_63_140/0.35)] transition group-hover:scale-110">
          <UploadCloud className="size-7" aria-hidden />
        </span>
        <p className="text-base font-black text-ink">Drop a class video here</p>
        <p className="text-xs text-charcoal/70">or tap to choose · MP4, MOV · AI tags it for you</p>
        <input type="file" accept="video/*" className="sr-only" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0].name)} />
        <span className="mt-1 text-[11px] text-charcoal/50">Demo: nothing is actually uploaded</span>
      </label>
    );
  }

  return (
    <Panel
      title={<span className="flex items-center gap-2 truncate">New class <span className="truncate text-xs font-medium text-charcoal/60">{file}</span></span>}
      action={
        <button type="button" onClick={() => setFile(null)} aria-label="Cancel upload" className="rounded-lg p-1 text-charcoal/60 hover:bg-plum-50">
          <X className="size-4" />
        </button>
      }
    >
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-plum-50">
        <div className="h-full w-full animate-pulse rounded-full bg-plum-500" />
      </div>
      <form onSubmit={publish} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-title">Title</Label>
          <Input id="c-title" required value={f.title} onChange={(e) => set("title", e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-desc">Description</Label>
          <Textarea id="c-desc" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. 30 min lower body with bands, glute focus" className="rounded-xl" />
        </div>
        <Button type="button" onClick={autoTag} disabled={tagging || !f.title} className="h-10 w-full rounded-xl bg-plum-500 font-bold">
          {tagging ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} AI auto-tag body area, level, kit &amp; chapters
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-area">Body area</Label>
            <NativeSelect id="c-area" value={f.bodyArea} onChange={(e) => set("bodyArea", e.target.value as BodyArea)} className="w-full">
              {AREAS.map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-level">Level</Label>
            <NativeSelect id="c-level" value={f.level} onChange={(e) => set("level", e.target.value as Level)} className="w-full">
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-dur">Minutes</Label>
            <Input id="c-dur" type="number" min={5} max={90} value={f.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))} className="h-9 rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-eq">Equipment</Label>
          <Input id="c-eq" value={f.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="Dumbbells, Mat" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-tags">Tags</Label>
          <Input id="c-tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="strength, glutes" className="rounded-xl" />
        </div>
        {f.chapters.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-2 text-sm font-medium">Chapters <AiBadge /></p>
            <ol className="flex flex-wrap gap-1.5">
              {f.chapters.map((c) => (
                <li key={c.label + c.atSec} className="rounded-full bg-plum-50 px-2.5 py-1 text-xs font-semibold text-plum-700">
                  {Math.floor(c.atSec / 60)}:{String(c.atSec % 60).padStart(2, "0")} {c.label}
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="c-when">Publish</Label>
          <Input id="c-when" type="datetime-local" value={f.publishAt} onChange={(e) => set("publishAt", e.target.value)} className="h-9 rounded-xl" />
          <p className="text-[11px] text-charcoal/60">Leave empty to publish now, or pick a time to schedule it.</p>
        </div>
        <Button type="submit" className={cn("h-11 w-full rounded-xl text-sm font-bold", ctaClass)}>
          {f.publishAt ? "Schedule class" : "Publish class"}
        </Button>
      </form>
    </Panel>
  );
}

function Drafter() {
  const { state } = useStore();
  const [classId, setClassId] = useState(state.classes[0]?.id ?? "");
  const [kind, setKind] = useState<"description" | "newsletter" | "social">("social");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const cls = state.classes.find((c) => c.id === classId);

  async function draft() {
    if (!cls) return;
    setBusy(true);
    try {
      setOut(await aiDraftContent({ classTitle: cls.title, kind }));
    } catch {
      toast.error("Couldn't draft that, try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={<span className="flex items-center gap-2">Write it for me <AiBadge /></span>}>
      <div className="space-y-3">
        <NativeSelect aria-label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full">
          {state.classes.slice(0, 60).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </NativeSelect>
        {/* Native radios: arrow keys and screen-reader semantics for free. */}
        <fieldset className="grid grid-cols-3 gap-1 rounded-xl bg-plum-50 p-1">
          <legend className="sr-only">Draft type</legend>
          {(["description", "newsletter", "social"] as const).map((k) => (
            <label
              key={k}
              className={cn(
                "cursor-pointer rounded-lg py-1.5 text-center text-xs font-bold capitalize has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-plum-400",
                kind === k ? "bg-white text-plum-700 shadow-sm" : "text-charcoal/70",
              )}
            >
              <input type="radio" name="draft-kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {k === "social" ? "Social post" : k}
            </label>
          ))}
        </fieldset>
        <Button type="button" onClick={draft} disabled={busy} variant="secondary" className="h-10 w-full rounded-xl font-bold text-plum-700">
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />} Draft {kind}
        </Button>
        {out && (
          <div className="relative">
            <Textarea aria-label="Draft" value={out} onChange={(e) => setOut(e.target.value)} className="min-h-32 rounded-2xl border-plum-100 bg-plum-50/40 pr-10" />
            <button
              type="button"
              aria-label="Copy draft"
              onClick={() => navigator.clipboard.writeText(out).then(() => toast.success("Copied"))}
              className="absolute top-2 right-2 rounded-lg p-1.5 text-plum-600 hover:bg-white"
            >
              <Copy className="size-4" />
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
