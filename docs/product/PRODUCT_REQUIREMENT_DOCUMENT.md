# 🌿 Product Requirements Document (PRD)

**Project Name:** Reflexa AI — Mindful Knowledge Companion
**Version:** 1.0
**Date:** 2025-10-26
**Scope:** 5-Day Hackathon Build

---

## 1. Product Overview

### 1.1 Purpose

Reflexa AI is a **wellness-centered Chrome Extension** that transforms everyday reading into calm, reflective micro-sessions.
It helps users **absorb more, stress less**, and **remember what matters** through guided reflection, summarization, and focus tracking — all powered by **Chrome’s Gemini Nano AI**.

### 1.2 Core Value

> “Turn what you read into mindful moments and actionable insights.”

Users often read endlessly but forget key takeaways. Reflexa AI turns reading into an **active, mindful process** — combining AI summarization and reflective journaling with a meditative, emotionally restorative UX.

### 1.3 Why Now

- AI is now embedded in Chrome (Gemini Nano) → makes on-device, private AI experiences possible.
- Users are burned out by productivity tools — craving **balance and awareness**.
- Generative AI + mindfulness is an emerging digital wellness trend.
- Cross-generation pain point: **information overload + shallow retention**.

---

## 2. Product Goals

| Goal                                | Description                                                 | Success Metric                            |
| ----------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| 🧘 **Encourage mindful reflection** | Prompt users to slow down, reflect after reading.           | ≥ 1 reflection/day average during testing |
| 🧩 **Improve knowledge retention**  | Generate 3-bullet takeaways (“Insight / Surprise / Apply”). | Users recall key info after 24h           |
| 💡 **Make reflection rewarding**    | Provide calm visuals, streaks, and progress.                | 60% return rate after first session       |
| 🔒 **Ensure data privacy**          | All processing local (Gemini Nano).                         | Zero external network calls               |
| ⚙️ **Hackathon-ready MVP**          | Core features built within 5 days.                          | 100% working demo video                   |

---

## 3. Target Users

| Segment                   | Need                           | Value Proposition                |
| ------------------------- | ------------------------------ | -------------------------------- |
| **Students**              | Improve study retention        | Learn calmly, summarize quickly  |
| **Professionals**         | Capture insights from articles | Reflect and remember key ideas   |
| **Researchers / Writers** | Build linked knowledge base    | Discover related reflections     |
| **Mindfulness Seekers**   | Reduce digital stress          | A calmer, AI-guided reading flow |

---

## 4. Core Experience (MVP)

### 4.1 Primary Flow

| Stage                          | Description                                                 | System Behavior                               |
| ------------------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| **1. Dwell Detection**         | User reads an article for ≥ N seconds                       | Content script tracks dwell time              |
| **2. Reflect Nudge**           | Gentle “Reflect?” lotus icon pulses                         | User clicks or ignores                        |
| **3. Reflect Mode Activation** | Overlay opens with breathing orb animation                  | Page dims, ambient chime plays                |
| **4. AI Summary Generation**   | Chrome Built-in AI APIs summarize visible text              | Outputs 3 bullets: Insight / Surprise / Apply |
| **5. Reflection Coaching**     | Chrome Built-in AI APIs ask 2 reflection questions          | User answers directly in overlay              |
| **6. Proofread (Optional)**    | Chrome Built-in AI APIs polish reflection text              | User-triggered                                |
| **7. Save & Link**             | Reflection stored locally, optionally linked via embeddings | User can revisit in Dashboard                 |
| **8. Dashboard Review**        | Popup UI shows past reflections, streak stats               | Calm visual metrics display                   |

---

## 5. Detailed Features

| Category                   | Feature                 | Description                                                   | Status      |
| -------------------------- | ----------------------- | ------------------------------------------------------------- | ----------- |
| **Reflection Experience**  | Reflect Mode Overlay    | Full-screen, Zen-inspired gradient; breathing orb, calm chime | ✅ Core     |
|                            | Auto Dwell Detection    | Detect when user is focused; nudge after N seconds            | ✅ Core     |
|                            | Side Nudge Icon         | Floating lotus; fades in gently                               | ✅ Core     |
| **AI Capabilities**        | 3-Bullet Summarization  | “Insight / Surprise / Apply” bullets                          | ✅ Core     |
|                            | 2 Reflection Prompts    | Coaching-style prompts for application                        | ✅ Core     |
|                            | Proofreading            | Chrome Built-in AI APIs lightly edit grammar                  | 🟡 Optional |
|                            | Embedding-based Linking | Suggests related reflections (semantic match)                 | 🟡 Optional |
| **Data & Storage**         | Local Reflection Log    | Chrome storage API for reflections                            | ✅ Core     |
|                            | Sync Option             | Chrome storage sync for cloud continuity                      | 🟡 Optional |
|                            | Export                  | Markdown / JSON export (manual trigger)                       | 🟡 Optional |
| **Analytics & Motivation** | Focus Streaks           | Daily reflection counter                                      | 🟡 Optional |
|                            | Calm Stats              | Visualization of reading vs. reflection ratio                 | ✅ Core     |
| **Accessibility**          | Reduce Motion           | Disables orb animation                                        | ✅ Core     |
|                            | Audio Toggle            | Mutes all ambient sounds                                      | ✅ Core     |
|                            | High Contrast           | Adjusts palette to WCAG AA                                    | ✅ Core     |

---

## 6. Chrome Built-in AI APIs Integration

| Function                 | API                   | Global Object      | Description                                 |
| ------------------------ | --------------------- | ------------------ | ------------------------------------------- |
| **Summarization**        | Summarizer API        | `Summarizer`       | 3-bullet output: Insight / Surprise / Apply |
| **Reflection Prompting** | Prompt API            | `LanguageModel`    | Two concise reflection questions            |
| **Content Generation**   | Writer API            | `Writer`           | Draft reflective paragraphs                 |
| **Text Improvement**     | Rewriter API          | `Rewriter`         | Refine tone and clarity                     |
| **Proofreading**         | Proofreader API       | `Proofreader`      | Fix grammar and spelling                    |
| **Translation**          | Translator API        | `Translator`       | Translate to user's language                |
| **Language Detection**   | Language Detector API | `LanguageDetector` | Auto-detect page language                   |

**Example AI Prompts:**

- _Summarize:_ “Summarize this article into exactly 3 bullets: [Insight], [Surprise], [Apply]. ≤20 words each.”
- _Coach:_ “Ask the user 2 short, action-based reflection questions related to this text.”
- _Proofread:_ “Polish grammar but preserve tone. ≤2 edits per sentence.”

---

## 7. Technical Overview

### 7.1 Architecture Diagram

```
User Reading → Content Script (monitor dwell)
 → Background SW (AI orchestrator)
 → Gemini Nano (summary + reflection)
 → Reflect Overlay (UI, breathing orb)
 → Chrome Storage (save data)
 → Dashboard Popup (review & streaks)
```

### 7.2 Chrome APIs Used

- Chrome Built-in AI APIs → Gemini Nano AI access
- `chrome.storage.local` / `.sync` → persistence
- `chrome.scripting.executeScript()` → DOM extraction
- `chrome.offscreen.createDocument()` → optional AI sandbox
- `chrome.sidePanel` → optional secondary UI

---

## 8. Data Model

```ts
type Reflection = {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  summary: string[];
  reflection: string[];
  proofreadVersion?: string;
  tags?: string[];
  embedding?: number[];
};

type Settings = {
  dwellThreshold: number;
  enableSound: boolean;
  reduceMotion: boolean;
  proofreadEnabled: boolean;
  privacyMode: 'local' | 'sync';
};
```

---

## 9. UX & Design System Alignment

| Aspect            | Implementation                                                                    |
| ----------------- | --------------------------------------------------------------------------------- |
| **Colors**        | Sky blue → lavender gradient (`#E0F2FE` → `#C7D2FE`)                              |
| **Typography**    | Inter (body), Noto Sans Display (headings), Lora (reflection text)                |
| **Motion**        | 7s breathing orb, fade transitions, 60fps                                         |
| **Audio**         | Gentle chime (<1s) + 8s ambient hum loop                                          |
| **Layout**        | Minimal whitespace, rounded corners, deep shadows (`0 4px 12px rgba(0,0,0,0.08)`) |
| **Accessibility** | Motion/audio toggle, WCAG AA compliance                                           |

---

## 10. Milestones & 5-Day Build Plan

| Day       | Focus                               | Deliverables                                                            |
| --------- | ----------------------------------- | ----------------------------------------------------------------------- |
| **Day 1** | Setup                               | Repo, manifest, base React app, Tailwind theme, content script scaffold |
| **Day 2** | Core Detection & Overlay            | Dwell timer, nudge icon, breathing orb overlay                          |
| **Day 3** | Chrome Built-in AI APIs Integration | AI summary + reflection prompts                                         |
| **Day 4** | Storage + Dashboard                 | Save reflections, view history, streak counter                          |
| **Day 5** | Enhancements                        | Proofreader, export, linking, final polish & demo video                 |

---

## 11. Privacy & Security

- All AI inference occurs **on-device** with Gemini Nano.
- No external API calls without explicit user action.
- Reflection data stored **locally by default**.
- Export/Sync options require manual toggle.
- Displays privacy notice: _“Your reflections never leave your device.”_

---

## 12. Judging Criteria Alignment

| Criterion                   | How It’s Addressed                                           |
| --------------------------- | ------------------------------------------------------------ |
| **Functionality**           | Scalable, modular, multi-audience (students, professionals). |
| **Purpose**                 | Meaningful improvement of reading retention + focus balance. |
| **Content/Creativity**      | Merges mindfulness visuals with structured knowledge design. |
| **User Experience**         | Accessible, emotionally resonant, easy 2-click flow.         |
| **Technological Execution** | Demonstrates real Chrome AI (Gemini Nano) APIs, fully local. |

---

## 13. Risks & Mitigations

| Risk                             | Mitigation                                |
| -------------------------------- | ----------------------------------------- |
| AI unavailable (Gemini disabled) | Fallback: manual reflection mode          |
| Overactive nudge                 | Adjustable dwell timer in settings        |
| Too much motion/audio            | Accessibility toggles                     |
| Performance                      | Limit DOM parsing, optimize background SW |
| Privacy concern                  | Clear “on-device only” messaging          |

---

## 14. Future Extensions

| Feature                   | Description                                  |
| ------------------------- | -------------------------------------------- |
| **Voice Reflections**     | Speech-to-text for quick reflections         |
| **Knowledge Graph View**  | Interactive web of connected insights        |
| **Smart Tagging**         | Auto-tagging via Gemini contextual inference |
| **Export to Notion/Gist** | External sync for power users                |

---

## 15. Success Metrics

| Metric                   | Target  |
| ------------------------ | ------- |
| Average reflections/day  | ≥ 2     |
| AI latency               | ≤ 4s    |
| Overlay load time        | ≤ 300ms |
| FPS stability            | 60fps   |
| Return usage after Day 1 | ≥ 60%   |

---

> _End of Reflexa AI Product Requirements Document v1.0 — “Mindful Knowledge Companion”_
