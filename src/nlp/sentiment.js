// src/nlp/sentiment.js
// Tiny, local sentiment + "panic/LOL" detector.

function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const POS = new Set([
  "win","great","awesome","love","nice","yay","cool","clean","works","fixed","pass",
  "haha","lol","lmao","lols","hehe","😂","😅","🙂","🎉","woot","yay!!","nailed"
]);
const NEG = new Set([
  "panic","anxious","anxiety","worried","stressed","stress","urgent","help",
  "broken","fail","wtf","ugh","omg","crash","stuck","blocked","😭","🥲","deadlines"
]);

const PANIC_PATTERNS = [
  /panic|freak(ing)? out|meltdown|help me/i,
  /urgent|deadline|blocked|stuck/i,
  /resume filter|oa due|offer deadline/i
];
const LOL_PATTERNS = [
  /lol|lmao|haha|hehe|😂|😅/i,
  /this is (so )?funny|i can't believe i did/i,
  /toilet|plunger|paper towels/i // your example 😅
];

export function analyzeEmotions(userMessages) {
  const dailyMap = new Map(); // YYYY-MM-DD -> score
  let panicCount = 0, lolCount = 0;

  for (const m of userMessages) {
    const date = new Date(m.createdAt).toISOString().slice(0,10);
    const toks = tokenize(m.text);
    let score = 0;
    for (const t of toks) {
      if (POS.has(t)) score += 1;
      if (NEG.has(t)) score -= 1;
    }
    // pattern hits
    if (PANIC_PATTERNS.some(rx => rx.test(m.text))) panicCount++;
    if (LOL_PATTERNS.some(rx => rx.test(m.text)))   lolCount++;

    dailyMap.set(date, (dailyMap.get(date) || 0) + score);
  }

  const dailyScores = [...dailyMap.entries()]
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([date, score]) => ({ date, score }));

  return { dailyScores, panicCount, lolCount };
}