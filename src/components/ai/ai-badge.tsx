import { cn } from "@/lib/utils";

/** Small "✨ AI" marker for anything AI-generated. `tone="dark"` for use on plum/dark backgrounds. */
export function AiBadge({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap",
        tone === "light" ? "bg-plum-50 text-plum-700 ring-1 ring-plum-200" : "bg-white/15 text-white ring-1 ring-white/30",
        className,
      )}
    >
      AI
    </span>
  );
}
