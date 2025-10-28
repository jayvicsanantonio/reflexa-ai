# API Corrections Summary

## Correct API Usage

According to the official Chrome documentation (https://developer.chrome.com/docs/ai/prompt-api), the Prompt API is accessed via a **global `LanguageModel` object**, NOT through `ai.languageModel`.

### ✅ What's Correct

The Chrome Prompt API is accessed through the global `LanguageModel` object (capital L).

## Corrected API Usage

### ✅ Correct (According to Official Chrome Docs)

```typescript
// Check availability
const availability = await LanguageModel.availability();

// Get parameters (capabilities)
const params = await LanguageModel.params();

// Create session
const session = await LanguageModel.create({
  temperature: params.defaultTemperature,
  topK: params.defaultTopK,
  initialPrompts: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello' },
  ],
});

// Prompt
const result = await session.prompt('Summarize this...');

// Stream (returns ReadableStream<string>)
const stream = session.promptStreaming('Write a poem...');
for await (const chunk of stream) {
  console.log(chunk); // chunk is already a string
}

// Cleanup
session.destroy();
```

### ❌ Incorrect Patterns

```typescript
// WRONG - ai.languageModel doesn't exist
await ai.languageModel.availability();
await ai.languageModel.create();

// WRONG - window.ai.languageModel pattern
await window.ai.languageModel.availability();
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
