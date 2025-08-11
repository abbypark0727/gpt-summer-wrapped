// src/slides/summerWrapped.js
// Build slides for your existing Story slide types.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const parseISO_utc = (isoYMD) => new Date(isoYMD + "T00:00:00Z");
const fmtMD = (isoYMD) => {
  const d = parseISO_utc(isoYMD);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
const fmtMDY = (isoYMD) => {
  const d = parseISO_utc(isoYMD);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};
const fmtWMD = (isoYMD) => {
  const d = parseISO_utc(isoYMD);
  return `${WD[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

export function buildSummerSlides(metrics) {
  const start = metrics.startISO || `${metrics.year}-06-01`;
  const end = metrics.endISO || `${metrics.year}-08-31`;
  const subrange = `${fmtMD(start)}–${fmtMD(end)}, ${parseISO_utc(end).getUTCFullYear()}`;

  const topicItems = Array.isArray(metrics.topics) ? metrics.topics : [];

  const base = [
    {
      id: "cover",
      title: "Your GPT Summer Wrapped",
      type: "full-cover",
      image: "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg",
      content:
        (metrics.totalPrompts ?? 0) > 0
          ? `A quick look at how you used ChatGPT during your internship.<br/><small>${subrange}</small>`
          : `We didn’t find summer prompts in your export.<br/><small>${subrange}</small>`,
    },
    {
      id: "prompts",
      title: "Total Prompts",
      type: "stat",
      content: `${(metrics.totalPrompts || 0).toLocaleString()}`,
      subtext: `You + ChatGPT, ${subrange}`,
    },
    {
      id: "active-days",
      title: "Active Days",
      type: "stat",
      content: `${metrics.uniqueDays || 0}`,
      subtext: "Days you used ChatGPT this summer",
    },
    {
      id: "streak",
      title: "Longest Streak",
      type: "stat",
      content: `${metrics.longestStreak || 0} days`,
      subtext: `Consecutive days you showed up`,
    },
  ];

  const maybeBusiest = metrics.busiestDay
    ? [{
        id: "busiest",
        title: "Busiest Day",
        type: "stat",
        content: `${metrics.busiestDay.count} prompts`,
        subtext: `on ${fmtWMD(metrics.busiestDay.date)}`,
      }]
    : [];

  const topicsPie = {
    id: "topics-pie",
    title: "What You Worked On",
    type: "pie",
    subtext: "Topic distribution",
    items: topicItems.length ? topicItems : [{ name: "General", value: 1 }],
  };

  const topicsList = {
    id: "topics-list",
    title: "Top Topics",
    type: "list",
    items: (topicItems.length
      ? topicItems.slice(0, 6).map(t => ({ name: t.name, count: `— ${t.value}x` }))
      : [{ name: "General", count: "— 1x" }]
    ),
    subtext: "Based on your summer prompts",
  };

  // after topicsPie/topicsList blocks
  const maybeKeywordsPie = (metrics.keywords?.length
  ? [{
      id: "keywords-pie",
      title: "Most-used Keywords",
      type: "pie",
      subtext: "What you brought up the most",
      items: metrics.keywords, // [{ name, value }]
    }]
  : []);

  const maybeKeywordsList = (metrics.keywords?.length
  ? [{
      id: "keywords-list",
      title: "Top Keywords",
      type: "list",
      items: metrics.keywords.slice(0, 10).map(k => ({ name: k.name, count: `— ${k.value}x` })),
      subtext: "Based on your summer prompts",
    }]
  : []);

  const maybeWeekly = (metrics.weekBuckets?.length
    ? [{
        id: "weekly",
        title: "Weekly Activity",
        type: "chart",
        chartData: metrics.weekBuckets, // [{ activity, count }]
        content: `Your prompt volume by week (${fmtMDY(start)} → ${fmtMDY(end)})`,
      }]
    : []);

  const maybeThread = metrics.longestThread
    ? [{
        id: "thread",
        title: "Deepest Dive",
        type: "list",
        items: [{ name: metrics.longestThread.title, count: `— ${metrics.longestThread.turns} turns` }],
        subtext: "Your longest summer thread",
      }]
    : [];

  const persona = {
    id: "persona",
    title: "Your Summer Persona",
    type: "text",
    content: `${metrics.persona?.blurb || ""}<br/><br/>${(metrics.persona?.tags || []).map(t => `#${t}`).join("  ")}`,
    subtext: "Shareable vibe snapshot",
  };

  const outro = {
    id: "outro",
    title: "Nice work ✨",
    type: "text",
    content: "Export this as a clip or keep iterating with more inputs (Slack, calendar, code).",
    subtext: "All processing stayed in your browser.",
  };

  return [
    ...base,
    ...maybeBusiest,
    topicsPie,
    topicsList,
    ...maybeKeywordsPie,
    ...maybeKeywordsList,
    ...maybeWeekly,
    ...maybeThread,
    persona,
    outro,
  ];
}