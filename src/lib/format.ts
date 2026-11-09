const gbpFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbpFmt2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });

/** £35 (whole pounds) or £32.08 when `pence` is true. */
export const gbp = (n: number, pence = false) => (pence ? gbpFmt2 : gbpFmt).format(n);

/** 12,450 */
export const num = (n: number) => n.toLocaleString("en-GB");

/** 0.684 -> "68%" */
export const pct = (n: number) => `${Math.round(n * 100)}%`;

const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

/** "2 hours ago", "yesterday", "in 3 days" */
export function relativeTime(date: string | Date, now: Date = new Date()): string {
  const diff = (new Date(date).getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
  return rtf.format(Math.round(diff / (86400 * 365)), "year");
}

/** "9 Nov 2026" */
export const shortDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "12:40" style mm:ss for video progress */
export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
