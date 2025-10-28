# API Corrections Summary

## Critical Correction: LanguageModel vs ai.languageModel

### What Was Wrong

The previous implementation incorrectly referenced `ai.languageModel` or `window.ai.languageModel`, which doesn't exist in the Chrome Prompt API.

### What's Correct

The Chrome Prompt API exposes a **global `LanguageModel` object** directly, not nested under `ai`.

## Corrected API Usage

### ✅ Correct (Current Implementation)

```typescript
// Check availability
const availability = await LanguageModel.availability();

// Get parameters
const params = await LanguageModel.params();

// Create session
const session = await LanguageModel.create({
  temperature: params.defaultTemperature,
  topK: params.defaultTopK,
  initialPrompts: [{ role: 'system', content: 'You are helpful.' }],
});

// Prompt
const result = await session.prompt('Summarize this...');

// Stream
const stream = session.promptStreaming('Write a poem...');
for await (const chunk of stream) {
  console.log(chunk);
}

// Cleanup
session.destroy();
```

### ❌ Incorrect (Old Pattern)

```typescript
// WRONG - These don't exist
await window.ai.languageModel.availability();
await ai.languageModel.create();
```

## Files Updated

1. **src/background/aiManager.ts**
   - Changed `ai.languageModel` → `LanguageModel`
   - Updated type declarations
   - Removed unused `AI` interface

2. **docs/GEMINI_NANO_INTEGRATION_FIXES.md**
   - Updated all code examples
   - Corrected type definitions

3. **docs/PROMPT_API_UPDATE_GUIDE.md**
   - Updated all API usage examples
   - Corrected implementation recommendations

## Type Definitions

```typescript
// Global LanguageModel object
declare global {
  interface Window {
    LanguageModel?: AILanguageModelFactory;
  }
  // For service worker context
  var LanguageModel: AILanguageModelFactory | undefined;
}

interface AILanguageModelFactory {
  create(options?: {
    temperature?: number;
    topK?: number;
    initialPrompts?: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    signal?: AbortSignal;
    monitor?: (monitor: AIDownloadProgressMonitor) => void;
  }): Promise<AILanguageModel>;

  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;

  params(): Promise<{
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }>;
}

interface AILanguageModel {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(input: string): ReadableStream;
  destroy(): void;
  clone(options?: { signal?: AbortSignal }): Promise<AILanguageModel>;
}
```

## Testing

To verify the API is available:

```javascript
// In Chrome DevTools console
console.log(typeof LanguageModel); // Should be "object"
console.log(LanguageModel); // Should show the API object

// Check availability
await LanguageModel.availability();
// Returns: 'available', 'downloadable', 'downloading', or 'unavailable'
```

## References

- **Official Documentation**: https://developer.chrome.com/docs/ai/prompt-api
- **GitHub Spec**: https://github.com/webmachinelearning/prompt-api
- **Chrome Status**: https://chromestatus.com/feature/5134603979063296

## Status

✅ All code updated to use correct `LanguageModel` API
✅ All documentation corrected
✅ Type definitions updated
✅ No TypeScript errors

---

**Updated**: January 27, 2025
**Verified Against**: Chrome Prompt API Documentation (Sept 21, 2025)
