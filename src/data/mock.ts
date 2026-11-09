// Seeded demo data. Everything date-based is built relative to `now` by buildSeed(now),
// so the demo always looks "current". Deterministic: same `now` day -> same data.
import type {
  Automation,
  Badge,
  BodyArea,
  CancellationReason,
  Challenge,
  ChatbotQuestion,
  ClassItem,
  Group,
  Level,
  Member,
  MonthlyMetric,
  NudgeRule,
  Payment,
  Post,
  Workout,
} from "../lib/types";
import { images, liveSchedule } from "./site";
import { ukWeekday } from "../lib/time";

export const ME_ID = "me";

export const avatarFor = (name: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=f7e9f3`;

// Tiny deterministic PRNG so server and client agree.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

// ---------- Static (date-free) data ----------

export const groups: Group[] = [
  { id: "general", name: "General", description: "Say hello, share wins and ask anything.", members: 4210, image: images.card1 },
  { id: "beginners", name: "Beginners", description: "New to strength training? Start here, no question too small.", members: 1385, image: images.workout },
  { id: "midlife", name: "Menopause & Midlife", description: "Strength, hormones, sleep and staying strong for longevity.", members: 2140, image: images.about },
  { id: "runners", name: "Runners", description: "Strength work that makes you a faster, injury-proof runner.", members: 640, image: images.card3 },
  { id: "over60s", name: "Over 60s", description: "Proof that strong has no age limit.", members: 910, image: images.card2 },
];

export const badges: Badge[] = [
  { id: "first-class", name: "First class", description: "Completed your first class", icon: "Sparkles", threshold: 1 },
  { id: "ten", name: "10 classes", description: "Completed 10 classes", icon: "Medal", threshold: 10 },
  { id: "fifty", name: "50 classes", description: "Completed 50 classes", icon: "Trophy", threshold: 50 },
  { id: "hundred", name: "100 club", description: "Completed 100 classes", icon: "Crown", threshold: 100 },
  { id: "streak-3", name: "3-day streak", description: "Trained 3 days in a row", icon: "Flame", threshold: 3 },
  { id: "streak-7", name: "7-day streak", description: "Trained 7 days in a row", icon: "Zap", threshold: 7 },
  { id: "first-live", name: "First live class", description: "Joined Caroline live", icon: "Radio" },
  { id: "all-rounder", name: "All-rounder", description: "Trained every body area in one week", icon: "Target" },
  { id: "anniversary", name: "1 year strong", description: "A year with Caroline's Circuits", icon: "Cake" },
];

// Templates: {area} {suggestedArea} {className} {days} {count} {buddy} {challenge} {kg} {nextKg} {weeks} {time} {name}
export const nudgeRules: NudgeRule[] = [
  { id: "balance-area", category: "Balance", trigger: "Last 3 sessions all on the same body area", message: "Your {area} is on fire 🔥 try {suggestedArea} next", enabled: true },
  { id: "balance-rest", category: "Balance", trigger: "3+ strength days in a row", message: "{count} strength days straight! Give your muscles some love with {className}", enabled: true },
  { id: "balance-new", category: "Balance", trigger: "Never tried a category", message: "Something new: a 10-min kettlebell starter", enabled: true },
  { id: "consistency-missed-live", category: "Consistency", trigger: "Missed their usual live class", message: "Missed {className} live? The recording is ready when you are", enabled: true },
  { id: "consistency-usual-day", category: "Consistency", trigger: "Usual workout day has passed with no class", message: "It's usually your {day} workout. Short on time? Try a 15-min express", enabled: true },
  { id: "consistency-7d", category: "Consistency", trigger: "7+ days inactive", message: "We've missed you! Here's a gentle 3-class comeback plan to ease back in", enabled: true },
  { id: "consistency-21d", category: "Consistency", trigger: "21+ days inactive", message: "A note from Caroline: no guilt, just come back for 10 minutes today x", enabled: true },
  { id: "consistency-streak-risk", category: "Consistency", trigger: "Streak will break if no class today", message: "Keep your {days}-day streak alive: a 10-minute class counts!", enabled: true },
  { id: "progression-beginner", category: "Progression", trigger: "Finished the Beginners series", message: "You've finished the Beginners series! Ready for a full 30-minute class?", enabled: true },
  { id: "progression-weights", category: "Progression", trigger: "Same dumbbell weight for 6+ weeks", message: "You've lifted {kg}kg for {weeks} weeks. Time to try {nextKg}kg?", enabled: true },
  { id: "progression-duration", category: "Progression", trigger: "Mostly short classes (≤15 min)", message: "You're smashing the 10-minute classes. Step up to a 20-minute one?", enabled: true },
  { id: "personal-similar", category: "Personalisation", trigger: "Has favourites", message: "Loved {className}? You'll like this one too", enabled: true },
  { id: "personal-time", category: "Personalisation", trigger: "Trains at a regular time of day", message: "You usually train around {time}. Want a reminder?", enabled: true },
  { id: "personal-sunday", category: "Personalisation", trigger: "Sunday", message: "Your week: 3 classes picked for you, balanced across your body", enabled: true },
  { id: "recognition-milestone", category: "Recognition", trigger: "Hit a class milestone", message: "{count} classes completed! You're officially stronger than when you started 💪", enabled: true },
  { id: "recognition-recap", category: "Recognition", trigger: "First days of the month", message: "Your monthly recap is here: {count} classes last month", enabled: true },
  { id: "community-buddy", category: "Community", trigger: "A buddy completed a class recently", message: "{buddy} just did {className}. Join her?", enabled: true },
  { id: "community-challenge", category: "Community", trigger: "A challenge targets an area they skip", message: "The {challenge} is perfect for you: it's all about {area}", enabled: true },
];

export const automations: Automation[] = [
  { id: "auto-welcome", name: "Welcome drip (5 emails)", trigger: "New member joins", channel: "email", enabled: true, sent: 3120, openRate: 0.68 },
  { id: "auto-abandoned", name: "Abandoned checkout", trigger: "Started checkout, didn't pay within 1h", channel: "email", enabled: true, sent: 842, openRate: 0.51 },
  { id: "auto-milestone", name: "Milestone celebration", trigger: "10 / 50 / 100 classes completed", channel: "push", enabled: true, sent: 1964, openRate: 0.74 },
  { id: "auto-winback", name: "Win-back", trigger: "Cancelled 30 days ago", channel: "email", enabled: true, sent: 410, openRate: 0.37 },
  { id: "auto-renewal", name: "Renewal reminder", trigger: "Annual plan renews in 14 days", channel: "email", enabled: true, sent: 288, openRate: 0.62 },
  { id: "auto-upsell", name: "Annual upsell", trigger: "3 months on monthly plan", channel: "email", enabled: true, sent: 655, openRate: 0.44 },
  { id: "auto-missed", name: "Missed class catch-up", trigger: "RSVP'd to live class but didn't attend", channel: "push", enabled: true, sent: 2210, openRate: 0.58 },
  { id: "auto-weekly", name: "This week's classes", trigger: "Every Sunday 6pm", channel: "email", enabled: true, sent: 18450, openRate: 0.49 },
];

export const chatbotQuestions: ChatbotQuestion[] = [
  { q: "What equipment do I need?", count: 412 },
  { q: "Can I do the classes if I can't make the live?", count: 388 },
  { q: "I'm a beginner, is this for me?", count: 341 },
  { q: "How do I pause my membership?", count: 226 },
  { q: "What time is the live class in my timezone?", count: 205 },
  { q: "Can I cast to my TV?", count: 174 },
  { q: "How much is it in dollars?", count: 152 },
  { q: "Is it suitable during menopause?", count: 139 },
  { q: "How do I cancel?", count: 97 },
  { q: "Do you give nutrition advice?", count: 64 },
];

// ---------- Classes ----------

type SeriesDef = {
  series: string;
  bodyArea: BodyArea;
  durationMin: number;
  level: Level;
  equipment: string[];
  instructor?: string;
  image: string;
  tags: string[];
  titles: string[];
};

const seriesDefs: SeriesDef[] = [
  { series: "Full Body Sculpt", bodyArea: "full", durationMin: 30, level: "all", equipment: ["Dumbbells", "Mat"], image: images.fullBody, tags: ["strength", "live"], titles: ["Full Body Sculpt: Supersets", "Full Body Sculpt: Push & Pull", "Full Body Sculpt: Tempo Strength", "Full Body Sculpt: Ladders", "Full Body Sculpt: Compound Power", "Full Body Sculpt: EMOM"] },
  { series: "Arms & Abs", bodyArea: "upper", durationMin: 30, level: "all", equipment: ["Dumbbells", "Mat"], image: images.card1, tags: ["strength", "live"], titles: ["Arms & Abs: Sculpted Shoulders", "Arms & Abs: Bis, Tris & Core", "Arms & Abs: Back Strength", "Arms & Abs: Burnout Finisher", "Arms & Abs: Upper Body Pyramid"] },
  { series: "Legs & Glutes", bodyArea: "lower", durationMin: 30, level: "all", equipment: ["Dumbbells", "Resistance band", "Mat"], image: images.card2, tags: ["strength", "live", "glutes"], titles: ["Legs & Glutes: Band Burn", "Legs & Glutes: Squat Strong", "Legs & Glutes: Lunge Lab", "Legs & Glutes: Glute Bridge Blast", "Legs & Glutes: Single-Leg Strength", "Legs & Glutes: Heavy Lower"] },
  { series: "Strength HIIT", bodyArea: "hiit", durationMin: 30, level: "intermediate", equipment: ["Dumbbells", "Mat"], image: images.card3, tags: ["cardio", "live", "hiit"], titles: ["Strength HIIT: Tabata Weights", "Strength HIIT: 40/20 Circuit", "Strength HIIT: Countdown", "Strength HIIT: Cardio Strength Fusion", "Strength HIIT: Friday Finisher"] },
  { series: "15 Minute Express", bodyArea: "full", durationMin: 15, level: "all", equipment: ["Dumbbells"], image: images.classes[0], tags: ["express", "short"], titles: ["15 Min Express: Total Body", "15 Min Express: Upper Burn", "15 Min Express: Lower Burn", "15 Min Express: Core & Cardio", "15 Min Express: Lunchbreak Lift"] },
  { series: "10 Minute Series", bodyArea: "lower", durationMin: 10, level: "all", equipment: ["Resistance band"], image: images.classes[1], tags: ["short", "stackable"], titles: ["In Ten: Glutes", "In Ten: Arms", "In Ten: Abs", "In Ten: Legs", "In Ten: Shoulders & Back"] },
  { series: "Abs Only", bodyArea: "core", durationMin: 20, level: "all", equipment: ["Mat"], image: images.absBlast, tags: ["core", "abs"], titles: ["Abs Blast: Deep Core", "Abs Blast: Obliques", "Abs Blast: Plank Party", "Abs Blast: Pilates Core", "Abs Blast: Standing Abs"] },
  { series: "Beginners", bodyArea: "full", durationMin: 20, level: "beginner", equipment: ["Mat", "Light dumbbells (optional)"], image: images.workout, tags: ["beginner", "low-impact"], titles: ["Beginners 1: The Basics", "Beginners 2: Building Blocks", "Beginners 3: Adding Weights", "Beginners 4: Full Body Flow", "Beginners 5: Confidence Builder"] },
  { series: "Yoga with Amber", bodyArea: "yoga", durationMin: 45, level: "all", equipment: ["Mat"], instructor: "Amber", image: images.yoga, tags: ["yoga", "mobility", "recovery"], titles: ["Yoga with Amber: Hip Release", "Yoga with Amber: Slow Flow", "Yoga with Amber: Strength & Balance", "Yoga with Amber: Evening Unwind"] },
  { series: "Kettlebells", bodyArea: "full", durationMin: 25, level: "intermediate", equipment: ["Kettlebell"], image: images.classes[8], tags: ["kettlebell", "power"], titles: ["Kettlebell Starter (10 min)", "Kettlebells: Swing Strong", "Kettlebells: Full Body Flow"] },
];

function chaptersFor(durationMin: number, bodyArea: BodyArea) {
  const total = durationMin * 60;
  if (bodyArea === "yoga") {
    return [
      { label: "Breath & arrive", atSec: 0 },
      { label: "Sun salutations", atSec: Math.round(total * 0.15) },
      { label: "Standing flow", atSec: Math.round(total * 0.4) },
      { label: "Floor & stretch", atSec: Math.round(total * 0.7) },
      { label: "Savasana", atSec: Math.round(total * 0.9) },
    ];
  }
  const warm = durationMin <= 10 ? 60 : 240;
  const cool = durationMin <= 10 ? 60 : 180;
  const work = total - warm - cool;
  const rounds = durationMin <= 15 ? 2 : 3;
  return [
    { label: "Warm-up", atSec: 0 },
    ...Array.from({ length: rounds }, (_, i) => ({ label: `Circuit ${i + 1}`, atSec: warm + Math.round((work / rounds) * i) })),
    { label: "Cool-down", atSec: total - cool },
  ];
}

function buildClasses(now: number): ClassItem[] {
  const r = rng(42);
  const out: ClassItem[] = [];
  let n = 0;
  for (const def of seriesDefs) {
    def.titles.forEach((title, i) => {
      const isKbStarter = title.startsWith("Kettlebell Starter");
      const durationMin = isKbStarter ? 10 : def.durationMin;
      const slug = def.series.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
      out.push({
        id: `${slug}-${i + 1}`,
        title,
        series: def.series,
        bodyArea: def.bodyArea,
        durationMin,
        level: isKbStarter ? "beginner" : def.level,
        equipment: def.equipment,
        instructor: def.instructor ?? "Caroline",
        // Round-robin scraped imagery so the grid doesn't look repetitive.
        image: i === 0 ? def.image : images.classes[(n + i) % images.classes.length],
        description: `${durationMin} minute ${def.series.toLowerCase()} class with ${def.instructor ?? "Caroline"}. Thorough warm-up and cool-down included, with low-impact options throughout.`,
        chapters: chaptersFor(durationMin, def.bodyArea),
        isLive: def.tags.includes("live") && i === 0,
        publishedAt: new Date(now - (i * 7 + n) * DAY).toISOString(),
        tags: isKbStarter ? [...def.tags, "starter"] : def.tags,
        plays: Math.round(400 + r() * 6000),
      });
    });
    n += def.titles.length;
  }
  return out;
}

// ---------- Members ----------

const people: [string, string, string][] = [
  // name, country, timezone
  ["Sophie Turner", "UK", "Europe/London"],
  ["Jane Whitaker", "UK", "Europe/London"],
  ["Rachel Greene", "UK", "Europe/London"],
  ["Helen Marsh", "UK", "Europe/London"],
  ["Claire Bennett", "UK", "Europe/London"],
  ["Fiona MacLeod", "UK", "Europe/London"],
  ["Lucy Hargreaves", "UK", "Europe/London"],
  ["Anna Kowalski", "UK", "Europe/London"],
  ["Margaret Ellis", "UK", "Europe/London"],
  ["Priya Shah", "UK", "Europe/London"],
  ["Gillian Ford", "UK", "Europe/London"],
  ["Kate Robinson", "UK", "Europe/London"],
  ["Linda Price", "UK", "Europe/London"],
  ["Siobhan Murphy", "Ireland", "Europe/Dublin"],
  ["Aoife Byrne", "Ireland", "Europe/Dublin"],
  ["Sophia Martín", "Spain", "Europe/Madrid"],
  ["Harriet Dubois", "France", "Europe/Paris"],
  ["Ingrid Larsen", "Norway", "Europe/Oslo"],
  ["Petra Vogel", "Germany", "Europe/Berlin"],
  ["Nicky Johnson", "USA", "America/New_York"],
  ["Colleen Hayes", "USA", "America/New_York"],
  ["Megan Brooks", "USA", "America/Chicago"],
  ["Jennifer Lopez-Hart", "USA", "America/Los_Angeles"],
  ["Tara Nguyen", "USA", "America/Los_Angeles"],
  ["Michelle Carter", "Canada", "America/Toronto"],
  ["Laura Mitchell", "Australia", "Australia/Sydney"],
  ["Kirsty Walker", "Australia", "Australia/Melbourne"],
  ["Bridget O'Neill", "New Zealand", "Pacific/Auckland"],
  ["Aisha Rahman", "UAE", "Asia/Dubai"],
  ["Mei Tan", "Singapore", "Asia/Singapore"],
  ["Thandi Mokoena", "South Africa", "Africa/Johannesburg"],
  ["Elena Rossi", "Italy", "Europe/Rome"],
  ["Charlotte de Vries", "Netherlands", "Europe/Amsterdam"],
  ["Rebecca Lane", "UK", "Europe/London"],
  ["Catherine Doyle", "UK", "Europe/London"],
  ["Georgie Watts", "UK", "Europe/London"],
  ["Ira Patel", "UK", "Europe/London"],
  ["Sarah Collins", "UK", "Europe/London"],
  ["Debbie Atkinson", "UK", "Europe/London"],
];

const goalPool = ["Get stronger", "Lose weight", "Tone up", "Bone health", "Feel energised", "Manage menopause symptoms", "Run faster", "Build a habit", "Improve posture"];
const tagPool = ["midlife", "beginner", "runner", "60+", "busy", "live-regular", "on-demand", "app-user", "high-engagement", "at-risk"];
const noteFor = (status: string, name: string) =>
  status === "paused"
    ? "Paused: travelling, back next month."
    : status === "cancelled"
      ? "Cancelled: see reason in churn log."
      : status === "trial"
        ? "Came from Instagram free class."
        : `${name.split(" ")[0]} loves the Wednesday legs class.`;

function buildMembers(now: number): Member[] {
  const r = rng(7);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const statuses = ["active", "active", "active", "active", "active", "active", "paused", "cancelled", "trial"] as const;
  const me: Member = {
    id: ME_ID,
    name: "Emma Clarke",
    email: "emma.clarke@example.com",
    avatar: avatarFor("Emma Clarke"),
    country: "UK",
    timezone: "Europe/London",
    plan: "monthly",
    status: "active",
    joinedAt: new Date(now - 70 * DAY).toISOString(),
    lastActiveAt: new Date(now - 1 * DAY).toISOString(),
    classesCompleted: 25,
    mrr: 35,
    notes: "Demo customer. Joined via This Morning feature. Prefers morning classes.",
    goals: ["Get stronger", "Tone up", "Build a habit"],
    level: "intermediate",
    tags: ["midlife", "on-demand", "app-user"],
  };
  const others = people.map(([name, country, timezone], i): Member => {
    const status = statuses[i % statuses.length];
    const plan = status === "trial" ? "trial" : r() < 0.3 ? "annual" : "monthly";
    const joinedDaysAgo = Math.round(10 + r() * 700);
    const lastActive = status === "cancelled" ? 30 + r() * 60 : status === "paused" ? 10 + r() * 20 : r() * 9;
    const first = name.split(" ")[0].toLowerCase();
    return {
      id: `m-${i + 1}`,
      name,
      email: `${first}.${name.split(" ").slice(-1)[0].toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
      avatar: avatarFor(name),
      country,
      timezone,
      plan,
      status,
      joinedAt: new Date(now - joinedDaysAgo * DAY).toISOString(),
      lastActiveAt: new Date(now - lastActive * DAY).toISOString(),
      classesCompleted: Math.round((joinedDaysAgo / 7) * (1 + r() * 3)),
      mrr: status === "active" ? (plan === "annual" ? Math.round((385 / 12) * 100) / 100 : 35) : 0,
      notes: noteFor(status, name),
      goals: [pick(goalPool), pick(goalPool)].filter((g, j, a) => a.indexOf(g) === j),
      level: pick(["beginner", "all", "intermediate"] as const),
      tags: [pick(tagPool), pick(tagPool)].filter((g, j, a) => a.indexOf(g) === j),
    };
  });
  return [me, ...others];
}

// ---------- Workouts ----------

function at(now: number, daysAgo: number, hour: number) {
  const d = new Date(now - daysAgo * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function buildWorkouts(now: number, classes: ClassItem[]): Workout[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  const w = (id: string, memberId: string, classId: string, daysAgo: number, hour = 9): Workout => {
    const c = byId.get(classId)!;
    return { id, memberId, classId, completedAt: at(now, daysAgo, hour), bodyArea: c.bodyArea, durationMin: c.durationMin };
  };
  // Emma: ~10 weeks, mostly Monday/Wednesday mornings (UK days, walked back from `now` so they stay
  // Mon/Wed whatever the demo date) plus a couple of Fridays. No kettlebells ever (untried-category nudge).
  // Ends with full body 4 days ago + 3 core sessions on the last 3 days = 4-day streak; balance nudge -> legs.
  const earlier = [
    "beginners-1", "beginners-2", "beginners-3", "full-body-sculpt-1", "legs-glutes-1", "arms-abs-1", "full-body-sculpt-2",
    "15-minute-express-1", "legs-glutes-2", "yoga-with-amber-1", "full-body-sculpt-3", "strength-hiit-1", "arms-abs-2",
    "legs-glutes-3", "full-body-sculpt-4", "10-minute-series-1", "strength-hiit-2", "arms-abs-3", "full-body-sculpt-5",
    "legs-glutes-4", "15-minute-express-2",
  ];
  const usualDaysAgo: number[] = [];
  let fridays = 0;
  for (let d = 6; usualDaysAgo.length < earlier.length; d++) {
    const wd = ukWeekday(new Date(at(now, d, 9)));
    if (wd === 1 || wd === 3 || (wd === 5 && fridays++ < 2)) usualDaysAgo.unshift(d);
  }
  const history: [string, number][] = [
    ...earlier.map((id, i): [string, number] => [id, usualDaysAgo[i]]),
    ["full-body-sculpt-6", 4],
    ["abs-only-1", 3], ["abs-only-2", 2], ["abs-only-3", 1],
  ];
  const mine = history.map(([classId, d], i) => w(`w-me-${i + 1}`, ME_ID, classId, d, d < 5 ? 7 : 9));
  // A few for buddies so "buddy did a class" fires.
  const buddies = [
    w("w-b-1", "m-1", "legs-glutes-5", 0, 8),
    w("w-b-2", "m-1", "full-body-sculpt-1", 2, 9),
    w("w-b-3", "m-6", "yoga-with-amber-2", 1, 18),
  ];
  return [...mine, ...buddies].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

// ---------- Community ----------

function buildPosts(now: number, members: Member[]): Post[] {
  const m = (i: number) => members[i];
  const hrs = (h: number) => new Date(now - h * 3_600_000).toISOString();
  const p = (id: string, mi: number, group: string, text: string, hoursAgo: number, likes: number, extra: Partial<Post> = {}): Post => ({
    id,
    authorId: m(mi).id,
    authorName: m(mi).name,
    avatar: m(mi).avatar,
    group,
    text,
    createdAt: hrs(hoursAgo),
    likes,
    comments: [],
    ...extra,
  });
  return [
    p("p1", 1, "general", "Welcome to all our new members this week! Introduce yourself below 👋 Caroline x", 2, 184, { pinned: true, authorName: "Caroline (Team CC)", authorId: "caroline", avatar: avatarFor("Caroline Idiens") }),
    p("p2", 2, "beginners", "Just finished Beginners 3 and I actually used weights for the first time!! 2kg but it counts 😂", 3, 96, { comments: [{ authorName: "Helen Marsh", text: "It absolutely counts! Well done 👏" }, { authorName: "Caroline (Team CC)", text: "So proud of you! 3kg next 😉" }] }),
    p("p3", 9, "midlife", "Anyone else find the strength classes have helped with sleep? Three months in and I'm finally sleeping through.", 5, 142, { comments: [{ authorName: "Claire Bennett", text: "Yes! And my mood is so much better." }] }),
    p("p4", 20, "runners", "Hit a 5k PB on Saturday 🏃‍♀️ 26:40! Honestly think it's the Wednesday legs classes.", 8, 210, { image: images.card3, comments: [{ authorName: "Sophia Martín", text: "Amazing!! Legs day magic." }] }),
    p("p5", 13, "over60s", "66 and deadlifting 8kg. Never thought I'd type that sentence.", 11, 267, { comments: [{ authorName: "Margaret Ellis", text: "Queen 👑" }, { authorName: "Gillian Ford", text: "Inspiring, Linda!" }] }),
    p("p6", 4, "general", "Friday HIIT nearly finished me off. Who else was lying on the mat afterwards?", 14, 88, { comments: [{ authorName: "Kate Robinson", text: "Still there now 😅" }] }),
    p("p7", 26, "general", "Doing the Monday class at 8pm Sydney time with a glass of water and zero regrets. Love that the recordings are up straight away.", 18, 74),
    p("p8", 30, "general", "🔥 LOSE 10KG IN 10 DAYS 🔥 DM me for my secret detox tea, link in bio!!!", 20, 0, { flagged: "Spam / promotion" }),
    p("p9", 3, "midlife", "Hot flushes during HIIT, any tips? Feel like I'm melting.", 22, 58, { comments: [{ authorName: "Fiona MacLeod", text: "Fan pointed right at the mat. Game changer." }] }),
    p("p10", 7, "beginners", "Is it normal to feel sore two days after legs day? Can't sit down 🙈", 26, 61, { comments: [{ authorName: "Caroline (Team CC)", text: "Totally normal (DOMS)! Gentle walk and the yoga class will help." }] }),
    p("p11", 15, "general", "Sunday yoga with Amber was exactly what I needed after a stressful week.", 30, 49),
    p("p12", 21, "runners", "Which class is best the day before a long run? Don't want dead legs.", 34, 22, { comments: [{ authorName: "Megan Brooks", text: "Arms & Abs! Save the legs." }] }),
    p("p13", 10, "over60s", "Bone density scan came back improved! Doctor asked what I'd changed. Strength training, that's what 💪", 40, 198),
    p("p14", 33, "general", "Click here for FREE designer trainers 👟 www.not-a-scam.biz", 44, 1, { flagged: "Suspicious link" }),
    p("p15", 5, "midlife", "Just ordered Fit at 50. Anyone started the 6-week plan yet?", 50, 37, { image: images.fitAt50 }),
    p("p16", 34, "general", "Back after surgery and so grateful for the low-impact options. Taking it slow.", 56, 121, { comments: [{ authorName: "Rebecca Lane", text: "Welcome back! Go gently x" }] }),
    p("p17", 6, "beginners", "Week 2 done ✅ Did 3 classes. Small wins!", 62, 53),
    p("p18", 18, "general", "Joining from Norway, the 9am UK class is perfect for my lunch break.", 70, 29),
    p("p19", 11, "midlife", "November Lower Body Challenge anyone? Need accountability buddies!", 76, 44, { comments: [{ authorName: "Lucy Hargreaves", text: "I'm in!" }] }),
    p("p20", 36, "general", "Upgraded to 4kg dumbbells today. Feeling very fancy.", 90, 67),
  ];
}

function buildChallenges(now: number, classes: ClassItem[]): Challenge[] {
  const d = new Date(now);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59).toISOString();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const ids = (area: BodyArea) => classes.filter((c) => c.bodyArea === area).slice(0, 6).map((c) => c.id);
  return [
    { id: "ch-lower", title: `${month} Lower Body Challenge`, description: "8 legs & glutes classes this month. Stronger legs, happier knees.", bodyArea: "lower", startsAt: monthStart, endsAt: monthEnd, targetClasses: 8, participants: 1243, classIds: ids("lower"), image: images.card2 },
    { id: "ch-core", title: "21-Day Core Reset", description: "A short abs class every day for 3 weeks.", bodyArea: "core", startsAt: new Date(now - 5 * DAY).toISOString(), endsAt: new Date(now + 16 * DAY).toISOString(), targetClasses: 21, participants: 892, classIds: ids("core"), image: images.absBlast },
    { id: "ch-yoga", title: "Stretch & Restore Week", description: "Pair every strength class with a yoga or mobility session.", bodyArea: "yoga", startsAt: new Date(now + 7 * DAY).toISOString(), endsAt: new Date(now + 14 * DAY).toISOString(), targetClasses: 4, participants: 310, classIds: ids("yoga"), image: images.yoga },
  ];
}

// ---------- Business ----------

function buildMetrics(now: number): MonthlyMetric[] {
  const d = new Date(now);
  const out: MonthlyMetric[] = [];
  let active = 2380;
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const month = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const jan = m.getMonth() === 0;
    const signups = Math.round(180 + (11 - i) * 14 + (jan ? 220 : 0) + (m.getMonth() === 8 ? 90 : 0));
    const cancellations = Math.round(95 + (m.getMonth() === 6 || m.getMonth() === 7 ? 60 : 0) + (11 - i) * 3);
    active += signups - cancellations;
    out.push({ month, signups, cancellations, activeMembers: active, mrr: Math.round(active * 31.6) });
  }
  return out;
}

function buildPayments(now: number, members: Member[]): Payment[] {
  return members
    .filter((m) => m.status !== "trial")
    .slice(0, 30)
    .map((m, i) => ({
      id: `pay-${i + 1}`,
      memberId: m.id,
      memberName: m.name,
      amount: m.plan === "annual" ? 385 : 35,
      date: new Date(now - (i % 28) * DAY).toISOString(),
      plan: m.plan,
      status: i === 7 || i === 19 ? "failed" : i === 24 ? "refunded" : "paid",
    }));
}

const cancelTexts: [string, string][] = [
  ["Too expensive", "Money's tight with the cost of living, will be back in the new year."],
  ["Not enough time", "New job, I'm just not finding 30 minutes. Maybe the 10 min ones would help."],
  ["Injury / health", "Knee surgery next month. Will rejoin when physio says ok."],
  ["Prefer in-person", "Missing the buzz of a real class."],
  ["Too expensive", "Have to cut back on subscriptions."],
  ["Not enough time", "Kids' schedules are chaos this term."],
  ["Classes too hard", "Found the HIIT too much, would like more beginner options."],
  ["Travelling", "Away for 3 months, would pause if it was easier to find."],
  ["Not enough time", "Couldn't make the live classes and forgot about the recordings."],
  ["Technical issues", "App kept logging me out on my TV."],
  ["Injury / health", "Back problems flared up. Loved the classes though."],
  ["Switched to gym", "Joined a gym with my partner."],
  ["Too expensive", "Wish there was a cheaper on-demand only plan."],
  ["Other", "Just taking a break, nothing wrong!"],
  ["Classes too hard", "Struggled to keep up, felt left behind."],
];

function buildCancellations(now: number, members: Member[]): CancellationReason[] {
  return cancelTexts.map(([reason, freeText], i) => ({
    memberId: members[(i * 3 + 2) % members.length].id,
    reason,
    freeText,
    date: new Date(now - (i * 9 + 2) * DAY).toISOString(),
  }));
}

// ---------- Seed ----------

export function buildSeed(nowDate: Date) {
  const now = nowDate.getTime();
  const classes = buildClasses(now);
  const members = buildMembers(now);
  const workouts = buildWorkouts(now, classes);
  // Dumbbell weight log for Emma: stuck on 2kg for 8 weeks -> "Time to try 3kg?"
  const weights = [10, 8, 6, 4, 2, 0].map((weeksAgo) => ({
    date: new Date(now - weeksAgo * 7 * DAY).toISOString(),
    kg: weeksAgo === 10 ? 1 : 2,
  }));
  return {
    classes,
    liveSchedule: liveSchedule.map((s) => ({ ...s })),
    members,
    workouts,
    posts: buildPosts(now, members),
    groups,
    challenges: buildChallenges(now, classes),
    badges,
    nudgeRules: nudgeRules.map((r) => ({ ...r })),
    automations: automations.map((a) => ({ ...a })),
    payments: buildPayments(now, members),
    cancellationReasons: buildCancellations(now, members),
    metrics: buildMetrics(now),
    chatbotQuestions,
    me: {
      memberId: ME_ID,
      onboarded: true,
      onboarding: {
        goals: ["Get stronger", "Tone up", "Build a habit"],
        level: "intermediate" as Level,
        equipment: ["Dumbbells", "Mat", "Resistance band"],
        injuries: "",
        availability: ["Mon", "Wed", "Fri"],
      },
      favourites: ["full-body-sculpt-3", "legs-glutes-2", "yoga-with-amber-1"],
      continueWatching: [
        { classId: "strength-hiit-3", progressSec: 640 },
        { classId: "yoga-with-amber-3", progressSec: 900 },
      ],
      rsvps: [] as string[],
      reminders: ["slot-wed"],
      weights,
      buddies: ["m-1", "m-6"],
      joinedChallenges: [] as string[],
      groups: ["general", "midlife"],
      paused: undefined as { until: string } | undefined,
      plan: "monthly" as "monthly" | "annual" | "trial",
    },
  };
}

export type Seed = ReturnType<typeof buildSeed>;
