# Logger Utility Documentation

**File**: `src/utils/logger.ts`
**Last Updated**: January 2, 2025

---

## Overview

The logger utility provides conditional logging functions that automatically detect the environment (development vs production) and only log in development mode. This ensures clean console output in production builds while retaining full debugging capabilities during development.

---

## Available Functions

### `devLog(...args: any[]): void`

Development-only logging. Logs to `console.log` only in development mode.

**Usage**:
```typescript
import { devLog } from '../../utils/logger';

devLog('User clicked button');
devLog('Data loaded:', { users: 10, posts: 25 });
```

### `devWarn(...args: any[]): void`

Development-only warnings. Logs to `console.warn` only in development mode.

**Usage**:
```typescript
import { devWarn } from '../../utils/logger';

devWarn('Feature deprecated, use new method instead');
devWarn('API response slower than expected:', duration);
```

### `devError(...args: any[]): void`

Development-only errors. Logs to `console.error` only in development mode.

**Usage**:
```typescript
import { devError } from '../../utils/logger';

devError('Failed to load data:', error);
devError('API call failed:', { endpoint, status });
```

### `perfLog(...args: any[]): void`

Performance logging. Logs to `console.log` only in development mode. Use for performance-related logging.

**Usage**:
```typescript
import { perfLog } from '../../utils/logger';

perfLog(`Component render: ${duration}ms`);
perfLog('Memory usage:', { before, after, delta });
```

---

## Environment Detection

The logger uses a **two-tier detection system** to determine if logging should be enabled:

### Tier 1: Vite Build Mode (Primary)

Checks Vite's environment variable set during build:

```typescript
import.meta.env.DEV === true
```

**Behavior**:
- `npm run build:dev` → `DEV = true` → **Logging enabled** ✅
- `npm run build` → `DEV = false` → **Logging disabled** ❌ (unless Tier 2)
- `npm run dev` → `DEV = true` → **Logging enabled** ✅

### Tier 2: Chrome Extension Unpacked Check (Fallback)

Checks if the extension is unpacked (loaded locally) vs published (Chrome Web Store):

```typescript
chrome.runtime.getManifest().update_url === undefined
```

**Behavior**:
- **Unpacked extension** (local testing) → No `update_url` → **Logging enabled** ✅
- **Chrome Web Store extension** (published) → Has `update_url` → **Logging disabled** ❌

---

## Behavior Matrix

| Build Command | Vite Mode | Extension Type | Logging Enabled? | Reason |
|---------------|-----------|----------------|-------------------|--------|
| `npm run build:dev` | Dev | Any | ✅ Yes | Tier 1: `DEV = true` |
| `npm run build` | Prod | **Unpacked** (local) | ✅ Yes | Tier 2: No `update_url` |
| `npm run build` | Prod | **Published** (CWS) | ❌ No | Both checks fail |
| `npm run dev` | Dev | Any | ✅ Yes | Tier 1: `DEV = true` |

---

## Why Two-Tier Detection?

### Problem

Developers test locally with `npm run build` (production mode), which disables logging by default. However, developers need logs for debugging!

### Solution

1. **If built in dev mode** → Always log (Tier 1)
2. **If built in prod mode BUT unpacked** → Still log (Tier 2)
3. **If built in prod mode AND published** → Don't log (both checks fail)

This ensures:
- ✅ Developers get logs when testing locally
- ✅ Production users don't see console noise
- ✅ Explicit dev builds always log

---

## Usage Guidelines

### When to Use Each Function

**`devLog()`** - General debugging, information logging
- User actions
- State changes
- Data loading
- Flow progression

**`devWarn()`** - Non-critical issues, deprecations
- Feature deprecation warnings
- Performance warnings
- Fallback scenarios
- Configuration issues

**`devError()`** - Errors and failures
- API call failures
- Validation errors
- Operation failures
- Critical issues

**`perfLog()`** - Performance-related logging
- Render times
- API response times
- Memory usage
- Performance metrics

### When NOT to Use

❌ **Don't use** for user-facing messages (use notifications/UI)
❌ **Don't use** for sensitive data (credentials, tokens)
❌ **Don't use** `console.log` directly in production code

---

## Migration from console.log

### Before
```typescript
console.log('User clicked button');
console.warn('Feature deprecated');
console.error('API call failed:', error);
```

### After
```typescript
import { devLog, devWarn, devError } from '../../utils/logger';

devLog('User clicked button');
devWarn('Feature deprecated');
devError('API call failed:', error);
```

---

## Testing the Logger

### Verify Logging Works

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Load as unpacked extension**:
   - Go to `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select `dist/` folder

3. **Check console**:
   - Open DevTools
   - You should see log messages
   - Logging is enabled because extension is unpacked!

### Verify Production Behavior

1. **Publish to Chrome Web Store**
2. **Install from store**
3. **Check console**:
   - No log messages
   - Logging is disabled (has `update_url`)

---

## Implementation Details

### Source Code Location

`src/utils/logger.ts`

### Detection Logic

```typescript
const isDev = (() => {
  // 1. Check Vite environment variable (set during build)
  try {
    if (
      typeof import.meta !== 'undefined' &&
      import.meta.env?.DEV === true
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  // 2. Check if extension is unpacked (loaded locally for testing)
  // Unpacked extensions don't have update_url, which is only present in Chrome Web Store extensions
  try {
    if (
      typeof chrome !== 'undefined' &&
      chrome.runtime?.getManifest
    ) {
      const manifest = chrome.runtime.getManifest();
      // If update_url is undefined, it's an unpacked extension (local testing)
      // Chrome Web Store extensions always have update_url
      if (manifest.update_url === undefined) {
        return true; // Unpacked = local testing = enable logging
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback: assume production (no logging)
  return false;
})();
```

---

## Best Practices

1. **Use appropriate log level**
   - `devLog` for information
   - `devWarn` for warnings
   - `devError` for errors
   - `perfLog` for performance

2. **Include context**
   - Log relevant data with messages
   - Use structured logging when helpful

3. **Don't log sensitive data**
   - No credentials, tokens, or personal data
   - Sanitize data before logging

4. **Use consistently**
   - Replace all `console.*` with logger functions
   - Maintain consistent logging patterns

5. **Test in both modes**
   - Verify logs appear in dev mode
   - Verify logs don't appear in production

---

## FAQ

### Q: Why use logger instead of console.log?

A: Logger automatically disables in production, keeping console clean for end users while maintaining debugging capability during development.

### Q: Will logs appear in production?

A: No. If the extension is published to Chrome Web Store, logging is automatically disabled.

### Q: Can I force logging in production?

A: No, and you shouldn't. Production builds should be clean. If you need logs, use `npm run build:dev` for local testing.

### Q: What about console.error for critical errors?

A: Use `devError()` instead. It behaves the same but respects the environment detection.

### Q: Do test files need to use the logger?

A: No. Test files can use `console.log` directly. The logger is for production code.

---

## Examples

### Content Script

```typescript
import { devLog, devError } from '../../utils/logger';

devLog('Content script initialized');

try {
  // Some operation
  devLog('Operation successful');
} catch (error) {
  devError('Operation failed:', error);
}
```

### Background Service Worker

```typescript
import { devLog, devWarn, devError } from '../../utils/logger';

devLog('Background service worker initialized');

if (!someCondition) {
  devWarn('Feature not available, using fallback');
}

try {
  await someAsyncOperation();
} catch (error) {
  devError('Async operation failed:', error);
}
```

### React Component

```typescript
import { devLog } from '../../utils/logger';

function MyComponent() {
  useEffect(() => {
    devLog('Component mounted');
    return () => {
      devLog('Component unmounted');
    };
  }, []);

  const handleClick = () => {
    devLog('Button clicked');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

---

## Summary

✅ **Local testing with `npm run build`**: Logging enabled (unpacked detection)
✅ **Local testing with `npm run build:dev`**: Logging enabled (explicit dev mode)
✅ **Chrome Web Store (published)**: Logging disabled (has `update_url`)
✅ **Development server (`npm run dev`)**: Logging enabled (dev mode)

**You can use either build command for local testing - logging will work!**

---

**Last Updated**: January 2, 2025
**Related Documentation**:
- `docs/CODE_OPTIMIZATION_REPORT.md` - Implementation details
- `docs/development/README.md` - Developer documentation overview

