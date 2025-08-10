// src/config/storyConfig.jsx

const getTodayDate = () => {
  // Return YYYY-MM-DD in local NY time
  const now = new Date();
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  // Build YYYY-MM-DD safely
  const y = ny.getFullYear();
  const m = String(ny.getMonth() + 1).padStart(2, '0');
  const d = String(ny.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Safer day-diff in UTC (no DST issues)
const toUTCms = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const calculateDaysBetween = (startDate, endDate) => {
  const diffMs = Math.abs(toUTCms(endDate) - toUTCms(startDate));
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateString) => {
  // Show a friendly date in NY timezone
  const [y, m, d] = dateString.split('-').map(Number);
  const asDate = new Date(Date.UTC(y, m - 1, d));
  return asDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
};

export const storyConfig = {
  startDate: '2024-06-01', // summer-ish default; your uploader will overwrite these anyway
  get endDate() {
    return getTodayDate();
  },

  // Only used as a fallback preview; the uploader replaces slides at runtime
  slides: [
    { id: 1, title: "Basic Text Card", type: "text",
      content: "This is a simple text card with title and content" },
    { id: 2, title: "Days Counter Card", type: "stat",
      showDaysCount: true, showStartDate: true },
    { id: 3, title: "Stat Card", type: "stat",
      content: "1,234", subtext: "This is a stat card with a number ✨" },
    { id: 4, title: "List Card", type: "list",
      items: [
        { name: "Item 1", count: "Detail 1" },
        { name: "Item 2", count: "Detail 2" },
        { name: "Item 3", count: "Detail 3" }
      ],
      subtext: "This is a list card" },
    { id: 5, title: "Pie Chart Card", type: "pie",
      subtext: "Distribution Example 📊",
      items: [
        { name: 'Category A', value: 400 },
        { name: 'Category B', value: 300 },
        { name: 'Category C', value: 200 }
      ] },
    { id: 6, title: "Full Cover Card", type: "full-cover",
      image: "https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg",
      content: "This is a full cover card with background image" },
    { id: 7, title: "Photo Card", type: "photo",
      image: "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg",
      content: "This is a photo card with an image" },
    { id: 8, title: "Video Card", type: "video",
      videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
      content: "This is a video card" }
  ],

  theme: {
    colors: {
      primary: '#d44f8c',
      secondary: '#ff8fb2',
      tertiary: '#ffb3c6',
      quaternary: '#ffd7e0',
      background: '#FFF0F3',
      text: '#333333'
    },
    timing: {
      slideDuration: 5000 // Story.jsx can read this
    }
  }
};