# 🌿 Reflexa AI Design System

**Theme:** Mindful Clarity — A Zen-Inspired Aesthetic for Calm Reflection  
**Version:** 1.0  
**Date:** 2025-10-26

---

## 🪷 1. Philosophy & Design Intent

> “Design should feel like a breath — steady, balanced, and restorative.”

Reflexa AI’s design language fuses **minimalist calm** with **functional clarity**.  
It supports dual goals:

1. **Mindfulness:** create tranquility and focus in moments of reflection.
2. **Retention:** structure information for comprehension and recall.

This system translates those values into color, typography, motion, layout, and components.

---

## 🌈 2. Core Design Principles

| Principle                    | Description                                                                      | Example                                       |
| ---------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| **Calm by Default**          | Every screen breathes — balanced whitespace, smooth transitions, no harsh edges. | Overlay fade-in; breathing orb pacing at 7 s. |
| **Simplicity = Clarity**     | Less text, more intention. Each visual element has a single function.            | Three-bullet summaries.                       |
| **Sensory Harmony**          | Visuals, sound, and motion sync into one sensory flow.                           | Orb expansion timed with ambient hum.         |
| **Empathetic Accessibility** | Design respects sensitivity to color, sound, and motion.                         | Reduce-motion and mute toggles.               |
| **Human Warmth in AI**       | AI output should feel natural and reassuring, not mechanical.                    | Soft typography, friendly tone in prompts.    |

---

## 🎨 3. Visual Identity

### 3.1 Color Palette — “Zen Spectrum”

| Token                    | Hex                      | Use             | Meaning                      |
| ------------------------ | ------------------------ | --------------- | ---------------------------- |
| `--color-bg-primary`     | `#F7FAFC`                | App backgrounds | Clarity / calm air           |
| `--color-bg-secondary`   | `#E0F2FE`                | Panels & cards  | Tranquility / sky reflection |
| `--color-accent`         | `#93C5FD`                | Primary actions | Energy / clarity             |
| `--color-accent-deep`    | `#60A5FA`                | Hover / focus   | Intention / awareness        |
| `--color-text-primary`   | `#1E293B`                | Main text       | Grounded thought             |
| `--color-text-secondary` | `#475569`                | Subtext         | Soft neutrality              |
| `--color-success`        | `#A7F3D0`                | Completion cues | Growth / satisfaction        |
| `--color-warning`        | `#FDE68A`                | Alerts          | Mindful attention            |
| `--color-error`          | `#FCA5A5`                | Errors          | Gentle correction            |
| `--color-overlay`        | `rgba(248,250,252,0.85)` | Overlay veil    | Quiet focus                  |
| `--color-gradient-start` | `#E0F2FE`                | Gradients start | Morning light                |
| `--color-gradient-end`   | `#C7D2FE`                | Gradients end   | Dusk calm                    |

**Gradient Example**

```css
background: linear-gradient(
  135deg,
  var(--color-gradient-start),
  var(--color-gradient-end)
);
```

---

### 3.2 Typography

| Token               | Font Family       | Use                | Weight  | Size Range |
| ------------------- | ----------------- | ------------------ | ------- | ---------- |
| `--font-heading`    | Noto Sans Display | Titles, modals     | 600–700 | 20–28 px   |
| `--font-body`       | Inter             | Primary copy       | 400–500 | 14–18 px   |
| `--font-reflection` | Lora (serif)      | Reflection entries | 400     | 16–20 px   |
| `--font-mono`       | JetBrains Mono    | Metrics & code     | 400     | 12–14 px   |

**Hierarchy Example**

```css
h1 {
  font-family: var(--font-heading);
  font-size: 28px;
}
p {
  font-family: var(--font-body);
  line-height: 1.6;
}
blockquote {
  font-family: var(--font-reflection);
  font-style: italic;
}
```

---

### 3.3 Iconography

- **Icon Style:** Thin, rounded outlines (Lucide or Feather icons).
- **Primary Symbol:** 🪷 _Lotus_ — represents awareness and growth.
- **Supportive Icons:**
  - 🔄 “Regenerate” summary
  - 💭 “Reflect” moment
  - 🕯 “Calm stats”
  - 🌐 “Export / Share”
- **Guideline:** Each icon fits within a 24 × 24 px grid and uses 1.5 px stroke width.

---

## 🧘 4. Layout & Spacing

### 4.1 Spacing Scale

| Token         | Size  | Usage                      |
| ------------- | ----- | -------------------------- |
| `--space-xxs` | 4 px  | Tight gaps                 |
| `--space-xs`  | 8 px  | Inline padding             |
| `--space-sm`  | 12 px | Button padding             |
| `--space-md`  | 16 px | Internal component spacing |
| `--space-lg`  | 24 px | Section spacing            |
| `--space-xl`  | 32 px | Modal margins              |
| `--space-2xl` | 48 px | Overlay breathing room     |

### 4.2 Grid & Alignment

- **Container max-width:** 640 px (popup) / full width (overlay).
- **Grid system:** 8 px baseline grid.
- **Alignment:** Center-weighted composition to evoke balance.

---

## 🌫 5. Depth, Shadows, and Surfaces

| Token             | Description                           | Example                                 |
| ----------------- | ------------------------------------- | --------------------------------------- |
| `--shadow-soft`   | Soft diffuse for cards                | `0 2px 6px rgba(0,0,0,0.05)`            |
| `--shadow-medium` | Modals & overlay elements             | `0 4px 12px rgba(0,0,0,0.08)`           |
| `--shadow-inner`  | Used in breathing orb                 | `inset 0 2px 4px rgba(255,255,255,0.2)` |
| `--border-radius` | 16 px for cards / 9999 px for buttons | —                                       |

Shadows simulate **sunlight filtered through paper**, never harsh or dark.

---

## 🔊 6. Audio Identity

| Sound               | File           | Duration | Purpose                  |
| ------------------- | -------------- | -------- | ------------------------ |
| **Entry Chime**     | `entry.wav`    | < 1 s    | Signals reflection start |
| **Breathing Loop**  | `ambient.ogg`  | 8 s loop | Supports focus rhythm    |
| **Completion Bell** | `complete.wav` | 0.8 s    | Positive reinforcement   |

Guidelines:

- Master volume at 30 %.
- No overlapping audio.
- Optional: user-toggle in settings.

---

## 🪄 7. Motion & Animation

| Animation          | Duration | Easing                        | Description                         |
| ------------------ | -------- | ----------------------------- | ----------------------------------- |
| **Fade In / Out**  | 1 s      | `ease-in-out`                 | Overlay transitions                 |
| **Breathe Cycle**  | 7 s      | `ease-in-out`                 | Orb expand/contract                 |
| **Button Hover**   | 0.2 s    | `cubic-bezier(0.45,0,0.55,1)` | Micro-interaction lift              |
| **Panel Entry**    | 0.8 s    | `ease-out`                    | Slide-up motion for reflection card |
| **Gradient Drift** | 8 s      | `linear infinite`             | Slow background motion              |

Accessibility:  
Respect `prefers-reduced-motion: reduce` to disable continuous animation and gradient drift.

---

## 🧩 8. Core Components

### 8.1 Reflect Button

```html
<button class="reflect-btn">Reflect</button>
```

```css
.reflect-btn {
  background: var(--color-accent);
  color: white;
  padding: var(--space-sm) var(--space-lg);
  border-radius: 9999px;
  font-weight: 500;
  box-shadow: var(--shadow-soft);
  transition: all 0.3s ease;
}
.reflect-btn:hover {
  background: var(--color-accent-deep);
  transform: scale(1.03);
}
```

---

### 8.2 Reflect Mode Overlay

```html
<div class="reflect-overlay">
  <div class="breathing-orb"></div>
  <div class="reflect-text">
    <h2>Pause. Take a breath.</h2>
    <ul class="summary">
      <li>💡 Insight</li>
      <li>🤯 Surprise</li>
      <li>🎯 Apply</li>
    </ul>
    <p>What idea will you use tomorrow?</p>
    <textarea placeholder="Type your reflection..."></textarea>
    <button>Save Reflection</button>
  </div>
</div>
```

```css
.reflect-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(6px);
  background: linear-gradient(
    135deg,
    var(--color-gradient-start),
    var(--color-gradient-end)
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 1s ease forwards;
}
.breathing-orb {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, #bfdbfe, #93c5fd);
  box-shadow: var(--shadow-inner);
  animation: breathe 7s ease-in-out infinite;
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}
```

---

### 8.3 Reflection Card (Dashboard)

```html
<div class="reflection-card">
  <h3>From: “Why Mindfulness Works”</h3>
  <ul>
    <li>Insight: Awareness reduces stress.</li>
  </ul>
  <p>Reflection: I’ll try breathing before checking messages.</p>
</div>
```

```css
.reflection-card {
  background: var(--color-bg-secondary);
  border-radius: var(--space-md);
  box-shadow: var(--shadow-soft);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  transition: box-shadow 0.3s ease;
}
.reflection-card:hover {
  box-shadow: var(--shadow-medium);
}
```

---

### 8.4 Dashboard / Metrics

| Element                  | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| **Focus Streak Counter** | Displays continuous reflection days        |
| **Calm Time Graph**      | Visual ratio of reading vs reflection time |
| **Tag Chips**            | Past topics / semantic clusters            |

Visual style: **Soft rounded bars**, **gentle transitions**, **no hard grids**.

---

### 8.5 Settings Modal

```html
<div class="settings-modal">
  <h2>Settings</h2>
  <label><input type="checkbox" /> Enable Ambient Sound</label>
  <label><input type="checkbox" /> Reduce Motion</label>
  <label><input type="checkbox" /> Sync Reflections</label>
  <button>Close</button>
</div>
```

Design: card with 32 px padding, 16 px gap between options, `box-shadow: var(--shadow-medium)`.

---

## 🧠 9. Accessibility Framework

| Area               | Guideline                                   |
| ------------------ | ------------------------------------------- |
| **Color Contrast** | Meets WCAG AA (≥ 4.5:1)                     |
| **Motion Control** | Detect `prefers-reduced-motion`             |
| **Sound Control**  | Toggle for mute & volume                    |
| **Keyboard Nav**   | Tab/Enter/Esc across all focusable elements |
| **Focus States**   | Outline `2px solid var(--color-accent)`     |

---

## 📱 10. Responsive & Context Modes

| Mode                        | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| **Overlay (Desktop)**       | Full-screen focus; breathing orb centered                |
| **Side Panel (Alt View)**   | Optional Chrome sidePanel view for quick summaries       |
| **Popup (Dashboard)**       | Compact 400 × 600 px window                              |
| **Mobile Chrome (Preview)** | Auto-adjust text size and spacing; no gradient animation |

---

## 🧩 11. Design Tokens (Reference JSON)

```json
{
  "colors": {
    "accent": "#93C5FD",
    "accentDeep": "#60A5FA",
    "backgroundPrimary": "#F7FAFC",
    "backgroundSecondary": "#E0F2FE"
  },
  "fonts": {
    "heading": "Noto Sans Display",
    "body": "Inter",
    "reflection": "Lora"
  },
  "spacing": [4, 8, 12, 16, 24, 32, 48],
  "radius": 16,
  "shadow": {
    "soft": "0 2px 6px rgba(0,0,0,0.05)",
    "medium": "0 4px 12px rgba(0,0,0,0.08)"
  }
}
```

---

## 🪷 12. Design System Alignment with PRD & ERD

| PRD/ERD Area            | Visual Response                                  |
| ----------------------- | ------------------------------------------------ |
| **Reflect Mode**        | Overlay gradient, breathing orb, calm audio.     |
| **3-Bullet Summary**    | Typography hierarchy: heading > bullet > prompt. |
| **Mindfulness Focus**   | Slow transitions, soft colors, ambient sound.    |
| **Knowledge Retention** | Clear structured layout, consistent spacing.     |
| **Accessibility**       | Color contrast + motion toggles.                 |

---

## 📘 13. Implementation Stack

| Tool              | Use                              |
| ----------------- | -------------------------------- |
| **Tailwind CSS**  | Implements all tokens via config |
| **Framer Motion** | Animations & breathing sequence  |
| **Lucide Icons**  | Vector line icons                |
| **React Context** | Theme + sound state management   |
| **Vite**          | Build + HMR                      |

---

> _End of Reflexa AI Design System v1.0 — “Mindful Clarity” Edition_
