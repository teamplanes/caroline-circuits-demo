"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Captions, Check, Download, Eye, Flame, Heart, Maximize2, Pause, Play, Radio, Share2, Sparkles, Tv } from "lucide-react";
import { toast } from "sonner";
import { AREA_LABEL, computeNudges, computeStreak } from "@/lib/nudges";
import { useStore } from "@/lib/store";
import { mmss } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AiBadge, BadgeMedal, ClassCard, Section, btnGhost, btnPrimary, card, earnedBadges, myWorkouts } from "./bits";

type Lang = "EN" | "ES" | "FR" | "DE";
// ponytail: canned caption lines per chapter type, stands in for real AI transcription + translation.
const CAPTIONS: Record<"warm" | "work" | "cool" | "yoga", Record<Lang, string[]>> = {
  warm: {
    EN: ["Let's get those shoulders rolling back", "Nice big arm circles, keep breathing", "March it out on the spot, lovely"],
    ES: ["Vamos a girar los hombros hacia atrás", "Grandes círculos con los brazos, respira", "Marcha en el sitio, muy bien"],
    FR: ["On fait rouler les épaules vers l'arrière", "Grands cercles de bras, respirez", "On marche sur place, très bien"],
    DE: ["Schultern nach hinten kreisen", "Große Armkreise, weiter atmen", "Auf der Stelle marschieren, super"],
  },
  work: {
    EN: ["Squat down, chest proud, push through the heels", "Ten more seconds, you've got this!", "Drop the weights if you need to, form first"],
    ES: ["Baja en sentadilla, pecho arriba, empuja con los talones", "¡Diez segundos más, tú puedes!", "Suelta las pesas si lo necesitas, primero la técnica"],
    FR: ["On descend en squat, poitrine fière, poussez dans les talons", "Encore dix secondes, vous y êtes !", "Posez les poids si besoin, la forme d'abord"],
    DE: ["Tief in die Kniebeuge, Brust raus, über die Fersen drücken", "Noch zehn Sekunden, du schaffst das!", "Gewichte ablegen, wenn nötig – Technik zuerst"],
  },
  cool: {
    EN: ["Lovely work everyone, let's stretch it out", "Hug those knees in, gently rock side to side", "Well done, see you next time x"],
    ES: ["Buen trabajo, vamos a estirar", "Abraza las rodillas, balancéate suavemente", "Bien hecho, ¡hasta la próxima!"],
    FR: ["Beau travail, on s'étire", "Ramenez les genoux, balancez doucement", "Bravo, à la prochaine !"],
    DE: ["Toll gemacht, jetzt dehnen wir", "Knie umarmen, sanft hin und her wiegen", "Gut gemacht, bis zum nächsten Mal!"],
  },
  yoga: {
    EN: ["Inhale, lengthen through the spine", "Exhale and soften into the stretch", "Let the breath lead the movement"],
    ES: ["Inhala, alarga la columna", "Exhala y relájate en el estiramiento", "Deja que la respiración guíe el movimiento"],
    FR: ["Inspirez, allongez la colonne", "Expirez et relâchez dans l'étirement", "Laissez le souffle guider le mouvement"],
    DE: ["Einatmen, die Wirbelsäule lang machen", "Ausatmen und in die Dehnung sinken", "Lass den Atem die Bewegung führen"],
  },
};

const CONFETTI_COLOURS = ["#9B3F8C", "#D25BC0", "#F7E9F3", "#814359", "#FFB86B", "#ffffff"];

export function ClassPlayer() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const session = search.get("session")?.split(",").filter(Boolean) ?? [];
  const live = search.get("live") === "1";
  const store = useStore();
  const { state, toggleFavourite, setProgress, completeWorkout, addPost } = store;
  const c = state.classes.find((x) => x.id === id);
  const saved = state.me.continueWatching.find((x) => x.classId === id)?.progressSec ?? 0;

  const [pos, setPos] = useState(saved);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cc, setCc] = useState(true);
  const [lang, setLang] = useState<Lang>("EN");
  const [finished, setFinished] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareGroup, setShareGroup] = useState("general");
  const [shared, setShared] = useState(false);
  const [before, setBefore] = useState<{ streak: number; badges: Set<string> } | null>(null);
  const posRef = useRef(pos);
  const finishedRef = useRef(false);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const total = (c?.durationMin ?? 0) * 60;

  // Restore saved progress once the store hydrates.
  const restored = useRef(false);
  useEffect(() => {
    if (!restored.current && store.hydrated) {
      restored.current = true;
      if (saved) setTimeout(() => setPos(saved), 0);
    }
  }, [store.hydrated, saved]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos((p) => Math.min(total, p + speed)), 1000);
    return () => clearInterval(t);
  }, [playing, speed, total]);

  // Save progress when leaving the page.
  useEffect(() => {
    return () => {
      if (posRef.current > 5 && !finishedRef.current) setProgress(id, Math.round(posRef.current));
    };
  }, [id, setProgress]);

  const finish = useCallback(() => {
    const now = new Date();
    // Snapshot before completing, so the done screen can show "+1" and newly earned badges.
    setBefore({ streak: computeStreak(myWorkouts(state), now), badges: earnedBadges(state, now) });
    setPlaying(false);
    finishedRef.current = true;
    completeWorkout(id);
    setFinished(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state, id, completeWorkout]);

  // Reaching the end of the (simulated) video finishes the class.
  const atEnd = playing && total > 0 && pos >= total;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- end of playback is an external event here
    if (atEnd) finish();
  }, [atEnd, finish]);

  if (!c) {
    // Admin-added classes only exist in localStorage, so wait for the store before saying "not found".
    if (!store.hydrated) return <div className="aspect-video animate-pulse rounded-[2rem] bg-plum-100/60" aria-busy="true" />;
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-black">Class not found</h1>
        <Link href="/hub/library" className={cn(btnPrimary, "mt-6")}>
          Back to the library
        </Link>
      </div>
    );
  }

  const chapterIdx = Math.max(0, c.chapters.findLastIndex((ch) => ch.atSec <= pos));
  const chapter = c.chapters[chapterIdx];
  const kind = c.bodyArea === "yoga" ? "yoga" : /warm/i.test(chapter.label) ? "warm" : /cool/i.test(chapter.label) ? "cool" : "work";
  const lines = CAPTIONS[kind][lang];
  const caption = lines[Math.floor(pos / 6) % lines.length];
  const fav = state.me.favourites.includes(c.id);
  // Position comes from the URL so the same clip can appear twice in a session.
  const sessionIdx = search.has("i") ? Number(search.get("i")) : session.indexOf(c.id);
  const nextInSession = sessionIdx >= 0 ? session[sessionIdx + 1] : undefined;
  const nextHref = `/hub/class/${nextInSession}?session=${session.join(",")}&i=${sessionIdx + 1}`;
  // ponytail: fake but stable viewer count for the live room.
  const viewers = 180 + ([...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 140) + Math.floor(pos / 30);
  const related = state.classes.filter((x) => x.series === c.series && x.id !== c.id).slice(0, 4);

  function togglePlay() {
    if (playing) setProgress(c!.id, Math.round(pos));
    setPlaying((p) => !p);
  }

  if (finished) {
    const now = new Date();
    const streak = computeStreak(myWorkouts(state), now);
    const next = computeNudges(state, now)[0];
    const gained = before ? streak - before.streak : 0;
    const nowEarned = earnedBadges(state, now);
    const newBadges = before ? state.badges.filter((b) => nowEarned.has(b.id) && !before.badges.has(b.id)) : [];
    const text = shareText || `Just finished ${c.title} ✅ ${streak > 1 ? `${streak}-day streak 🔥` : ""}`.trim();
    return (
      <div className="mesh-bg grain relative overflow-hidden rounded-[2rem] px-5 py-10 text-white md:px-10 md:py-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 48 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute top-0 block rounded-sm"
              style={{ left: `${(i * 37) % 100}%`, width: 6 + (i % 3) * 3, height: 10 + (i % 4) * 3, background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length] }}
              initial={{ y: -40, rotate: 0, opacity: 1 }}
              animate={{ y: 700, rotate: 360 + i * 20, opacity: 0 }}
              transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 8) * 0.08, ease: "easeIn" }}
            />
          ))}
        </div>
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="mx-auto grid size-24 place-items-center rounded-full bg-white text-plum-700 shadow-[0_0_60px_rgb(255_255_255/0.4)]">
            <Check className="size-12" strokeWidth={3} aria-hidden />
          </motion.div>
          <h1 className="mt-6 text-4xl leading-[1.05] font-black tracking-tight md:text-6xl">
            Class smashed.
          </h1>
          <p className="mt-3 text-white/80">
            {c.title} · {c.durationMin} minutes in the bank.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-3xl p-5">
              <Flame className="mx-auto size-8 text-orange-300" aria-hidden />
              <div className="flex items-start justify-center gap-1">
                <motion.p initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="text-5xl font-black tabular-nums">
                  {streak}
                </motion.p>
                {gained > 0 && (
                  <motion.span
                    initial={{ y: 12, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 14 }}
                    className="rounded-full bg-white px-2 py-0.5 text-sm font-black text-plum-800"
                  >
                    +{gained}
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-white/70">day streak{streak > 1 ? ", keep it going!" : ""}</p>
            </div>
            {next && (
              <div className="glass rounded-3xl p-5 text-left">
                <p className="text-[11px] font-black tracking-widest text-white/60 uppercase">Nice! Next time try…</p>
                <p className="mt-1 font-bold">{next.message}</p>
                <Link href={next.cta.href ?? "/hub"} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-white underline underline-offset-4">
                  {next.cta.label} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            )}
          </div>

          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, type: "spring", stiffness: 220, damping: 16 }}
              className="glass mt-3 rounded-3xl p-5"
            >
              <p className="flex items-center justify-center gap-2 text-[11px] font-black tracking-widest text-white/70 uppercase">
                <Sparkles className="size-4 text-orange-200" aria-hidden /> New badge{newBadges.length > 1 ? "s" : ""} earned
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-4 [&_p]:text-white">
                {newBadges.map((b) => (
                  <BadgeMedal key={b.id} badge={b} earned />
                ))}
              </div>
            </motion.div>
          )}

          <div className="glass mt-3 rounded-3xl p-5 text-left">
            <p className="mb-2 flex items-center gap-2 font-extrabold">
              <Share2 className="size-4" aria-hidden /> Share to community
            </p>
            {shared ? (
              <p className="text-sm">
                Posted! <Link href="/hub/community" className="font-bold underline underline-offset-4">See it in the feed</Link>
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addPost({ group: shareGroup, text, image: c.image });
                  setShared(true);
                  toast.success("Shared with the community 💜");
                }}
                className="space-y-2"
              >
                <label htmlFor="share-text" className="sr-only">Post text</label>
                <textarea id="share-text" value={text} onChange={(e) => setShareText(e.target.value)} rows={2} className="w-full rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-white focus-visible:ring-3 focus-visible:ring-white focus-visible:outline-none" />
                <div className="flex gap-2">
                  <label htmlFor="share-group" className="sr-only">Group</label>
                  <select id="share-group" value={shareGroup} onChange={(e) => setShareGroup(e.target.value)} className="h-11 flex-1 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold [&>option]:text-ink">
                    {state.groups.filter((g) => g.id === "general" || state.me.groups.includes(g.id)).map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="h-11 rounded-full bg-white px-6 text-sm font-black text-plum-800">
                    Post
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {nextInSession && (
              <Link href={nextHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-black text-plum-800">
                Next in session <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
            <Link href="/hub" className="glass inline-flex h-11 items-center rounded-full px-6 text-sm font-bold">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/hub/library" className="text-plum-700 inline-flex items-center gap-1 text-sm font-bold hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Library
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          {/* Mock video player */}
          <div className="group relative aspect-video overflow-hidden rounded-[2rem] bg-ink shadow-[0_24px_60px_rgb(42_15_38/0.35)]">
            <Image src={c.image} alt={`${c.title} class preview`} fill priority sizes="(min-width: 1280px) 60vw, 100vw" className={cn("object-cover transition duration-700", playing ? "scale-105" : "opacity-80")} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
              {live && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-[11px] font-black tracking-widest text-white uppercase shadow-[0_0_20px_rgb(239_68_68/0.7)]">
                    <Radio className="size-3.5 animate-pulse" aria-hidden /> Live
                  </span>
                  <span className="glass inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white tabular-nums">
                    <Eye className="size-3.5" aria-hidden /> {viewers} watching
                  </span>
                </>
              )}
              <span className="glass rounded-full px-3 py-1 text-[11px] font-black tracking-widest text-white uppercase">{chapter.label}</span>
            </div>
            {session.length > 1 && (
              <span className="glass absolute top-4 right-4 rounded-full px-3 py-1 text-[11px] font-bold text-white">
                Session {sessionIdx + 1}/{session.length}
              </span>
            )}
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="absolute inset-0 grid place-items-center rounded-[2rem] focus-visible:ring-4 focus-visible:ring-warm-400/60 focus-visible:outline-none focus-visible:ring-inset">
              <AnimatePresence>
                {!playing && (
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} className="glass grid size-20 place-items-center rounded-full md:size-24">
                    <Play className="ml-1 size-9 fill-white text-white" aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {cc && (
              <p className="pointer-events-none absolute inset-x-0 bottom-20 px-6 text-center" aria-hidden>
                <span className="rounded-lg bg-black/70 px-3 py-1.5 text-sm font-semibold text-white md:text-base">{caption}</span>
              </p>
            )}
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
              <label htmlFor="scrub" className="sr-only">Seek</label>
              <input
                id="scrub"
                type="range"
                min={0}
                max={total}
                value={pos}
                onChange={(e) => setPos(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-warm-500"
              />
              <div className="flex items-center gap-2 text-white">
                <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="grid size-9 place-items-center rounded-full hover:bg-white/15">
                  {playing ? <Pause className="size-5 fill-white" aria-hidden /> : <Play className="size-5 fill-white" aria-hidden />}
                </button>
                <span className="text-xs font-semibold tabular-nums">
                  {mmss(pos)} / {mmss(total)}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <label htmlFor="speed" className="sr-only">Demo speed</label>
                  <select id="speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="h-8 rounded-full bg-white/15 px-2 text-xs font-bold [&>option]:text-ink" title="Demo playback speed">
                    <option value={1}>1×</option>
                    <option value={10}>10× demo</option>
                    <option value={60}>60× demo</option>
                  </select>
                  <button type="button" onClick={() => setCc((v) => !v)} aria-pressed={cc} aria-label="Captions" className={cn("grid size-9 place-items-center rounded-full hover:bg-white/15", cc && "bg-white/20")}>
                    <Captions className="size-5" aria-hidden />
                  </button>
                  <button type="button" onClick={() => toast.success("Casting to “Living room TV”")} aria-label="Cast to TV" className="grid size-9 place-items-center rounded-full hover:bg-white/15">
                    <Tv className="size-5" aria-hidden />
                  </button>
                  <button type="button" onClick={() => toast("Full screen is disabled in the demo")} aria-label="Full screen" className="grid size-9 place-items-center rounded-full hover:bg-white/15 max-sm:hidden">
                    <Maximize2 className="size-5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-plum-600 text-xs font-bold tracking-wider uppercase">
                {c.series} · {AREA_LABEL[c.bodyArea]}
              </p>
              <h1 className="text-ink mt-1 text-3xl leading-tight font-black tracking-tight md:text-4xl">{c.title}</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-plum-50 px-3 py-1 text-plum-800">{c.durationMin} min</span>
                <span className="rounded-full bg-plum-50 px-3 py-1 text-plum-800 capitalize">{c.level === "all" ? "All levels" : c.level}</span>
                {c.equipment.map((e) => (
                  <span key={e} className="rounded-full bg-plum-50 px-3 py-1 text-plum-800">{e}</span>
                ))}
                <span className="rounded-full bg-plum-50 px-3 py-1 text-plum-800">with {c.instructor}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => toggleFavourite(c.id)} aria-pressed={fav} className={btnGhost}>
                <Heart className={cn("size-4", fav && "fill-warm-400 text-warm-400")} aria-hidden /> {fav ? "Saved" : "Save"}
              </button>
              <button type="button" onClick={() => toast.success(`${c.title} downloaded for offline viewing`)} className={btnGhost}>
                <Download className="size-4" aria-hidden /> Download
              </button>
              <button type="button" onClick={finish} className={btnPrimary}>
                <Check className="size-4" aria-hidden /> Finish class
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold">Chapters</h2>
              <AiBadge />
            </div>
            <ol className="space-y-1">
              {c.chapters.map((ch, i) => (
                <li key={ch.label}>
                  <button
                    type="button"
                    onClick={() => setPos(ch.atSec)}
                    aria-current={i === chapterIdx ? "step" : undefined}
                    className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition", i === chapterIdx ? "bg-plum-500 font-bold text-white" : "hover:bg-plum-50")}
                  >
                    <span className="w-10 text-xs tabular-nums opacity-70">{mmss(ch.atSec)}</span>
                    <span className="flex-1">{ch.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold">Captions</h2>
              <AiBadge />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCc((v) => !v)} aria-pressed={cc} className={cn("h-9 rounded-full px-4 text-xs font-bold", cc ? "bg-ink text-white" : "bg-plum-50 text-plum-800")}>
                {cc ? "On" : "Off"}
              </button>
              <div className="flex gap-1" role="radiogroup" aria-label="Caption language">
                {(["EN", "ES", "FR", "DE"] as Lang[]).map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => { setLang(l); setCc(true); }} className={cn("h-9 w-11 rounded-full text-xs font-bold", lang === l ? "bg-plum-500 text-white" : "bg-plum-50 text-plum-800")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">Auto-transcribed and translated.</p>
          </div>
          {nextInSession && (
            <Link href={nextHref} className={cn(card, "block text-sm font-bold hover:shadow-lg")}>
              Up next in your session: {state.classes.find((x) => x.id === nextInSession)?.title} →
            </Link>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <Section title={`More ${c.series}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((x) => (
              <ClassCard key={x.id} c={x} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
