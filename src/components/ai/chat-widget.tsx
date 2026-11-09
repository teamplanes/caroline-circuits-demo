"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart, RotateCcw, SendHorizontal, Sparkles, X } from "lucide-react";
import { aiChatStream, type ChatTurn } from "@/lib/ai-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AiBadge } from "./ai-badge";

type Mode = "sales" | "support";

const COPY: Record<Mode, { title: string; subtitle: string; greeting: string; chips: string[]; disclaimer: string }> = {
  sales: {
    title: "Chat with us",
    subtitle: "Answers from Caroline's classes & FAQs",
    greeting:
      "Hi, I'm here to help! 👋 Ask me anything about the classes, the kit you'll need or how membership works.",
    chips: ["Am I too unfit?", "What kit do I need?", "What time is that for me?", "How much is it?"],
    disclaimer: "AI assistant, can make mistakes. Not medical advice.",
  },
  support: {
    title: "Ask Caroline",
    subtitle: "Billing, pausing, kit, times & modifications",
    greeting: "Hello lovely! How can I help today? I can sort billing questions, pausing, kit, class times and modifications.",
    chips: ["How do I pause?", "What time is that for me?", "What kit do I need?", "Modifications for sore knees"],
    disclaimer: "AI assistant, can make mistakes. Not medical advice.",
  },
};

export function ChatWidget({ mode, floating = true }: { mode: Mode; floating?: boolean }) {
  const [open, setOpen] = useState(!floating);
  const copy = COPY[mode];

  if (!floating) return <ChatPanel mode={mode} className="h-[560px] rounded-3xl" />;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 top-[var(--demo-bar-h)] bottom-0 z-[90] sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(600px,calc(100dvh-var(--demo-bar-h)-8rem))] sm:w-[400px]"
          >
            <ChatPanel mode={mode} onClose={() => setOpen(false)} className="h-full sm:rounded-3xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? `Close ${copy.title}` : `Open ${copy.title}`}
        aria-expanded={open}
        className={cn(
          "fixed right-4 bottom-4 z-[91] grid size-14 place-items-center rounded-full text-white sm:right-6 sm:bottom-6 sm:size-16",
          "bg-plum-600 shadow-[0_12px_40px_rgb(155_63_140/0.45)] ring-1 ring-white/30",
          "focus-visible:ring-4 focus-visible:ring-warm-400/50 focus-visible:outline-none",
          open && "max-sm:hidden",
        )}
      >
        {!open && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-warm-500/40 [animation-duration:2.4s] motion-reduce:hidden" />}
        {open ? <X className="size-6" /> : <MessageCircleHeart className="size-7" />}
      </motion.button>
    </>
  );
}

function ChatPanel({ mode, onClose, className }: { mode: Mode; onClose?: () => void; className?: string }) {
  const copy = COPY[mode];
  const { state, addChatMessage, clearChat } = useStore();
  // History lives in the store (survives view switches, feeds Admin > Insights); only the reply being streamed is local.
  const history = useMemo<ChatTurn[]>(
    () => state.chatLog.filter((m) => m.mode === mode).map(({ role, content }) => ({ role, content })),
    [state.chatLog, mode],
  );
  const [streaming, setStreaming] = useState<string | null>(null);
  const messages: ChatTurn[] = [
    { role: "assistant", content: copy.greeting },
    ...history,
    ...(streaming !== null ? [{ role: "assistant" as const, content: streaming }] : []),
  ];
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [history, streaming]);

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(text: string) {
    const q = text.trim().slice(0, 2000);
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    // The greeting is UI only; the API conversation starts with the user's first message.
    const turns: ChatTurn[] = [...history, { role: "user", content: q }];
    addChatMessage("user", q, mode);
    let reply = "";
    setStreaming("");
    const append = (chunk: string) => {
      reply += chunk;
      setStreaming(reply);
    };

    abortRef.current = new AbortController();
    try {
      await aiChatStream(
        {
          mode,
          messages: turns,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          // Admin edits (schedule, prices, discount) ground the answers.
          live: { schedule: state.liveSchedule, prices: state.settings.prices, firstMonthDiscount: state.settings.firstMonthDiscount },
        },
        append,
        abortRef.current.signal,
      );
    } catch {
      if (!abortRef.current.signal.aborted && !reply) {
        append("Sorry, I couldn't connect just now. Please try again, or email hello@carolinescircuits.com.");
      }
    } finally {
      if (reply) addChatMessage("assistant", reply, mode);
      setStreaming(null);
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const waiting = busy && messages[messages.length - 1]?.content === "";
  const showChips = messages.length === 1;

  return (
    <section
      role={onClose ? "dialog" : "region"}
      aria-label={copy.title}
      className={cn("glass-light flex flex-col overflow-hidden bg-white/80 shadow-2xl shadow-plum-900/20", className)}
    >
      <header className="mesh-bg relative flex items-center gap-3 px-4 py-3.5 text-white">
        <div className="glass grid size-10 shrink-0 place-items-center rounded-full">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-extrabold tracking-tight">{copy.title}</h2>
            <AiBadge tone="dark" />
          </div>
          <p className="truncate text-xs text-white/80">{copy.subtitle}</p>
        </div>
        {history.length > 0 && !busy && (
          <button
            type="button"
            onClick={() => clearChat(mode)}
            aria-label="Start a new chat"
            title="New chat"
            className="grid size-9 place-items-center rounded-full hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="grid size-9 place-items-center rounded-full hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <X className="size-5" />
          </button>
        )}
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "assistant" && m.content === "" ? null : (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-gradient-to-br from-plum-500 to-plum-700 text-white"
                    : "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-plum-100",
                )}
              >
                {m.role === "assistant" ? <MarkdownLite text={m.content} /> : m.content}
              </div>
            </div>
          ),
        )}
        {waiting && <TypingDots />}
        {showChips && (
          <div className="flex flex-wrap gap-2 pt-1">
            {copy.chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => send(c)}
                className="rounded-full border border-plum-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-plum-700 transition hover:border-plum-400 hover:bg-plum-50 focus-visible:ring-2 focus-visible:ring-plum-400 focus-visible:outline-none"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-plum-100 bg-white/70 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-end gap-2">
          <label htmlFor={`chat-input-${mode}`} className="sr-only">
            Your message
          </label>
          <textarea
            id={`chat-input-${mode}`}
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Type your question…"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-plum-200 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-charcoal/60 focus-visible:border-plum-400 focus-visible:ring-2 focus-visible:ring-plum-300 focus-visible:outline-none sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-plum-600 text-white shadow-lg shadow-plum-500/30 transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-plum-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40 disabled:hover:scale-100"
          >
            <SendHorizontal className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-charcoal/70">{copy.disclaimer}</p>
      </form>
    </section>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is typing">
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-plum-100">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-plum-400 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Renders **bold**, [links](url) and "- " bullets. Everything else is plain text (no HTML injection). */
function MarkdownLite({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={blocks.length} className="my-1 list-disc space-y-0.5 pl-5 marker:text-plum-400">
        {bullets.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    if (bullet) {
      bullets.push(bullet[1]);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={blocks.length} className="[&:not(:first-child)]:mt-2">{inline(line)}</p>);
  }
  flush();
  return <>{blocks}</>;
}

function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i} className="font-bold text-plum-800">{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const internal = /^\/(?!\/)/.test(href); // "//host" is protocol-relative, i.e. external
      if (!internal && !href.startsWith("https://")) return <Fragment key={i}>{label}</Fragment>;
      return (
        <a
          key={i}
          href={href}
          {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className="font-semibold text-plum-600 underline decoration-plum-300 underline-offset-2 hover:text-plum-800"
        >
          {label}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
