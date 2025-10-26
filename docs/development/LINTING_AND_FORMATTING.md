# Linting and Formatting Guide

## Overview

This project uses ESLint v9 and Prettier v3 for code quality and consistent formatting. The setup includes automatic Tailwind CSS class sorting and TypeScript type checking.

## Tools

### ESLint v9

- **Version**: 9.38.0
- **Config Format**: Flat config (eslint.config.js)
- **Purpose**: Code quality, bug detection, best practices

### Prettier v3

- **Version**: 3.6.2
- **Purpose**: Code formatting, style consistency
- **Plugin**: prettier-plugin-tailwindcss (automatic class sorting)

### TypeScript ESLint v8

- **Version**: 8.46.2
- **Purpose**: TypeScript-specific linting rules

## Configuration Files

### eslint.config.js

Modern flat config format (ESLint v9+):

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint
  .config
  // Configurations...
  ();
```

**Key Features**:

- TypeScript type-aware linting
- React Hooks rules
- React Refresh (HMR) rules
- Prettier integration
- Chrome extension globals

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Key Features**:

- Single quotes
- Semicolons required
- 80 character line width
- Automatic Tailwind class sorting

## NPM Scripts

### Linting

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix
```

### Formatting

```bash
# Format all source files
npm run format

# Check if files are formatted correctly
npm run format:check
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Combined Workflow

```bash
# Before committing:
npm run type-check  # Check types
npm run lint:fix    # Fix linting issues
npm run format      # Format code
npm run build       # Verify build works
```

## IDE Integration

### VS Code

**Required Extensions**:

- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

**Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

**Features**:

- Format on save
- Auto-fix ESLint errors on save
- Tailwind CSS autocomplete
- TypeScript IntelliSense

## Rules Overview

### ESLint Rules

#### TypeScript

- `@typescript-eslint/no-unused-vars`: Warn on unused variables (except `_` prefix)
- `@typescript-eslint/consistent-type-imports`: Prefer `type` imports
- `@typescript-eslint/no-misused-promises`: Prevent promise misuse

#### React

- `react-hooks/rules-of-hooks`: Enforce Hooks rules
- `react-hooks/exhaustive-deps`: Warn on missing dependencies
- `react-refresh/only-export-components`: Warn on non-component exports (HMR)

### Prettier Rules

- **Semicolons**: Required
- **Quotes**: Single quotes
- **Trailing Commas**: ES5 (objects, arrays)
- **Line Width**: 80 characters
- **Tab Width**: 2 spaces
- **Arrow Parens**: Always
- **End of Line**: LF (Unix)

### Tailwind Class Sorting

Prettier automatically sorts Tailwind classes in this order:

1. Layout (display, position)
2. Flexbox/Grid
3. Spacing (margin, padding)
4. Sizing (width, height)
5. Typography
6. Visual (background, border)
7. Effects (shadow, opacity)
8. Transitions/Animations

**Example**:

```tsx
// Before
<div className="text-2xl font-bold mb-4 p-6 bg-calm-50">

// After (automatically sorted)
<div className="bg-calm-50 p-6 mb-4 text-2xl font-bold">
```

## Common Issues

### Issue: ESLint not working in IDE

**Solution**:

1. Ensure ESLint extension is installed
2. Reload VS Code window
3. Check output panel for errors
4. Verify `eslint.config.js` exists

### Issue: Prettier not formatting

**Solution**:

1. Ensure Prettier extension is installed
2. Set Prettier as default formatter
3. Enable "Format on Save"
4. Check `.prettierrc` exists

### Issue: Tailwind classes not sorting

**Solution**:

1. Ensure `prettier-plugin-tailwindcss` is installed
2. Check plugin is listed in `.prettierrc`
3. Restart IDE

### Issue: Type errors in eslint.config.js

**Solution**:
The config file is JavaScript, not TypeScript. It's excluded from type checking:

```javascript
{
  ignores: ['eslint.config.js'];
}
```

## Migration from ESLint v8

### Changes Made

1. **Config Format**: `.eslintrc.cjs` → `eslint.config.js`
2. **Import Style**: CommonJS → ES Modules
3. **Plugins**: Separate packages → Unified packages
4. **Parser Options**: New `projectService` API

### Old Config (.eslintrc.cjs)

```javascript
module.exports = {
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
};
```

### New Config (eslint.config.js)

```javascript
import tseslint from 'typescript-eslint';

export default tseslint.config(...tseslint.configs.recommended);
```

## Best Practices

### 1. Run Linting Before Commits

Add to your workflow:

```bash
npm run lint:fix && npm run format
```

### 2. Use Type Imports

Prefer:

```typescript
import type { FC } from 'react';
```

Over:

```typescript
import { FC } from 'react';
```

### 3. Ignore Unused Parameters

Use `_` prefix:

```typescript
const handler = (_event, data) => {
  console.log(data);
};
```

### 4. Organize Imports

Let ESLint handle import organization:

```typescript
// External imports first
import React from 'react';

// Internal imports second
import { MyComponent } from './components';

// Type imports last
import type { MyType } from './types';
```

### 5. Consistent Formatting

Always use Prettier for formatting, never manual spacing:

```typescript
// Good (Prettier formatted)
const obj = { a: 1, b: 2 };

// Bad (manual spacing)
const obj = { a: 1, b: 2 };
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Lint and Format

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run format:check
```

## Resources

- [ESLint v9 Documentation](https://eslint.org/docs/latest/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Prettier Tailwind Plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)

## Summary

The project now has a modern, comprehensive linting and formatting setup:

✅ **ESLint v9** with flat config
✅ **Prettier v3** with Tailwind plugin
✅ **TypeScript ESLint v8** for type-aware linting
✅ **React Hooks** and **React Refresh** rules
✅ **Automatic formatting** on save (VS Code)
✅ **Tailwind class sorting** automatically
✅ **Type checking** integrated

All tools work together seamlessly to ensure code quality and consistency.
