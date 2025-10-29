# Summarizer API Integration Corrections

## Issues Found

After reviewing the official Chrome Summarizer API documentation at https://developer.chrome.com/docs/ai/summarizer-api, several corrections are needed in `summarizerManager.ts`:

### 1. **API Access Pattern - CRITICAL**

- **Issue**: Code uses `ai.summarizer` but Summarizer is a **global API**
- **Current**: `if (typeof ai === 'undefined' || !ai?.summarizer)`
- **Correct**: `if ('Summarizer' in self)` or `if (typeof Summarizer !== 'undefined')`
- **Documentation**: "Run feature detection to see if the browser supports the Summarizer API: `if ('Summarizer' in self)`"

### 2. **Factory Method Name**

- **Issue**: Using `ai.summarizer.create()`
- **Correct**: `Summarizer.create()` (capital S, global scope)
- **Documentation**: "call the asynchronous `Summarizer.create()` function"

### 3. **Availability Check**

- **Issue**: Using `ai.summarizer.availability()`
- **Correct**: `Summarizer.availability()` (capital S, global scope)
- **Documentation**: "call the asynchronous `Summarizer.availability()` function"

### 4. **Type Values**

- **Issue**: Using `'tl;dr'` (with semicolon)
- **Correct**: `'tldr'` (no semicolon)
- **Documentation**: "allowed values `key-points` (default), `tldr`, `teaser`, and `headline`"

### 5. **Missing Language Support**

- **Issue**: Not implementing language configuration options
- **Should Add**:
  - `expectedInputLanguages: string[]`
  - `outputLanguage: string`
  - `expectedContextLanguages: string[]`
- **Documentation**: "Set the expected input, output, and context languages, when creating your session"

### 6. **Context Parameter in summarize()**

- **Issue**: Not documented in current implementation
- **Correct**: `summarize(text, { context: 'optional context' })`
- **Documentation**: "The second, optional argument is an object with a `context` field"

## Summary Type and Length Reference

From official documentation:

| Type           | Meaning                | Short      | Medium      | Long        |
| -------------- | ---------------------- | ---------- | ----------- | ----------- |
| `"tldr"`       | Quick overview         | 1 sentence | 3 sentences | 5 sentences |
| `"teaser"`     | Most interesting parts | 1 sentence | 3 sentences | 5 sentences |
| `"key-points"` | Bulleted list          | 3 bullets  | 5 bullets   | 7 bullets   |
| `"headline"`   | Article headline       | 12 words   | 17 words    | 22 words    |

## Correct Implementation Pattern

```typescript
// Feature detection
if ('Summarizer' in self) {
  // Check availability
  const availability = await Summarizer.availability();

  if (availability === 'unavailable') {
    return;
  }

  // Create session with options
  const summarizer = await Summarizer.create({
    sharedContext: 'This is a scientific article',
    type: 'key-points', // NOT 'tl;dr' - use 'tldr'
    format: 'markdown',
    length: 'medium',
    expectedInputLanguages: ['en', 'ja', 'es'],
    outputLanguage: 'es',
    expectedContextLanguages: ['en'],
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded * 100}%`);
      });
    },
  });

  // Batch summarization
  const summary = await summarizer.summarize(text, {
    context: 'Additional context',
  });

  // Streaming summarization
  const stream = summarizer.summarizeStreaming(text, {
    context: 'Additional context',
  });

  for await (const chunk of stream) {
    console.log(chunk);
  }
}
```

## Browser Support

- Chrome 138+ stable
- Not available in Web Workers
- Requires user activation for session creation

## Next Steps

1. Update `capabilityDetector.ts` to check `'Summarizer' in self` instead of `ai.summarizer`
2. Update `summarizerManager.ts` to use global `Summarizer` API
3. Fix type value from `'tl;dr'` to `'tldr'`
4. Add language configuration options
5. Update TypeScript definitions in `chrome-ai.d.ts` if needed
