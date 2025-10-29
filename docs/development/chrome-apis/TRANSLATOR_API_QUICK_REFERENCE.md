# Translator API Quick Reference

## ✅ Correct API Access

```javascript
// Global Translator object (capital T)
if ('Translator' in self) {
  // The Translator API is supported.
}
```

## ❌ Incorrect Patterns

```javascript
// These don't exist - DO NOT USE
ai.translator.create();
window.ai.translator.availability();
```

## Basic Usage

### Check Availability for Language Pair

```javascript
const status = await Translator.availability({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'
```

### Create Translator

```javascript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

### Translate Text

```javascript
const result = await translator.translate(
  'Where is the next bus stop, please?'
);
// "Où est le prochain arrêt de bus, s'il vous plaît ?"
```

### Translate with Streaming

```javascript
const stream = translator.translateStreaming(longText);
for await (const chunk of stream) {
  console.log(chunk); // chunk is already a string
}
```

### Destroy Translator

```javascript
translator.destroy();
```

## Language Codes

Use BCP 47 language short codes:

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

## TypeScript Types

```typescript
interface AITranslatorFactory {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AITranslator>;

  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
}

interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

declare global {
  var Translator: AITranslatorFactory | undefined;
}
```

## Common Patterns

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
    throw new Error(`Translation not supported for ${from} -> ${to}`);
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

### With Abort Signal

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
  signal: controller.signal,
});

const result = await translator.translate('Hello', {
  signal: controller.signal,
});
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

## Chrome Flags

Required flag in `chrome://flags`:

1. `#translator-api` → **Enabled**

Then restart Chrome completely.

## Resources

- [Official Translator API Documentation](https://developer.chrome.com/docs/ai/translator-api)
- [Language Detector API](https://developer.chrome.com/docs/ai/language-detection)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Demo Playground](https://chrome.dev/web-ai-demos/translation-language-detection-api-playground/)
