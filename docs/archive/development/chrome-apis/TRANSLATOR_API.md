# Translator API - Complete Reference

**Official Documentation**: https://developer.chrome.com/docs/ai/translator-api

## Quick Reference

Translate text between languages using Chrome's built-in Translator API powered by on-device models.

### Basic Usage

```typescript
// Feature detection
if ('Translator' in self) {
  // Translator API is supported
}

// Check availability for language pair
const status = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

// Create translator
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

// Translate text
const result = await translator.translate('Hello, world!');
console.log(result); // "¡Hola, mundo!"

// Clean up
translator.destroy();
```

### Common Language Codes (BCP 47)

- `'en'` - English
- `'es'` - Spanish
- `'fr'` - French
- `'de'` - German
- `'it'` - Italian
- `'pt'` - Portuguese
- `'zh'` - Chinese
- `'ja'` - Japanese
- `'ko'` - Korean
- `'ar'` - Arabic

---

## Complete Guide

### Overview

The Chrome Translator API provides on-device translation between languages. It's powered by local models and runs entirely on-device for privacy.

### Key Features

- **On-Device Translation**: All processing happens locally
- **Multiple Language Pairs**: Supports many language combinations
- **Streaming Support**: Progressive translation for long texts
- **Download Progress**: Monitor model download progress
- **Privacy Protection**: No data sent to servers

### API Structure

#### Translator Factory

The Translator API is accessed via the global `Translator` object:

```typescript
// Feature detection
if ('Translator' in self) {
  // Translator API is supported
}

// Check availability for specific language pair
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create a translator
const translator = await Translator.create(options);
```

#### Translator Session

Once created, a translator can translate multiple texts:

```typescript
// Non-streaming translation
const result = await translator.translate(text, { signal });

// Streaming translation
const stream = translator.translateStreaming(text);
for await (const chunk of stream) {
  console.log(chunk);
}

// Clean up
translator.destroy();
```

### Full Configuration Options

```typescript
interface TranslatorCreateOptions {
  // Source language (BCP 47 code)
  sourceLanguage: string; // Required

  // Target language (BCP 47 code)
  targetLanguage: string; // Required

  // Monitor download progress
  monitor?: (monitor: {
    addEventListener: (
      event: string,
      callback: (e: { loaded: number; total: number }) => void
    ) => void;
  }) => void;

  // Abort signal
  signal?: AbortSignal;
}
```

---

## Usage Examples

### Basic Translation

```typescript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

const result = await translator.translate(
  'Where is the next bus stop, please?'
);
console.log(result);
// "¿Dónde está la próxima parada de autobús, por favor?"

translator.destroy();
```

### With Download Progress

```typescript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      const percent = (e.loaded * 100).toFixed(1);
      console.log(`Downloaded ${percent}%`);
      updateProgressBar(e.loaded);
    });
  },
});

const result = await translator.translate('Hello, how are you?');
console.log(result); // "Bonjour, comment allez-vous ?"

translator.destroy();
```

### Streaming Translation

```typescript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'de',
});

const longText = 'This is a very long text that needs to be translated...';
const stream = translator.translateStreaming(longText);

let fullTranslation = '';
for await (const chunk of stream) {
  fullTranslation += chunk;
  updateUI(fullTranslation); // Progressive update
}

translator.destroy();
```

### Multiple Translations (Session Reuse)

```typescript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'ja',
});

const phrases = ['Good morning', 'Thank you', 'You are welcome', 'Goodbye'];

const translations = await Promise.all(
  phrases.map((phrase) => translator.translate(phrase))
);

translations.forEach((translation, i) => {
  console.log(`${phrases[i]} → ${translation}`);
});

translator.destroy();
```

### Check Support Before Creating

```typescript
async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  // Check if API exists
  if (typeof Translator === 'undefined') {
    throw new Error('Translator API not available');
  }

  // Check language pair support
  const status = await Translator.availability({
    sourceLanguage: from,
    targetLanguage: to,
  });

  if (status === 'unavailable') {
    throw new Error(`Translation not supported for ${from} → ${to}`);
  }

  // Create translator
  const translator = await Translator.create({
    sourceLanguage: from,
    targetLanguage: to,
  });

  // Translate
  const result = await translator.translate(text);

  // Cleanup
  translator.destroy();

  return result;
}
```

### With Abort Signal

```typescript
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'zh',
    signal: controller.signal,
  });

  const result = await translator.translate('Long text to translate...', {
    signal: controller.signal,
  });

  console.log(result);
  translator.destroy();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Translation cancelled');
  }
}
```

---

## Reflexa AI Integration

### Session Caching

```typescript
class TranslatorCache {
  private sessions = new Map<string, AITranslator>();

  async getTranslator(from: string, to: string): Promise<AITranslator> {
    const key = `${from}-${to}`;

    if (this.sessions.has(key)) {
      return this.sessions.get(key)!;
    }

    const translator = await Translator.create({
      sourceLanguage: from,
      targetLanguage: to,
    });

    this.sessions.set(key, translator);
    return translator;
  }

  destroy() {
    for (const translator of this.sessions.values()) {
      translator.destroy();
    }
    this.sessions.clear();
  }
}
```

### Progressive Enhancement

```typescript
async function translateOrFallback(
  text: string,
  from: string,
  to: string
): Promise<string> {
  // Check if Translator API is available
  if (typeof Translator === 'undefined') {
    return fallbackTranslate(text, from, to);
  }

  const status = await Translator.availability({
    sourceLanguage: from,
    targetLanguage: to,
  });

  if (status === 'unavailable') {
    return fallbackTranslate(text, from, to);
  }

  // Use Translator API
  const translator = await Translator.create({
    sourceLanguage: from,
    targetLanguage: to,
  });

  const result = await translator.translate(text);
  translator.destroy();
  return result;
}

function fallbackTranslate(
  text: string,
  from: string,
  to: string
): Promise<string> {
  // Use cloud translation service
  return fetch('/api/translate', {
    method: 'POST',
    body: JSON.stringify({ text, from, to }),
  })
    .then((r) => r.json())
    .then((d) => d.translation);
}
```

---

## Best Practices

### 1. Check Availability First

```typescript
const status = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

if (status === 'unavailable') {
  // Language pair not supported
  showUnsupportedMessage();
  return;
}

if (status === 'downloadable') {
  // Model needs to be downloaded
  showDownloadNotice();
}
```

### 2. Reuse Translator Sessions

```typescript
// ✅ GOOD - Create once, use multiple times
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});

const result1 = await translator.translate(text1);
const result2 = await translator.translate(text2);
const result3 = await translator.translate(text3);

translator.destroy();

// ❌ BAD - Creating new instance each time
for (const text of texts) {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'fr',
  });
  await translator.translate(text);
  translator.destroy();
}
```

### 3. Use Streaming for Long Texts

```typescript
// For better UX with long texts
if (text.length > 1000) {
  const stream = translator.translateStreaming(text);
  for await (const chunk of stream) {
    updateUI(chunk);
  }
} else {
  const result = await translator.translate(text);
  updateUI(result);
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  const result = await translator.translate(text);
  return result;
} catch (error) {
  console.error('Translation failed:', error);
  // Return original text or show error
  return text;
}
```

---

## Important Notes

### Privacy Protection

The Translator API hides the download status of specific language pairs to protect user privacy. All language pairs are reported as `downloadable` until individual sites create a translator for a given pair.

### Sequential Processing

Translations are processed sequentially. If you send large amounts of text, subsequent translations are blocked until earlier ones complete. For best performance:

- Chunk text together
- Add loading indicators
- Consider using streaming for long texts

### User Activation Required

Before the model can be downloaded, there must be a user interaction (click, tap, or key press).

---

## Troubleshooting

### Translator API Not Available

**Symptoms**: `typeof Translator === 'undefined'`

**Solutions**:

1. Check Chrome version (138+)
2. Enable flag: `chrome://flags/#translator-api`
3. Restart Chrome completely

### Language Pair Not Supported

**Symptoms**: `availability()` returns `'unavailable'`

**Solutions**:

1. Verify language codes are correct (BCP 47)
2. Check if language pair is supported
3. Try alternative language pairs
4. Fall back to cloud translation service

### Slow Translation

**Symptoms**: Translation takes too long

**Solutions**:

1. Use streaming for better UX
2. Show loading indicators
3. Cache translator sessions
4. Chunk large texts

---

## System Requirements

- **Chrome**: Version 138+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: Varies by language pair
- **Network**: Required for initial model download

## Chrome Flags

Enable in `chrome://flags`:

- `#translator-api` → **Enabled**

Then restart Chrome completely.

---

## Resources

- [Official Translator API Documentation](https://developer.chrome.com/docs/ai/translator-api)
- [Language Detector API](https://developer.chrome.com/docs/ai/language-detection)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Demo Playground](https://chrome.dev/web-ai-demos/translation-language-detection-api-playground/)

## Related APIs

- **Language Detector API**: Detect language before translation
- **Prompt API**: For general-purpose AI interactions
- **Summarizer API**: For content summarization

---

**Last Updated**: October 30, 2025
**API Version**: Chrome 138+
**Status**: Origin Trial
