# Rewriter API Integration Guide

## Overview

The Chrome Rewriter API helps revise and restructure existing text while preserving meaning. It's powered by Gemini Nano and runs entirely on-device for privacy.

**Official Documentation**: https://developer.chrome.com/docs/ai/rewriter-api

## Key Features

- **Tone Control**: Adjust text to be more formal, more casual, or keep as-is
- **Length Control**: Make text shorter, longer, or keep as-is
- **Format Control**: Output as plain text, markdown, or keep as-is
- **Context Support**: Provide shared context and per-request context
- **Streaming**: Get progressive updates as text is rewritten
- **Session Reuse**: Cache and reuse sessions for better performance
- **Language Support**: Specify expected input/output languages

## API Structure

### Rewriter Factory

The Rewriter API is accessed via the global `Rewriter` object:

```typescript
// Feature detection
if ('Rewriter' in self) {
  // Rewriter API is supported
}

// Check availability
const availability = await Rewriter.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create a rewriter session
const rewriter = await Rewriter.create(options);
```

### Rewriter Session

Once created, a rewriter session can rewrite multiple pieces of text:

```typescript
// Non-streaming (waits for complete response)
const result = await rewriter.rewrite(text, { context });

// Streaming (progressive updates)
const stream = rewriter.rewriteStreaming(text, { context });
for await (const chunk of stream) {
  console.log(chunk);
}

// Clean up
rewriter.destroy();
```

## Configuration Options

### Session Creation Options

```typescript
interface RewriterCreateOptions {
  // Shared context used for all rewrite operations in this session
  sharedContext?: string;

  // Writing tone
  tone?: 'as-is' | 'more-formal' | 'more-casual'; // default: 'as-is'

  // Output format
  format?: 'as-is' | 'markdown' | 'plain-text'; // default: 'as-is'

  // Output length
  length?: 'as-is' | 'shorter' | 'longer'; // default: 'as-is'

  // Expected input languages (ISO 639-1 codes)
  expectedInputLanguages?: string[]; // e.g., ['en', 'es', 'ja']

  // Expected context languages
  expectedContextLanguages?: string[];

  // Output language
  outputLanguage?: string; // e.g., 'en'

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

### Rewrite Method Options

```typescript
interface RewriteOptions {
  // Per-request context (in addition to sharedContext)
  context?: string;

  // Abort signal
  signal?: AbortSignal;
}
```

## Reflexa AI Implementation

### RewriterManager Class

Located in `src/background/rewriterManager.ts`, this class wraps the Rewriter API with:

- Availability checking
- Session caching and reuse
- Timeout handling with retry logic
- Tone mapping (Reflexa tones → Rewriter API tones)
- Streaming support
- Error handling

### Tone Mapping

Reflexa uses custom tone names that map to Rewriter API tones:

| Reflexa Tone | Rewriter API Tone |
| ------------ | ----------------- |
| `calm`       | `as-is`           |
| `concise`    | `as-is` + shorter |
| `empathetic` | `more-casual`     |
| `academic`   | `more-formal`     |

### Tone Options

The Rewriter API provides three tone options:

| Tone          | Description                                |
| ------------- | ------------------------------------------ |
| `as-is`       | Keep the original tone (default)           |
| `more-formal` | Make text more professional and structured |
| `more-casual` | Make text more conversational and relaxed  |

### Length Options

| Length    | Description                       |
| --------- | --------------------------------- |
| `as-is`   | Keep original length (default)    |
| `shorter` | Condense while preserving meaning |
| `longer`  | Expand with more detail           |

## Usage Examples

### Basic Usage

```typescript
import { RewriterManager } from './background/rewriterManager';

const rewriterManager = new RewriterManager();

// Check availability
const available = await rewriterManager.checkAvailability();

if (available) {
  // Rewrite text
  const { original, rewritten } = await rewriterManager.rewrite(
    'hey whats up, can u help me with this?',
    'academic',
    'This is for a formal email to a professor'
  );

  console.log('Original:', original);
  console.log('Rewritten:', rewritten);
}
```

### Streaming Rewriting

```typescript
let progressiveText = '';

const { original, rewritten } = await rewriterManager.rewriteStreaming(
  'This article was really cool and I learned a lot from it.',
  'academic',
  'Rewriting for a research paper',
  (chunk) => {
    progressiveText += chunk;
    // Update UI with progressive text
    updateTextDisplay(progressiveText);
  }
);

console.log('Complete rewritten text:', rewritten);
```

### With Language Support

```typescript
// Create a multilingual rewriter
const rewriter = await Rewriter.create({
  tone: 'more-formal',
  expectedInputLanguages: ['en', 'ja', 'es'],
  expectedContextLanguages: ['en', 'ja', 'es'],
  outputLanguage: 'es',
  sharedContext: 'Rewriting messages for a Spanish language program.',
});

const result = await rewriter.rewrite('Thanks for your help!', {
  context: 'Message to a teacher',
});

rewriter.destroy();
```

### Session Reuse for Multiple Texts

```typescript
// Create a rewriter for multiple reviews
const rewriter = await Rewriter.create({
  tone: 'more-casual',
  format: 'plain-text',
  sharedContext: 'Customer reviews for a product.',
});

// Rewrite multiple reviews
const reviews = [
  'This product exceeded my expectations.',
  'I am thoroughly satisfied with this purchase.',
  'The quality is exceptional.',
];

const rewrittenReviews = await Promise.all(
  reviews.map((review) =>
    rewriter.rewrite(review, {
      context: 'Make it sound more conversational',
    })
  )
);

// Clean up when done
rewriter.destroy();
```

### With Abort Signal

```typescript
const controller = new AbortController();

// Set timeout
setTimeout(() => controller.abort(), 5000);

try {
  const rewriter = await Rewriter.create({
    tone: 'more-formal',
    signal: controller.signal,
  });

  const result = await rewriter.rewrite('Text to rewrite', {
    signal: controller.signal,
  });

  console.log(result);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation timed out');
  }
}
```

### Different Tone and Length Combinations

```typescript
const text = 'I think this is a really good idea and we should do it.';

// Make more formal and shorter
const rewriter1 = await Rewriter.create({
  tone: 'more-formal',
  length: 'shorter',
});
const formal = await rewriter1.rewrite(text);
// Result: "This proposal merits implementation."

// Make more casual and longer
const rewriter2 = await Rewriter.create({
  tone: 'more-casual',
  length: 'longer',
});
const casual = await rewriter2.rewrite(text);
// Result: "Hey, I really think this is an awesome idea and we should totally go ahead and do it!"

rewriter1.destroy();
rewriter2.destroy();
```

## Best Practices

### 1. Check Availability First

```typescript
const availability = await Rewriter.availability();

if (availability === 'unavailable') {
  // Fall back to manual editing or alternative method
  return;
}

if (availability === 'downloadable') {
  // Inform user that model needs to be downloaded
  showDownloadNotice();
}
```

### 2. Use Shared Context for Related Tasks

```typescript
// Good: Shared context for multiple related rewrites
const rewriter = await Rewriter.create({
  sharedContext: 'Rewriting customer feedback to be more constructive.',
});

const feedback1 = await rewriter.rewrite('This product is terrible');
const feedback2 = await rewriter.rewrite('Waste of money');
```

### 3. Cache and Reuse Sessions

```typescript
// RewriterManager automatically caches sessions by configuration
const result1 = await rewriterManager.rewrite('Text 1', 'academic');

// Reuses the same session (same tone)
const result2 = await rewriterManager.rewrite('Text 2', 'academic');
```

### 4. Handle Timeouts and Errors

```typescript
try {
  const result = await rewriterManager.rewrite(text, tone, context);
  return result;
} catch (error) {
  if (error.message.includes('timeout')) {
    // Retry with longer timeout or fall back
    console.warn('Rewriter timed out, using original text');
    return { original: text, rewritten: text };
  }
  throw error;
}
```

### 5. Use Streaming for Long Content

```typescript
// For better UX, use streaming for longer content
if (text.length > 500) {
  return await rewriterManager.rewriteStreaming(text, tone, context, onChunk);
} else {
  return await rewriterManager.rewrite(text, tone, context);
}
```

### 6. Clean Up Sessions

```typescript
// Clean up when component unmounts or is no longer needed
useEffect(() => {
  return () => {
    rewriterManager.destroy();
  };
}, []);
```

## Integration with Reflexa AI

### Use Case: Improve User Reflections

```typescript
async function improveReflection(userText: string, targetTone: string) {
  const rewriterManager = new RewriterManager();

  const available = await rewriterManager.checkAvailability();
  if (!available) {
    return null;
  }

  const context = 'This is a personal reflection on an article read.';

  const { rewritten } = await rewriterManager.rewrite(
    userText,
    targetTone as TonePreset,
    context
  );

  return rewritten;
}
```

### Use Case: Adjust Tone for Different Audiences

```typescript
async function adjustForAudience(
  text: string,
  audience: 'academic' | 'casual' | 'professional'
) {
  const toneMap = {
    academic: 'more-formal',
    casual: 'more-casual',
    professional: 'as-is',
  };

  const rewriter = await Rewriter.create({
    tone: toneMap[audience],
    format: 'plain-text',
  });

  const result = await rewriter.rewrite(text);
  rewriter.destroy();

  return result;
}
```

### Use Case: Condense Long Text

```typescript
async function condenseText(longText: string) {
  const rewriter = await Rewriter.create({
    tone: 'as-is',
    length: 'shorter',
    sharedContext: 'Condense while preserving key information.',
  });

  const result = await rewriter.rewrite(longText);
  rewriter.destroy();

  return result;
}
```

## Troubleshooting

### Rewriter API Not Available

**Symptoms**: `availability()` returns `'unavailable'`

**Solutions**:

1. Check Chrome version (137+)
2. Enable flag: `chrome://flags/#rewriter-api-for-gemini-nano`
3. Ensure sufficient storage (22GB free)
4. Check system requirements (GPU/CPU)
5. Restart Chrome completely

### Slow Rewriting

**Symptoms**: Takes >5 seconds to rewrite

**Solutions**:

1. Use shorter length setting
2. Reduce context size
3. Implement streaming for better UX
4. Check system resources (CPU/GPU usage)

### Output Doesn't Match Expected Tone

**Symptoms**: Rewritten text doesn't reflect chosen tone

**Solutions**:

1. Provide more specific context
2. Use `sharedContext` to set expectations
3. Add per-request `context` for guidance
4. Try different tone combinations

### Session Creation Fails

**Symptoms**: `create()` throws error

**Solutions**:

1. Check if model is downloading
2. Verify language codes are valid (ISO 639-1)
3. Ensure language combination is supported
4. Check for conflicting options

## Performance Considerations

### Session Caching

RewriterManager caches sessions by configuration key:

```
Key format: "{tone}-{format}-{length}"
Example: "more-formal-plain-text-as-is"
```

This means:

- Same configuration = reused session (fast)
- Different configuration = new session (slower first time)

### Timeout Strategy

RewriterManager implements a two-tier timeout:

1. **First attempt**: 5 seconds
2. **Retry**: 8 seconds

This balances responsiveness with reliability.

### Memory Management

- Sessions are kept in memory until `destroy()` is called
- Call `destroy()` when manager is no longer needed
- Individual sessions can be destroyed with `destroySession()`

## Testing

### Manual Testing

1. Open Chrome DevTools console
2. Check availability:
   ```javascript
   await Rewriter.availability();
   ```
3. Create and test:
   ```javascript
   const rewriter = await Rewriter.create({ tone: 'more-casual' });
   const result = await rewriter.rewrite('I am writing to inquire about...');
   console.log(result);
   rewriter.destroy();
   ```

### Automated Testing

```typescript
describe('RewriterManager', () => {
  let rewriterManager: RewriterManager;

  beforeEach(() => {
    rewriterManager = new RewriterManager();
  });

  afterEach(() => {
    rewriterManager.destroy();
  });

  it('should check availability', async () => {
    const available = await rewriterManager.checkAvailability();
    expect(typeof available).toBe('boolean');
  });

  it('should rewrite text with correct options', async () => {
    const result = await rewriterManager.rewrite(
      'Test text',
      'academic',
      'Test context'
    );

    expect(result).toHaveProperty('original');
    expect(result).toHaveProperty('rewritten');
    expect(typeof result.rewritten).toBe('string');
  });
});
```

## Comparison: Writer vs Rewriter

| Feature        | Writer API              | Rewriter API                    |
| -------------- | ----------------------- | ------------------------------- |
| Purpose        | Generate new content    | Improve existing content        |
| Input          | Prompt/topic            | Existing text                   |
| Tone Options   | formal, neutral, casual | as-is, more-formal, more-casual |
| Length Options | short, medium, long     | as-is, shorter, longer          |
| Use Case       | Draft creation          | Text refinement                 |

## Resources

- [Official Rewriter API Documentation](https://developer.chrome.com/docs/ai/rewriter-api)
- [Writing Assistance APIs Explainer](https://github.com/explainers-by-googlers/writing-assistance-apis/)
- [Chrome AI Built-in APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Gemini Nano Model Information](https://deepmind.google/technologies/gemini/nano/)

## Related APIs

- **Writer API**: For generating new content
- **Proofreader API**: For grammar and spelling corrections
- **Prompt API**: For general-purpose AI interactions
- **Summarizer API**: For content summarization

---

**Last Updated**: October 28, 2025
**API Version**: Chrome 137+
**Status**: Origin Trial
