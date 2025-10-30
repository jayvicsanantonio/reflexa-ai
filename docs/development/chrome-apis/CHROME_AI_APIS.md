# Reflexa AI — Chrome Built-in AI API Integration Plan (v1.0)

## Overview

Reflexa AI now integrates all **Chrome Built-in AI APIs** recommended in the Google Chrome AI Challenge 2025:

- Prompt API
- Summarizer API
- Writer API
- Rewriter API
- Proofreader API
- Language Detector API
- Translator API

These on-device APIs (powered by Gemini Nano) enable Reflexa AI to provide a **mindful, privacy-first reading companion** that enhances focus, understanding, and reflection.

---

## Current Reflexa AI Features

| Current Feature  | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| Reflect Overlay  | Minimal floating overlay for reflection and summarization.                  |
| Focus Timer      | Encourages deep, undistracted reading sessions.                             |
| Smart Summary    | Summarizes any webpage content on demand.                                   |
| Reflection Notes | Helps users process what they’ve read through journaling prompts.           |
| Local AI         | Operates entirely on-device using Gemini Nano — no data leaves the browser. |

---

## Integrating All 7 Chrome AI APIs

### 🧠 1. Summarizer API — _Quick Comprehension_

**Purpose:** Generate concise summaries of any webpage or selected text.
**Integration:** Replaces existing “Quick Summary” feature.
**UI Element:** Dropdown to choose summary format (`Bullets`, `Paragraph`, `Headline + Bullets`).

```js
const summary = await ai.summarizer.summarize(text, { format: 'bullets' });
```

---

### 💬 2. Prompt API — _Reflective Dialogue & Fallback Intelligence_

**Purpose:** Drive Reflexa’s core reflective prompt and reasoning.
**Integration:** Used for deep reflection prompts and fallback when other APIs are unavailable.

```js
const reflection = await ai.prompt.prompt(
  'What insights can I draw from this text?'
);
```

---

### ✍️ 3. Writer API — _First Draft Reflection_

**Purpose:** Automatically draft the user’s first reflective note.
**Integration:** Adds “Start Reflection” button that generates a short reflective paragraph.

```js
// Create a writer session with configuration
const writer = await ai.writer.create({
  tone: 'neutral', // 'formal', 'neutral', or 'casual'
  format: 'plain-text', // 'plain-text' or 'markdown' (default: 'markdown')
  length: 'short', // 'short', 'medium', or 'long'
  sharedContext:
    'This is a reflective writing exercise based on article insights.',
});

// Generate draft with optional context
const draft = await writer.write(
  'Write a reflective paragraph about the key insights',
  { context: summary }
);

// Clean up when done
writer.destroy();
```

---

### 🔁 4. Rewriter API — _Tone & Style Adjustment_

**Purpose:** Adjust tone or rephrase reflection notes.
**Integration:** Adds tone preset chips → Calm · Concise · Empathetic · Academic.

```js
const concise = await ai.rewriter.rewrite(draft, { style: 'concise' });
```

---

### ✅ 5. Proofreader API — _Grammar & Clarity Polishing_

**Purpose:** Fix grammar and improve readability of reflections.
**Integration:** Adds “Proofread” button before saving or sharing a note.

```js
const polished = await ai.proofreader.proofread(text, {
  mode: 'grammar_clarity',
});
```

---

### 🌐 6. Language Detector API — _Smart Language Awareness_

**Purpose:** Detect page or note language to tailor experience.
**Integration:** Automatically detects non-English text and suggests translation.

```js
const lang = await ai.languageDetector.detect(text);
```

---

### 🌎 7. Translator API — _Multilingual Support_

**Purpose:** Translate summaries or reflections into other languages.
**Integration:** Adds “Translate” dropdown in reflection panel.

```js
const translated = await ai.translator.translate(summary, { to: 'en' });
```

---

## 🧩 Unified Experience Flow

1. User opens Reflexa overlay on a webpage.
2. **Language Detector** checks page language.
3. **Summarizer** generates structured summary.
4. **Writer** drafts a reflective paragraph.
5. **Rewriter** adjusts tone and clarity.
6. **Proofreader** polishes grammar and spelling.
7. **Translator** converts summary or note to preferred language.
8. **Prompt API** powers fallback and flexible reflection questions.

---

## 🧰 Implementation Notes

| Category          | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| Capability Gating | Use `'summarizer' in ai` etc. for runtime checks.                         |
| Fallback          | Default to `Prompt API` when others unavailable.                          |
| Privacy           | All operations remain fully local (Gemini Nano).                          |
| Chrome Flags      | `#prompt-api-for-gemini-nano` and `#optimization-guide-on-device-model`.  |
| Dev Toggle        | Enable experimental Proofreader or multimodal Prompt APIs when supported. |

**Helper Example:**

```ts
export const can = {
  summarize: 'summarizer' in ai,
  writer: 'writer' in ai,
  rewriter: 'rewriter' in ai,
  proofreader: 'proofreader' in ai,
  lang: 'languageDetector' in ai && 'translator' in ai,
};
```

---

## ✨ UI Enhancements to Showcase All APIs

- **Tone Chips** — Calm · Concise · Empathetic · Academic
- **Proofread Button** — Inline diff view before saving
- **Translate Menu** — Convert reflections instantly
- **Language Pill** — Shows detected language in header
- **Dev Mode Toggle** — Enables experimental Gemini features

---

## ✅ Chrome Web Store Submission Checklist

- Manifest V3 with correct permissions (`storage`, `scripting`, `activeTab`)
- Version sync between manifest and package.json
- Origin Trial token (if required) for Prompt API
- Screenshots showing all 7 APIs in use
- Privacy policy stating “No data leaves the device”

---

## 🏁 Summary

This document defines how Reflexa AI now fully leverages all **seven Chrome Built-in AI APIs**.
Every integration serves a real user purpose — not just technical compliance — aligning perfectly with Reflexa AI’s mission:

> “To make browsing and reading feel calm, intentional, and intelligent — powered by local AI.”

---

© 2025 Reflexa AI — Google Chrome Built-in AI Challenge Submission
