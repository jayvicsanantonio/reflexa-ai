# Development vs Production Detection in Chrome Extension

**Date**: 2025-11-02
**Context**: Understanding how the extension detects dev vs prod mode for logging

---

## Current Situation

When you run `npm run build` and load the extension in Chrome locally, the logger may not work as expected because:

1. **Vite sets `import.meta.env.DEV` based on build mode**:
   - `npm run build` → defaults to **production mode** → `DEV = false` → **No logging**
   - `npm run build:dev` → **development mode** → `DEV = true` → **Logging enabled**

2. **The browser doesn't know** if the extension is "dev" or "prod"
3. **Chrome doesn't distinguish** between unpacked extensions (local testing) and published extensions

---

## How Vite Determines Mode

Vite sets environment variables based on:
- **Build command mode**: `vite build --mode development` vs `vite build` (production)
- **NODE_ENV**: Set automatically by Vite based on mode

### Your Current Build Scripts:

```json
{
  "build": "npm run check && npm run test && vite build",           // Production (DEV=false)
  "build:dev": "vite build --mode development",                    // Development (DEV=true)
  "build:prod": "npm run check && npm run test && vite build --mode production"  // Explicit production
}
```

### What Happens:

| Command | Mode | `import.meta.env.DEV` | Logging Enabled? |
|---------|------|----------------------|------------------|
| `npm run build` | Production (default) | `false` | ❌ No |
| `npm run build:dev` | Development | `true` | ✅ Yes |
| `npm run build:prod` | Production | `false` | ❌ No |
| `npm run dev` | Development | `true` | ✅ Yes |

---

## Problem: Local Testing Needs Logging

You're testing locally (unpacked extension), but you might want logging. Current behavior:

- **If you use `npm run build`**: No logs (production mode)
- **If you use `npm run build:dev`**: Logs enabled (development mode)

**Issue**: You might accidentally use `npm run build` for local testing, which disables logging.

---

## Better Solution: Detect Unpacked Extension

Instead of relying on Vite's build mode, we can detect if the extension is **unpacked** (local testing) vs **installed from Chrome Web Store** (production).

### Approach 1: Check Extension Location ✅ Recommended

Chrome extensions installed from the Web Store have a specific location. We can check:

```typescript
// Check if extension is unpacked (developer mode)
const isUnpacked = chrome.runtime.getManifest().update_url === undefined;
```

**Web Store extensions** have an `update_url` in their manifest. **Unpacked extensions** do not.

### Approach 2: Use Build Mode + Manifest Check

Keep current approach but add fallback:

```typescript
const isDev = import.meta.env.DEV || isUnpackedExtension();
```

---

## Recommended Fix

Update the logger to detect both Vite mode AND unpacked extension status:

```typescript
const isDev = (() => {
  // Check Vite environment variable
  try {
    if (import.meta.env?.DEV === true) {
      return true;
    }
  } catch {
    // ignore
  }

  // Fallback: Check if extension is unpacked (local testing)
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const manifest = chrome.runtime.getManifest();
      // Unpacked extensions don't have update_url
      return manifest.update_url === undefined;
    }
  } catch {
    // ignore
  }

  return false;
})();
```

This way:
- **Local testing** (unpacked) → Logging enabled ✅
- **Chrome Web Store** (published) → Logging disabled ✅
- **Development builds** (`npm run build:dev`) → Logging enabled ✅
- **Production builds** (`npm run build`) → Logging enabled IF unpacked ✅

---

## Quick Fix for Local Testing

**For now, use `npm run build:dev` for local testing:**

```bash
npm run build:dev    # Builds with logging enabled
```

Then load the `dist/` folder in Chrome.

---

## Long-term Solution

Update the logger to detect unpacked extensions automatically (see recommended fix above).

