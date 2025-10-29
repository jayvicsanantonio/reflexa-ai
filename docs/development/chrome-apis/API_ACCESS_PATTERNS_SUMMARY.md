# Chrome Built-in AI APIs - Access Patterns Summary

## Date: January 27, 2025

## Complete API Access Reference

This document provides the definitive reference for accessing all Chrome Built-in AI APIs.

## Global APIs (Capital Letter, NOT in ai namespace)

These APIs are accessed via global objects with capital letters:

| API                       | Global Object      | Access Pattern              | Documentation                                         |
| ------------------------- | ------------------ | --------------------------- | ----------------------------------------------------- |
| **Writer API**            | `Writer`           | `Writer.create()`           | [Quick Ref](WRITER_API_QUICK_REFERENCE.md)            |
| **Rewriter API**          | `Rewriter`         | `Rewriter.create()`         | [Quick Ref](REWRITER_API_QUICK_REFERENCE.md)          |
| **Proofreader API**       | `Proofreader`      | `Proofreader.create()`      | [Corrections](PROOFREADER_API_CORRECTIONS.md)         |
| **Summarizer API**        | `Summarizer`       | `Summarizer.create()`       | [Quick Ref](SUMMARIZER_API_QUICK_REFERENCE.md)        |
| **Prompt API**            | `LanguageModel`    | `LanguageModel.create()`    | [Quick Ref](PROMPT_API_QUICK_REFERENCE.md)            |
| **Translator API**        | `Translator`       | `Translator.create()`       | [Quick Ref](TRANSLATOR_API_QUICK_REFERENCE.md)        |
| **Language Detector API** | `LanguageDetector` | `LanguageDetector.create()` | [Quick Ref](LANGUAGE_DETECTOR_API_QUICK_REFERENCE.md) |

### Example Usage

```typescript
// ✅ CORRECT - Global objects
if (typeof Writer !== 'undefined') {
  const writer = await Writer.create({ tone: 'casual' });
  const result = await writer.write('Write something');
  writer.destroy();
}

if (typeof Rewriter !== 'undefined') {
  const rewriter = await Rewriter.create({ tone: 'more-formal' });
  const result = await rewriter.rewrite('Make this formal');
  rewriter.destroy();
}

if (typeof Proofreader !== 'undefined') {
  const proofreader = await Proofreader.create();
  const result = await proofreader.proofread('Fix this text');
  proofreader.destroy();
}

if (typeof LanguageModel !== 'undefined') {
  const session = await LanguageModel.create();
  const result = await session.prompt('Summarize this');
  session.destroy();
}

if (typeof Translator !== 'undefined') {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });
  const result = await translator.translate('Hello');
  translator.destroy();
}

if (typeof LanguageDetector !== 'undefined') {
  const detector = await LanguageDetector.create();
  const results = await detector.detect('Hello, world!');
  // results is an array of {detectedLanguage, confidence}
  console.log(results[0].detectedLanguage, results[0].confidence);
  detector.destroy();
}

if (typeof Summarizer !== 'undefined') {
  const summarizer = await Summarizer.create({
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
  });
  const result = await summarizer.summarize('Summarize this text');
  summarizer.destroy();
}
```

## Common Mistakes to Avoid

### ❌ WRONG Patterns

```typescript
// ❌ WRONG - These don't exist (all APIs are global)
await ai.writer.create();
await ai.rewriter.create();
await ai.proofreader.create();
await ai.summarizer.create();
await ai.languageModel.create();
await ai.translator.create();
await ai.languageDetector.create();

// ❌ WRONG - Lowercase global objects
await writer.create();
await rewriter.create();
await proofreader.create();
await summarizer.create();
await languageModel.create();
await translator.create();
await languageDetector.create();

// ❌ WRONG - Window prefix
await window.Writer.create();
await window.ai.writer.create();
```

## Feature Detection

### Global APIs

```typescript
// Check if API exists
const hasWriter = 'Writer' in self;
const hasRewriter = 'Rewriter' in self;
const hasProofreader = 'Proofreader' in self;
const hasSummarizer = 'Summarizer' in self;
const hasLanguageModel = 'LanguageModel' in self;
const hasTranslator = 'Translator' in self;
const hasLanguageDetector = 'LanguageDetector' in self;

// Check availability
if (typeof Writer !== 'undefined') {
  const status = await Writer.availability();
  // 'available' | 'downloadable' | 'downloading' | 'unavailable'
}
```

## Type Definitions

```typescript
// Global API declarations
declare global {
  var Writer: AIWriterFactory | undefined;
  var Rewriter: AIRewriterFactory | undefined;
  var Proofreader: AIProofreaderFactory | undefined;
  var Summarizer: AISummarizerFactory | undefined;
  var LanguageModel: AILanguageModelFactory | undefined;
  var Translator: AITranslatorFactory | undefined;
  var LanguageDetector: AILanguageDetectorFactory | undefined;
}
```

## Capability Detection Implementation

```typescript
// src/background/capabilityDetector.ts

private checkAPIAvailability(apiName: string): boolean {
  if (typeof globalThis === 'undefined') {
    return false;
  }

  // All APIs are global (capital letter)
  if (apiName === 'writer') return 'Writer' in globalThis;
  if (apiName === 'rewriter') return 'Rewriter' in globalThis;
  if (apiName === 'proofreader') return 'Proofreader' in globalThis;
  if (apiName === 'summarizer') return 'Summarizer' in globalThis;
  if (apiName === 'languageModel') return 'LanguageModel' in globalThis;
  if (apiName === 'translator') return 'Translator' in globalThis;
  if (apiName === 'languageDetector') return 'LanguageDetector' in globalThis;

  return false;
}
```

## Chrome Flags Required

### All APIs (Global)

- `#writer-api` → **Enabled**
- `#rewriter-api` → **Enabled**
- `#proofreader-api` → **Enabled**
- `#summarizer-api` → **Enabled**
- `#prompt-api-for-gemini-nano` → **Enabled**
- `#translator-api` → **Enabled**
- `#language-detector-api` → **Enabled**

### Required for All

- `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Then restart Chrome completely.

## Quick Reference Table

| API               | Namespace | Object Name        | Create Pattern                                          |
| ----------------- | --------- | ------------------ | ------------------------------------------------------- |
| Writer            | Global    | `Writer`           | `Writer.create({ tone, length })`                       |
| Rewriter          | Global    | `Rewriter`         | `Rewriter.create({ tone, length })`                     |
| Proofreader       | Global    | `Proofreader`      | `Proofreader.create()`                                  |
| Summarizer        | Global    | `Summarizer`       | `Summarizer.create({ type, length })`                   |
| Prompt            | Global    | `LanguageModel`    | `LanguageModel.create({ temperature, topK })`           |
| Translator        | Global    | `Translator`       | `Translator.create({ sourceLanguage, targetLanguage })` |
| Language Detector | Global    | `LanguageDetector` | `LanguageDetector.create()`                             |

## Testing in Console

```javascript
// Test all global APIs
console.log('Writer:', typeof Writer);
console.log('Rewriter:', typeof Rewriter);
console.log('Proofreader:', typeof Proofreader);
console.log('Summarizer:', typeof Summarizer);
console.log('LanguageModel:', typeof LanguageModel);
console.log('Translator:', typeof Translator);
console.log('LanguageDetector:', typeof LanguageDetector);
```

## References

### Official Chrome Documentation

- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Writer API](https://developer.chrome.com/docs/ai/writer-api)
- [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
- [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Translator API](https://developer.chrome.com/docs/ai/translator-api)
- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
- [Language Detector API](https://developer.chrome.com/docs/ai/language-detection)

### Internal Documentation

- [All APIs Integration Status](ALL_APIS_INTEGRATION_STATUS.md)
- [Chrome AI API Corrections Complete](CHROME_AI_API_CORRECTIONS_COMPLETE.md)

---

**Last Updated**: January 27, 2025
**Status**: ✅ Complete and Verified
**Build**: ✅ Passing
