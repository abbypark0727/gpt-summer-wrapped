// src/data/chatgpt/parse.js
// Tolerant parser for ChatGPT export formats.
// Normalizes into: { threads: [{ id, title, createdAt, messages: [{role, createdAt, text}] }] }

const toISO = (t) => {
  if (!t && t !== 0) return null;
  // seconds since epoch (int/float)
  if (typeof t === "number") return new Date(t * 1000).toISOString();
  // ISO-ish string
  if (typeof t === "string") {
    const d = new Date(t);
    if (!isNaN(d)) return d.toISOString();
  }
  return null;
};

const getText = (content) => {
  if (!content) return "";

  // Legacy ChatGPT: { content_type:"text", parts:[...] }
  if (Array.isArray(content.parts)) {
    return content.parts.filter(Boolean).join("\n").trim();
  }

  // Common: { text: "..." } or { text: { value: "..." } }
  if (typeof content.text === "string") return content.text.trim();
  if (content?.text?.value) return String(content.text.value).trim();

  // Assistants-like: content is an array of blocks
  // e.g. [{type:"text", text:{value:"..."}}, {type:"input_text", text:{value:"..."}}]
  if (Array.isArray(content)) {
    const pieces = [];
    for (const c of content) {
      if (!c) continue;
      if (typeof c === "string") { pieces.push(c); continue; }
      if (c?.text?.value) { pieces.push(String(c.text.value)); continue; }
      if (typeof c?.text === "string") { pieces.push(c.text); continue; }
      if (c?.type === "input_text" && typeof c?.input_text === "string") {
        pieces.push(c.input_text);
      }
    }
    return pieces.join("\n").trim();
  }

  // Fallback: stringify plain strings
  if (typeof content === "string") return content.trim();

  return "";
};

function extractFromMapping(mapping) {
  if (!mapping) return [];
  const nodes = Object.values(mapping)
    .filter(n => n?.message?.author?.role && n?.message?.content)
    .sort((a, b) => {
      const at = a.message?.create_time ?? a.message?.update_time ?? 0;
      const bt = b.message?.create_time ?? b.message?.update_time ?? 0;
      return at - bt;
    });

  return nodes
    // If you want to skip system/tool messages entirely, uncomment next line:
    // .filter(n => ["user", "assistant"].includes(n.message.author.role))
    .map(n => ({
      role: n.message.author.role, // "user" | "assistant" | "system" | "tool"
      createdAt: toISO(n.message.create_time) || toISO(n.message.update_time),
      text: getText(n.message.content),
    }));
}

export function normalizeChatGPTExport(raw) {
  const threads = [];

  // 1) Full ChatGPT export: { conversations: [...] }
  if (Array.isArray(raw?.conversations)) {
    raw.conversations.forEach((conv, i) => {
      threads.push({
        id: conv.id ?? `conv-${i + 1}`,
        title: conv.title ?? `Conversation ${i + 1}`,
        createdAt: toISO(conv.create_time) || toISO(conv.update_time),
        messages: extractFromMapping(conv.mapping),
      });
    });
    return { threads };
  }

  // 2) Shared/single conversation shape: { messages: [...] }
  if (Array.isArray(raw?.messages)) {
    threads.push({
      id: raw.id ?? "conv-1",
      title: raw.title ?? "Conversation",
      createdAt: toISO(raw.create_time) || toISO(raw.update_time),
      messages: (raw.messages || []).map((m) => ({
        role: m?.author?.role ?? m?.role ?? "user",
        createdAt: toISO(m?.create_time) || toISO(m?.update_time),
        text: getText(m?.content),
      })),
    });
    return { threads };
  }

  // 3) Fallback: array of conversations with {mapping}
  if (Array.isArray(raw)) {
    raw.forEach((conv, i) => {
      threads.push({
        id: conv?.id ?? `conv-${i + 1}`,
        title: conv?.title ?? `Conversation ${i + 1}`,
        createdAt: toISO(conv?.create_time) || toISO(conv?.update_time),
        messages: extractFromMapping(conv?.mapping ?? {}),
      });
    });
    return { threads };
  }

  // Unknown shape
  return { threads: [] };
}