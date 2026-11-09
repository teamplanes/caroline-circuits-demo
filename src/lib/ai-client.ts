// Browser-side wrappers for the /api/ai/* routes. The routes fall back to deterministic answers
// when there's no ANTHROPIC_API_KEY, so these always resolve unless the server is unreachable.
import type { ChatLive, ChatMode, ChatTurn, ModerationResult, SearchClass, SummaryResult, TagResult } from "./ai-prompts";

export type { ChatLive, ChatMode, ChatTurn, SearchClass };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/ai/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI ${path} failed (${res.status})`);
  return res.json();
}

/** Natural-language class search. Pass `classes` to search the store's library (incl. user-added classes). */
export async function aiSearch(query: string, classes?: SearchClass[]): Promise<{ classIds: string[]; explanation: string }> {
  const compact = classes?.map(({ id, title, series, bodyArea, durationMin, level, equipment, tags }) => ({
    id, title, series, bodyArea, durationMin, level, equipment, tags,
  }));
  return post("search", { query, classes: compact });
}

export async function aiTagClass(input: { title: string; description: string }): Promise<TagResult> {
  return post("tag", input);
}

export async function aiSummariseFeedback(texts: string[]): Promise<SummaryResult> {
  return post("summarise", { texts });
}

export async function aiModerate(text: string): Promise<ModerationResult> {
  const { flagged, reason } = await post<ModerationResult>("moderate", { text });
  return reason ? { flagged, reason } : { flagged };
}

export async function aiDraftContent(input: { classTitle: string; kind: "description" | "newsletter" | "social" }): Promise<string> {
  return (await post<{ text: string }>("draft", input)).text;
}

/** Streams the chat reply; onToken gets each text chunk. Resolves with the full reply. */
export async function aiChatStream(
  input: { mode: ChatMode; messages: ChatTurn[]; timeZone?: string; live?: ChatLive },
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`AI chat failed (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    full += chunk;
    onToken(chunk);
  }
  return full;
}

// ponytail: legacy key, nothing writes it any more (chat turns live in store.chatLog). Remove once
// admin/insights.tsx stops importing it.
export const CHATBOT_LOG_KEY = "cc-chatbot-log";
