# Prompt API Quick Reference

## ✅ Correct API Access

```javascript
// Global LanguageModel object (capital L)
LanguageModel.availability()
LanguageModel.params()
LanguageModel.create({...})
```

## ❌ Incorrect Patterns

```javascript
// These don't exist - DO NOT USE
ai.languageModel.availability();
window.ai.languageModel.create();
chrome.ai.languageModel.prompt();
```

## Basic Usage

### Check Availability

```javascript
const status = await LanguageModel.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'
```

### Get Model Parameters

```javascript
const params = await LanguageModel.params();
// Returns: {defaultTopK: 3, maxTopK: 128, defaultTemperature: 1, maxTemperature: 2}
```

### Create Session

```javascript
const session = await LanguageModel.create({
  temperature: 0.7,
  topK: 40,
  initialPrompts: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi! How can I help?' },
  ],
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
  signal: abortController.signal,
});
```

### Prompt (Non-Streaming)

```javascript
const result = await session.prompt('Summarize this article...');
console.log(result); // String response
```

### Prompt (Streaming)

```javascript
const stream = session.promptStreaming('Write a long story...');

// Method 1: for await
for await (const chunk of stream) {
  console.log(chunk); // chunk is already a string
}

// Method 2: ReadableStream
const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(value); // value is already a string
}
```

### Clone Session

```javascript
const clonedSession = await session.clone({
  signal: abortController.signal,
});
```

### Destroy Session

```javascript
session.destroy();
```

## Advanced Features

### With JSON Schema (Structured Output)

```javascript
const schema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
  },
  required: ['summary', 'sentiment'],
};

const result = await session.prompt('Analyze this text...', {
  responseConstraint: schema,
});

const parsed = JSON.parse(result);
console.log(parsed.summary, parsed.sentiment);
```

### With Abort Signal

```javascript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

const result = await session.prompt('Long task...', {
  signal: controller.signal,
});
```

### Track Token Usage

```javascript
console.log(`${session.inputUsage}/${session.inputQuota} tokens used`);

// Check if near limit
if (session.inputUsage > session.inputQuota * 0.8) {
  console.warn('Context window nearly full');
  const newSession = await session.clone();
  session.destroy();
  session = newSession;
}
```

### Append Messages

```javascript
await session.append([
  {
    role: 'user',
    content: 'Additional context...',
  },
]);
```

### Response Prefix

```javascript
const result = await session.prompt([
  {
    role: 'user',
    content: 'Generate a JSON object',
  },
  {
    role: 'assistant',
    content: '{\n  "',
    prefix: true, // Model continues from here
  },
]);
```

## TypeScript Types

```typescript
interface AILanguageModelFactory {
  create(options?: {
    temperature?: number;
    topK?: number;
    initialPrompts?: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
      prefix?: boolean;
    }>;
    expectedInputs?: Array<{
      type: 'text' | 'image' | 'audio';
      languages?: string[];
    }>;
    expectedOutputs?: Array<{
      type: 'text';
      languages?: string[];
    }>;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
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
  prompt(
    input:
      | string
      | Array<{
          role: 'user' | 'assistant';
          content:
            | string
            | Array<{
                type: 'text' | 'image' | 'audio';
                value: string | File | Blob;
              }>;
          prefix?: boolean;
        }>,
    options?: {
      signal?: AbortSignal;
      responseConstraint?: JSONSchema;
      omitResponseConstraintInput?: boolean;
    }
  ): Promise<string>;

  promptStreaming(input: string): ReadableStream<string>;

  append(
    messages: Array<{
      role: 'user' | 'assistant';
      content:
        | string
        | Array<{
            type: 'text' | 'image' | 'audio';
            value: string | File | Blob;
          }>;
    }>
  ): Promise<void>;

  clone(options?: { signal?: AbortSignal }): Promise<AILanguageModel>;

  destroy(): void;

  readonly inputUsage: number;
  readonly inputQuota: number;
  readonly maxTokens: number;
  readonly tokensSoFar: number;
  readonly tokensLeft: number;
  readonly topK: number;
  readonly temperature: number;
}
```

## Common Patterns

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

## Chrome Flags

Required flags in `chrome://flags`:

1. `#prompt-api-for-gemini-nano` → **Enabled**
2. `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Then restart Chrome completely.

## Resources

- [Official Documentation](https://developer.chrome.com/docs/ai/prompt-api)
- [Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in)
- [Structured Output Guide](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api)
- [Session Management](https://developer.chrome.com/docs/ai/session-management)
