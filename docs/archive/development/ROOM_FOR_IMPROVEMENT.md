# Reflexa AI — Room for Improvement

Last updated: 2025-10-30
Author: UX/UI Review

This document summarizes prioritized UX/UI improvements across the popup dashboard, Reflect Mode overlay, options, and onboarding. The goal is to reduce cognitive load, improve first‑run success, and add lightweight management tools while keeping the calm, accessible experience.

## Summary of Opportunities
- Onboarding: first‑run setup + demo to unblock AI features
- Overlay: progressive disclosure; stronger loading/busy affordances
- Popup: prioritize reflections; streamline AI status
- Reflection management: search, favorites, tags, safe undo
- Options: voice settings, AI setup test, dark mode
- Performance & a11y: low‑power fallback, high‑contrast support
- Copy & micro‑interactions: tasteful feedback; clearer AI states
- Export: scoped export and clipboard option

---

## Overall Look & Feel Revamp (Implemented)

What changed in the content experience to match the requested direction:

- Floating lotus → pill on hover
  - Position: lower‑left by default; responsive variants supported.
  - Hover/focus expands fluidly into a pill that reveals the “Reflect” label.
  - Keyboard: Enter/Space triggers reflect; tooltips on quick actions.
- Vertical quick actions column (stable hover)
  - Actions: Dashboard (top), AI Status (middle), Settings (closest to lotus).
  - Stability: Wrapper hit‑area extends vertically so the stack doesn’t collapse when cursor travels upward along the column.
  - Tooltips: Appear on hover/focus with accessible labels.
- Modals restyle (centered cards)
  - Settings and AI Status are centered, white card surfaces with rounded corners, soft border/shadow, and subtle entrance animation.
  - Opaque cards over a soft blurred backdrop; content behind remains visible vaguely.
  - Z‑index: Cards render above backdrop and the toast renders above everything.
- Help → AI Status
  - “Help” quick action replaced with “AI Status” (brain icon) and a status modal that matches the provided visual reference.
  - Includes an “Experimental Mode Active” banner when enabled.

Notes
- The visuals align to the project’s zen/lotus palette; color tokens are reused where present.
- Reduced‑motion preference disables non‑essential animations.

Key files
- Content entry and styling injection: `src/content/index.tsx:88` (LOTUS_NUDGE_STYLES)
- Lotus UI and quick actions: `src/content/components/LotusNudge.tsx`
- Settings modal: `src/content/components/QuickSettingsModal.tsx`
- AI Status modal: `src/content/components/AIStatusModal.tsx`
- Shared styles/utilities: `src/content/styles.css`

---

## Settings UX and Behavior (Implemented)

- Live updates without reload
  - Changing any control immediately persists via `chrome.runtime.sendMessage('updateSettings')` and broadcasts `settingsUpdated` to all tabs.
  - Content script applies updates in place: dwell threshold resets, audio fades in/out, overlay refreshes.
  - Visual feedback: only a lightweight toast “Settings updated”; no inline “Saving/Saved” text.
- Visible dependencies (no hidden options)
  - All options are visible; dependent ones are disabled with an info tooltip (e.g., Translation‑dependent controls).
  - Examples include Translation, Voice input, and Proofreading.
- Defaults and ranges (updated)
  - Dwell Threshold: 0–60s, step 10, default 10s.
  - Voice Auto‑stop Delay: 0–60s, step 10 (UI in seconds), stored in ms; default 10s.
  - Experimental Mode: enabled by default.
- Storage mode
  - Default remains `local`. `sync` is available for portability but is optional and clearly labeled; consider removing from quick settings if confusing.

Open question
- “Pause nudges on this …” microcopy should be explicit. Recommendation: “Pause on this site for 15 minutes” or “Pause on this page for 15 minutes”.

---

## AI Status Popover (Implemented)

- Replaces the former Help modal and quick action.
- Styled per reference: light card, header icon/badge, capability grid, and setup steps.
- Always above blur backdrop (explicit content z‑index) and keyboard accessible; focus trapped; ESC closes.

Enhancements to consider
- Add per‑API brand icons instead of the generic circle glyphs in capability cards.
- Optional “Refresh status” button with a tiny spinner to re‑check availability.

---

## Accessibility & Interaction

- Dialogs declare `role="dialog"` and `aria-modal="true"` and are focus‑trapped with ESC to close.
- Switches expose `role="switch"` and toggle with Enter/Space; disabled states are announced.
- Tooltips are hover/focus aware and never trap focus.
- Hover stability for the quick‑action rail prevents flicker when traveling vertically from pill → actions.

---

## Performance & Implementation Notes

- Shadow DOM is used for injected UIs; styles are linked once per overlay/modal.
- Animations are modest and disabled under reduced motion to respect user preference.
- Backdrop and toast stacking were tuned so the toast is always visible above overlays.

---

## Next Steps (Polish)

- Settings polish
  - Add small feature icons per row (brand‑aligned) and unify section headers to match AI Status typography.
  - Extract shared modal layout styles into CSS classes to reduce inline styles.
- Quick actions rail
  - Compute wrapper vertical padding dynamically from the number of actions (currently fixed to accommodate three).
- Tests
  - Dialog a11y: roles, aria‑modal, ESC close, focus trap.
  - Live updates: verify `settingsUpdated` triggers dwell/audio/overlay changes.
  - Quick‑action hover stability: ensure visibility across the rail’s y‑axis.

---

## Build & Test Status

- Local verification
  - `npm run build`: passes (type‑check, lint, format, test, Vite build).
  - `npm run test`: 494 passed, 21 skipped.

---

## Appendix — How Settings Persist and Apply

- Persistence
  - Saved in `chrome.storage.local` by default (optional `chrome.storage.sync` if selected).
- Application
  - Background updates values, then broadcasts a `settingsUpdated` message.
  - Content scripts apply changes immediately (no reloads).


---

## Quick Wins (Low Effort → High Impact)

1) Add Options shortcut in popup header
- Proposed: Add a gear icon button to open Options directly from popup header.
- Location: `src/popup/App.tsx:416` (header actions)
- Rationale: Improves discoverability of settings without opening chrome://extensions.
- Acceptance Criteria:
  - Clicking the gear opens the Options page (`chrome.runtime.openOptionsPage`).
  - Button has focus ring, tooltip, and ARIA label “Open settings”.

2) Replace blocking delete confirm with non‑blocking Undo toast
- Proposed: Remove `confirm()` and use a toast “Reflection deleted. Undo”.
- Locations:
  - Trigger: `src/popup/ReflectionCard.tsx:136–144`
  - State + toast: `src/popup/App.tsx` (add lightweight Toast component)
- Rationale: Modern, forgiving pattern; reduces friction.
- Acceptance Criteria:
  - Delete removes item immediately and shows toast for 5–7s.
  - Undo restores item and recalculates streak.
  - Works with keyboard and screen readers.

3) Locale‑aware dates/times
- Proposed: Use browser locale for human‑readable timestamps.
- Location: `src/popup/ReflectionCard.tsx:101`
- Rationale: Matches user preferences (12/24h, month/day order).
- Acceptance Criteria:
  - Uses `navigator.language` or `Intl.DateTimeFormat(undefined, …)`.
  - No hard‑coded 'en-US'.

4) Overlay summary skeleton + disabled controls during updates
- Proposed: When `isLoadingSummary`, show 3 skeleton rows and disable Start Reflection/Translate/Format.
- Locations:
  - `src/content/components/MeditationFlowOverlay/SummaryPhase.tsx` (disable controls)
  - `src/content/components/MeditationFlowOverlay/SummaryPhase.tsx` (render skeletons)
- Rationale: Clear progress feedback; avoids mid‑update actions.
- Acceptance Criteria:
  - Skeletons visible during format changes and initial summary load.
  - Related buttons aria‑busy and disabled; focus management preserved.

5) Tooltip for disabled Export
- Proposed: Add `title="Add a reflection to export"` and `aria-disabled`.
- Location: `src/popup/App.tsx:433`
- Acceptance Criteria: Users understand why Export is disabled.

---

## Onboarding Improvements

A) First‑run checklist modal (privacy → AI setup → preferences → demo)
- Proposed:
  - Step 1: Privacy notice acknowledgement (existing copy).
  - Step 2: “Enable Chrome AI” guidance (reuse content from `AIStatusPanel` setup modal).
- Step 3: Set dwell threshold (default 10s) and reduce motion.
  - Step 4: Try a sample reflection demo (uses static text in overlay).
- Location: `src/popup/App.tsx:203` (after `FIRST_LAUNCH`); extract a shared Onboarding component.
- Acceptance Criteria:
  - Modal appears only once on first run.
  - Each step is keyboard navigable; focus is trapped.
  - “Start demo” opens overlay with sample content; quitting returns to popup.

B) Proactive AI status prompts
- Proposed: If core APIs missing, surface a “Fix it” CTA that opens setup instructions.
- Location: `src/popup/AIStatusPanel.tsx`
- Acceptance Criteria:
  - Unavailable states provide an actionable button.
  - Clear microcopy explains what enabling the flag achieves.

---

## Reflect Mode Overlay

A) Progressive disclosure for advanced tools
- Proposed: Default view shows breathing orb, summary, two inputs, save/cancel. Hide Tone chips, Proofread diff, and Translate behind a “More tools” disclosure.
- Location: `src/content/components/MeditationFlowOverlay/ToolsSection.tsx` (MoreToolsMenu integration).
- Acceptance Criteria:
  - Fewer controls visible by default; “More tools” toggles advanced actions.
  - All features remain accessible; state persists after toggle.

B) Stronger busy/disabled states
- Proposed: Centralize `isLoadingSummary`, `isTranslating`, and `isRewriting` to disable related controls and set `aria-busy`.
- Location: `MeditationFlowOverlay` + related handlers in `src/content/workflows/`.
- Acceptance Criteria:
  - Buttons disabled with visual and ARIA feedback during work.
  - Screen reader announcement (“Updating summary…”, “Translation complete”).

C) Voice input affordances
- Proposed: Add a small live indicator dot (respect reduced motion), always display current language label.
- Location: `src/content/components/VoiceToggleButton.tsx`.
- Acceptance Criteria:
  - Indicator reflects recording state; no motion if `reduceMotion`.
  - Tooltip clarifies language and fallback behavior.

---

## Popup Information Architecture

A) Prioritize reflections above AI and stats
- Proposed: Move “Your Reflections” above Calm Stats and AI Status; collapse AI status into a compact summary row with link to details.
- Location: `src/popup/App.tsx:461` (reorder sections)
- Acceptance Criteria:
  - Reflections visible at a glance.
  - AI details are still discoverable via link/button.

B) Search and filter
- Proposed: Add a small search input above the list (filter by title/tags; persist last query).
- Location: `src/popup/App.tsx:471`.
- Acceptance Criteria:
  - Filters occur client‑side with debounced input.
  - No layout shift; accessible label and clear button.

---

## Reflection Management

A) Favorites and tags
- Proposed: Add a star to favorite and show tags; quick add via inline chip editor or kebab menu.
- Location: `src/popup/ReflectionCard.tsx`.
- Acceptance Criteria:
  - Favorite is persisted; reflects in Export filter and search.
  - Tagging UI is keyboard friendly and screen‑reader labeled.

B) Inline edit
- Proposed: Toggle reflection body to an editable textarea and save on blur or Cmd/Ctrl+S.
- Location: `src/popup/ReflectionCard.tsx`.
- Acceptance Criteria:
  - Edit mode is clearly indicated; escape cancels with no data loss.
  - Updates persist to storage; streak unaffected.

---

## Options Enhancements

A) Voice input settings
- Proposed: New “Voice Input” section with enable toggle, language override dropdown, auto‑stop delay slider.
- Location: `src/options/App.tsx` (new SettingsSection); types already support: `voiceInputEnabled`, `voiceLanguage`, `voiceAutoStopDelay`.
- Acceptance Criteria:
  - Settings persist and immediately affect overlay voice behavior.

B) AI setup helper and test button
- Proposed: Add “Open Setup Guide” button and a one‑click “Run test” (sample summarization) with inline result.
- Location: `src/options/App.tsx:300` (AI Status section).
- Acceptance Criteria:
  - Test displays success/failure and which API path was used (specialized vs Prompt fallback).

C) Dark mode support
- Proposed: Add a theme toggle (Follow system / Light / Dark) and dark token set.
- Location: tokens in `src/styles/theme.css`; theme state in options; data‑attribute on roots.
- Acceptance Criteria:
  - Popup, options, and overlay respect theme with AA contrast.

---

## Performance & Accessibility

A) Low‑power fallback
- Proposed: When average FPS < 45 for 2s, disable heavy blur/gradients in overlay and simplify backgrounds.
- Locations: `src/content/styles.css` (alt classes), `src/utils/performanceMonitor.ts` (threshold), `src/content/index.tsx` (toggle class based on report).
- Acceptance Criteria:
  - Automatic downgrade is reversible; respects reduced‑motion.

B) High‑contrast support
- Proposed: Add `[data-high-contrast]` or `prefers-contrast: more` variants for key surfaces.
- Location: `src/styles/accessibility.css` and critical components.
- Acceptance Criteria:
  - Meets WCAG AA in high contrast; focus outlines remain visible.

C) Keyboard shortcuts help
- Proposed: Add a small “?” in popup header revealing shortcuts (Esc close overlay, Cmd/Ctrl+Enter save, Cmd/Ctrl+E export).
- Location: `src/popup/App.tsx:416` (header actions).
- Acceptance Criteria:
  - Dialog accessible and dismissible; list uses readable labels.

---

## Copy & Micro‑interactions

A) Streak celebration
- Proposed: Subtle sparkle or shimmer on +1, with reduced motion fallback.
- Location: `src/popup/StreakCounter.tsx`.
- Acceptance Criteria:
  - Animation respects `reduceMotion`; clear but not distracting.

B) Clearer AI microcopy
- Proposed: Under “Unavailable”, add one‑line rationale + “Fix it” CTA.
- Location: `src/popup/AIStatusPanel.tsx`.
- Acceptance Criteria:
  - Reduces ambiguity; drives users to enable features.

---

## Export Experience

A) Scoped export and copy to clipboard
- Proposed: Date range selector, filter by favorites/tags, and “Copy Markdown”.
- Location: `src/popup/ExportModal.tsx`.
- Acceptance Criteria:
  - Export respects filters and validates selection.
  - “Copy” places Markdown on clipboard with success toast.

---

## Design Consistency

A) Translation flags
- Proposed: Replace emoji flags with neutral language icons or labels to avoid regional sensitivities.
- Location: `src/content/components/TranslateDropdown.tsx`.
- Acceptance Criteria:
  - Options remain scannable; a11y names unchanged or improved.

---

## Implementation Roadmap

- Days 1–2
  - Options gear in popup, Undo toast for delete, locale dates, overlay skeleton, tooltip for Export, move reflections above AI status.
- Days 3–4
  - Overlay progressive disclosure, voice affordances, popup search.
- Days 5–6
  - Onboarding stepper (privacy + AI setup + prefs + demo), options voice settings and AI test.
- Week 2
  - Low‑power mode, dark mode, favorites/tags/edit, scoped export.

---

## Success Metrics
- First‑run completion rate for AI setup (>80%).
- Time‑to‑first reflection decreased by 25%.
- Overlay abandonment rate reduced by 20%.
- Search usage and favorites adoption in popup (>30% of active users).
- Support tickets related to “AI unavailable” drop by 50%.

---

## Appendix: File Reference Map
- Popup: `src/popup/App.tsx`, `AIStatusPanel.tsx`, `ReflectionCard.tsx`, `ExportModal.tsx`, `StreakCounter.tsx`, `CalmStats.tsx`
- Overlay: `src/content/components/MeditationFlowOverlay/`, `VoiceToggleButton.tsx`, `ProofreadDiffView/`, `TonePresetChips/`, `TranslateDropdown/`, `StartReflectionButton.tsx`
- Content script orchestration: `src/content/index.tsx`
- Options: `src/options/App.tsx` and `components/*`
- Theme & a11y: `src/styles/theme.css`, `src/styles/accessibility.css`, `src/content/styles.css`
- Performance: `src/utils/performanceMonitor.ts`
