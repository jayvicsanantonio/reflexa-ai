# Build and Packaging Scripts

This document describes the build and packaging scripts available for the Reflexa AI Chrome Extension.

## Available Scripts

### Development Scripts

#### `npm run dev`

Starts the Vite development server for rapid development with hot module replacement (HMR).

```bash
npm run dev
```

#### `npm run dev:watch`

Builds the extension in development mode with watch mode enabled. Automatically rebuilds when files change.

```bash
npm run dev:watch
```

### Build Scripts

#### `npm run build`

Full production build with all quality checks (type checking, linting, formatting).

```bash
npm run build
```

This runs:

1. Type checking (`tsc --noEmit`)
2. ESLint validation
3. Prettier format checking
4. Vite production build with minification

#### `npm run build:dev`

Development build without quality checks. Faster for testing.

```bash
npm run build:dev
```

#### `npm run build:prod`

Production build with all quality checks (same as `npm run build`).

```bash
npm run build:prod
```

#### `npm run build:only`

Build without running quality checks. Use when you've already validated code.

```bash
npm run build:only
```

### Quality Check Scripts

#### `npm run check`

Runs all quality checks without building.

```bash
npm run check
```

Includes:

- Type checking
- Linting
- Format checking

#### `npm run type-check`

TypeScript type checking only.

```bash
npm run type-check
```

#### `npm run lint`

ESLint validation.

```bash
npm run lint
```

#### `npm run lint:fix`

Auto-fix ESLint issues where possible.

```bash
npm run lint:fix
```

#### `npm run format`

Format all source files with Prettier.

```bash
npm run format
```

#### `npm run format:check`

Check if files are formatted correctly without modifying them.

```bash
npm run format:check
```

### Packaging Scripts

#### `npm run package`

Creates a production-ready ZIP file for Chrome Web Store distribution.

```bash
npm run package
```

This:

1. Runs full production build with quality checks
2. Creates a ZIP archive in the `build/` directory
3. Names the file: `reflexa-ai-chrome-extension-v{version}-{date}.zip`

#### `npm run package:dev`

Creates a development ZIP file without quality checks.

```bash
npm run package:dev
```

### Test Scripts

#### `npm run test`

Runs all tests once (non-watch mode).

```bash
npm run test
```

#### `npm run test:watch`

Runs tests in watch mode for development.

```bash
npm run test:watch
```

#### `npm run test:ui`

Opens Vitest UI for interactive test running.

```bash
npm run test:ui
```

#### `npm run test:coverage`

Runs tests with coverage reporting.

```bash
npm run test:coverage
```

## Git Hooks

The project uses Husky for Git hooks to ensure code quality.

### Pre-commit Hook

Runs automatically before each commit:

- Type checking
- Linting
- Format checking

If any check fails, the commit is blocked.

### Pre-push Hook

Runs automatically before pushing:

- All tests

If tests fail, the push is blocked.

### Skipping Hooks

To skip hooks temporarily (not recommended):

```bash
git commit --no-verify
git push --no-verify
```

## Build Output

### Development Build

- Output directory: `dist/`
- Source maps: Enabled
- Minification: Disabled
- Optimizations: Minimal

### Production Build

- Output directory: `dist/`
- Source maps: Disabled
- Minification: Enabled
- Optimizations: Maximum
- Tree shaking: Enabled
- Code splitting: Enabled

### Package Output

- Output directory: `build/`
- Format: ZIP archive
- Compression: Maximum (level 9)
- Includes: All files from `dist/`

## Workflow Examples

### Standard Development Workflow

```bash
# Start development server
npm run dev

# Make changes...

# Run tests
npm run test

# Commit (hooks run automatically)
git add .
git commit -m "feat: add new feature"

# Push (tests run automatically)
git push
```

### Creating a Release

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Create production package
npm run package

# Upload build/reflexa-ai-chrome-extension-v*.zip to Chrome Web Store
```

### Quick Testing Build

```bash
# Build without checks
npm run build:dev

# Or build and package
npm run package:dev
```

### Fixing Code Quality Issues

```bash
# Auto-fix linting issues
npm run lint:fix

# Auto-format code
npm run format

# Check if everything passes
npm run check
```

## Troubleshooting

### Build Fails

1. Check Node.js version (requires v22+)
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Clear build cache:
   ```bash
   rm -rf dist build
   ```

### Hooks Not Running

1. Ensure you're in a git repository
2. Reinstall hooks:
   ```bash
   npm run prepare
   ```
3. Check `.husky/` directory exists

### Package Script Fails

1. Ensure build completed successfully
2. Check `dist/` directory exists
3. Verify archiver is installed:
   ```bash
   npm list archiver
   ```

## Configuration Files

- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules
- `.prettierrc` - Prettier formatting rules
- `package.json` - Scripts and dependencies
- `.husky/` - Git hook scripts

## Performance Tips

1. Use `npm run dev:watch` for active development
2. Use `npm run build:dev` for quick testing builds
3. Only run `npm run package` for final releases
4. Use `npm run test:watch` during test development
5. Run `npm run check` before committing to catch issues early
