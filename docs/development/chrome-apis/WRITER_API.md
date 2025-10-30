# Writer API - Complete Reference

**Official Documentation**: https://developer.chrome.com/docs/ai/writer-api

## Quick Reference

Generate new content with tone and length control using Chrome's built-in Writer API powered by Gemini Nano.

### Basic Usage

```typescript
// Feature detection
if ('Writer' in self) {
  // Writer API is supported
}

// Check availability
const available = await Writer.availability();

// Create session
const writer = await Writer.create({
  tone: 'neutral',
  format: 'markdown',
  length: 'medium',
});

// Generate text
const result = await writer.write('Write about mindfulness');

// Clean up
writer.destroy();
```

### Configuration Options

#### Tone

| Value     | Description                    |
| --------- | ------------------------------ |
| `formal`  | Professional, structured style |
| `neutral` | Balanced, standard style       |
| `casual`  | Conversational, relaxed style  |

#### Format

| Value        | Description                   |
| ------------ | ----------------------------- |
| `markdown`   | Markdown formatting (default) |
| `plain-text` | Plain text, no formatting     |

#### Length

| Value    | Approximate Words |
| -------- | ----------------- |
| `short`  | 50-100            |
| `medium` | 100-200           |
| `long`   | 200-300           |

### Reflexa AI Tone Mapping

| Reflexa Tone   | Writer API Tone |
| -------------- | --------------- |
| `calm`         | `neutral`       |
| `professional` | `formal`        |
| `casual`       | `casual`        |

---

## Complete Guide

### Overview

The Chrome Writer API helps create new content that conforms to a specified writing task. It's powered by Gemini Nano and runs entirely on-device for privacy.

### Key Features

- **Tone Control**: Generate text in formal, neutral, or casual tones
- **Length Control**: Specify short, medium, or long output
- **Context Support**: Provide shared context and per-request context
- **Streaming**: Get progressive updates as text generates
- **Session Reuse**: Cache and reuse sessions for better performance
- **Language Support**: Specify expected input/output languages

### API Structure

#### Writer Factory

The Writer API is accessed via the global `Writer` object:

```typescript
// Feature detection
if ('Writer' in self) {
  // Writer API is supported
}

// Check availability
const availability = await Writer.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create a writer session
const writer = await Writer.create(options);
```

#### Writer Session

Once created, a writer session can generate multiple pieces of content:

```typescript
// Non-streaming (waits for complete response)
const result = await writer.write(prompt, { context });

// Streaming (progressive updates)
const stream = writer.writeStreaming(prompt, { context });
for await (const chunk of stream) {
  console.log(chunk);
}

// Clean up
writer.destroy();
```

### Full Configuration Options

#### Session Creation Options

```typescript
interface WriterCreateOptions {
  // Shared context used for all write operations in this session
  sharedContext?: string;

  // Writing tone
  tone?: 'formal' | 'neutral' | 'casual'; // default: 'neutral'

  // Output format
  format?: 'plain-text' | 'markdown'; // default: 'markdown'

  // Output length
  length?: 'short' | 'medium' | 'long'; // default: 'medium'

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

#### Write Method Options

```typescript
interface WriteOptions {
  // Per-request context (in addition to sharedContext)
  context?: string;

  // Abort signal
  signal?: AbortSignal;
}
```

---

## Usage Examples

### Basic Generation

```typescript
import { WriterManager } from './background/writerManager';

const writerManager = new WriterManager();

// Check availability
const available = await writerManager.checkAvailability();

if (available) {
  // Generate text
  const draft = await writerManager.generate(
    'Write about the benefits of mindful reading',
    {
      tone: 'calm',
      length: 'medium',
    },
    'This is for a reflection journal'
  );

  console.log(draft);
}
```

### Streaming Generation

```typescript
let progressiveText = '';

const fullText = await writerManager.generateStreaming(
  'Write a motivational message about learning',
  {
    tone: 'professional',
    length: 'short',
  },
  undefined,
  (chunk) => {
    progressiveText += chunk;
    // Update UI with progressive text
    updateTextDisplay(progressiveText);
  }
);

console.log('Complete text:', fullText);
```

### With Context

```typescript
const writer = await Writer.create({
  sharedContext: 'Writing reflective journal entries',
  tone: 'neutral',
});

const entry = await writer.write('Reflect on today', {
  context: 'User read an article about mindfulness',
});

writer.destroy();
```

### Multiple Generations (Session Reuse)

```typescript
// Create a writer for multiple tasks
const writer = await Writer.create({
  tone: 'casual',
  format: 'plain-text',
  length: 'short',
  sharedContext: 'These are social media posts about productivity.',
});

// Generate multiple posts
const post1 = await writer.write('Write about morning routines');
const post2 = await writer.write('Write about time management');
const post3 = await writer.write('Write about focus techniques');

// Clean up when done
writer.destroy();
```

### With Language Support

```typescript
// Create a multilingual writer
const writer = await Writer.create({
  tone: 'formal',
  expectedInputLanguages: ['en', 'es', 'ja'],
  expectedContextLanguages: ['en', 'es'],
  outputLanguage: 'es',
  sharedContext: 'These are messages for a Spanish language learning program.',
});

const message = await writer.write('Write a welcome message for new students', {
  context: 'Students may speak English or Japanese',
});

writer.destroy();
```

### With Abort Signal

```typescript
const controller = new AbortController();

// Set timeout
setTimeout(() => controller.abort(), 5000);

try {
  const writer = await Writer.create({
    tone: 'neutral',
    signal: controller.signal,
  });

  const result = await writer.write('Write about AI ethics', {
    signal: controller.signal,
  });

  console.log(result);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation timed out');
  }
}
```

---

## Reflexa AI Integration

### WriterManager Class

Located in `src/background/writerManager.ts`, this class wraps the Writer API with:

- Availability checking
- Session caching and reuse
- Timeout handling with retry logic
- Tone mapping (Reflexa tones → Writer API tones)
- Streaming support
- Error handling

### Use Case: Draft Reflection

```typescript
async function generateReflectionDraft(summary: string[]) {
  const writerManager = new WriterManager();

  const available = await writerManager.checkAvailability();
  if (!available) {
    return null;
  }

  const context = `Summary insights: ${summary.join('. ')}`;

  const draft = await writerManager.generate(
    'Write a reflective paragraph about these insights',
    {
      tone: 'calm',
      length: 'medium',
    },
    context
  );

  return draft;
}
```

### Use Case: Generate Reflection Prompts

```typescript
async function generateCustomPrompts(topic: string) {
  const writer = await Writer.create({
    tone: 'neutral',
    format: 'plain-text',
    length: 'short',
    sharedContext: 'Generate thoughtful reflection questions.',
  });

  const prompts = await Promise.all([
    writer.write(`Generate a question about applying ${topic} to daily life`),
    writer.write(`Generate a question about surprising aspects of ${topic}`),
    writer.write(`Generate a question about deeper meaning of ${topic}`),
  ]);

  writer.destroy();
  return prompts;
}
```

---

## Best Practices

### 1. Check Availability First

```typescript
const availability = await Writer.availability();

if (availability === 'unavailable') {
  // Fall back to manual input or alternative method
  return;
}

if (availability === 'downloadable') {
  // Inform user that model needs to be downloaded
  showDownloadNotice();
}
```

### 2. Use Shared Context for Related Tasks

```typescript
// Good: Shared context for multiple related generations
const writer = await Writer.create({
  sharedContext: 'Writing reflective journal entries about articles read.',
});

const entry1 = await writer.write('Reflect on article about mindfulness');
const entry2 = await writer.write('Reflect on article about productivity');
```

### 3. Cache and Reuse Sessions

```typescript
// WriterManager automatically caches sessions by configuration
const draft1 = await writerManager.generate('Topic 1', {
  tone: 'calm',
  length: 'medium',
});

// Reuses the same session (same tone + length)
const draft2 = await writerManager.generate('Topic 2', {
  tone: 'calm',
  length: 'medium',
});
```

### 4. Handle Timeouts and Errors

```typescript
try {
  const draft = await writerManager.generate(topic, options, context);
  return draft;
} catch (error) {
  if (error.message.includes('timeout')) {
    // Retry with longer timeout or fall back
    console.warn('Writer timed out, using fallback');
    return await fallbackGeneration(topic);
  }
  throw error;
}
```

### 5. Use Streaming for Long Content

```typescript
// For better UX, use streaming for longer content
if (options.length === 'long') {
  return await writerManager.generateStreaming(
    topic,
    options,
    context,
    onChunk
  );
} else {
  return await writerManager.generate(topic, options, context);
}
```

### 6. Clean Up Sessions

```typescript
// Clean up when component unmounts or is no longer needed
useEffect(() => {
  return () => {
    writerManager.destroy();
  };
}, []);
```

---

## Troubleshooting

### Writer API Not Available

**Symptoms**: `availability()` returns `'unavailable'`

**Solutions**:

1. Check Chrome version (137+)
2. Enable flag: `chrome://flags/#writer-api-for-gemini-nano`
3. Ensure sufficient storage (22GB free)
4. Check system requirements (GPU/CPU)
5. Restart Chrome completely

### Slow Generation

**Symptoms**: Takes >5 seconds to generate

**Solutions**:

1. Use shorter length setting
2. Reduce context size
3. Implement streaming for better UX
4. Check system resources (CPU/GPU usage)

### Inconsistent Output

**Symptoms**: Output doesn't match expected tone/length

**Solutions**:

1. Provide more specific prompts
2. Use `sharedContext` to set expectations
3. Add per-request `context` for guidance
4. Experiment with different tone settings

### Session Creation Fails

**Symptoms**: `create()` throws error

**Solutions**:

1. Check if model is downloading
2. Verify language codes are valid (ISO 639-1)
3. Ensure language combination is supported
4. Check for conflicting options

---

## Performance Considerations

### Session Caching

WriterManager caches sessions by configuration key:

```
Key format: "{tone}-{format}-{length}"
Example: "neutral-plain-text-medium"
```

This means:

- Same configuration = reused session (fast)
- Different configuration = new session (slower first time)

### Timeout Strategy

WriterManager implements a two-tier timeout:

1. **First attempt**: 5 seconds
2. **Retry**: 8 seconds

This balances responsiveness with reliability.

### Memory Management

- Sessions are kept in memory until `destroy()` is called
- Call `destroy()` when manager is no longer needed
- Individual sessions can be destroyed with `destroySession()`

---

## System Requirements

- **Chrome**: Version 137+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free space
- **GPU**: >4GB VRAM OR CPU: 16GB RAM + 4 cores
- **Network**: Unmetered connection for model download

## Chrome Flags

Enable in `chrome://flags`:

- `#writer-api-for-gemini-nano`
- `#optimization-guide-on-device-model`

Then restart Chrome completely.

---

## Testing

### Manual Testing

1. Open Chrome DevTools console
2. Check availability:
   ```javascript
   await Writer.availability();
   ```
3. Create and test:
   ```javascript
   const writer = await Writer.create({ tone: 'casual' });
   const result = await writer.write('Write a haiku about coding');
   console.log(result);
   writer.destroy();
   ```

### Automated Testing

```typescript
describe('WriterManager', () => {
  let writerManager: WriterManager;

  beforeEach(() => {
    writerManager = new WriterManager();
  });

  afterEach(() => {
    writerManager.destroy();
  });

  it('should check availability', async () => {
    const available = await writerManager.checkAvailability();
    expect(typeof available).toBe('boolean');
  });

  it('should generate text with correct options', async () => {
    const result = await writerManager.generate(
      'Test topic',
      { tone: 'calm', length: 'short' },
      'Test context'
    );

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
```

---

## Resources

- [Official Writer API Documentation](https://developer.chrome.com/docs/ai/writer-api)
- [Writing Assistance APIs Explainer](https://github.com/explainers-by-googlers/writing-assistance-apis/)
- [Chrome AI Built-in APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Gemini Nano Model Information](https://deepmind.google/technologies/gemini/nano/)

## Related APIs

- **Rewriter API**: For improving existing text
- **Proofreader API**: For grammar and spelling corrections
- **Prompt API**: For general-purpose AI interactions
- **Summarizer API**: For content summarization

---

**Last Updated**: October 30, 2025
**API Version**: Chrome 137+
**Status**: Origin Trial
