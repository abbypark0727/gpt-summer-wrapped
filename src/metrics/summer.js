// src/metrics/summer.js
// Computes summer (June 1–Aug 31) metrics from normalized threads.

import { extractKeywords } from '../nlp/keywords';
import { analyzeEmotions } from '../nlp/sentiment';

const SUMMER_START = (year) => new Date(Date.UTC(year, 5, 1)); // June 1
const SUMMER_END = (year) => new Date(Date.UTC(year, 7, 31, 23, 59, 59, 999)); // Aug 31

function toYMD(d) { return new Date(d).toISOString().slice(0,10); }

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

// Heuristic: minutes saved per user prompt by topic
const TIME_SAVED_MIN = {
  "Coding/Debugging": 9,
  "Writing/Comms":    6,
  "Data/Analysis":    8,
  "Research":         7,
  "Math/Stats":       7,
  "General":          4,
};

function estimateTimeSavedPerMessage(m) {
  const toks = tokenize(m.text);
  const cats = categorize(toks);
  let base = Math.max(...cats.map(c => TIME_SAVED_MIN[c] ?? 4));
  if (toks.length > 60) base += 2;
  if (/\burgent|quick|deadline\b/i.test(m.text)) base += 2;
  return base;
}

// Pull likely accomplishments from phrasing
function extractAccomplishments(userMsgs) {
  const RX = [
    /merged|landed|shipped|launched/i,
    /fixed|resolved|closed/i,
    /approved|got approval|sign[- ]off/i,
    /offer (received|got)|return offer/i,
    /presented|demo(ed)?|published/i,
  ];
  const seen = new Set();
  const items = [];

  for (const m of userMsgs) {
    if (!RX.some(rx => rx.test(m.text))) continue;
    const text = m.text.replace(/\s+/g, " ").trim();
    // short label: first 90 chars
    const label = text.slice(0, 90) + (text.length > 90 ? "…" : "");
    if (seen.has(label)) continue;
    seen.add(label);
    items.push({ name: label, date: toYMD(m.createdAt) });
  }
  // prefer recent, cap 6
  items.sort((a,b) => b.date.localeCompare(a.date));
  return items.slice(0, 6);
}

function makeRoast(metrics) {
  const kw0 = metrics.keywords?.[0]?.name;
  if (metrics.longestStreak <= 2) {
    return `Commitment issues? A ${metrics.longestStreak}-day streak says “see you… eventually.”`;
  }
  if ((metrics.emotions?.panicCount || 0) > (metrics.emotions?.lolCount || 0)) {
    return `You kept the panic button warm. Maybe next summer we swap “omg” for “lol”?`;
  }
  if (kw0) return `You whispered “${kw0}” into ChatGPT’s ear all summer. Obsession? Product focus.`;
  return `Balanced diet of prompts. Not too spicy, not too bland. Chef’s kiss.`;
}

export function computeSummerMetrics(threads, opts = {}) {
  // 1) Flatten messages and normalize role
    const allMsgs = threads.flatMap((t) =>
    (t.messages || []).map(m => ({
      ...m,
      role: String(m.role || "").toLowerCase(),
      threadId: t.id,
      threadTitle: t.title || "Conversation",
    }))
  ).filter(m => m.createdAt);

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
      keywords: [],
      emotions: { dailyScores: [], panicCount: 0, lolCount: 0 },
      timeSavedMinutes: 0,
      accomplishments: [],
      roast: "Not enough data to roast you. Come back after a good crash out.",
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

  const userSummer = inSummer.filter(m => m.role === "user");
  const totalPrompts = userSummer.length;
  const totalAssistant = inSummer.filter(m => m.role === "assistant").length;

  // keywords (with optional aliases boost)
  const aliases = new Set((opts.aliases || []).map(s => s.toLowerCase()));
  const keywords = extractKeywords(userSummer, { topN: 12, boost: aliases });

  // daily usage & streaks
  const daily = new Map();
  for (const m of inSummer) {
    const key = toYMD(m.createdAt);
    const prev = daily.get(key) || { user: 0, all: 0 };
    daily.set(key, { user: prev.user + (m.role === "user" ? 1 : 0), all: prev.all + 1 });
  }
  const uniqueDays = daily.size;

  let busiestDay = null;
  for (const [day, v] of daily.entries()) {
    if (!busiestDay || v.user > busiestDay.count || (v.user === busiestDay.count && v.all > busiestDay.all)) {
      busiestDay = { date: day, count: v.user, all: v.all };
    }
  }

  const daysSorted = [...daily.keys()].sort();
  let longestStreak = 0, current = 0, prevDate = null;
  for (const dStr of daysSorted) {
    const v = daily.get(dStr);
    if (!v || v.user === 0) { prevDate = null; continue; }
    if (!prevDate) current = 1;
    else {
      const prev = new Date(prevDate), cur = new Date(dStr);
      const diff = (cur - prev) / (1000*60*60*24);
      current = diff === 1 ? current + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, current);
    prevDate = dStr;
  }

  // topics
  const topicCounts = new Map();
  for (const m of userSummer) {
    for (const c of categorize(tokenize(m.text))) {
      topicCounts.set(c, (topicCounts.get(c) || 0) + 1);
    }
  }
  const topics = [...topicCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  // weekly buckets
  const weekMap = new Map();
  for (const m of userSummer) {
    const d = new Date(m.createdAt);
    const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dow = day.getUTCDay();
    const monday = new Date(day); monday.setUTCDate(day.getUTCDate() - ((dow + 6) % 7));
    const label = `Week of ${monday.toISOString().slice(5,10)}`;
    weekMap.set(label, (weekMap.get(label) || 0) + 1);
  }
  const weekBuckets = [...weekMap.entries()]
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([activity, count]) => ({ activity, count }));

  // emotions
  const emo = analyzeEmotions(userSummer);
  const emotions = { dailyScores: emo.dailyScores, panicCount: emo.panicCount, lolCount: emo.lolCount };

  // time saved (cap 60 min/day)
  const perDay = new Map();
  for (const m of userSummer) {
    const key = toYMD(m.createdAt);
    const add = estimateTimeSavedPerMessage(m);
    perDay.set(key, (perDay.get(key) || 0) + add);
  }
  let timeSavedMinutes = 0;
  for (const v of perDay.values()) {
    timeSavedMinutes += Math.min(v, 60);
  }

  // accomplishments
  const accomplishments = extractAccomplishments(userSummer);

  // persona + roast
  const topTwo = topics.slice(0,2).map(t => t.name);
  const persona = {
    blurb: topTwo.length
      ? `You leaned ${topTwo[0]} with a side of ${topTwo[1] || "General"} this summer.`
      : "Your summer usage was low-volume but eclectic.",
    tags: [`${totalPrompts} prompts`, `${longestStreak}-day streak`, topTwo[0] || "General"],
  };
  const roast = makeRoast({ longestStreak, keywords, emotions });

  return {
    year: chosenYear,
    startISO: SUMMER_START(chosenYear).toISOString().slice(0,10),
    endISO:   SUMMER_END(chosenYear).toISOString().slice(0,10),
    totalPrompts,
    totalAssistant,
    uniqueDays,
    longestStreak,
    busiestDay,
    topics,
    weekBuckets,
    longestThread: (() => {
      const threadCounts = new Map();
      for (const m of inSummer) {
        const cur = threadCounts.get(m.threadId) || { title: m.threadTitle, turns: 0 };
        cur.turns += 1; threadCounts.set(m.threadId, cur);
      }
      const e = [...threadCounts.entries()].sort((a,b)=>b[1].turns - a[1].turns)[0];
      return e ? { id: e[0], title: e[1].title, turns: e[1].turns } : null;
    })(),
    persona,
    keywords,
    emotions,
    timeSavedMinutes,
    accomplishments,
    roast,
  };
}