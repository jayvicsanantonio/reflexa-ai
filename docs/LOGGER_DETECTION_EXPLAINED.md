# Logger Detection Explained

**Updated**: 2025-11-02

---

## How the Logger Detects Dev vs Prod

The logger now uses a **two-tier detection system**:

### Tier 1: Vite Build Mode (Primary)
```typescript
import.meta.env.DEV === true  // Set by Vite during build
```

**When**: Set during the build process
- `npm run build:dev` → `DEV = true`
- `npm run build` → `DEV = false` (production)

### Tier 2: Chrome Extension Unpacked Check (Fallback)
```typescript
chrome.runtime.getManifest().update_url === undefined
```

**When**: Extension is running in Chrome
- **Unpacked extension** (local testing) → No `update_url` → **Logging enabled**
- **Chrome Web Store extension** (published) → Has `update_url` → **Logging disabled**

---

## Behavior Matrix

| Build Command | Vite Mode | Extension Type | Logging Enabled? | Why |
|---------------|-----------|----------------|------------------|-----|
| `npm run build:dev` | Dev | Any | ✅ Yes | Tier 1: `DEV = true` |
| `npm run build` | Prod | **Unpacked** (local) | ✅ Yes | Tier 2: No `update_url` |
| `npm run build` | Prod | **Published** (CWS) | ❌ No | Both checks fail |
| `npm run dev` | Dev | Any | ✅ Yes | Tier 1: `DEV = true` |

---

## Why This Approach?

### Problem We're Solving:
- Developer tests locally with `npm run build` (production mode)
- Production mode disables logging
- But developer needs logs for debugging!

### Solution:
1. **If built in dev mode** → Always log (Tier 1)
2. **If built in prod mode BUT unpacked** → Still log (Tier 2)
3. **If built in prod mode AND published** → Don't log (both fail)

---

## For Local Testing

### Recommended Approach:
```bash
npm run build:dev    # Explicitly enable logging
```

### Also Works:
```bash
npm run build        # Will still log if extension is unpacked (Tier 2 detection)
```

Both will work for local testing! The logger automatically detects you're using an unpacked extension.

---

## For Production (Chrome Web Store)

When you publish to Chrome Web Store:
1. Extension gets `update_url` in manifest
2. Tier 2 check detects published extension
3. Logging is automatically disabled
4. No console noise for end users

---

## Testing the Detection

To verify logging works:

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Load as unpacked extension** in Chrome:
   - Go to `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select `dist/` folder

3. **Check console**:
   - Open DevTools
   - You should see `[Reflexa]` log messages
   - Logging is enabled because extension is unpacked!

4. **Verify production behavior**:
   - After publishing to Chrome Web Store
   - Install from store
   - Check console
   - No `[Reflexa]` log messages
   - Logging is disabled!

---

## Summary

✅ **Local testing with `npm run build`**: Logging enabled (unpacked detection)
✅ **Local testing with `npm run build:dev`**: Logging enabled (explicit dev mode)
✅ **Chrome Web Store (published)**: Logging disabled (has `update_url`)
✅ **Development server (`npm run dev`)**: Logging enabled (dev mode)

**You can use either build command for local testing - logging will work!**

