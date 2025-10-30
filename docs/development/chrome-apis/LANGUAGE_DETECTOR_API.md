# Language Detector API - Complete Reference

**Official Documentation**: https://developer.chrome.com/docs/ai/language-detection

## Quick Reference

Detect the language of text using Chrome's built-in Language Detector API.

### Basic Usage

```typescript
// Feature detection
if ('LanguageDetector' in self) {
  // Language Detector API is supported
}

// Check availability
const status = await LanguageDetector.availability();

// Create detector
const detector = await LanguageDetector.create();

// Detect language
const results = await detector.detect('Hallo und herzlich willkommen!');

// Results is an array of {detectedLanguage, confidence}
console.log(results[0].detectedLanguage); // 'de'
console.log(results[0].confidence); // 0.9993835687637329

// Clean up
detector.destroy();
```

### Return Format

```typescript
interface LanguageDetectionResult {
  detectedLanguage: string; // ISO 639-1 language code (e.g., 'en', 'es', 'de')
  confidence: number; // 0.0 to 1.0
}
```

---

## Complete Guide

### Overview

The Chrome Language Detector API helps identify the language of text. It's powered by on-device models and runs entirely locally for privacy.

### Key Features

- **Fast Detection**: Quick language identification
- **Multiple Candidates**: Returns ranked list of possible languages
- **Confidence Scores**: Provides confidence level for each detection
- **On-Device**: All processing happens locally
- **Lightweight**: Very small model, already present in Chrome

### API Structure

#### Language Detector Factory

The Language Detector API is accessed via the global `LanguageDetector` object:

```typescript
// Feature detection
if ('LanguageDetector' in self) {
  // Language Detector API is supported
}

// Check availability
const availability = await LanguageDetector.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create a detector
const detector = await LanguageDetector.create(options);
```

#### Language Detector Session

Once created, a detector can analyze multiple texts:

```typescript
// Detect language
const results = await detector.detect(text, { signal });

// Access top result
const topResult = results[0];
console.log(topResult.detectedLanguage, topResult.confidence);

// Iterate through all candidates
for (const result of results) {
  if (result.confidence > 0.5) {
    console.log(`${result.detectedLanguage}: ${result.confidence}`);
  }
}

// Clean up
detector.destroy();
```

### Full Configuration Options

```typescript
interface LanguageDetectorCreateOptions {
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

### Basic Detection

```typescript
const detector = await LanguageDetector.create();

const text = 'Bonjour, comment allez-vous?';
const results = await detector.detect(text);

console.log(`Detected: ${results[0].detectedLanguage}`); // 'fr'
console.log(`Confidence: ${results[0].confidence}`); // 0.98

detector.destroy();
```

### Multiple Detections (Session Reuse)

```typescript
const detector = await LanguageDetector.create();

const texts = [
  'Hello, world!',
  'Hola, mundo!',
  'Bonjour, monde!',
  'Hallo, Welt!',
];

for (const text of texts) {
  const results = await detector.detect(text);
  console.log(`"${text}" → ${results[0].detectedLanguage}`);
}

detector.destroy();
```

### With Confidence Threshold

```typescript
const detector = await LanguageDetector.create();

const results = await detector.detect(text);
const topResult = results[0];

if (topResult.confidence > 0.8) {
  // High confidence, use the result
  console.log(`Detected: ${topResult.detectedLanguage}`);
} else {
  // Low confidence, treat as unknown
  console.log('Language uncertain');
}

detector.destroy();
```

### Pre-Translation Detection

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

### Content Labeling

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

### Batch Detection

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

### With Abort Signal

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  const detector = await LanguageDetector.create({
    signal: controller.signal,
  });

  const results = await detector.detect(text, {
    signal: controller.signal,
  });

  console.log(results[0].detectedLanguage);
  detector.destroy();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Detection cancelled');
  }
}
```

---

## Reflexa AI Integration

### LanguageDetectorManager Class

```typescript
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

---

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

---

## Limitations

1. **Short Text**: Very short phrases and single words have low accuracy
2. **Mixed Languages**: Detects primary language, not all languages in text
3. **Language Coverage**: Not all languages are supported
4. **Confidence Variance**: Confidence scores vary based on text length and clarity

---

## Troubleshooting

### Language Detector API Not Available

**Symptoms**: `typeof LanguageDetector === 'undefined'`

**Solutions**:

1. Check Chrome version (138+)
2. Enable flag: `chrome://flags/#language-detector-api`
3. Restart Chrome completely

### Low Confidence Scores

**Symptoms**: All confidence scores below 0.5

**Possible Reasons**:

1. Text is too short
2. Text contains mixed languages
3. Language is not well-supported

**Solutions**:

1. Use longer text samples
2. Extract single-language segments
3. Set a confidence threshold

### Incorrect Detection

**Symptoms**: Wrong language detected

**Solutions**:

1. Provide more text for better accuracy
2. Check if text is in a supported language
3. Verify text encoding is correct

---

## System Requirements

- **Chrome**: Version 138+
- **Model**: Very small (already present in Chrome)
- **Download**: Automatic on first use
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS

## Chrome Flags

Enable in `chrome://flags`:

- `#language-detector-api` → **Enabled**
- `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Then restart Chrome completely.

---

## Resources

- [Official Language Detector API Documentation](https://developer.chrome.com/docs/ai/language-detection)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [API Playground](https://chrome.dev/web-ai-demos/translation-language-detection-api-playground/)

## Related APIs

- **Translator API**: Translate text between languages
- **Prompt API**: For general-purpose AI interactions

---

**Last Updated**: October 30, 2025
**API Version**: Chrome 138+
**Status**: Origin Trial
