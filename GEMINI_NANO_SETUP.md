# Gemini Nano Setup Guide for Reflexa AI

## Prerequisites

- **Chrome 127+** (Stable) OR **Chrome Canary/Dev** (Recommended)
- **macOS, Windows, or Linux** (with sufficient RAM - 4GB+ recommended)

## Step-by-Step Setup

### 1. Check Chrome Version

1. Open Chrome
2. Go to: `chrome://version/`
3. Check the version number (should be 127 or higher)

**If your version is too old:**

- Download Chrome Canary: https://www.google.com/chrome/canary/
- Or update Chrome Stable to latest version

### 2. Enable Required Flags

#### Flag 1: Prompt API

1. Go to: `chrome://flags/#prompt-api-for-gemini-nano`
2. Click the dropdown next to "Prompt API for Gemini Nano"
3. Select **"Enabled"**

#### Flag 2: Optimization Guide

1. Go to: `chrome://flags/#optimization-guide-on-device-model`
2. Click the dropdown next to "Optimization Guide On Device Model"
3. Select **"Enabled BypassPerfRequirement"**

### 3. Restart Chrome

**IMPORTANT:** You MUST restart Chrome completely for flags to take effect.

1. Close ALL Chrome windows
2. Quit Chrome completely (Cmd+Q on Mac, or close from taskbar on Windows)
3. Reopen Chrome

### 4. Verify AI API is Available

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Run this command:
   ```javascript
   window.ai;
   ```
4. You should see an object with `languageModel` property
5. If you see `undefined`, the flags didn't take effect - restart Chrome again

### 5. Check AI Availability

Run this in the console:

```javascript
await window.ai.languageModel.availability();
```

Expected responses:

- `"available"` - Model is ready to use ✅
- `"downloadable"` or `"after-download"` - Model needs to be downloaded
- `"downloading"` - Model is currently downloading
- `"unavailable"` - Not supported on this device ❌

### 6. Download Gemini Nano Model (if needed)

If availability returns `"downloadable"` or `"after-download"`:

```javascript
await window.ai.languageModel.create();
```

This will download the model (~1.5GB). It may take several minutes.

**Monitor download progress:**
The model downloads in the background. You can check status by running:

```javascript
await window.ai.languageModel.availability();
```

When it returns `"available"`, you're ready!

### 7. Test the Model

Once available, test it:

```javascript
const session = await window.ai.languageModel.create();
const result = await session.prompt('Say hello!');
console.log(result);
session.destroy();
```

You should see a response from Gemini Nano!

## Troubleshooting

### "ai is not defined" error

- Flags are not enabled properly
- Chrome wasn't restarted after enabling flags
- Chrome version is too old

**Solution:** Double-check flags, restart Chrome completely, verify version

### "availability() returns 'unavailable'"

- Your device doesn't meet system requirements
- Not enough RAM or storage
- Gemini Nano not supported on your OS version

**Solution:** Try Chrome Canary, ensure 4GB+ RAM available

### Model won't download

- Check internet connection
- Ensure sufficient disk space (~2GB free)
- Try restarting Chrome and running create() again

### Extension still shows "AI Unavailable"

1. Verify `window.ai` exists in page console
2. Check background service worker console for detailed errors
3. Reload the extension after enabling AI
4. Try on a different webpage

## Verification Checklist

Before using Reflexa AI with Gemini Nano:

- [ ] Chrome version 127+ (or Canary/Dev)
- [ ] `chrome://flags/#prompt-api-for-gemini-nano` = Enabled
- [ ] `chrome://flags/#optimization-guide-on-device-model` = Enabled BypassPerfRequirement
- [ ] Chrome restarted completely
- [ ] `window.ai` is defined in console
- [ ] `await window.ai.languageModel.availability()` returns "available"
- [ ] Test prompt works successfully

## Still Having Issues?

If you've completed all steps and still see "AI Unavailable":

1. Check background service worker logs:
   - Go to `chrome://extensions/`
   - Click "service worker" under Reflexa AI
   - Look for error messages

2. Try a different browser profile:
   - Create a new Chrome profile
   - Enable flags in the new profile
   - Test there

3. System Requirements:
   - Ensure your device meets minimum requirements
   - Some older devices may not support on-device AI

## Alternative: Manual Mode

Reflexa AI works perfectly without Gemini Nano!

When AI is unavailable, you can:

- Manually write your 3-bullet summary
- Manually write your 2 reflection questions
- Still save and track all your reflections
- Export your reflection history

The extension is designed to be useful with or without AI.
