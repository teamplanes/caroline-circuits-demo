export type BodyArea = "full" | "upper" | "lower" | "core" | "hiit" | "yoga" | "mobility";
export type Level = "beginner" | "all" | "intermediate";
export type Plan = "monthly" | "annual" | "trial";
export type MemberStatus = "active" | "paused" | "cancelled" | "trial";

export type ClassItem = {
  id: string;
  title: string;
  series: string;
  bodyArea: BodyArea;
  durationMin: number;
  level: Level;
  equipment: string[];
  instructor: string;
  image: string;
  description: string;
  chapters: { label: string; atSec: number }[];
  isLive?: boolean;
  publishedAt: string; // ISO
  tags: string[];
  plays: number;
};

export type LiveSlot = {
  id: string;
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday (JS Date convention)
  timeUK: string; // "HH:MM" Europe/London
  title: string;
  bodyArea: BodyArea;
  durationMin: number;
  instructor?: string;
  prerecorded?: boolean;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  country: string;
  timezone: string;
  plan: Plan;
  status: MemberStatus;
  joinedAt: string;
  lastActiveAt: string;
  classesCompleted: number;
  mrr: number; // GBP per month
  notes: string;
  goals: string[];
  level: Level;
  tags: string[];
};

export type Workout = {
  id: string;
  memberId: string;
  classId: string;
  completedAt: string;
  bodyArea: BodyArea;
  durationMin: number;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  avatar: string;
  group: string;
  text: string;
  image?: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  comments: { authorName: string; text: string }[];
  pinned?: boolean;
  hidden?: boolean;
  flagged?: string; // reason
};

export type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
  image: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  bodyArea: BodyArea;
  startsAt: string;
  endsAt: string;
  targetClasses: number;
  participants: number;
  classIds: string[];
  image: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  threshold?: number;
};

export type NudgeCategory =
  | "Balance"
  | "Consistency"
  | "Progression"
  | "Personalisation"
  | "Recognition"
  | "Community";

export type NudgeRule = {
  id: string;
  category: NudgeCategory;
  trigger: string; // human-readable description of when it fires
  message: string; // template, supports {placeholders}
  enabled: boolean;
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  channel: "email" | "push" | "sms" | "in-app";
  enabled: boolean;
  sent: number;
  openRate: number; // 0..1
};

export type Payment = {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  plan: Plan;
  status: "paid" | "failed" | "refunded";
};

export type CancellationReason = {
  memberId: string;
  reason: string;
  freeText: string;
  date: string;
};

export type Testimonial = {
  name: string;
  location?: string;
  age?: number;
  tag: "beginner" | "midlife" | "runner" | "busy" | "60+";
  quote: string;
  result?: string;
};

export type Faq = { question: string; answer: string; category?: string };

export type BlogPost = {
  id: string;
  title: string;
  date: string;
  cover: string;
  url: string;
  excerpt: string;
  relatedBodyArea?: BodyArea;
};

export type PressItem = { name: string; logo: string; quote?: string; url?: string };

export type ChatbotQuestion = { q: string; count: number };

export type MonthlyMetric = {
  month: string; // "2026-01"
  mrr: number;
  signups: number;
  cancellations: number;
  activeMembers: number;
};

export type ChatMessage = { role: "user" | "assistant"; content: string; at: string; mode?: "sales" | "support" };

export type Nudge = {
  id: string;
  ruleId: string;
  category: NudgeCategory;
  title: string;
  message: string;
  cta: { label: string; classId?: string; href?: string };
  priority: number; // higher = more important
};
