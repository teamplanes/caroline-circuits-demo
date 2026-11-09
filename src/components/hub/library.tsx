"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Layers, ListPlus, Loader2, Play, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { aiSearch } from "@/lib/ai-client";
import { AREA_LABEL } from "@/lib/nudges";
import { usePersistentState, useStore } from "@/lib/store";
import type { BodyArea, ClassItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AiBadge, ClassCard, PageHeader, Pill, Section, btnGhost, btnPrimary, card, injuryFriendly } from "./bits";

type Playlist = { id: string; name: string; classIds: string[] };
const DURATIONS = [
  { id: "any", label: "Any length", test: () => true },
  { id: "10", label: "10 min", test: (c: ClassItem) => c.durationMin <= 10 },
  { id: "15", label: "15 min", test: (c: ClassItem) => c.durationMin > 10 && c.durationMin <= 15 },
  { id: "20", label: "20–25 min", test: (c: ClassItem) => c.durationMin > 15 && c.durationMin <= 25 },
  { id: "30", label: "30+ min", test: (c: ClassItem) => c.durationMin >= 30 },
];
const EQUIPMENT = ["Any kit", "No equipment", "Dumbbells", "Resistance band", "Kettlebell"];
const AREAS: BodyArea[] = ["full", "upper", "lower", "core", "hiit", "yoga"];
const EXAMPLES = ["15 min, no weights, sore knee", "something gentle for after a run", "quick abs before work", "challenge me with legs"];

const selectCls = "h-9 rounded-full border border-plum-100 bg-white/70 px-3 text-xs font-bold text-charcoal focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none";

export function LibraryView() {
  const { state } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const comeback = params.get("plan") === "comeback";
  const [tab, setTab] = useState<"browse" | "favourites" | "playlists" | "build">("browse");

  // Filters
  const [duration, setDuration] = useState("any");
  const [area, setArea] = useState<BodyArea | "all">("all");
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  const [level, setLevel] = useState("any");
  const [series, setSeries] = useState("any");
  const [gentle, setGentle] = useState(false);

  // AI search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [ai, setAi] = useState<{ query: string; classIds: string[]; explanation: string } | null>(null);

  const [playlists, setPlaylists] = usePersistentState<Playlist[]>("playlists", [
    { id: "pl-mornings", name: "Quick mornings ☀️", classIds: ["15-minute-express-1", "10-minute-series-3", "abs-only-5"] },
    { id: "pl-recovery", name: "Recovery days", classIds: ["yoga-with-amber-2", "yoga-with-amber-4"] },
  ]);
  const [stack, setStack] = usePersistentState<string[]>("session-stack", []);
  const [newList, setNewList] = useState("");

  const classById = useMemo(() => new Map(state.classes.map((c) => [c.id, c])), [state.classes]);
  const allSeries = [...new Set(state.classes.map((c) => c.series))];

  const filtered = state.classes.filter((c) => {
    const d = DURATIONS.find((x) => x.id === duration)!;
    const kitOk =
      equipment === "Any kit" ? true : equipment === "No equipment" ? c.equipment.every((e) => e === "Mat" || e.includes("optional")) : c.equipment.includes(equipment);
    return (
      d.test(c) &&
      (area === "all" || c.bodyArea === area) &&
      kitOk &&
      (level === "any" || c.level === level) &&
      (series === "any" || c.series === series) &&
      (!gentle || injuryFriendly(c))
    );
  });

  const favs = state.me.favourites.map((id) => classById.get(id)).filter((c): c is ClassItem => !!c);
  const likedSeed = favs[0];
  const becauseYouLiked = likedSeed
    ? state.classes.filter((c) => c.id !== likedSeed.id && !state.me.favourites.includes(c.id) && (c.series === likedSeed.series || c.bodyArea === likedSeed.bodyArea)).slice(0, 4)
    : [];
  const comebackPlan = state.classes.filter((c) => c.durationMin <= 20 && (c.level === "beginner" || c.tags.includes("short"))).slice(0, 3);
  const clips = state.classes.filter((c) => c.durationMin <= 15);
  const stackMin = stack.reduce((s, id) => s + (classById.get(id)?.durationMin ?? 0), 0);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setSearching(true);
    try {
      const res = await aiSearch(q, state.classes);
      setAi({ query: q, ...res });
    } catch {
      toast.error("Search is having a moment. Try the filters below.");
    } finally {
      setSearching(false);
    }
  }

  const move = (i: number, dir: -1 | 1) =>
    setStack((s) => {
      const next = [...s];
      const j = i + dir;
      if (j < 0 || j >= next.length) return s;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="On demand" title={<>The library</>}>
        <p className="text-muted-foreground text-sm font-semibold">{state.classes.length} classes · new every week</p>
      </PageHeader>

      {/* AI search */}
      <div className="mesh-bg grain relative overflow-hidden rounded-[2rem] p-5 text-white md:p-8">
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <AiBadge tone="dark" />
            <p className="text-sm font-bold text-white/80">Describe the workout you want</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
            className="glass flex items-center gap-2 rounded-full p-1.5 pl-5"
          >
            <Search className="size-5 shrink-0 text-white/70" aria-hidden />
            <label htmlFor="ai-search" className="sr-only">
              Search classes in plain English
            </label>
            <input
              id="ai-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="“15 min, no weights, sore knee”"
              className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-white placeholder:text-white/50 focus:outline-none"
            />
            <button type="submit" disabled={searching} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-plum-800 transition hover:scale-105 disabled:opacity-70">
              {searching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              <span className="max-sm:sr-only">Find</span>
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => runSearch(ex)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/20">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {ai && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Section
              title={
                <span className="flex items-center gap-2">
                  Results for “{ai.query}” <AiBadge />
                </span>
              }
              action={
                <button type="button" onClick={() => setAi(null)} className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
                  <X className="size-4" aria-hidden /> Clear
                </button>
              }
            >
              <p className="text-muted-foreground mb-4 text-sm">{ai.explanation}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ai.classIds.map((id) => classById.get(id)).filter((c): c is ClassItem => !!c).map((c) => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {comeback && (
        <div className={cn(card, "border-plum-200 bg-plum-50/80")}>
          <h2 className="text-xl font-black">Your gentle comeback plan 💜</h2>
          <p className="text-muted-foreground mb-4 text-sm">Three short classes to ease back in. No pressure, just press play.</p>
          <ol className="grid gap-3 sm:grid-cols-3">
            {comebackPlan.map((c, i) => (
              <li key={c.id}>
                <Link href={`/hub/class/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 hover:shadow-md">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-white">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{c.title}</span>
                    <span className="text-muted-foreground text-xs">{c.durationMin} min</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" role="group" aria-label="Library views">
        {(
          [
            ["browse", "Browse"],
            ["favourites", `Favourites (${favs.length})`],
            ["playlists", "Playlists"],
            ["build", "Build a session"],
          ] as const
        ).map(([id, label]) => (
          <Pill key={id} active={tab === id} onClick={() => setTab(id)}>
            {label}
          </Pill>
        ))}
      </div>

      {tab === "browse" && (
        <>
          {state.me.continueWatching.length > 0 && (
            <Section title="Continue watching">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {state.me.continueWatching.map((cw) => {
                  const c = classById.get(cw.classId);
                  return c ? <ClassCard key={c.id} c={c} progressSec={cw.progressSec} /> : null;
                })}
              </div>
            </Section>
          )}

          {likedSeed && becauseYouLiked.length > 0 && (
            <Section title={<>Because you liked {likedSeed.title}</>}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {becauseYouLiked.map((c) => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </div>
            </Section>
          )}

          <Section title="All classes">
            {/* One swipeable row on phones, wraps from sm up. */}
            <div className="glass-light sticky top-[calc(var(--demo-bar-h)+72px)] z-20 mb-5 flex items-center gap-2 rounded-3xl p-2 max-sm:-mx-1 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] sm:flex-wrap lg:top-[calc(var(--demo-bar-h)+8px)] [&>select]:shrink-0">
              <label className="sr-only" htmlFor="f-duration">Duration</label>
              <select id="f-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className={selectCls}>
                {DURATIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <label className="sr-only" htmlFor="f-area">Body area</label>
              <select id="f-area" value={area} onChange={(e) => setArea(e.target.value as BodyArea | "all")} className={selectCls}>
                <option value="all">All body areas</option>
                {AREAS.map((a) => <option key={a} value={a}>{AREA_LABEL[a][0].toUpperCase() + AREA_LABEL[a].slice(1)}</option>)}
              </select>
              <label className="sr-only" htmlFor="f-kit">Equipment</label>
              <select id="f-kit" value={equipment} onChange={(e) => setEquipment(e.target.value)} className={selectCls}>
                {EQUIPMENT.map((e) => <option key={e}>{e}</option>)}
              </select>
              <label className="sr-only" htmlFor="f-level">Level</label>
              <select id="f-level" value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
                <option value="any">Any level</option>
                <option value="beginner">Beginner</option>
                <option value="all">All levels</option>
                <option value="intermediate">Intermediate</option>
              </select>
              <label className="sr-only" htmlFor="f-series">Series</label>
              <select id="f-series" value={series} onChange={(e) => setSeries(e.target.value)} className={selectCls}>
                <option value="any">All series</option>
                {allSeries.map((s) => <option key={s}>{s}</option>)}
              </select>
              <Pill active={gentle} onClick={() => setGentle((g) => !g)}>
                Injury-friendly
              </Pill>
              <span className="text-muted-foreground ml-auto shrink-0 pr-3 text-xs font-bold whitespace-nowrap">{filtered.length} classes</span>
            </div>
            {filtered.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center">No classes match. Try loosening a filter, or ask the AI search above.</p>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((c) => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </motion.div>
            )}
          </Section>
        </>
      )}

      {tab === "favourites" &&
        (favs.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favs.map((c) => (
              <ClassCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-10 text-center">Tap the heart on any class to save it here.</p>
        ))}

      {tab === "playlists" && (
        <div className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newList.trim()) return;
              setPlaylists((p) => [...p, { id: `pl-${Date.now()}`, name: newList.trim(), classIds: [] }]);
              setNewList("");
            }}
            className="flex gap-2"
          >
            <label htmlFor="new-playlist" className="sr-only">New playlist name</label>
            <input id="new-playlist" value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="New playlist name" className="h-11 flex-1 rounded-full border border-plum-100 bg-white/80 px-5 text-sm focus-visible:ring-3 focus-visible:ring-plum-300 focus-visible:outline-none" />
            <button type="submit" className={btnPrimary}>
              <ListPlus className="size-4" aria-hidden /> Create
            </button>
          </form>
          {playlists.map((pl) => {
            const items = pl.classIds.map((id) => classById.get(id)).filter((c): c is ClassItem => !!c);
            return (
              <div key={pl.id} className={card}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="flex-1 text-lg font-extrabold">{pl.name}</h3>
                  <span className="text-muted-foreground text-xs font-bold">
                    {items.length} classes · {items.reduce((s, c) => s + c.durationMin, 0)} min
                  </span>
                  <label htmlFor={`add-${pl.id}`} className="sr-only">Add a class to {pl.name}</label>
                  <select
                    id={`add-${pl.id}`}
                    value=""
                    onChange={(e) => e.target.value && setPlaylists((all) => all.map((p) => (p.id === pl.id ? { ...p, classIds: [...p.classIds, e.target.value] } : p)))}
                    className={selectCls}
                  >
                    <option value="">+ Add class</option>
                    {state.classes.filter((c) => !pl.classIds.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button type="button" onClick={() => setPlaylists((all) => all.filter((p) => p.id !== pl.id))} aria-label={`Delete ${pl.name}`} className="text-muted-foreground rounded-full p-2 hover:bg-plum-50">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                {items.length ? (
                  <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                    {items.map((c) => (
                      <li key={c.id} className="relative w-48 shrink-0">
                        <Link href={`/hub/class/${c.id}`} className="block overflow-hidden rounded-2xl">
                          <span className="relative block aspect-video">
                            <Image src={c.image} alt="" fill sizes="192px" className="object-cover" />
                          </span>
                          <span className="mt-1.5 block truncate text-xs font-bold">{c.title}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPlaylists((all) => all.map((p) => (p.id === pl.id ? { ...p, classIds: p.classIds.filter((x) => x !== c.id) } : p)))}
                          aria-label={`Remove ${c.title}`}
                          className="glass-dark absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full text-white"
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">Empty. Add a class above.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "build" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-muted-foreground mb-3 text-sm">Stack short clips into one session. Great for “I&apos;ve got 25 minutes”.</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {clips.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white/80 p-2 pr-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                    <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{c.title}</span>
                    <span className="text-muted-foreground text-xs">{c.durationMin} min · {AREA_LABEL[c.bodyArea]}</span>
                  </span>
                  <button type="button" onClick={() => setStack((s) => [...s, c.id])} aria-label={`Add ${c.title} to session`} className="grid size-9 place-items-center rounded-full bg-plum-50 text-plum-700 hover:bg-plum-100">
                    <Plus className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mesh-bg grain h-fit rounded-3xl p-5 text-white lg:sticky lg:top-[calc(var(--demo-bar-h)+24px)]">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Layers className="size-5" aria-hidden />
                <h3 className="text-lg font-black">Your session</h3>
              </div>
              <p className="mt-1 text-5xl font-black tabular-nums">
                {stackMin}
                <span className="text-lg font-bold text-white/70"> min</span>
              </p>
              <ol className="mt-4 space-y-2">
                {stack.length === 0 && <li className="text-sm text-white/70">Add clips from the list.</li>}
                {stack.map((id, i) => (
                  <li key={`${id}-${i}`} className="glass flex items-center gap-2 rounded-2xl p-2 pl-3 text-sm">
                    <span className="flex-1 truncate font-semibold">
                      {i + 1}. {classById.get(id)?.title}
                    </span>
                    <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="rounded-full p-1 hover:bg-white/20"><ArrowUp className="size-3.5" aria-hidden /></button>
                    <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="rounded-full p-1 hover:bg-white/20"><ArrowDown className="size-3.5" aria-hidden /></button>
                    <button type="button" onClick={() => setStack((s) => s.filter((_, j) => j !== i))} aria-label="Remove" className="rounded-full p-1 hover:bg-white/20"><X className="size-3.5" aria-hidden /></button>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={!stack.length}
                  onClick={() => router.push(`/hub/class/${stack[0]}?session=${stack.join(",")}&i=0`)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-sm font-black text-plum-800 disabled:opacity-50"
                >
                  <Play className="size-4 fill-current" aria-hidden /> Start session
                </button>
                <button type="button" onClick={() => setStack([])} disabled={!stack.length} className={cn(btnGhost, "border-white/30 bg-white/10 text-white hover:bg-white/20")}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
