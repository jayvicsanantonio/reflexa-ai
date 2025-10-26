# Build Scripts Guide

## Overview

This document explains all available npm scripts and their purposes in the Reflexa AI Chrome Extension project.

## Script Categories

### Development Scripts

#### `npm run dev`

Starts the Vite development server with Hot Module Replacement (HMR).

**What it does**:

- Starts Vite dev server
- Enables HMR for instant updates
- Watches for file changes
- Serves extension for development

**When to use**:

- During active development
- When you want instant feedback
- For testing changes quickly

**Example**:

```bash
npm run dev
```

### Build Scripts

#### `npm run build`

**Recommended for production builds**

Runs all quality checks before building the extension.

**What it does**:

1. ✅ Type checking (`tsc --noEmit`)
2. ✅ ESLint checking (`eslint .`)
3. ✅ Prettier format checking
4. ✅ Vite production build

**When to use**:

- Before committing code
- Before deploying to production
- When you want to ensure code quality

**Example**:

```bash
npm run build
```

**Output**:

```
> reflexa-ai-chrome-extension@1.0.0 check
> npm run type-check && npm run lint && npm run format:check

✓ Type checking passed
✓ Linting passed (2 warnings)
✓ Formatting passed

> vite build
✓ built in 309ms
```

#### `npm run build:only`

Builds the extension without running quality checks.

**What it does**:

- Runs Vite production build only
- Skips type checking
- Skips linting
- Skips format checking

**When to use**:

- When you've already run checks separately
- For quick builds during testing
- When you're confident code is correct

**Example**:

```bash
npm run build:only
```

### Quality Check Scripts

#### `npm run check`

Runs all quality checks without building.

**What it does**:

1. ✅ Type checking
2. ✅ ESLint checking
3. ✅ Prettier format checking

**When to use**:

- Before committing
- To verify code quality
- In CI/CD pipelines

**Example**:

```bash
npm run check
```

#### `npm run type-check`

Runs TypeScript type checking without emitting files.

**What it does**:

- Checks TypeScript types
- Validates type safety
- Reports type errors

**When to use**:

- To verify TypeScript types
- After making type changes
- Before committing

**Example**:

```bash
npm run type-check
```

**Output**:

```
> tsc --noEmit
# No output = success
```

#### `npm run lint`

Checks code with ESLint.

**What it does**:

- Runs ESLint on all files
- Reports errors and warnings
- Does NOT auto-fix

**When to use**:

- To check for linting issues
- Before committing
- In CI/CD pipelines

**Example**:

```bash
npm run lint
```

**Output**:

```
✖ 2 problems (0 errors, 2 warnings)
```

#### `npm run lint:fix`

Checks code with ESLint and auto-fixes issues.

**What it does**:

- Runs ESLint on all files
- Automatically fixes fixable issues
- Reports remaining issues

**When to use**:

- To fix linting errors automatically
- Before committing
- After making code changes

**Example**:

```bash
npm run lint:fix
```

#### `npm run format`

Formats all source files with Prettier.

**What it does**:

- Formats TypeScript files
- Formats TSX (React) files
- Formats CSS files
- Formats JSON files
- Sorts Tailwind classes automatically

**When to use**:

- To format code automatically
- Before committing
- After making changes

**Example**:

```bash
npm run format
```

**Output**:

```
src/background/index.ts 30ms
src/content/index.tsx 4ms
src/popup/App.tsx 6ms
```

#### `npm run format:check`

Checks if files are formatted correctly without modifying them.

**What it does**:

- Checks Prettier formatting
- Does NOT modify files
- Reports unformatted files

**When to use**:

- In CI/CD pipelines
- To verify formatting
- Before committing

**Example**:

```bash
npm run format:check
```

**Output**:

```
Checking formatting...
All matched files use Prettier code style!
```

### Preview Script

#### `npm run preview`

Previews the production build locally.

**What it does**:

- Serves the built extension
- Simulates production environment
- Useful for testing builds

**When to use**:

- After building
- To test production build
- Before deploying

**Example**:

```bash
npm run build
npm run preview
```

## Recommended Workflows

### Before Committing

Run all checks and build:

```bash
npm run build
```

Or run checks separately:

```bash
npm run check
```

### Quick Development Cycle

1. Start dev server:

```bash
npm run dev
```

2. Make changes (auto-reloads)

3. Before commit:

```bash
npm run lint:fix
npm run format
npm run build
```

### CI/CD Pipeline

```bash
# Install dependencies
npm ci

# Run all checks
npm run check

# Build
npm run build:only
```

### Fix All Issues

```bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Verify everything
npm run check
```

## Script Dependencies

### `npm run build` Flow

```
npm run build
  ├─> npm run check
  │     ├─> npm run type-check (tsc --noEmit)
  │     ├─> npm run lint (eslint .)
  │     └─> npm run format:check (prettier --check)
  └─> vite build
```

### `npm run check` Flow

```
npm run check
  ├─> npm run type-check
  ├─> npm run lint
  └─> npm run format:check
```

## Exit Codes

All scripts follow standard exit code conventions:

- **0**: Success
- **1**: Error (build failed, checks failed)
- **2**: Warning (linting warnings, but no errors)

## Performance

Typical execution times on a modern machine:

| Script                 | Time   | Notes               |
| ---------------------- | ------ | ------------------- |
| `npm run dev`          | ~500ms | Initial startup     |
| `npm run build`        | ~2-3s  | Includes all checks |
| `npm run build:only`   | ~300ms | Build only          |
| `npm run check`        | ~1-2s  | All checks          |
| `npm run type-check`   | ~500ms | TypeScript only     |
| `npm run lint`         | ~500ms | ESLint only         |
| `npm run format`       | ~100ms | Format all files    |
| `npm run format:check` | ~50ms  | Check only          |

## Troubleshooting

### Build Fails with Type Errors

```bash
# Check types first
npm run type-check

# Fix type errors in your code
# Then try building again
npm run build
```

### Build Fails with Linting Errors

```bash
# Try auto-fixing
npm run lint:fix

# If issues remain, fix manually
# Then try building again
npm run build
```

### Build Fails with Format Errors

```bash
# Format all files
npm run format

# Then try building again
npm run build
```

### Want to Build Without Checks

```bash
# Use build:only
npm run build:only
```

## Best Practices

### 1. Always Run Checks Before Committing

```bash
npm run build
```

### 2. Use Auto-Fix Tools

```bash
npm run lint:fix
npm run format
```

### 3. Run Checks in CI/CD

```yaml
# .github/workflows/ci.yml
- run: npm run check
- run: npm run build:only
```

### 4. Format on Save (VS Code)

Enable in `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### 5. Pre-commit Hooks (Optional)

Consider using Husky for automatic checks:

```bash
npm install --save-dev husky lint-staged
```

## Summary

| Script         | Type Check | Lint     | Format Check | Build |
| -------------- | ---------- | -------- | ------------ | ----- |
| `build`        | ✅         | ✅       | ✅           | ✅    |
| `build:only`   | ❌         | ❌       | ❌           | ✅    |
| `check`        | ✅         | ✅       | ✅           | ❌    |
| `type-check`   | ✅         | ❌       | ❌           | ❌    |
| `lint`         | ❌         | ✅       | ❌           | ❌    |
| `lint:fix`     | ❌         | ✅ (fix) | ❌           | ❌    |
| `format`       | ❌         | ❌       | ❌ (fix)     | ❌    |
| `format:check` | ❌         | ❌       | ✅           | ❌    |

**Recommendation**: Use `npm run build` for production builds to ensure all quality checks pass.
