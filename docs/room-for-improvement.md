# Reflexa AI — Room for Improvement

This document compiles UI/UX opportunities and actionable recommendations across the extension surfaces (Lotus Nudge, Quick Actions, Meditative Reflect Flow, AI Status, Quick Settings, Dashboard Overlay, and Toolbar Popup). It balances visual polish, interaction quality, accessibility, and implementation maintainability.

## Quick Wins (High Impact, Low Effort)
- Improve settings micro-icons consistency
  - Use a compact, consistent 16px icon grid for all rows; keep color tints aligned with the surface (blue tints on light cards, neutral on dark).
  - Extract icons to a small `icons.tsx` to avoid inline duplication and ensure consistency.
- Normalize modal spacing and typography
  - Adopt a shared modal class scale for header (18–20px/700), body (14–15px/400–500), footer spacing (12–16px).
  - Keep accent bars and subtle dividers consistent across Settings, AI Status, and Dashboard Overlay.
- Strengthen toast visibility and elegance
  - Current toast is above the backdrop; keep it visually compact with a calm fade and remove “Saved/Saving” text in favor of a short “Settings updated.”
  - Add safe-areas at view edges to avoid overlap with site-fixed elements.
- Make quick-actions hover rail adaptive
  - Pad the wrapper based on the number of quick actions so the rail never collapses when moving vertically (implemented). Keep constants co-located with the component.

## Lotus Nudge & Quick Actions
- Placement & interaction
  - Default position is bottom-left; keep expansion to a pill with “Reflect”.
  - Maintain a stable hover/focus area so the stacked actions don’t collapse when moving upward.
- Action ordering
  - From bottom to top (nearest to lotus → farthest): Settings, AI Status, Dashboard. This matches frequency of use.
- Accessibility & affordance
  - Ensure tooltips use `role="tooltip"`, appear on focus, and don’t trap focus.
  - Add keyboard shortcuts: Enter/Space (Reflect), ArrowUp/ArrowDown (cycle quick actions when open).

## Meditative Reflect Flow
- Flow structure
  - Longer breathing intro with gentle cue changes (Inhale/Hold/Exhale).
  - Summary → Q1 → Q2 with bottom nav and progress dots; Left/Right/Enter to navigate, ESC to exit.
- Calm visuals & contrast
  - Dark, high-contrast backdrop with soft saturation blur; large, calm typography; focus outlines are visible.
- More panel
  - Tucked tools for translation and proofreading to keep the main flow serene.
  - Respect “Reduce motion”; avoid aggressive transitions.
- Draft resilience
  - Autosave drafts (implemented) and resume on re-open for the same URL when recent (implemented). Consider adding “Resume draft?” micro-prompt in future.

## AI Status (Help Replacement)
- Visual consistency
  - Light card, rounded corners, subtle header badge, and crisp section dividers for better scannability.
- Capability icons & labels
  - Use appropriate icons for Summarizer, Writer, Rewriter, Proofreader, Language Detector, Translator, and Prompt API.
  - Checkmark color for “Available” uses a deep blue for better contrast.
- Setup Chrome AI
  - Friendly checklist with per-flag copy buttons right-aligned; consistent spacing so buttons never touch the modal edge.
  - Remove “Refresh” button; re-open panel to re-check.
  - Add a subdued “Tip” line about updating Chrome if flags don’t appear.

## Quick Settings
- Structure & defaults
  - Sections: Behavior, Experience, AI Features, Privacy, Voice; defaults match product direction (e.g., Experimental Mode on, Dwell/Auto-stop 0–60s step 10, default 10s).
  - Show all options (even if disabled) with clear “info” hints; avoid hidden dependencies.
- Live updates + toast
  - Settings propagate via background broadcast and apply immediately (audio, dwell threshold, overlay re-render) with an elegant toast.
- Micro-UX polish
  - Keep scroll position on toggle to prevent jump-to-top (implemented).
  - Align colors with AI Status for a cohesive system.

## Dashboard Overlay (In-Page)
- CalmStats parity
  - Share the same stats visuals between popup and overlay to avoid drift; extract to a lightweight shared component when time permits.
- Actions
  - Keep export actions in the header only; remove per-item export. Provide JSON and Markdown.
- Streak and list polish
  - Present streak with a mini weekly bar and badges; improve empty state with brand and guidance.

## Toolbar Popup
- Minimalist hero
  - Compact outer gradient box (matches lotus vibe) with a white pill card inside: logo, label, tagline, and a large “Reflect” CTA.
  - Height trimmed to feel snug; CTA behaves like quick action “Reflect” and starts the in-page meditative flow.

## Accessibility & Tests
- Access roles
  - All modals are `role="dialog"` with `aria-modal`, labeled headers, ESC close, and focus traps.
- Keyboard flows
  - Verify Left/Right/Enter navigation across Reflect flow; ensure tooltips are accessible.
- Tests to add or enhance
  - Meditation flow resume from draft and translation/proofread in More panel.
  - AI Status dialog and per-flag copy alignment.
  - Quick actions hover rail stability and keyboard operation.

## Maintainability
- Inline → CSS classes
  - Several inline styles (AI Status, Settings, Dashboard tiles) can be gradually migrated to shared classes in `src/content/styles.css` for easier maintenance.
- Shared components
  - Promote CalmStatsLite and modal shells to shared components to avoid drift between surfaces.

## Roadmap Candidates
- Optional “Resume draft?” nudge when opening Reflect with a saved draft.
- Per-API brand icons in AI Status with micro-helpers.
- Configurable toast location (top-right, bottom-left) to avoid site header collisions.
- Optional skip on breathing intro (“Start now”) respecting reduce motion.

---
If you want, I can turn any section above into tickets with acceptance criteria and estimates, or extract a checklist for the next milestone.
