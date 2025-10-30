# ⚙️ Engineering Requirements Document (ERD)

**Project:** Reflexa AI — Mindful Knowledge Companion
**Version:** 1.0
**Date:** 2025-10-26
**Scope:** 5-Day Hackathon Build

---

## 1. Overview

### 1.1 Purpose

This document defines the **engineering blueprint** for the Reflexa AI Chrome Extension.
It translates the PRD and Design System into concrete technical requirements and implementation guidance for developers.
It also justifies architectural choices, trade-offs, and limitations.

### 1.2 Summary

Reflexa AI is a **mindfulness and retention-focused Chrome Extension** powered by **Gemini Nano**, Chrome’s built-in AI model.
It detects when a user has been focused on a webpage for a while, gently invites them to reflect, summarizes the page, and records key takeaways in a calming “Reflect Mode.”

### 1.3 Engineering Goals

- Lightweight and stable Chrome extension that **never uploads data externally**.
- Seamless integration with **Gemini Nano** for on-device AI summarization and reflection.
- Responsive and visually fluid **Zen-inspired interface** with accessible controls.
- Feasible within a **5-day hackathon timeline** with optional post-MVP upgrades.

---

## 2. High-Level Architecture

### 2.1 Overview Diagram

```
User Reading → Content Script (detect dwell time & extract DOM)
    ↓
Background Service Worker (AI orchestrator, storage)
    ↓
Chrome Built-in AI APIs (Summarizer, LanguageModel, Proofreader, Writer, Rewriter, Translator, LanguageDetector)
    ↓
Reflect Overlay (UI injection on page)
    ↓
Chrome Storage API (local / sync)
    ↓
Popup Dashboard (history, streaks, related reflections)
```

### 2.2 Core Modules

| Module                            | Role                                                               | Key Dependencies                                            |
| --------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Manifest (MV3)**                | Registers permissions, declares service worker and content scripts | Chrome Extension Manifest v3                                |
| **Background Service Worker**     | Mediates AI calls, manages reflection data, syncs settings         | `chrome.runtime`, `chrome.storage`, Chrome Built-in AI APIs |
| **Content Script**                | Injects Reflect Mode overlay, monitors user dwell time             | `chrome.scripting`, React for UI                            |
| **Popup (Dashboard)**             | Displays reflections, metrics, and streaks                         | React + Tailwind                                            |
| **Options Page**                  | User settings for sound, motion, privacy                           | Chrome Storage API                                          |
| **Offscreen Document (optional)** | Isolated AI runtime if AI session must run outside page context    | `chrome.offscreen.createDocument()`                         |

---

## 3. Technology Stack

| Layer            | Tech                                  | Reason                                          |
| ---------------- | ------------------------------------- | ----------------------------------------------- |
| **Framework**    | React + TypeScript                    | Componentized, fast iteration, type safety      |
| **Styling**      | Tailwind CSS                          | Rapid prototyping with consistent design tokens |
| **Animations**   | Framer Motion                         | Smooth transitions & breathing orb effects      |
| **AI**           | Chrome Built-in AI APIs (Gemini Nano) | On-device summarization, reflection, proofing   |
| **Storage**      | Chrome Storage API (local / sync)     | Native, lightweight persistence                 |
| **Build System** | Vite                                  | Modern bundler, fast rebuilds, MV3 compatible   |
| **Testing**      | Vitest + Playwright                   | Unit & UI validation                            |
| **Audio**        | Web Audio API                         | Ambient sound control                           |
| **Icons**        | Lucide Icons                          | Thin, minimal SVG icon set                      |

---

## 4. API Usage & AI Integration

### 4.1 Chrome Built-in AI APIs (Powered by Gemini Nano)

Chrome's Built-in AI APIs, powered by Gemini Nano, are the **core intelligence engine** of the extension. It runs locally on the user’s machine, enabling **zero network dependence** and instant inference.

#### Pros:

- ✅ On-device → privacy-safe, offline-ready
- ✅ Lower latency than cloud APIs
- ✅ Integrated with Chrome security model

#### Cons:

- ⚠️ Model capacity limits (text length ~ few KB)
- ⚠️ Requires Chrome Canary or supported builds (initially)
- ⚠️ Unavailable on older systems

#### Available Chrome Built-in AI APIs

| Task                        | Prompt Example                                                              | Output                        |
| --------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| **Summarization**           | “Summarize into 3 bullets: [Insight], [Surprise], [Apply]. ≤20 words each.” | Array of 3 key bullet strings |
| **Reflection Prompting**    | “Ask 2 concise, action-oriented questions.”                                 | 2 strings, each ≤15 words     |
| **Proofreading (optional)** | “Polish grammar and clarity. Keep voice natural.”                           | Cleaned text                  |
| **Embeddings (optional)**   | Local vector similarity search                                              | 128-d float array             |

---

### 4.2 Chrome Extension APIs Used

| API                                 | Purpose                       | Notes                              |
| ----------------------------------- | ----------------------------- | ---------------------------------- |
| `chrome.scripting.executeScript()`  | Extract visible DOM text      | Runs securely per-page             |
| `chrome.storage.local`              | Persist reflections           | Local-only privacy                 |
| `chrome.storage.sync`               | Sync optional reflections     | Requires explicit opt-in           |
| `chrome.offscreen.createDocument()` | Optional isolated AI context  | Ensures stability in background SW |
| `chrome.runtime.sendMessage()`      | Communication between scripts | Used for event propagation         |
| `chrome.sidePanel`                  | Optional secondary interface  | Future alternate UI mode           |

### 4.3 Chrome Built-in AI API Access Pattern

All Chrome Built-in AI APIs are accessed via global objects:

```typescript
// Feature detection
if ('Summarizer' in self) {
  const summarizer = await Summarizer.create();
  const summary = await summarizer.summarize(text);
  summarizer.destroy();
}

if ('LanguageModel' in self) {
  const session = await LanguageModel.create();
  const response = await session.prompt('Generate reflection questions');
  session.destroy();
}

if ('Writer' in self) {
  const writer = await Writer.create({ tone: 'neutral', length: 'medium' });
  const draft = await writer.write('Write about mindfulness');
  writer.destroy();
}

if ('Proofreader' in self) {
  const proofreader = await Proofreader.create();
  const result = await proofreader.proofread(text);
  proofreader.destroy();
}
```

---

## 5. Data Model

```ts
type Reflection = {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  summary: string[]; // [Insight, Surprise, Apply]
  reflection: string[]; // user’s answers
  proofreadVersion?: string;
  tags?: string[];
  embedding?: number[]; // optional
};

type Settings = {
  dwellThreshold: number;
  enableSound: boolean;
  reduceMotion: boolean;
  proofreadEnabled: boolean;
  privacyMode: 'local' | 'sync';
};
```

### Design Rationale:

- **JSON-like structure** allows easy export to Markdown or JSON.
- **Optional embedding** prepares for future semantic linking.
- **Separation of reflection and summary** supports analytics and machine-learning scaling later.

---

## 6. Key Functional Requirements

| ID   | Requirement                                   | Reason                                     |
| ---- | --------------------------------------------- | ------------------------------------------ |
| FR-1 | Detect dwell time ≥ N seconds on readable DOM | Ensures reflection triggered intentionally |
| FR-2 | Extract article title + text                  | Provides AI with clean context             |
| FR-3 | Call Chrome Built-in AI APIs for processing   | Generate 3 actionable takeaways            |
| FR-4 | Show breathing overlay with summary + prompts | Core meditative UX                         |
| FR-5 | Save reflections locally                      | Enables history dashboard                  |
| FR-6 | Optionally proofread reflection               | Improve clarity and retention              |
| FR-7 | Show past reflections in dashboard            | Reinforces habit/streak                    |
| FR-8 | Accessibility toggles (motion/sound)          | Inclusive design compliance                |
| FR-9 | Privacy controls (local/sync/export)          | Regulatory safety and user trust           |

---

## 7. Non-Functional Requirements

| Category             | Requirement                      | Target                    |
| -------------------- | -------------------------------- | ------------------------- |
| **Performance**      | Overlay render ≤ 300 ms          | Optimize React rendering  |
| **AI Latency**       | Gemini summary ≤ 4 s             | Use local model           |
| **FPS Stability**    | 60 FPS animations                | Framer Motion tuning      |
| **Memory Footprint** | ≤ 150 MB                         | Minimize injected scripts |
| **Security**         | No network calls without consent | Hardcoded origin rules    |
| **Accessibility**    | WCAG AA compliance               | Manual testing checklist  |

---

## 8. Development Environment

### 8.1 Prerequisites

- Node.js 18+
- Chrome 137+ (with Built-in AI APIs enabled)
- pnpm or npm 9+

### 8.2 Local Setup

```bash
npm install
npm run dev
```

**Testing Build:**

```bash
npm run build
```

**Load in Chrome:**

1. Go to `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked** → select `dist/` folder

---

## 9. Folder Structure

```
browse-reflect/
│
├── public/
│   ├── icons/
│   ├── audio/
│   └── manifest.json
│
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   ├── overlay.tsx
│   │   ├── detectDwell.ts
│   │   └── styles.css
│   ├── popup/
│   │   ├── App.tsx
│   │   ├── Dashboard.tsx
│   │   └── components/
│   ├── options/
│   │   └── Settings.tsx
│   ├── utils/
│   │   ├── ai.ts
│   │   ├── storage.ts
│   │   └── constants.ts
│   └── types/
│       └── reflection.ts
│
└── vite.config.js
```

---

## 10. Implementation Approach

### 10.1 AI Flow

- **Input:** Extract main readable DOM content (ignore ads/nav).
- **Pre-processing:** Strip HTML, truncate to 2–3k tokens.
- **Summarization:** `Summarizer` API → 3 bullets (“Insight, Surprise, Apply”).
- **Prompting:** `LanguageModel` API → 2 reflective questions.
- **Post-processing:** Display + store in Chrome storage.

**Reasoning:**

- Maintains minimal CPU usage and latency.
- Keeps pipeline purely local → GDPR-compliant.

### 10.2 UI Rendering Flow

1. **Injection:** Content script injects `<div id="reflect-root">`.
2. **Render:** React mounts Overlay component inside.
3. **Transition:** Background fades; breathing orb expands.
4. **Interaction:** User reads summary, writes reflection.
5. **Save:** Message passed to background worker to persist reflection.

**Pros:**

- Seamless UX with no page reloads.
- Lightweight DOM injection; compatible with all sites.

**Cons:**

- Slight delay on very dynamic pages.
- Some sites may block injection (iframes, CSP).

Mitigation: fallback modal (`chrome.sidePanel`).

---

## 11. AI Safety & Error Handling

| Scenario                                | Handling                                                       | Reason                |
| --------------------------------------- | -------------------------------------------------------------- | --------------------- |
| Chrome Built-in AI unavailable          | Show modal: “Local AI disabled — manual reflection available.” | Graceful fallback     |
| Large text input (> 3k tokens)          | Auto-truncate and notify                                       | Prevents model crash  |
| AI failure (timeout / invalid response) | Retry once → fallback heuristic summary                        | Reliability           |
| Storage full                            | Prompt user to export older reflections                        | Safety & transparency |
| User offline                            | Continue normally (AI is local)                                | Offline-first design  |

---

## 12. Testing Plan

| Test Type         | Tool                | Goal                                    |
| ----------------- | ------------------- | --------------------------------------- |
| **Unit**          | Vitest              | Validate logic of dwell timer, storage  |
| **UI Snapshot**   | Playwright          | Validate overlay layout and transitions |
| **AI Mock Tests** | Jest + Mocks        | Simulate Chrome Built-in AI responses   |
| **Performance**   | Lighthouse          | Check FPS, memory                       |
| **Accessibility** | AXE + manual review | Confirm WCAG AA compliance              |

---

## 13. Build & Deployment

### Build Commands

```bash
npm run lint
npm run build
npm run zip
```

### Chrome Publishing

1. Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Upload `browse-reflect.zip`.
3. Fill metadata: description, screenshots, banner (Zen blue gradient).
4. Submit for review (typically 1–3 days).

---

## 14. Risks & Mitigation

| Risk                                            | Impact | Mitigation                         |
| ----------------------------------------------- | ------ | ---------------------------------- |
| Chrome Built-in AI unsupported in some versions | High   | Provide fallback manual reflection |
| Extension injection blocked by page CSP         | Medium | SidePanel fallback                 |
| Audio/motion sensitivity                        | Medium | User toggles for accessibility     |
| Performance issues on long articles             | Low    | Text truncation & batching         |
| Privacy concerns                                | High   | Clear “on-device only” statement   |

---

## 15. Trade-offs and Design Rationale

| Decision                                       | Pros                          | Cons                 | Rationale                     |
| ---------------------------------------------- | ----------------------------- | -------------------- | ----------------------------- |
| **Chrome Built-in AI APIs (Gemini Nano)**      | Privacy, offline, low latency | Model size limits    | Prioritize user trust         |
| **Multiple specialized APIs vs single Prompt** | Better results per task       | More complexity      | Quality over simplicity       |
| **Overlay UI instead of side panel**           | Emotional immersion, Zen vibe | Slightly intrusive   | Matches mindfulness UX        |
| **React + Tailwind**                           | Fast iteration                | Bundle size ↑        | Hackathon speed advantage     |
| **Local storage**                              | Simplicity                    | No cross-device sync | Privacy-first by default      |
| **Framer Motion**                              | Beautiful animations          | Adds dependency      | Reinforces calmness aesthetic |

---

## 16. Future Enhancements

| Feature                   | Description                              | Impact              |
| ------------------------- | ---------------------------------------- | ------------------- |
| **Voice Reflections**     | Record and transcribe via Web Speech API | Accessibility boost |
| **Smart Tags + Search**   | Tag clustering using embeddings          | Better recall       |
| **Knowledge Graph View**  | Visual linking of insights               | Stronger retention  |
| **Cloud Sync (optional)** | Cross-device reflections                 | Convenience         |
| **Notion/Gist Export**    | Integration with personal tools          | Adoption driver     |

---

## 17. Success Metrics

| Metric              | Target                    | Measurement       |
| ------------------- | ------------------------- | ----------------- |
| AI Response Latency | ≤ 4 seconds               | Console timing    |
| Reflection Saves    | ≥ 5 per tester/day        | Local analytics   |
| Overlay Render      | ≤ 300 ms                  | Performance trace |
| Memory Usage        | ≤ 150 MB                  | Chrome profiler   |
| User Return Rate    | ≥ 60% after first session | Internal survey   |

---

> _End of Reflexa AI Engineering Requirements Document v1.0 — “Mindful Knowledge Companion”_
