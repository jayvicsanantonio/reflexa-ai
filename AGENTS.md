# Repository Guidelines

## Project Structure & Module Organization
- Core extension code lives in `src/`, with entry points separated by context: `background/` for service workers, `content/` for injected scripts, and `popup/` plus `options/` for React UIs.
- Reusable logic is grouped under `utils/`, configuration constants in `constants/`, and shared typings in `types/`.
- Tests live in `src/__tests__/`; shared harness code sits in `src/test/`.
- Static assets stay in `public/`; builds land in `dist/` and packaged zips in `build/`.
- Docs live in `docs/`; sample scenarios for demos and QA sit in `demos/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server for the extension sandbox; `npm run dev:watch` builds in watch mode without serving.
- `npm run build` runs type-checking, linting, tests, then produces a production bundle in `dist/`; prefer this for CI verification.
- `npm run package` creates a production build and archives it via `scripts/package-extension.js` into `build/`.
- `npm run preview` hosts the built bundle for manual spot checks in a browser.

## Coding Style & Naming Conventions
- The project targets modern TypeScript and React 18; prefer functional components and hooks.
- Prettier enforces two-space indent and trailing commas; ESLint rules live in `eslint.config.js`.
- Name files by context: React components as `PascalCase.tsx`, hooks as `useThing.ts`, shared modules as `kebab-case.ts`.
- Prefer data-driven DOM selectors like `data-test-id`.

## Testing Guidelines
- Vitest runs the suite (`npm run test`) with Testing Library and Happy DOM.
- Integration specs live in `src/__tests__/*.integration.test.ts`; unit tests use `*.test.ts` or `*.test.tsx`.
- Put shared helpers in `src/test/`.
- Run `npm run test:coverage` for coverage; favor meaningful assertions over snapshots.

## Commit & Pull Request Guidelines
- Follow the Conventional Commits pattern visible in history (`type(scope): concise summary`), keeping verbs imperative.
- Before opening a PR, ensure `npm run check` and `npm run build` succeed locally and artifacts are not committed.
- PR descriptions should outline intent, note key UI changes, link issues, and attach screenshots for popup/options updates.
- Request review after CI passes and flag follow-ups with checklists.
