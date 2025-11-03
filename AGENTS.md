# Repository Guidelines

## Project Structure & Module Organization
- Core extension code in `src/`: `background/` (service worker), `content/` (injected scripts), `popup/` and `options/` (React UIs).
- Shared modules: `utils/` (logic), `constants/` (config), `types/` (typings).
- Tests in `src/__tests__/`; shared test harness in `src/test/`.
- Static assets in `public/`; build output in `dist/`; release archives in `build/`.
- Docs in `docs/`; demo scenarios in `demos/`.

## Build, Test, and Development Commands
- `npm run dev` — start Vite sandbox with HMR.
- `npm run dev:watch` — build in watch mode (no server).
- `npm run build` — type-check, lint, test, then emit `dist/` (CI baseline).
- `npm run preview` — serve the built bundle for manual checks.
- `npm run package` — production build and zip to `build/` via `scripts/package-extension.js`.
- `npm run test` / `npm run test:coverage` — run Vitest suite and coverage.

## Coding Style & Naming Conventions
- TypeScript + React 18; prefer functional components and hooks.
- Formatting via Prettier (two-space indent, trailing commas). ESLint config in `eslint.config.js`.
- Naming: components `PascalCase.tsx`; hooks `useThing.ts`; shared modules `kebab-case.ts`.
- Prefer data-driven selectors like `data-test-id`.

## Testing Guidelines
- Framework: Vitest + Testing Library + Happy DOM.
- Unit tests: `*.test.ts`/`*.test.tsx`; integration: `src/__tests__/*.integration.test.ts`.
- Favor meaningful assertions over snapshots; keep tests deterministic.
- Place shared helpers in `src/test/`.

## Commit & Pull Request Guidelines
- Conventional Commits: `type(scope): concise summary` (imperative).
- Before PR: `npm run check` and `npm run build` must pass; do not commit artifacts.
- PRs: describe intent, key UI changes, linked issues; include screenshots for `popup/` or `options/`.
- Request review after CI passes; list follow-ups as checklists.

## Security & Agent Notes
- Do not hardcode secrets; keep browser permissions minimal and update `manifest` thoughtfully.
- Agents and contributors: keep diffs small and focused; follow these rules for every touched file; update docs/tests when behavior changes.

