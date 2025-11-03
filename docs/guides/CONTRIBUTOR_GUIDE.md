# Contributor Guide

Welcome to Reflexa AI. This guide explains how the extension is organized, how to run it locally, how to contribute safely, and how to ship changes with confidence.

## Overview & Entry Points
- Manifest: `public/manifest.json` (MV3). Wires all contexts.
- Background (service worker): `src/background/index.ts`. Orchestrates AI services, storage, and message routing.
- Content script: `src/content/index.tsx`. Injected into pages; mounts UI and runs workflows.
- Popup UI: `src/popup/index.html` → `src/popup/App.tsx`.
- Options UI: `src/options/index.html` → `src/options/App.tsx`.

## Project Structure (What lives where)
- `src/background/`
  - `index.ts` bootstraps listeners and routes messages in `handleMessage`.
  - `handlers/` groups operations: `ai/`, `streaming/`, `storage/`, `settings/`, `utils/`.
  - `services/ai/` contains managers (Summarizer, Writer, Rewriter, Proofreader, Translator, Language Detector, Prompt) exposed via `aiService`.
- `src/content/`
  - `index.tsx` is the injected entry.
  - `setup/` initializes listeners, nudges, and modals; `workflows/` encapsulates flows; `ui/` and `components/` render surfaces; `core/` and `state/` hold runtime state.
- `src/popup/`, `src/options/`: React apps for toolbar popup and settings.
- `src/utils/`, `src/constants/`, `src/types/`: Shared utilities, config, and typings.
- Tests: `src/__tests__/` (integration/unit) and `src/test/` (helpers).
- Assets: `public/` (manifest, icons, audio). Builds: `dist/`. Packages: `build/`.

## Prerequisites
- Chrome 131+ with Built‑in AI (Gemini Nano) enabled (see docs/guides for flags).
- Node 18+ recommended. Use `npm` (lockfile present).

## Install, Run, Build
```sh
npm install                # install deps
npm run dev               # Vite dev server (extension sandbox)
npm run dev:watch         # watch builds without server
npm run build             # type-check, lint, test, then production bundle to dist/
npm run preview           # serve the built bundle
npm run package           # build + zip to build/
```

## Load in Chrome (Dev)
1. Run `npm run dev` or `npm run dev:watch`.
2. Open `chrome://extensions` → enable Developer mode.
3. Click “Load unpacked” and select the `dist/` directory.
4. Click the toolbar icon to open the popup; navigate any page to see the content script.

## Testing
- Runner: Vitest with Testing Library and Happy DOM.
- Commands: `npm run test`, `npm run test:watch`, `npm run test:coverage`.
- Conventions:
  - Unit: `*.test.ts` / `*.test.tsx`
  - Integration: `src/__tests__/*.integration.test.ts`
- Place shared helpers in `src/test/`.
- Prefer meaningful assertions over snapshots; keep tests deterministic.

## Coding Standards
- TypeScript + React 18; functional components + hooks.
- Formatting: Prettier (2‑space indent, trailing commas). Linting: ESLint (`eslint.config.js`).
- Naming: components `PascalCase.tsx`; hooks `useThing.ts`; shared modules `kebab-case.ts`.
- Selectors: prefer `data-test-id` for robust tests.

## Architecture & Data Flow
- Messaging: `chrome.runtime.onMessage` in `src/background/index.ts` routes via `handleMessage` to `src/background/handlers/*`.
- Streaming: long‑running ops use a `Port` named `ai-stream` (`chrome.runtime.onConnect`). See `src/background/handlers/streaming/`.
- Message helper: `src/utils/messageBus.ts` wraps `chrome.runtime.sendMessage` with typed `AIResponse`.
- Types and contracts: `src/types/index.ts` defines `MessageType`, `Message`, `AIResponse`, and domain models.
- AI service: `src/background/services/ai/aiService.ts` aggregates capability managers and capability detection; initialize on install/startup.

## Background Service Worker
- Entry: `src/background/index.ts`.
- Responsibilities: initialize `aiService`, migrate storage keys, route messages, manage streams, and suppress benign runtime errors.
- Handlers by concern:
  - AI: summarize/reflect/proofread/write/rewrite/translate/language‑detect.
  - Storage: save/load/export reflections, streak.
  - Settings: get/update/reset settings.
  - Utilities: capability checks, open dashboard, start reflection.

## Content Script
- Entry: `src/content/index.tsx`.
- Bootstraps via `src/content/setup/` (message listeners, nudge + modals, initialization callbacks).
- Orchestrates flows in `src/content/workflows/` and renders UI via `src/content/ui/` + `src/content/components/`.
- Cleans up on `beforeunload` using `instanceManager` and `uiManager`.

## Popup & Options Apps
- Popup: `src/popup/App.tsx` renders a minimalist hero and dispatches actions (e.g., `startReflectInActiveTab`).
- Options: `src/options/App.tsx` loads/saves settings with debounced updates and shows AI capability checks.

## Debugging Playbook
- Logs: `src/utils/logger.ts` enables `devLog` automatically for unpacked builds; `devError` always logs.
- Background: `chrome://extensions` → “Service worker” link to open background console.
- Content script: Chrome DevTools → Sources → Page context; filter by `src/content/`.
- Popup/Options: right‑click view → Inspect.
- Reload: `chrome://extensions` → click reload icon after builds.

## Performance & Accessibility
- Budgets/constants: see `src/constants/index.ts` (timings, cache TTL, performance targets, a11y defaults).
- Accessibility helpers/styles: `src/styles/accessibility.css`; aim for WCAG AA; ensure keyboard navigation.
- Prefer memoization where relevant; avoid unnecessary re‑renders; keep DOM work minimal in content scripts.

## Security & Manifest
- Never hardcode secrets. Keep permissions minimal in `public/manifest.json`.
- Update `web_accessible_resources` only when needed; review `content_scripts` matches and `run_at`.
- Background must stay as module service worker (`type: module`).

## Commit & PR Process
- Conventional Commits: `type(scope): concise summary` (imperative). Examples: `feat(content): add lotus nudge`, `fix(background): debounce capability refresh`.
- Pre‑PR: `npm run check` and `npm run build` must pass; avoid committing artifacts from `dist/` or `build/`.
- PR description: intent, key UI changes, linked issues; include screenshots/gifs for `popup/` or `options/` updates.
- Keep diffs small and focused; update docs/tests with behavior changes.

## Release & Packaging
- `npm run package` produces a production build and ZIP in `build/` via `scripts/package-extension.js`.
- Verify `dist/` size and contents, spot check via `npm run preview`, then load the built folder in Chrome.

## Useful Paths
- Manifest: `public/manifest.json`
- Background entry: `src/background/index.ts`
- Content entry: `src/content/index.tsx`
- Popup: `src/popup/index.html`, `src/popup/App.tsx`
- Options: `src/options/index.html`, `src/options/App.tsx`
- Handlers index: `src/background/handlers/index.ts`
- AI service: `src/background/services/ai/aiService.ts`
- Message bus: `src/utils/messageBus.ts`

## First Issue Checklist
1. Read this guide and `AGENTS.md`.
2. Run: `npm install && npm run build`.
3. Load `dist/` in Chrome and validate basic flows.
4. Write or update tests; run `npm run test:coverage`.
5. Format/lint/type‑check: `npm run check`.
6. Open PR with Conventional Commit title and screenshots if UI changed.

Happy contributing! 🎉

