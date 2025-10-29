# Language Detector API Integration Corrections

## Summary

Fixed the Language Detector API integration to match the official Chrome documentation at https://developer.chrome.com/docs/ai/language-detection

## Key Issues Found and Fixed

### 1. **Incorrect API Access Pattern** ❌ → ✅

**Issue**: The code was trying to access the Language Detector API through `ai.languageDetector`, but according to the official documentation, **LanguageDetector is a global object**, not part of the `ai` namespace.

**Before**:

```typescript
if (typeof ai === 'undefined' || !ai?.languageDetector) {
  console.warn('Language Detector API not available');
  return null;
}
this.detector = await ai.languageDetector.create();
```

**After**:

```typescript
const LanguageDetector = (
  globalThis as typeof globalThis & {
    LanguageDetector?: AILanguageDetectorFactory;
  }
).LanguageDetector;

if (!LanguageDetector) {
  console.warn('Language Detector API not available');
  return null;
}
this.detector = await LanguageDetector.create();
```

### 2. **Incorrect Availability Check** ❌ → ✅

**Issue**: The availability check was using the capability detector instead of calling the actual `LanguageDetector.availability()` method.

**Before**:

```typescript
const capabilities = await Promise.resolve(
  capabilityDetector.getCapabilities()
);
this.available = Boolean(capabilities.languageDetector);
```

**After**:

```typescript
const LanguageDetector = (
  globalThis as typeof globalThis & {
    LanguageDetector?: AILanguageDetectorFactory;
  }
).LanguageDetector;

if (!LanguageDetector) {
  this.available = false;
  return false;
}

const status = await LanguageDetector.availability();
this.available = status === 'available' || status === 'downloadable';
```

### 3. **Type Definitions Updated** ✅

**Issue**: The TypeScript type definitions incorrectly placed `languageDetector` under the `ai` namespace.

**Before**:

```typescript
interface ChromeAI {
  summarizer?: AISummarizerFactory;
  languageDetector?: AILanguageDetectorFactory;
}
```

**After**:

```typescript
interface ChromeAI {
  summarizer?: AISummarizerFactory;
}

declare global {
  interface Window {
    ai?: ChromeAI;
    LanguageDetector?: AILanguageDetectorFactory;
  }

  var LanguageDetector: AILanguageDetectorFactory | undefined;
}
```

### 4. **Added Monitor Support** ✅

**Issue**: The type definition for `AILanguageDetectorFactory.create()` was missing the `monitor` option for tracking download progress.

**Added**:

```typescript
export interface AILanguageDetectorFactory {
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
```

### 5. **Capability Detector Updated** ✅

**Issue**: The capability detector was checking for `languageDetector` under the `ai` namespace.

**Before**:

```typescript
// For other APIs (summarizer, languageDetector), check through ai object
const ai = (globalThis as typeof globalThis & { ai?: Record<string, unknown> })
  .ai;

if (!ai) {
  return false;
}

return apiName in ai;
```

**After**:

```typescript
// LanguageDetector is also a global (not under ai namespace)
if (apiName === 'languageDetector') {
  return 'LanguageDetector' in globalThis;
}

// For other APIs (summarizer), check through ai object
const ai = (globalThis as typeof globalThis & { ai?: Record<string, unknown> })
  .ai;

if (!ai) {
  return false;
}

return apiName in ai;
```

## Official Documentation Reference

According to the Chrome documentation:

1. **Feature Detection**:

   ```javascript
   if ('LanguageDetector' in self) {
     // The Language Detector API is available.
   }
   ```

2. **Availability Check**:

   ```javascript
   const status = await LanguageDetector.availability();
   ```

3. **Creating Detector**:

   ```javascript
   const detector = await LanguageDetector.create({
     monitor(m) {
       m.addEventListener('downloadprogress', (e) => {
         console.log(`Downloaded ${e.loaded * 100}%`);
       });
     },
   });
   ```

4. **Detecting Language**:
   ```javascript
   const results = await detector.detect(someUserText);
   for (const result of results) {
     console.log(result.detectedLanguage, result.confidence);
   }
   ```

## API Access Pattern Summary

| API                  | Access Pattern         | Namespace  |
| -------------------- | ---------------------- | ---------- |
| Summarizer           | `ai.summarizer`        | Under `ai` |
| Writer               | `Writer`               | Global     |
| Rewriter             | `Rewriter`             | Global     |
| Proofreader          | `Proofreader`          | Global     |
| LanguageModel        | `LanguageModel`        | Global     |
| Translator           | `Translator`           | Global     |
| **LanguageDetector** | **`LanguageDetector`** | **Global** |

## Files Modified

1. `src/background/languageDetectorManager.ts` - Fixed API access and availability check
2. `src/background/capabilityDetector.ts` - Updated to check LanguageDetector as global
3. `src/types/chrome-ai.d.ts` - Moved LanguageDetector to global scope, added monitor option

## Testing Recommendations

1. Test feature detection: `'LanguageDetector' in self`
2. Test availability check: `await LanguageDetector.availability()`
3. Test detector creation with monitor for download progress
4. Test language detection with various text samples
5. Verify confidence scores are between 0.0 and 1.0
6. Test with short text (should have low confidence)
7. Test caching behavior

## Status

✅ **COMPLETE** - Language Detector API integration now matches official Chrome documentation
