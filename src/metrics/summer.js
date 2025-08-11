// src/metrics/summer.js
// Computes summer (June 1–Aug 31) metrics from normalized threads.

import { extractKeywords } from '../nlp/keywords';

const SUMMER_START = (year) => new Date(Date.UTC(year, 5, 1)); // June 1
const SUMMER_END = (year) => new Date(Date.UTC(year, 7, 31, 23, 59, 59, 999)); // Aug 31

function toYMD(d) {
  const z = new Date(d);
  return z.toISOString().slice(0, 10); // YYYY-MM-DD
}

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const TOPIC_RULES = [
  { name: "Coding/Debugging", keys: ["code", "bug", "error", "python", "pandas", "sql", "js", "react", "api"] },
  { name: "Writing/Comms", keys: ["email", "draft", "rewrite", "tone", "summary", "bullet", "outline"] },
  { name: "Data/Analysis", keys: ["data", "table", "chart", "plot", "csv", "query", "metrics", "regression"] },
  { name: "Research", keys: ["paper", "cite", "source", "evidence", "policy", "report"] },
  { name: "Math/Stats", keys: ["probability", "matrix", "algebra", "stat", "mean", "variance"] },
];

function categorize(tokens) {
  const set = new Set(tokens);
  const out = [];
  for (const rule of TOPIC_RULES) {
    const hit = rule.keys.some((k) => set.has(k));
    if (hit) out.push(rule.name);
  }
  return out.length ? out : ["General"];
}

export function computeSummerMetrics(threads, opts = {}) {
  // 1) Flatten messages and normalize role
  const allMsgs = threads
    .flatMap((t) =>
      (t.messages || []).map((m) => ({
        ...m,
        role: String(m.role || "").toLowerCase(), // normalize
        threadId: t.id,
        threadTitle: t.title || "Conversation",
      }))
    )
    .filter((m) => m.createdAt);

  if (!allMsgs.length) {
    const now = new Date();
    const year = opts.year ?? now.getUTCFullYear();
    return {
      year,
      startISO: SUMMER_START(year).toISOString().slice(0, 10),
      endISO: SUMMER_END(year).toISOString().slice(0, 10),
      totalPrompts: 0,
      totalAssistant: 0,
      uniqueDays: 0,
      longestStreak: 0,
      busiestDay: null,
      topics: [],
      weekBuckets: [],
      longestThread: null,
      persona: { blurb: "No summer data found.", tags: [] },
    };
  }

  // 2) Choose year with most Jun–Aug msgs (or provided)
  const byYear = new Map();
  for (const m of allMsgs) {
    const d = new Date(m.createdAt);
    const y = d.getUTCFullYear();
    const month = d.getUTCMonth();
    if (month >= 5 && month <= 7) {
      byYear.set(y, (byYear.get(y) || 0) + 1);
    }
  }
  const chosenYear =
    opts.year ??
    (byYear.size
      ? [...byYear.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : new Date(allMsgs[0].createdAt).getUTCFullYear());

  const start = SUMMER_START(chosenYear);
  const end = SUMMER_END(chosenYear);

  const inSummer = allMsgs.filter((m) => {
    const d = new Date(m.createdAt);
    return d >= start && d <= end;
  });

  if (!inSummer.length) {
    // Nothing in the chosen summer window
    return {
      year: chosenYear,
      startISO: start.toISOString().slice(0, 10),
      endISO: end.toISOString().slice(0, 10),
      totalPrompts: 0,
      totalAssistant: 0,
      uniqueDays: 0,
      longestStreak: 0,
      busiestDay: null,
      topics: [],
      weekBuckets: [],
      longestThread: null,
      persona: { blurb: "No summer data found.", tags: [] },
    };
  }

  // Separate user messages (for topics, streaks, weekly buckets)
  const userSummer = inSummer.filter((m) => m.role === "user");

  // For keywords
  const aliases = new Set((opts.aliases || []).map(s => s.toLowerCase()));
  const keywords = extractKeywords(userSummer, { topN: 12, boost: aliases });

  // 3) Counts
  const totalPrompts = userSummer.length;
  const totalAssistant = inSummer.filter((m) => m.role === "assistant").length;

  // 4) Daily buckets & streaks (track user vs all)
  const daily = new Map(); // YYYY-MM-DD -> { user: n, all: n }
  for (const m of inSummer) {
    const key = toYMD(m.createdAt);
    const prev = daily.get(key) || { user: 0, all: 0 };
    daily.set(key, {
      user: prev.user + (m.role === "user" ? 1 : 0),
      all: prev.all + 1,
    });
  }
  const uniqueDays = daily.size;

  // Busiest day: by user count, tie-break by all
  let busiestDay = null;
  for (const [day, v] of daily.entries()) {
    if (
      !busiestDay ||
      v.user > busiestDay.count ||
      (v.user === busiestDay.count && v.all > busiestDay.all)
    ) {
      busiestDay = { date: day, count: v.user, all: v.all };
    }
  }

  // Longest streak of consecutive days with >=1 user msg
  const daysSorted = [...daily.keys()].sort();
  let longestStreak = 0;
  let current = 0;
  let prevDate = null;
  for (const dStr of daysSorted) {
    const v = daily.get(dStr);
    if (!v || v.user === 0) {
      // breaks streak if that day had no user prompts
      prevDate = null;
      continue;
    }
    if (!prevDate) {
      current = 1;
    } else {
      const prev = new Date(prevDate);
      const cur = new Date(dStr);
      const diff = (cur - prev) / (1000 * 60 * 60 * 24);
      current = diff === 1 ? current + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, current);
    prevDate = dStr;
  }

  // 5) Topics (user prompts only)
  const topicCounts = new Map();
  for (const m of userSummer) {
    const cats = categorize(tokenize(m.text));
    for (const c of cats) topicCounts.set(c, (topicCounts.get(c) || 0) + 1);
  }
  const topics = [...topicCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 6) Weekly buckets (user prompts only)
  const weekMap = new Map(); // label -> count
  for (const m of userSummer) {
    const d = new Date(m.createdAt);
    const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dow = day.getUTCDay(); // 0 Sun ... 6 Sat
    const monday = new Date(day);
    const delta = (dow + 6) % 7; // days since Monday
    monday.setUTCDate(day.getUTCDate() - delta);
    const label = `Week of ${monday.toISOString().slice(5, 10)}`; // "Week of 06-02"
    weekMap.set(label, (weekMap.get(label) || 0) + 1);
  }
  const weekBuckets = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([activity, count]) => ({ activity, count }));

  // 7) Longest thread (by turns in summer window, user+assistant)
  const threadCounts = new Map(); // threadId -> { title, turns }
  for (const m of inSummer) {
    const cur = threadCounts.get(m.threadId) || { title: m.threadTitle, turns: 0 };
    cur.turns += 1;
    threadCounts.set(m.threadId, cur);
  }
  const longestThreadEntry = [...threadCounts.entries()].sort((a, b) => b[1].turns - a[1].turns)[0];
  const longestThread = longestThreadEntry
    ? { id: longestThreadEntry[0], title: longestThreadEntry[1].title, turns: longestThreadEntry[1].turns }
    : null;

  // 8) Persona blurb
  const topTwo = topics.slice(0, 2).map((t) => t.name);
  const persona = {
    blurb: topTwo.length
      ? `You leaned ${topTwo[0]} with a side of ${topTwo[1] || "General"} this summer.`
      : "Your summer usage was low-volume but eclectic.",
    tags: [`${totalPrompts} prompts`, `${longestStreak}-day streak`, topTwo[0] || "General"],
  };

  return {
    year: chosenYear,
    startISO: start.toISOString().slice(0, 10),
    endISO: end.toISOString().slice(0, 10),
    totalPrompts,
    totalAssistant,
    uniqueDays,
    longestStreak,
    busiestDay,
    topics,
    weekBuckets,
    longestThread,
    persona,
    keywords,
  };
}