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

Reflexa AI uses all seven Chrome Built-in AI APIs. Enable each flag for full functionality:

#### Flag 1: Optimization Guide (Required)

1. Go to: `chrome://flags/#optimization-guide-on-device-model`
2. Click the dropdown next to "Optimization Guide On Device Model"
3. Select **"Enabled BypassPerfRequirement"**

#### Flag 2: Prompt API (Required)

1. Go to: `chrome://flags/#prompt-api-for-gemini-nano`
2. Click the dropdown next to "Prompt API for Gemini Nano"
3. Select **"Enabled"**

#### Flag 3: Summarizer API (Recommended)

1. Go to: `chrome://flags/#summarization-api-for-gemini-nano`
2. Click the dropdown next to "Summarization API for Gemini Nano"
3. Select **"Enabled"**

#### Flag 4: Writer API (Recommended)

1. Go to: `chrome://flags/#writer-api-for-gemini-nano`
2. Click the dropdown next to "Writer API for Gemini Nano"
3. Select **"Enabled"**

#### Flag 5: Rewriter API (Recommended)

1. Go to: `chrome://flags/#rewriter-api-for-gemini-nano`
2. Click the dropdown next to "Rewriter API for Gemini Nano"
3. Select **"Enabled"**

#### Flag 6: Language Detection API (Optional)

1. Go to: `chrome://flags/#language-detection-api`
2. Click the dropdown next to "Language Detection API"
3. Select **"Enabled"**

#### Flag 7: Translation API (Optional)

1. Go to: `chrome://flags/#translation-api`
2. Click the dropdown next to "Translation API"
3. Select **"Enabled"**

**Note**: Flags 1-2 are required for basic AI functionality. Flags 3-5 enable specialized features with better performance. Flags 6-7 enable multilingual support.

### 3. Restart Chrome

**IMPORTANT:** You MUST restart Chrome completely for flags to take effect.

1. Close ALL Chrome windows
2. Quit Chrome completely (Cmd+Q on Mac, or close from taskbar on Windows)
3. Reopen Chrome

### 4. Verify AI APIs are Available

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Run these commands to check each API:

```javascript
// Check Prompt API (Required)
LanguageModel;

// Check Summarizer API
Summarizer;

// Check Writer API
Writer;

// Check Rewriter API
Rewriter;

// Check Proofreader API (may not be available yet)
Proofreader;

// Check Language Detector API
LanguageDetector;

// Check Translator API
Translator;
```

4. Each should show a factory object (not `undefined`)
5. If you see `undefined`, the corresponding flag didn't take effect - restart Chrome again

**Note**: All Chrome AI APIs are accessed via global objects (capital first letter), NOT through `ai.*` or `window.ai.*`.

### 5. Check AI Availability

Run these commands in the console to check each API's availability:

```javascript
// Prompt API
await LanguageModel.availability();

// Summarizer API
await Summarizer.availability();

// Writer API
await Writer.availability();

// Rewriter API
await Rewriter.availability();

// Language Detector API
await LanguageDetector.availability();

// Translator API
await Translator.availability();
```

Expected responses for each:

- `"available"` - API is ready to use ✅
- `"downloadable"` - Model needs to be downloaded
- `"downloading"` - Model is currently downloading
- `"unavailable"` - Not supported on this device ❌

**Note**: All APIs share the same Gemini Nano model, so downloading once enables all APIs.

### 6. Download Gemini Nano Model (if needed)

If availability returns `"downloadable"`:

```javascript
await LanguageModel.create();
```

This will download the model (~22GB). It may take several minutes.

**Monitor download progress:**
The model downloads in the background. You can check status by running:

```javascript
await LanguageModel.availability();
```

When it returns `"available"`, you're ready!

### 7. Test the APIs

Once available, test each API:

```javascript
// Test Prompt API
const session = await LanguageModel.create();
const result = await session.prompt('Say hello!');
console.log(result);
session.destroy();

// Test Summarizer API
const summarizer = await Summarizer.create();
const summary = await summarizer.summarize('Long article text here...');
console.log(summary);
summarizer.destroy();

// Test Writer API
const writer = await Writer.create();
const draft = await writer.write('Write about AI');
console.log(draft);
writer.destroy();

// Test Rewriter API
const rewriter = await Rewriter.create();
const rewritten = await rewriter.rewrite('Make this more formal');
console.log(rewritten);
rewriter.destroy();

// Test Language Detector API
const detector = await LanguageDetector.create();
const detection = await detector.detect('Bonjour le monde');
console.log(detection); // Should detect French
detector.destroy();

// Test Translator API
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});
const translated = await translator.translate('Hello world');
console.log(translated); // Should output "Hola mundo"
translator.destroy();
```

You should see responses from Gemini Nano for each API!

## Troubleshooting

### "API is not defined" error (e.g., "Summarizer is not defined")

- Corresponding flag is not enabled properly
- Chrome wasn't restarted after enabling flags
- Chrome version is too old
- API not yet available in your Chrome version

**Solution:** Double-check flags, restart Chrome completely, verify version, check Chrome Status for API availability

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

1. Verify `LanguageModel` exists in page console
2. Check background service worker console for detailed errors
3. Reload the extension after enabling AI
4. Try on a different webpage

## Verification Checklist

Before using Reflexa AI with all Chrome AI APIs:

**Required (Core Functionality)**:

- [ ] Chrome version 127+ (or Canary/Dev)
- [ ] `chrome://flags/#optimization-guide-on-device-model` = Enabled BypassPerfRequirement
- [ ] `chrome://flags/#prompt-api-for-gemini-nano` = Enabled
- [ ] Chrome restarted completely
- [ ] `LanguageModel` is defined in console
- [ ] `await LanguageModel.availability()` returns "available"

**Recommended (Enhanced Features)**:

- [ ] `chrome://flags/#summarization-api-for-gemini-nano` = Enabled
- [ ] `chrome://flags/#writer-api-for-gemini-nano` = Enabled
- [ ] `chrome://flags/#rewriter-api-for-gemini-nano` = Enabled
- [ ] `Summarizer`, `Writer`, `Rewriter` are defined in console
- [ ] Each API's `availability()` returns "available"

**Optional (Multilingual Support)**:

- [ ] `chrome://flags/#language-detection-api` = Enabled
- [ ] `chrome://flags/#translation-api` = Enabled
- [ ] `LanguageDetector`, `Translator` are defined in console
- [ ] Each API's `availability()` returns "available"

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
