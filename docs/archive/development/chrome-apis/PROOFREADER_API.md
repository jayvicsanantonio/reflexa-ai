# Proofreader API - Complete Reference

**Official Documentation**: https://developer.chrome.com/docs/ai/proofreader-api

## Quick Reference

Fix grammar, spelling, and punctuation errors using Chrome's built-in Proofreader API powered by Gemini Nano.

### Basic Usage

```typescript
// Feature detection
if ('Proofreader' in self) {
  // Proofreader API is supported
}

// Check availability
const status = await Proofreader.availability();

// Create session
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en'],
});

// Proofread text
const result = await proofreader.proofread('I seen him yesterday.');

console.log(result.correction); // "I saw him yesterday."
console.log(result.corrections); // [{ startIndex: 2, endIndex: 6 }]

// Clean up
proofreader.destroy();
```

### Return Type

```typescript
interface ProofreadResult {
  correction: string; // Fully corrected text
  corrections: Array<{
    startIndex: number; // Start position of correction
    endIndex: number; // End position of correction
  }>;
}
```

### Configuration Options

```typescript
interface ProofreaderCreateOptions {
  // Expected input languages (ISO 639-1 codes)
  expectedInputLanguages?: string[]; // e.g., ['en', 'es']

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

## Complete Guide

### Overview

The Chrome Proofreader API helps fix grammar, spelling, and punctuation errors in text. It's powered by Gemini Nano and runs entirely on-device for privacy.

### Key Features

- **Grammar Correction**: Fixes grammatical errors
- **Spelling Correction**: Corrects misspelled words
- **Punctuation**: Fixes punctuation issues
- **Language Support**: Specify expected input languages
- **Correction Tracking**: Returns indices of all corrections made
- **On-Device**: All processing happens locally

### API Structure

#### Proofreader Factory

The Proofreader API is accessed via the global `Proofreader` object:

```typescript
// Feature detection
if ('Proofreader' in self) {
  // Proofreader API is supported
}

// Check availability
const availability = await Proofreader.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create a proofreader session
const proofreader = await Proofreader.create(options);
```

#### Proofreader Session

Once created, a proofreader session can proofread multiple pieces of text:

```typescript
// Proofread text
const result = await proofreader.proofread(text, { signal });

// Access corrected text
console.log(result.correction);

// Access correction positions
result.corrections.forEach((correction) => {
  console.log(`Correction at ${correction.startIndex}-${correction.endIndex}`);
});

// Clean up
proofreader.destroy();
```

---

## Usage Examples

### Basic Proofreading

```typescript
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en'],
});

const result = await proofreader.proofread(
  'I seen him yesterday at the store.'
);

console.log(result.correction);
// "I saw him yesterday at the store."

console.log(result.corrections);
// [{ startIndex: 2, endIndex: 6 }]

proofreader.destroy();
```

### Multiple Proofreading Operations

```typescript
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en'],
});

const texts = [
  'She dont like apples.',
  'Their going to the store.',
  'I could of done better.',
];

const results = await Promise.all(
  texts.map((text) => proofreader.proofread(text))
);

results.forEach((result, index) => {
  console.log(`Original: ${texts[index]}`);
  console.log(`Corrected: ${result.correction}`);
  console.log(`Corrections: ${result.corrections.length}`);
});

proofreader.destroy();
```

### With Abort Signal

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  const proofreader = await Proofreader.create({
    expectedInputLanguages: ['en'],
    signal: controller.signal,
  });

  const result = await proofreader.proofread('Text to proofread', {
    signal: controller.signal,
  });

  console.log(result.correction);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation timed out');
  }
}
```

### Multilingual Support

```typescript
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en', 'es', 'fr'],
});

const englishResult = await proofreader.proofread('I seen him yesterday');
const spanishResult = await proofreader.proofread('Yo visto él ayer');

console.log(englishResult.correction);
console.log(spanishResult.correction);

proofreader.destroy();
```

---

## Reflexa AI Integration

### ProofreaderManager Class

Located in `src/background/proofreaderManager.ts`, this class wraps the Proofreader API with:

- Availability checking
- Session caching and reuse
- Timeout handling
- Error handling
- Type-safe result handling

### Use Case: Proofread User Reflections

```typescript
async function proofreadReflection(userText: string) {
  const proofreaderManager = new ProofreaderManager();

  const available = await proofreaderManager.checkAvailability();
  if (!available) {
    return null;
  }

  const result = await proofreaderManager.proofread(userText);

  return {
    correctedText: result.correction,
    correctionCount: result.corrections.length,
  };
}
```

---

## API Corrections Applied

### 1. API Access Method

**Before (Incorrect)**:

```typescript
const session = await ai.proofreader.create();
```

**After (Correct)**:

```typescript
const session = await Proofreader.create();
```

### 2. Return Type

**Before (Incorrect)**:

```typescript
const correctedText: string = await session.proofread(text);
```

**After (Correct)**:

```typescript
const result: ProofreadResult = await session.proofread(text);
// result.correction contains the corrected text
// result.corrections contains the array of corrections
```

### 3. Configuration Options

**Before (Incorrect)**:

```typescript
await Proofreader.create({
  sharedContext: 'some context',
});
```

**After (Correct)**:

```typescript
await Proofreader.create({
  expectedInputLanguages: ['en'],
});
```

### 4. Capability Detection

**Before (Incorrect)**:

```typescript
if ('proofreader' in ai) {
}
```

**After (Correct)**:

```typescript
if ('Proofreader' in self) {
}
```

---

## Best Practices

### 1. Check Availability First

```typescript
const availability = await Proofreader.availability();

if (availability === 'unavailable') {
  // Fall back to manual proofreading or alternative
  return;
}

if (availability === 'downloadable') {
  // Inform user that model needs to be downloaded
  showDownloadNotice();
}
```

### 2. Reuse Sessions

```typescript
// Create once, use multiple times
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en'],
});

const result1 = await proofreader.proofread(text1);
const result2 = await proofreader.proofread(text2);
const result3 = await proofreader.proofread(text3);

// Clean up when done
proofreader.destroy();
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await proofreader.proofread(text);
  return result.correction;
} catch (error) {
  console.error('Proofreading failed:', error);
  // Return original text if proofreading fails
  return text;
}
```

### 4. Specify Expected Languages

```typescript
// Better: Specify expected languages for better accuracy
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en', 'es'],
});
```

---

## API Limitations

According to the official documentation:

- **No correction types**: The API doesn't categorize corrections (grammar/spelling/clarity)
- **No explanations**: No explanations provided for why corrections were made
- **No streaming**: Unlike Writer/Rewriter, proofreading doesn't support streaming
- **Limited options**: `includeCorrectionTypes` and `includeCorrectionExplanation` are NOT supported yet

---

## Troubleshooting

### Proofreader API Not Available

**Symptoms**: `availability()` returns `'unavailable'`

**Solutions**:

1. Check Chrome version (141+)
2. Enable flag: `chrome://flags/#proofreader-api-for-gemini-nano`
3. Ensure sufficient storage (22GB free)
4. Check system requirements (GPU/CPU)
5. Restart Chrome completely

### No Corrections Returned

**Symptoms**: `corrections` array is empty

**Possible Reasons**:

1. Text has no errors
2. Language not in `expectedInputLanguages`
3. API couldn't detect errors in the text

### Incorrect Corrections

**Symptoms**: Corrections don't match expectations

**Solutions**:

1. Ensure correct language is specified
2. Verify input text encoding
3. Check if text is in a supported language

---

## System Requirements

- **Chrome**: Version 141+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free space
- **GPU**: >4GB VRAM OR CPU: 16GB RAM + 4 cores
- **Network**: Unmetered connection for model download

## Chrome Flags

Enable in `chrome://flags`:

- `#proofreader-api-for-gemini-nano`
- `#optimization-guide-on-device-model`

Then restart Chrome completely.

---

## Testing

### Manual Testing

1. Open Chrome DevTools console
2. Check availability:
   ```javascript
   await Proofreader.availability();
   ```
3. Create and test:
   ```javascript
   const proofreader = await Proofreader.create({
     expectedInputLanguages: ['en'],
   });
   const result = await proofreader.proofread('I seen him yesterday');
   console.log(result.correction);
   console.log(result.corrections);
   proofreader.destroy();
   ```

### Automated Testing

```typescript
describe('ProofreaderManager', () => {
  let proofreaderManager: ProofreaderManager();

  beforeEach(() => {
    proofreaderManager = new ProofreaderManager();
  });

  afterEach(() => {
    proofreaderManager.destroy();
  });

  it('should check availability', async () => {
    const available = await proofreaderManager.checkAvailability();
    expect(typeof available).toBe('boolean');
  });

  it('should proofread text', async () => {
    const result = await proofreaderManager.proofread('I seen him');

    expect(result).toHaveProperty('correction');
    expect(result).toHaveProperty('corrections');
    expect(Array.isArray(result.corrections)).toBe(true);
  });
});
```

---

## Resources

- [Official Proofreader API Documentation](https://developer.chrome.com/docs/ai/proofreader-api)
- [Proofreader API Explainer](https://github.com/explainers-by-googlers/proofreader-api)
- [Chrome AI Built-in APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Chrome Status](https://chromestatus.com/feature/5164677291835392)

## Related APIs

- **Writer API**: For generating new content
- **Rewriter API**: For improving existing text
- **Prompt API**: For general-purpose AI interactions

---

**Last Updated**: October 30, 2025
**API Version**: Chrome 141+
**Status**: Origin Trial
