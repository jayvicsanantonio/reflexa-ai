# Proofreader API Integration Corrections

## Summary

Fixed critical issues in the Proofreader API integration based on the official Chrome documentation at https://developer.chrome.com/docs/ai/proofreader-api

## Key Issues Fixed

### 1. API Access Method

**Problem**: Code was accessing the API via `ai.proofreader`
**Solution**: The Proofreader API is accessed via the global `Proofreader` object (capital P), not through `ai.proofreader`

```typescript
// ❌ WRONG
if (typeof ai === 'undefined' || !ai?.proofreader) {
  return null;
}
const session = await ai.proofreader.create();

// ✅ CORRECT
const ProofreaderAPI = (
  globalThis as typeof globalThis & {
    Proofreader?: AIProofreaderFactory;
  }
).Proofreader;

if (!ProofreaderAPI) {
  return null;
}
const session = await ProofreaderAPI.create();
```

### 2. Return Type

**Problem**: Code expected `proofread()` to return a plain string
**Solution**: The API returns a `ProofreadResult` object with:

- `correction` (string) - the fully corrected text
- `corrections` (array) - list of corrections with `startIndex` and `endIndex`

```typescript
// ❌ WRONG
const correctedText: string = await session.proofread(text);

// ✅ CORRECT
const result: ProofreadResult = await session.proofread(text);
// result.correction contains the corrected text
// result.corrections contains the array of corrections
```

### 3. Configuration Options

**Problem**: Code used `sharedContext` option
**Solution**: The Proofreader API uses `expectedInputLanguages` option

```typescript
// ❌ WRONG
await Proofreader.create({
  sharedContext: 'some context',
});

// ✅ CORRECT
await Proofreader.create({
  expectedInputLanguages: ['en'],
});
```

### 4. Capability Detection

**Problem**: Code checked for `languageDetector` when checking proofreader availability
**Solution**: Check for the global `Proofreader` object

```typescript
// ❌ WRONG
const proofreader = this.checkAPIAvailability('languageDetector');

// ✅ CORRECT
const proofreader = this.checkAPIAvailability('proofreader');
```

### 5. Type Definitions

**Problem**: Type definitions didn't match the actual API
**Solution**: Updated type definitions to match Chrome's implementation

```typescript
export interface ProofreadResult {
  correction: string; // Fully corrected text
  corrections: Array<{
    startIndex: number;
    endIndex: number;
  }>;
}

export interface AIProofreader {
  proofread(
    input: string,
    options?: { signal?: AbortSignal }
  ): Promise<ProofreadResult>;
  destroy(): void;
}

export interface AIProofreaderFactory {
  create(options?: {
    expectedInputLanguages?: string[];
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AIProofreader>;
  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;
}
```

## Files Modified

1. **src/background/proofreaderManager.ts**
   - Changed API access from `ai.proofreader` to global `Proofreader`
   - Updated to handle `ProofreadResult` object instead of string
   - Changed configuration to use `expectedInputLanguages`
   - Removed manual diff calculation and change categorization (API doesn't provide this)
   - Added type assertions for global access

2. **src/background/capabilityDetector.ts**
   - Fixed proofreader detection to check for global `Proofreader` object
   - Removed incorrect mapping to `languageDetector`

3. **src/types/chrome-ai.d.ts**
   - Added `ProofreadResult` interface matching Chrome API
   - Updated `AIProofreader` interface to return `ProofreadResult`
   - Updated `AIProofreaderFactory` to use `expectedInputLanguages`
   - Removed `proofreader` from `ChromeAI` interface (it's a global, not in `ai` namespace)
   - Added `Proofreader` to global declarations

4. **src/types/index.ts**
   - Updated `ProofreadResult` to match application needs
   - Added note about Chrome API not providing type categorization

## Important Notes

### API Limitations

According to the documentation:

- `includeCorrectionTypes` and `includeCorrectionExplanation` options are NOT supported yet
- The API only provides `startIndex` and `endIndex` for corrections, not the type (grammar/spelling/clarity)
- No streaming support for proofreading (unlike Writer/Rewriter APIs)

### Global Access Pattern

The Proofreader API follows the same pattern as Writer and Rewriter:

- Accessed via global object (e.g., `Proofreader`, `Writer`, `Rewriter`)
- NOT accessed through `ai` namespace
- Requires origin trial or flag enablement

### Example Usage

```typescript
// Check availability
const status = await Proofreader.availability();

if (status === 'available' || status === 'downloadable') {
  // Create session
  const proofreader = await Proofreader.create({
    expectedInputLanguages: ['en'],
  });

  // Proofread text
  const result = await proofreader.proofread(
    'I seen him yesterday at the store.'
  );

  console.log(result.correction); // "I saw him yesterday at the store."
  console.log(result.corrections); // [{ startIndex: 2, endIndex: 6 }]

  // Clean up
  proofreader.destroy();
}
```

## Testing Recommendations

1. Test with Chrome 141+ with origin trial token or flag enabled
2. Verify `Proofreader` global is available before use
3. Handle cases where API is unavailable gracefully
4. Test with various input languages
5. Verify correction indices match expected positions

## References

- Official Documentation: https://developer.chrome.com/docs/ai/proofreader-api
- Explainer: https://github.com/explainers-by-googlers/proofreader-api
- Chrome Status: https://chromestatus.com/feature/5164677291835392
