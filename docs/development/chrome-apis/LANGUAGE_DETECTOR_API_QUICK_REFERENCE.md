# Language Detector API - Quick Reference

**Status**: ✅ Corrected and Verified
**Last Updated**: October 28, 2025
**Chrome Version**: 138+

## Critical Information

⚠️ **IMPORTANT**: Language Detector API is accessed as a **global object**, NOT through the `ai` namespace!

```typescript
// ✅ CORRECT
const detector = await LanguageDetector.create();

// ❌ WRONG
const detector = await ai.languageDetector.create();
```

## Feature Detection

```typescript
// Check if API exists
if ('LanguageDetector' in self) {
  // API is available
}

// Check availability status
const status = await LanguageDetector.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'
```

## Basic Usage

```typescript
// Create detector instance
const detector = await LanguageDetector.create();

// Detect language
const text = 'Hallo und herzlich willkommen!';
const results = await detector.detect(text);

// Results is an array of {detectedLanguage, confidence}
for (const result of results) {
  console.log(result.detectedLanguage, result.confidence);
}
// Output: de 0.9993835687637329

// Clean up
detector.destroy();
```

## With Download Progress Monitoring

```typescript
const detector = await LanguageDetector.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

## API Reference

### LanguageDetector.create()

```typescript
interface CreateOptions {
  monitor?: (monitor: {
    addEventListener: (
      event: string,
      callback: (e: { loaded: number; total: number }) => void
    ) => void;
  }) => void;
  signal?: AbortSignal;
}

await LanguageDetector.create(options?: CreateOptions): Promise<AILanguageDetector>
```

### detector.detect()

```typescript
interface DetectOptions {
  signal?: AbortSignal;
}

await detector.detect(
  input: string,
  options?: DetectOptions
): Promise<LanguageDetectionResult[]>
```

### LanguageDetectionResult

```typescript
interface LanguageDetectionResult {
  detectedLanguage: string; // ISO 639-1 language code (e.g., 'en', 'es', 'de')
  confidence: number; // 0.0 to 1.0
}
```

## Return Format

The `detect()` method returns an **array** of results, ranked from most likely to least likely:

```typescript
const results = await detector.detect('Hello, world!');

// results[0] is the most confident result
console.log(results[0].detectedLanguage); // 'en'
console.log(results[0].confidence); // 0.9995

// You can iterate through all candidates
for (const result of results) {
  if (result.confidence > 0.8) {
    console.log(`${result.detectedLanguage}: ${result.confidence}`);
  }
}
```

## Best Practices

### 1. Use Sufficient Text

```typescript
// ❌ BAD - Too short, low accuracy
const results = await detector.detect('Hi');

// ✅ GOOD - Longer text, better accuracy
const results = await detector.detect(
  'Hello, how are you doing today? I hope everything is going well.'
);
```

### 2. Check Confidence Threshold

```typescript
const results = await detector.detect(text);
const topResult = results[0];

if (topResult.confidence > 0.8) {
  // High confidence, use the result
  console.log(`Detected: ${topResult.detectedLanguage}`);
} else {
  // Low confidence, treat as unknown
  console.log('Language uncertain');
}
```

### 3. Reuse Detector Instance

```typescript
// ✅ GOOD - Create once, use multiple times
const detector = await LanguageDetector.create();

const lang1 = await detector.detect(text1);
const lang2 = await detector.detect(text2);
const lang3 = await detector.detect(text3);

detector.destroy();

// ❌ BAD - Creating new instance each time
for (const text of texts) {
  const detector = await LanguageDetector.create();
  await detector.detect(text);
  detector.destroy();
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  const detector = await LanguageDetector.create();
  const results = await detector.detect(text);

  if (results.length === 0) {
    console.log('No language detected');
  } else {
    console.log(`Detected: ${results[0].detectedLanguage}`);
  }

  detector.destroy();
} catch (error) {
  console.error('Language detection failed:', error);
  // Fallback to default language or manual selection
}
```

## Common Use Cases

### 1. Pre-Translation Detection

```typescript
async function translateText(text: string, targetLang: string) {
  const detector = await LanguageDetector.create();
  const results = await detector.detect(text);
  const sourceLang = results[0].detectedLanguage;

  detector.destroy();

  if (sourceLang === targetLang) {
    return text; // Already in target language
  }

  const translator = await Translator.create({
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
  });

  const translated = await translator.translate(text);
  translator.destroy();

  return translated;
}
```

### 2. Content Labeling

```typescript
async function labelContent(content: string) {
  const detector = await LanguageDetector.create();
  const results = await detector.detect(content);

  detector.destroy();

  return {
    content,
    language: results[0].detectedLanguage,
    confidence: results[0].confidence,
    alternatives: results.slice(1, 3), // Top 2 alternatives
  };
}
```

### 3. Multi-Language Detection

```typescript
async function detectMultipleLanguages(texts: string[]) {
  const detector = await LanguageDetector.create();
  const detections = [];

  for (const text of texts) {
    const results = await detector.detect(text);
    detections.push({
      text,
      language: results[0].detectedLanguage,
      confidence: results[0].confidence,
    });
  }

  detector.destroy();
  return detections;
}
```

## Integration with Reflexa AI

```typescript
// src/background/languageDetectorManager.ts
import type {
  AILanguageDetector,
  AILanguageDetectorFactory,
  LanguageDetectionResult,
} from '../types/chrome-ai';

export class LanguageDetectorManager {
  private detector: AILanguageDetector | null = null;

  async checkAvailability(): Promise<boolean> {
    const LanguageDetector = (
      globalThis as typeof globalThis & {
        LanguageDetector?: AILanguageDetectorFactory;
      }
    ).LanguageDetector;

    if (!LanguageDetector) {
      return false;
    }

    const status = await LanguageDetector.availability();
    return status === 'available' || status === 'downloadable';
  }

  private async getDetector(): Promise<AILanguageDetector | null> {
    if (this.detector) {
      return this.detector;
    }

    const LanguageDetector = (
      globalThis as typeof globalThis & {
        LanguageDetector?: AILanguageDetectorFactory;
      }
    ).LanguageDetector;

    if (!LanguageDetector) {
      return null;
    }

    this.detector = await LanguageDetector.create();
    return this.detector;
  }

  async detect(text: string): Promise<LanguageDetectionResult[]> {
    const detector = await this.getDetector();
    if (!detector) {
      throw new Error('Language Detector API not available');
    }

    return await detector.detect(text);
  }

  destroy(): void {
    if (this.detector) {
      this.detector.destroy();
      this.detector = null;
    }
  }
}
```

## Chrome Flags

Enable in `chrome://flags`:

- `#language-detector-api` → **Enabled**
- `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Then restart Chrome completely.

## System Requirements

- **Chrome**: Version 138+
- **Model**: Very small (already present in Chrome for other features)
- **Download**: Automatic on first use

## Limitations

1. **Short Text**: Very short phrases and single words have low accuracy
2. **Mixed Languages**: Detects primary language, not all languages in text
3. **Language Coverage**: Not all languages are supported (check Chrome 132+ for language availability)
4. **Confidence Variance**: Confidence scores vary based on text length and clarity

## TypeScript Types

```typescript
// Global declaration
declare global {
  var LanguageDetector: AILanguageDetectorFactory | undefined;
}

// Factory interface
interface AILanguageDetectorFactory {
  create(options?: {
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AILanguageDetector>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}

// Detector interface
interface AILanguageDetector {
  detect(
    input: string,
    options?: { signal?: AbortSignal }
  ): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

// Result interface
interface LanguageDetectionResult {
  detectedLanguage: string; // ISO 639-1 code
  confidence: number; // 0.0 to 1.0
}
```

## Official Documentation

- [Language Detector API](https://developer.chrome.com/docs/ai/language-detection)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [API Playground](https://chrome.dev/web-ai-demos/translation-language-detection-api-playground/)

## Related Documentation

- [Language Detector API Corrections](LANGUAGE_DETECTOR_API_CORRECTIONS.md)
- [Translator API Quick Reference](TRANSLATOR_API_QUICK_REFERENCE.md)
- [API Access Patterns Summary](API_ACCESS_PATTERNS_SUMMARY.md)
- [All APIs Integration Status](ALL_APIS_INTEGRATION_STATUS.md)

---

**Status**: ✅ Production Ready
**Build**: ✅ Passing
**Last Updated**: October 28, 2025
