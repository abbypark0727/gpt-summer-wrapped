import { STOPWORDS } from './stopwords';
const TOKEN = /[A-Za-z0-9+#._-]+/g;

export function extractKeywords(messages, { topN = 10, boost = new Set() } = {}) {
  const freq = new Map();
  for (const m of messages) {
    const text = m?.text || "";
    const raw = text.match(TOKEN) || [];
    for (const t of raw) {
      const lower = t.toLowerCase();
      if (lower.length < 3) continue;
      if (STOPWORDS.has(lower)) continue;
      if (/^\d+$/.test(lower)) continue;

    let weight = 1;
      if (/^[A-Z0-9_-]{3,}$/.test(t)) weight += 1.5;      // ALLCAPS boost
      if (/^[A-Z][a-z0-9_-]+$/.test(t)) weight += 0.5;    // Capitalized boost
      if (boost.has(lower) || boost.has(t)) weight += 3;  // user-specified aliases

    freq.set(lower, (freq.get(lower) || 0) + weight);
    }
  }
  return [...freq.entries()]
    .map(([name, value]) => ({ name: name.toUpperCase(), value: Math.round(value) }))
    .sort((a,b) => b.value - a.value)
    .slice(0, topN);
}