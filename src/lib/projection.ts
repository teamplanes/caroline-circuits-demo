// Focus options + 6-month projections for the homepage onboarding chat.
// ponytail: illustrative curves tuned to "average member" figures, not fitted to real data.
// Swap the rates in AVERAGES for numbers from the real member database once it exists.

export type Point = { month: number; value: number };
export type Focus = "weight" | "strength" | "tone" | "stamina";

export const MONTHS = 6;

/** Average 6-month change at 3 sessions/week. Shown to visitors in the caveats, so keep them honest. */
export const AVERAGES = {
  strengthGain6m: 0.6, // +60% on the dumbbell weight lifted
  weightLossPerMonth: 0.01, // 1% of body weight in month one, tapering after
  waistLossPerMonthCm: 1.2, // cm off the waist in month one, tapering after
  plankGain6m: 1.2, // +120% on plank hold time
};

// More sessions help, with diminishing returns; clamp so 5x/week isn't a miracle.
const sessionFactor = (perWeek: number) => Math.min(1.25, Math.max(0.6, perWeek / 3));
const round = (v: number, step: number) => Number((Math.round(v / step) * step).toFixed(2)); // toFixed: no 76.50000001
const months = <T,>(f: (m: number) => T) => Array.from({ length: MONTHS + 1 }, (_, m) => f(m));

/** Fast early gains that level off: 0 at month 0, 1 at month 6. */
const gainCurve = (m: number) => (1 - Math.exp(-m / 2.5)) / (1 - Math.exp(-MONTHS / 2.5));
/** Tapering monthly loss: month one loses `first`, each later month 12% less. */
const taper = (start: number, first: (current: number) => number, step: number) => {
  let v = start;
  return months((m) => {
    if (m > 0) v -= first(v) * Math.pow(0.88, m - 1);
    return { month: m, value: round(v, step) };
  });
};

export function strengthProjection(startKg: number, perWeek: number): Point[] {
  const g = AVERAGES.strengthGain6m * sessionFactor(perWeek);
  return months((m) => ({ month: m, value: round(startKg * (1 + g * gainCurve(m)), 0.5) })); // real dumbbell steps
}
export function weightProjection(startKg: number, perWeek: number): Point[] {
  return taper(startKg, (w) => w * AVERAGES.weightLossPerMonth * sessionFactor(perWeek), 0.1);
}
export function waistProjection(startCm: number, perWeek: number): Point[] {
  return taper(startCm, () => AVERAGES.waistLossPerMonthCm * sessionFactor(perWeek), 0.5);
}
export function plankProjection(startSec: number, perWeek: number): Point[] {
  const g = AVERAGES.plankGain6m * sessionFactor(perWeek);
  return months((m) => ({ month: m, value: round(startSec * (1 + g * gainCurve(m)), 5) }));
}

type Input =
  | { kind: "number"; min: number; max: number; placeholder: string; label: string }
  | { kind: "chips"; options: readonly (readonly [string, number])[] };

const pct = (a: number, b: number) => Math.round(((b - a) / a) * 100);
const VARY = "Everyone is different, so your results will vary. This is an estimate, not a promise or medical advice.";

/** Everything the chat needs per focus: chip label, follow-up question, chart, headline, caveat, first class. */
export const FOCI: Record<
  Focus,
  {
    label: string;
    question: string;
    input: Input;
    unit: string;
    metric: string;
    describe: (start: number) => string; // for the AI note prompt
    project: (start: number, perWeek: number) => Point[];
    headline: (start: number, end: number) => [big: string, small: string];
    caveat: (perWeek: number) => string;
    classSlug: string;
  }
> = {
  weight: {
    label: "Lose weight",
    question: "Roughly what do you weigh now? I'll show what a typical member loses over 6 months.",
    input: { kind: "number", min: 35, max: 250, placeholder: "e.g. 72", label: "Your weight in kg" },
    unit: "kg",
    metric: "Your weight",
    describe: (s) => `losing weight (currently ${s}kg)`,
    project: weightProjection,
    headline: (s, e) => [`−${round(s - e, 0.1).toFixed(1)}kg`, `${s}kg → ${e}kg`],
    caveat: (n) =>
      `Based on the average weight change in our members training ${n} times a week, alongside a balanced diet: about ${AVERAGES.weightLossPerMonth * 100}% of body weight in the first month, then a little less each month. ${VARY}`,
    classSlug: "20-minute-strength-hiit",
  },
  strength: {
    label: "Get stronger",
    question: "What weight dumbbells do you lift at the moment?",
    input: { kind: "chips", options: [["None yet", 2], ["2kg", 2], ["4kg", 4], ["6kg", 6], ["8kg or more", 8]] },
    unit: "kg",
    metric: "Your dumbbell weight",
    describe: (s) => `getting stronger (lifting ${s}kg dumbbells)`,
    project: strengthProjection,
    headline: (s, e) => [`${s}kg → ${e}kg`, `${pct(s, e)}% stronger`],
    caveat: (n) =>
      `Based on the average lifting strength increase in our members (about ${AVERAGES.strengthGain6m * 100}% in 6 months at 3 classes a week), adjusted for ${n} a week. ${VARY}`,
    classSlug: "full-body-sculpt",
  },
  tone: {
    label: "Tone up",
    question: "What's your waist measurement, roughly? Tape round your middle, level with your belly button.",
    input: { kind: "number", min: 50, max: 160, placeholder: "e.g. 84", label: "Your waist in cm" },
    unit: "cm",
    metric: "Your waist",
    describe: (s) => `toning up (waist ${s}cm)`,
    project: waistProjection,
    headline: (s, e) => [`−${round(s - e, 0.5)}cm`, `off your waist`],
    caveat: (n) =>
      `Based on the average waist measurement change in our members training ${n} times a week, alongside a balanced diet: about ${AVERAGES.waistLossPerMonthCm}cm in the first month, then a little less each month. ${VARY}`,
    classSlug: "lower-body-sculpt",
  },
  stamina: {
    label: "Core & stamina",
    question: "How long can you hold a plank right now?",
    input: { kind: "chips", options: [["Under 20 seconds", 15], ["20 to 40 seconds", 30], ["40 to 60 seconds", 50], ["Over a minute", 70]] },
    unit: "s",
    metric: "Your plank hold",
    describe: (s) => `building core strength and stamina (plank hold about ${s} seconds)`,
    project: plankProjection,
    headline: (s, e) => [`${s}s → ${e}s`, `${(e / s).toFixed(1)}× longer`],
    caveat: (n) =>
      `Based on the average plank hold improvement in our members (about ${AVERAGES.plankGain6m * 100}% longer in 6 months at 3 classes a week), adjusted for ${n} a week. ${VARY}`,
    classSlug: "10-minute-abs",
  },
};

export const isFocus = (v: unknown): v is Focus => typeof v === "string" && Object.hasOwn(FOCI, v);
