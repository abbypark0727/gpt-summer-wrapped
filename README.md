# GPT Summer Wrapped

Turn your ChatGPT export into a fun, animated “summer wrapped” recap — right in the browser.  
Upload `conversations.json` and get story-style slides for total prompts, streaks, topics, weekly activity, emotions, and more.

Repo: https://github.com/abbypark0727/gpt-summer-wrapped

---

## Why this exists

Most “GPT wrapped” tools are static and shallow: a few totals and maybe a chart. I wanted something **dynamic** and **personal** that reflects how students actually used ChatGPT over the summer. This MVP is scoped to the **summer internship timeline** (June–August) so the recap tells a clear story with fewer false positives.

**How this differs from typical “wrapped” tools**
- **Animated, story-like slides** instead of static tables  
- **Semantic-ish insights**: popular keywords (e.g., your project codename), topic mix, and “panic/LOL” moments via emotion cues  
- **Accomplishment-aware**: surfaces wins like merged PRs, fixes, approvals, and launches  
- **Time-saved heuristic**: rough but honest estimate across coding/writing/research (tweakable later)  
- **Private by design**: parsing + metrics run locally in your browser

**Who it’s for**
- Students and interns who want a *personal* summer recap of their ChatGPT usage

**What you get**
- A shareable, animated story of your summer  
- Most-used keywords (e.g., **FORAGER**, internal tools), topic distribution, weekly activity  
- Emotion highlights (anxious/funny moments), detected accomplishments, and an optional roast  
- A realistic estimate of time saved

---

## Features

- 🖼️ Animated, tap-through **story slides** (Framer Motion)
- 📤 **Browser-only** parsing of ChatGPT exports (no server, private)
- 📊 **Metrics**: total prompts, active days, longest streak, busiest day
- 🧩 **Topics** pie + list; weekly activity chart
- 🎭 **Persona** blurb + tags
- 🧠 (Optional) **Personalization**: keywords, emotions, time saved, wins, roast
- 🎨 Theming via `src/config/storyConfig.jsx`

---

## How it works

1) You upload your ChatGPT export (`conversations.json`).  
2) The app normalizes threads → computes summer (June–Aug) metrics → builds a slide config.  
3) `Story` renders animated cards you can tap/click through (auto-advances too).

All processing stays in your browser.

---

## Quick start

### Prereqs
- Node **>= 18**
- npm **>= 9**

### Run locally
```bash
git clone https://github.com/abbypark0727/gpt-summer-wrapped.git
cd gpt-summer-wrapped
npm install
npm run dev
```
### Steps For Running
Open the printed localhost URL, click the upload area, and choose your ChatGPT export JSON.

How to get your export
ChatGPT → Settings → Data Controls → Export → Download the zip → unzip → pick conversations.json.

Usage
Upload your conversations.json on the home screen.

The slides will auto-build from your summer activity:

Cover → Totals → Active Days → Streaks → Busiest Day → Topics Pie/List → Weekly Chart → Persona

(Optional): Keywords → Emotions → Panic/LOL Moments → Time Saved → Wins → Roast

Navigation:

Desktop: space/→ to advance, ← to go back.

Mobile: tap right/left half; swipe works too.

### Project Structure
gpt-summer-wrapped/
├─ index.html
├─ vite.config.js
├─ package.json
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ components/
│  │  ├─ Story.jsx
│  │  └─ UploadAndBuild.jsx
│  ├─ config/
│  │  └─ storyConfig.jsx
│  ├─ data/
│  │  └─ chatgpt/parse.js
│  ├─ metrics/
│  │  └─ summer.js
│  └─ slides/
│     ├─ summerWrapped.js
│     └─ personalized.js   # optional

### Configuration
Theme & timing: edit src/config/storyConfig.jsx

Colors under theme.colors

Auto-advance under theme.timing.slideDuration (ms)

Summer window: src/metrics/summer.js uses June 1 → Aug 31 of the year with the most summer activity.

Slides: definitions live in src/slides/* (composed in UploadAndBuild.jsx).

### License
Inspired by community “wrapped” templates (MIT) and built with: Vite, React 18, Emotion, Framer Motion, Recharts.