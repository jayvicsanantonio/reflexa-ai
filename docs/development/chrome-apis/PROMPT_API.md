# Prompt API - Complete Reference

**Official Documentation**: https://developer.chrome.com/docs/ai/prompt-api

## Quick Reference

General-purpose AI interactions using Chrome's built-in Prompt API (LanguageModel) powered by Gemini Nano.

### Basic Usage

```typescript
// Feature detection
if ('LanguageModel' in self) {
  // Prompt API is supported
}

// Check availability
const status = await LanguageModel.availability();

// Get model parameters
const params = await LanguageModel.params();
// {defaultTopK: 3, maxTopK: 128, defaultTemperature: 1, maxTemperature: 2}

// Create session
const session = await LanguageModel.create({
  temperature: 0.7,
  topK: 40,
});

// Prompt (non-streaming)
const result = await session.prompt('Summarize this article...');
console.log(result);

// Prompt (streaming)
const stream = session.promptStreaming('Write a long story...');
for await (const chunk of stream) {
  console.log(chunk);
}

// Clean up
session.destroy();
```

### Configuration Options

```typescript
interface LanguageModelCreateOptions {
  temperature?: number; // 0.0 to 2.0 (default: 1.0)
  topK?: number; // 1 to 128 (default: 3)
  initialPrompts?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    prefix?: boolean;
  }>;
  signal?: AbortSignal;
}
```

---

## Complete Guide

### Overview

The Chrome Prompt API (LanguageModel) provides general-purpose AI interactions. It's powered by Gemini Nano and runs entirely on-device for privacy.

### Key Features

- **General Purpose**: Flexible AI interactions for any task
- **Streaming Support**: Progressive responses for long outputs
- **Session Management**: Maintain conversation context
- **Structured Output**: JSON schema support for structured responses
- **Token Tracking**: Monitor context window usage
- **Session Cloning**: Duplicate sessions with context

### API Structure

#### LanguageModel Factory

The Prompt API is accessed via the global `LanguageModel` object:

```typescript
// Feature detection
if ('LanguageModel' in self) {
  // Prompt API is supported
}

// Check availability
const availability = await LanguageModel.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Get model parameters
const params = await LanguageModel.params();
// {defaultTopK, maxTopK, defaultTemperature, maxTemperature}

// Create a session
const session = await LanguageModel.create(options);
```

#### LanguageModel Session

Once created, a session can handle multiple prompts:

```typescript
// Non-streaming prompt
const result = await session.prompt(input, options);

// Streaming prompt
const stream = session.promptStreaming(input);
for await (const chunk of stream) {
  console.log(chunk);
}

// Append messages to context
await session.append(messages);

// Clone session with same context
const clonedSession = await session.clone();

// Track token usage
console.log(`${session.inputUsage}/${session.inputQuota} tokens used`);

// Clean up
session.destroy();
```

### Full Configuration Options

```typescript
interface LanguageModelCreateOptions {
  // Sampling temperature (0.0 = deterministic, 2.0 = creative)
  temperature?: number; // default: 1.0

  // Top-K sampling (lower = more focused)
  topK?: number; // default: 3

  // Initial conversation context
  initialPrompts?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    prefix?: boolean; // For response prefixing
  }>;

  // Expected input types (for multimodal)
  expectedInputs?: Array<{
    type: 'text' | 'image' | 'audio';
    languages?: string[];
  }>;

  // Expected output types
  expectedOutputs?: Array<{
    type: 'text';
    languages?: string[];
  }>;

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

### Basic Prompting

```typescript
const session = await LanguageModel.create();

const result = await session.prompt('What are the benefits of reading?');
console.log(result);

session.destroy();
```

### With Initial Context

```typescript
const session = await LanguageModel.create({
  temperature: 0.7,
  topK: 40,
  initialPrompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant that provides concise answers.',
    },
    {
      role: 'user',
      content: 'Hello!',
    },
    {
      role: 'assistant',
      content: 'Hi! How can I help you today?',
    },
  ],
});

const result = await session.prompt('Tell me about mindfulness');
console.log(result);

session.destroy();
```

### Streaming Response

```typescript
const session = await LanguageModel.create({
  temperature: 0.8,
});

const stream = session.promptStreaming('Write a short story about AI');

let fullResponse = '';
for await (const chunk of stream) {
  fullResponse += chunk;
  updateUI(fullResponse); // Progressive update
}

session.destroy();
```

### Structured Output (JSON Schema)

```typescript
const session = await LanguageModel.create();

const schema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
    keyPoints: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['summary', 'sentiment', 'keyPoints'],
};

const result = await session.prompt('Analyze this article: ...', {
  responseConstraint: schema,
});

const parsed = JSON.parse(result);
console.log(parsed.summary);
console.log(parsed.sentiment);
console.log(parsed.keyPoints);

session.destroy();
```

### Session Cloning

```typescript
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You are a helpful assistant.' }],
});

// Have a conversation
await session.prompt('What is AI?');
await session.prompt('Tell me more about machine learning');

// Clone session to branch conversation
const clonedSession = await session.clone();

// Original session continues one way
await session.prompt('What about deep learning?');

// Cloned session goes another way
await clonedSession.prompt('What about natural language processing?');

session.destroy();
clonedSession.destroy();
```

### Token Usage Tracking

```typescript
const session = await LanguageModel.create();

console.log(`Tokens used: ${session.inputUsage}/${session.inputQuota}`);

await session.prompt('First question');
console.log(`After first: ${session.inputUsage}/${session.inputQuota}`);

await session.prompt('Second question');
console.log(`After second: ${session.inputUsage}/${session.inputQuota}`);

// Check if near limit
if (session.inputUsage > session.inputQuota * 0.8) {
  console.warn('Context window nearly full');
  // Clone session to reset context
  const newSession = await session.clone();
  session.destroy();
  session = newSession;
}

session.destroy();
```

### Appending Messages

```typescript
const session = await LanguageModel.create();

// Add context without prompting
await session.append([
  {
    role: 'user',
    content: 'Here is some background information...',
  },
  {
    role: 'assistant',
    content: 'Thank you for the context.',
  },
]);

// Now prompt with that context
const result = await session.prompt(
  'Based on that information, what do you think?'
);

session.destroy();
```

### Response Prefix

```typescript
const session = await LanguageModel.create();

const result = await session.prompt([
  {
    role: 'user',
    content: 'Generate a JSON object with name and age',
  },
  {
    role: 'assistant',
    content: '{\n  "', // Model continues from here
    prefix: true,
  },
]);

console.log('{\n  "' + result); // Complete JSON

session.destroy();
```

### With Abort Signal

```typescript
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  const session = await LanguageModel.create({
    signal: controller.signal,
  });

  const result = await session.prompt('Long task...', {
    signal: controller.signal,
  });

  console.log(result);
  session.destroy();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled');
  }
}
```

---

## Reflexa AI Integration

### Session Management

```typescript
class SessionManager {
  private session: AILanguageModel | null = null;
  private createdAt: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async getSession(): Promise<AILanguageModel> {
    const now = Date.now();

    if (this.session && now - this.createdAt < this.TTL) {
      return this.session;
    }

    if (this.session) {
      this.session.destroy();
    }

    this.session = await LanguageModel.create();
    this.createdAt = now;
    return this.session;
  }

  destroy() {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
  }
}
```

### Retry Logic

```typescript
async function promptWithRetry(
  session: AILanguageModel,
  text: string,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await session.prompt(text);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`Retry ${i + 1}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Progressive Enhancement

```typescript
async function summarize(text: string): Promise<string> {
  // Check if Prompt API is available
  if (typeof LanguageModel === 'undefined') {
    return fallbackSummarize(text);
  }

  const status = await LanguageModel.availability();
  if (status === 'unavailable') {
    return fallbackSummarize(text);
  }

  // Use Prompt API
  const session = await LanguageModel.create();
  const result = await session.prompt(`Summarize: ${text}`);
  session.destroy();
  return result;
}

function fallbackSummarize(text: string): string {
  // Manual summarization logic
  return text.slice(0, 200) + '...';
}
```

---

## Best Practices

### 1. Check Availability First

```typescript
const availability = await LanguageModel.availability();

if (availability === 'unavailable') {
  // Fall back to alternative
  return;
}

if (availability === 'downloadable') {
  // Inform user that model needs to be downloaded
  showDownloadNotice();
}
```

### 2. Reuse Sessions

```typescript
// ✅ GOOD - Create once, use multiple times
const session = await LanguageModel.create();

const result1 = await session.prompt('Question 1');
const result2 = await session.prompt('Question 2');
const result3 = await session.prompt('Question 3');

session.destroy();
```

### 3. Monitor Token Usage

```typescript
// Check before prompting
if (session.inputUsage > session.inputQuota * 0.9) {
  // Context window almost full, clone to reset
  const newSession = await session.clone();
  session.destroy();
  session = newSession;
}
```

### 4. Use Streaming for Long Outputs

```typescript
// For better UX with long responses
const stream = session.promptStreaming('Write a detailed explanation...');
for await (const chunk of stream) {
  updateUI(chunk);
}
```

### 5. Handle Errors Gracefully

```typescript
try {
  const result = await session.prompt(text);
  return result;
} catch (error) {
  console.error('Prompt failed:', error);
  // Fall back to alternative or show error
  return fallbackResponse(text);
}
```

---

## Troubleshooting

### Prompt API Not Available

**Symptoms**: `typeof LanguageModel === 'undefined'`

**Solutions**:

1. Check Chrome version (137+)
2. Enable flags:
   - `chrome://flags/#prompt-api-for-gemini-nano`
   - `chrome://flags/#optimization-guide-on-device-model`
3. Restart Chrome completely

### Context Window Full

**Symptoms**: Error about token limit exceeded

**Solutions**:

1. Clone session to reset context
2. Use shorter prompts
3. Summarize previous context before continuing

### Slow Responses

**Symptoms**: Takes too long to respond

**Solutions**:

1. Use streaming for better UX
2. Reduce temperature for faster responses
3. Use shorter prompts
4. Check system resources

---

## System Requirements

- **Chrome**: Version 137+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free space
- **GPU**: >4GB VRAM OR CPU: 16GB RAM + 4 cores
- **Network**: Unmetered connection for model download

## Chrome Flags

Enable in `chrome://flags`:

- `#prompt-api-for-gemini-nano` → **Enabled**
- `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Then restart Chrome completely.

---

## Resources

- [Official Prompt API Documentation](https://developer.chrome.com/docs/ai/prompt-api)
- [Structured Output Guide](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api)
- [Session Management](https://developer.chrome.com/docs/ai/session-management)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)

## Related APIs

- **Writer API**: For generating new content with tone control
- **Rewriter API**: For improving existing text
- **Summarizer API**: For content summarization

---

**Last Updated**: October 30, 2025
**API Version**: Chrome 137+
**Status**: Origin Trial
