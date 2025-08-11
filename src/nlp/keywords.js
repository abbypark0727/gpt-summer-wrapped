// src/nlp/keywords.js
const STOP = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","without","by","as",
  "is","are","was","were","be","been","being","it","its","at","from","this","that",
  "i","you","we","they","he","she","them","my","our","your","me","us",
  "about","into","over","under","up","down","out","not","no","yes","ok","okay",
  "thanks","thank","pls","please","hey","hi","hello",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * messages: [{ role, text, createdAt }]
 * opts: { topN = 12, boost = Set<string> } // strings already lowercase
 */
export function extractKeywords(messages, opts = {}) {
  const topN = opts.topN ?? 12;
  const boost = opts.boost ?? new Set();

  const freq = new Map();

  for (const m of messages) {
    if ((m.role || "").toLowerCase() !== "user") continue;
    const toks = tokenize(m.text);
    for (const t of toks) {
      if (t.length < 2) continue;
      if (STOP.has(t)) continue;

      const cur = freq.get(t) ?? 0;
      // alias boost: if token is one of your aliases, give it extra weight
      const weight = boost.has(t) ? 5 : 1; // tweakable
      freq.set(t, cur + weight);
    }
  }

  return Array.from(freq.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}