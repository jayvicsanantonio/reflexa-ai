# AI Service Architecture

**Last Updated**: January 2025
**Status**: ✅ Complete Implementation

## Overview

This document provides comprehensive developer documentation for Reflexa AI's Chrome AI APIs integration. The AI Service layer orchestrates all seven Chrome Built-in AI APIs with capability detection, fallback handling, and error management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AI Service Layer](#ai-service-layer)
3. [API Managers](#api-managers)
4. [Capability Detection](#capability-detection)
5. [Fallback Strategy](#fallback-strategy)
6. [Error Handling](#error-handling)
7. [Session Management](#session-management)
8. [Message Handlers](#message-handlers)
9. [Usage Examples](#usage-examples)
10. [Testing](#testing)

## Architecture Overview

### System Design

The AI Service uses a lightweight orchestration approach where individual API managers handle their own operations:

```
┌─────────────────────────────────────────────────────────┐
│                    AIService                            │
│  (Lightweight Orchestration)                            │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Capability   │  │   Manager    │  │   Manager    │ │
│  │ Detection    │  │   Access     │  │   Lifecycle  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Summarizer   │  │   Writer     │  │  Rewriter    │
│  Manager     │  │   Manager    │  │   Manager    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Proofreader  │  │  Language    │  │ Translator   │
│  Manager     │  │  Detector    │  │   Manager    │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐
│   Prompt     │
│  Manager     │
│ (Fallback)   │
└──────────────┘
```

### Key Design Principles

1. **Lightweight Orchestration**: AIService provides access to managers rather than wrapping operations
2. **Direct Manager Access**: Callers use `aiService.summarizer.summarize()` not `aiService.summarize()`
3. **Individual Responsibility**: Each manager handles timeout/retry logic, error handling, session management
4. **Capability Detection**: Centralized in `capabilityDetector` service, cached and refreshable
5. **Fallback in Handlers**: Message handlers implement fallback logic, not AIService
6. **Singleton Pattern**: Export `aiService` instance for global access

## AI Service Layer

### File Location

`src/background/services/ai/aiService.ts`

### Core Interface

```typescript
export class AIService {
  // Manager instances (public readonly)
  public readonly prompt: PromptManager;
  public readonly proofreader: ProofreaderManager;
  public readonly summarizer: SummarizerManager;
  public readonly translator: TranslatorManager;
  public readonly writer: WriterManager;
  public readonly rewriter: RewriterManager;

  // Initialization
  initialize(experimentalMode?: boolean): void;
  isInitialized(): boolean;

  // Capability management
  getCapabilities(): AICapabilities;
  refreshCapabilities(experimentalMode?: boolean): AICapabilities;
  async checkAllAvailability(): Promise<AvailabilityStatus>;

  // Cleanup
  destroyAll(): void;
}
```

### AICapabilities Interface

```typescript
interface AICapabilities {
  summarizer: boolean;
  writer: boolean;
  rewriter: boolean;
  proofreader: boolean;
  languageDetector: boolean;
  translator: boolean;
  prompt: boolean;
  experimental: boolean;
}
```

### Usage Pattern

```typescript
import { aiService } from '@/background/services/ai';

// Initialize on background worker startup
aiService.initialize();

// Check capabilities
const caps = aiService.getCapabilities();
if (caps.summarizer) {
  // Use Summarizer API
  const summary = await aiService.summarizer.summarize(text, 'bullets');
}

// Direct manager access
const draft = await aiService.writer.write({
  topic: 'reflection',
  tone: 'calm',
  length: 'short',
});

// Cleanup on shutdown
aiService.destroyAll();
```

## API Managers

Each Chrome AI API has a dedicated manager module in `src/background/services/ai/`.

### Common Patterns

All managers follow these consistent patterns:

1. **Availability Checking**
   - `checkAvailability()`: Async method using global object detection
   - `isAvailable()`: Synchronous getter for cached status

2. **Session Management**
   - `createSession()`: Private method creating and caching sessions
   - Session caching by configuration key
   - `destroy()`: Cleanup method for lifecycle management

3. **Timeout Logic**
   - 5-second initial timeout
   - 8-second retry timeout
   - `Promise.race` with AbortController

4. **Error Handling**
   - Try-catch with retry logic
   - Descriptive error messages
   - Graceful degradation

### Summarizer Manager

**File**: `src/background/services/ai/summarizerManager.ts`

**Purpose**: Generate summaries in three formats using Chrome's Summarizer API

**Key Methods**:

```typescript
class SummarizerManager {
  isAvailable(): boolean;
  async summarize(text: string, format: SummaryFormat): Promise<string[]>;
  async summarizeBullets(text: string): Promise<string[]>;
  async summarizeParagraph(text: string): Promise<string[]>;
  async summarizeHeadlineBullets(text: string): Promise<string[]>;
  destroy(): void;
  destroySession(format: SummaryFormat): void;
}

type SummaryFormat = 'bullets' | 'paragraph' | 'headline-bullets';
```

**Implementation Details**:

- Checks `globalThis.Summarizer` for availability
- Session options: `type` (key-points, tl;dr, teaser, headline), `format` (plain-text, markdown), `length` (short, medium, long)
- Session caching by `${type}-${format}-${length}` key
- Parses markdown bullets into array format
- Handles parallel session creation for headline+bullets format

**Example**:

```typescript
const manager = new SummarizerManager();
await manager.checkAvailability();

if (manager.isAvailable()) {
  const bullets = await manager.summarize(text, 'bullets');
  // Returns: ["Insight: ...", "Surprise: ...", "Apply: ..."]
}
```

### Writer Manager

**File**: `src/background/services/ai/writerManager.ts`

**Purpose**: Generate first drafts with tone and length control using Chrome's Writer API

**Key Methods**:

```typescript
class WriterManager {
  isAvailable(): boolean;
  async write(options: WriterOptions): Promise<string>;
  async generate(options: WriterGenerateOptions): Promise<string>;
  async generateStreaming(
    options: WriterGenerateOptions
  ): AsyncGenerator<string>;
  destroy(): void;
}

interface WriterOptions {
  topic: string;
  tone: 'calm' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  context?: string;
}
```

**Implementation Details**:

- Checks `globalThis.Writer` for availability
- Tone mapping: calm→neutral, professional→formal, casual→casual
- Length ranges: short=50-100 words, medium=100-200, long=200-300
- Session caching by `${tone}-${format}-${length}` key
- Streaming support with `for await...of` iteration
- Context support via `sharedContext` parameter

**Example**:

```typescript
const manager = new WriterManager();
await manager.checkAvailability();

if (manager.isAvailable()) {
  const draft = await manager.write({
    topic: 'reflection on article',
    tone: 'calm',
    length: 'short',
    context: 'Summary: ...',
  });
}
```

### Rewriter Manager

**File**: `src/background/services/ai/rewriterManager.ts`

**Purpose**: Adjust tone and style of existing text using Chrome's Rewriter API

**Key Methods**:

```typescript
class RewriterManager {
  isAvailable(): boolean;
  async rewrite(text: string, options: RewriteOptions): Promise<RewriteResult>;
  async rewriteStreaming(
    text: string,
    options: RewriteOptions
  ): AsyncGenerator<string>;
  destroy(): void;
}

interface RewriteOptions {
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  length?: 'as-is' | 'shorter' | 'longer';
  context?: string;
}

interface RewriteResult {
  original: string;
  rewritten: string;
}
```

**Implementation Details**:

- Checks `globalThis.Rewriter` for availability
- Tone preset mapping: calm→as-is, concise→shorter, empathetic→more-casual, academic→more-formal
- Session caching by `${tone}-${format}-${length}` key
- Returns object with both original and rewritten text for comparison
- Streaming support with `for await...of`
- Preserves paragraph structure and formatting

**Example**:

```typescript
const manager = new RewriterManager();
await manager.checkAvailability();

if (manager.isAvailable()) {
  const result = await manager.rewrite(text, {
    tone: 'more-formal',
    length: 'as-is',
  });
  console.log('Original:', result.original);
  console.log('Rewritten:', result.rewritten);
}
```

### Proofreader Manager

**File**: `src/background/services/ai/proofreaderManager.ts`

**Purpose**: Fix grammar and improve clarity using Chrome's Proofreader API

**Key Methods**:

```typescript
class ProofreaderManager {
  isAvailable(): boolean;
  async proofread(text: string): Promise<ProofreadResult>;
  destroy(): void;
}

interface ProofreadResult {
  correctedText: string;
  corrections: TextChange[];
}

interface TextChange {
  startIndex: number;
  endIndex: number;
  original: string;
}
```

**Implementation Details**:

- Checks `globalThis.Proofreader` for availability
- Single session maintained (no caching needed)
- Configuration: `expectedInputLanguages` array (defaults to ['en'])
- Transforms Chrome API result format to application format
- No fallback available (specialized API only)

**Example**:

```typescript
const manager = new ProofreaderManager();
await manager.checkAvailability();

if (manager.isAvailable()) {
  const result = await manager.proofread(text);
  console.log('Corrected:', result.correctedText);
  console.log('Changes:', result.corrections.length);
}
```

### Language Detector Manager

**File**: `src/background/services/ai/languageDetectorManager.ts`

**Purpose**: Identify language of text content using Chrome's Language Detector API

**Key Methods**:

```typescript
class LanguageDetectorManager {
  isAvailable(): boolean;
  async detect(text: string, pageUrl?: string): Promise<LanguageDetection>;
  clearCache(): void;
  clearCacheForPage(pageUrl: string): void;
  cleanupCache(): void;
}

interface LanguageDetection {
  detectedLanguage: string; // ISO 639-1 code
  confidence: number; // 0-1
  languageName: string; // Human-readable name
}
```

**Implementation Details**:

- Checks `globalThis.LanguageDetector` for availability
- Singleton pattern with exported `languageDetectorManager` instance
- Uses first 500 characters for speed optimization
- Comprehensive language mapping: 100+ languages supported
- Per-page caching with 5-minute TTL
- Sorts results by confidence and returns top match

**Example**:

```typescript
import { languageDetectorManager } from '@/background/services/ai';

if (languageDetectorManager.isAvailable()) {
  const detection = await languageDetectorManager.detect(text, pageUrl);
  console.log(
    `Language: ${detection.languageName} (${detection.detectedLanguage})`
  );
  console.log(`Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
}
```

### Translator Manager

**File**: `src/background/services/ai/translatorManager.ts`

**Purpose**: Translate text between languages using Chrome's Translator API

**Key Methods**:

```typescript
class TranslatorManager {
  isAvailable(): boolean;
  async canTranslate(sourceLang: string, targetLang: string): Promise<boolean>;
  async translate(text: string, options: TranslateOptions): Promise<string>;
  async translateWithMarkdown(
    text: string,
    options: TranslateOptions
  ): Promise<string>;
  cleanupSessions(): void;
  destroy(): void;
}

interface TranslateOptions {
  sourceLanguage: string; // ISO 639-1 code
  targetLanguage: string; // ISO 639-1 code
}
```

**Implementation Details**:

- Checks `globalThis.Translator` for availability
- Singleton pattern with exported `translatorManager` instance
- Supported languages: en, es, fr, de, it, pt, zh, ja, ko, ar
- `canTranslate()` checks language pair availability before translation
- Session caching by `${sourceLanguage}-${targetLanguage}` with 5-minute TTL
- Markdown detection and preservation: bullets, numbered lists, headers, bold, italic, links
- Requires source language (no auto-detection - integrate with Language Detector)

**Example**:

```typescript
import { translatorManager } from '@/background/services/ai';

if (translatorManager.isAvailable()) {
  const canDo = await translatorManager.canTranslate('en', 'es');
  if (canDo) {
    const translated = await translatorManager.translate(text, {
      sourceLanguage: 'en',
      targetLanguage: 'es',
    });
  }
}
```

### Prompt Manager

**File**: `src/background/services/ai/promptManager.ts`

**Purpose**: Universal fallback using Chrome's Prompt API (LanguageModel)

**Key Methods**:

```typescript
class PromptManager {
  isAvailable(): boolean;
  async prompt(text: string, options?: PromptOptions): Promise<string>;
  async promptStreaming(
    text: string,
    options?: PromptOptions
  ): AsyncGenerator<string>;

  // Specialized fallback methods
  async summarize(text: string, format: SummaryFormat): Promise<string[]>;
  async generateDraft(options: WriterOptions): Promise<string>;
  async rewrite(text: string, tone: TonePreset): Promise<string>;
  async proofread(text: string): Promise<string>;
  async generateReflectionPrompts(summary: string[]): Promise<string[]>;

  // Advanced methods
  async countTokens(text: string): Promise<number>;
  async cloneSession(sessionId: string): Promise<string>;
  async getCapabilities(): Promise<PromptCapabilities>;
  destroy(): void;
}

interface PromptOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}
```

**Implementation Details**:

- Checks `globalThis.LanguageModel` for availability
- Session caching by `${systemPrompt}-${temperature}` key
- Temperature presets: factual=0.3, balanced=0.7, creative=0.9
- Specialized prompts mimic each API's behavior
- Streaming support with ReadableStream
- Response parsing for each format (bullets, paragraph, headline-bullets)

**Example**:

```typescript
const manager = new PromptManager();
await manager.checkAvailability();

if (manager.isAvailable()) {
  // General prompting
  const response = await manager.prompt('Explain quantum computing', {
    temperature: 0.7,
  });

  // Fallback for summarization
  const summary = await manager.summarize(text, 'bullets');

  // Fallback for draft generation
  const draft = await manager.generateDraft({
    topic: 'reflection',
    tone: 'calm',
    length: 'short',
  });
}
```

## Capability Detection

### File Location

`src/background/services/capabilities/capabilityDetector.ts`

### Purpose

Centralized capability detection for all Chrome AI APIs with caching and refresh support.

### Interface

```typescript
export function detectCapabilities(experimentalMode?: boolean): AICapabilities;
export function refreshCapabilities(experimentalMode?: boolean): AICapabilities;
export function getCachedCapabilities(): AICapabilities | null;
```

### Implementation

```typescript
// Check for global API objects
const capabilities: AICapabilities = {
  summarizer: 'Summarizer' in globalThis,
  writer: 'Writer' in globalThis,
  rewriter: 'Rewriter' in globalThis,
  proofreader: 'Proofreader' in globalThis,
  languageDetector: 'LanguageDetector' in globalThis,
  translator: 'Translator' in globalThis,
  prompt: 'LanguageModel' in globalThis,
  experimental: experimentalMode || false,
};
```

### Caching Strategy

- Capabilities cached on first detection
- 5-minute TTL for cache
- Explicit refresh via `refreshCapabilities()`
- Invalidated when experimental mode toggled

### Usage

```typescript
import {
  detectCapabilities,
  refreshCapabilities,
} from '@/background/services/capabilities';

// Initial detection
const caps = detectCapabilities();

// Check specific API
if (caps.summarizer) {
  // Use Summarizer API
}

// Refresh on demand
const updated = refreshCapabilities(experimentalMode);
```

## Fallback Strategy

### Fallback Hierarchy

```
Specialized API → Prompt API → Manual Mode
```

### Fallback Matrix

| Operation   | Primary API   | Fallback   | Manual Mode |
| ----------- | ------------- | ---------- | ----------- |
| Summarize   | Summarizer    | Prompt API | ✅          |
| Write Draft | Writer        | Prompt API | ✅          |
| Rewrite     | Rewriter      | Prompt API | ✅          |
| Proofread   | Proofreader   | None       | ❌          |
| Translate   | Translator    | None       | ❌          |
| Detect Lang | Lang Detector | None       | ❌          |

### Implementation Location

Fallback logic is implemented in message handlers (`src/background/handlers/messageHandlers.ts`), not in AIService or individual managers.

### Example Fallback Implementation

```typescript
// In message handler
async function handleSummarize(content: string, format: SummaryFormat) {
  const caps = aiService.getCapabilities();

  try {
    if (caps.summarizer) {
      // Use Summarizer API
      return await aiService.summarizer.summarize(content, format);
    } else if (caps.prompt) {
      // Fall back to Prompt API
      return await aiService.prompt.summarize(content, format);
    } else {
      // Manual mode
      return { error: 'AI unavailable', manualMode: true };
    }
  } catch (error) {
    // Retry with fallback on error
    if (caps.prompt) {
      return await aiService.prompt.summarize(content, format);
    }
    throw error;
  }
}
```

## Error Handling

### Error Types

1. **API Unavailable**: Specific Chrome AI API not available
2. **Timeout**: Operation exceeds timeout threshold
3. **Rate Limiting**: API returns rate limit error
4. **Session Error**: Session creation or usage fails
5. **Invalid Response**: API returns unexpected format
6. **Network Error**: Connection issues (rare for local AI)

### Timeout Handling

All managers implement consistent timeout logic:

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${operation} timeout`)), timeoutMs)
      ),
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Usage in manager
async summarize(text: string, format: SummaryFormat): Promise<string[]> {
  try {
    // Try with 5-second timeout
    return await withTimeout(
      this.summarizeInternal(text, format),
      5000,
      'Summarize'
    );
  } catch (error) {
    // Retry with 8-second timeout
    return await withTimeout(
      this.summarizeInternal(text, format),
      8000,
      'Summarize retry'
    );
  }
}
```

### Rate Limiting

Implemented in message handlers with exponential backoff:

```typescript
async function withRateLimitRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.message.includes('rate limit')) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Rate limit exceeded after ${maxRetries} retries: ${lastError.message}`
  );
}
```

### Session Error Handling

```typescript
async createSession(options: SessionOptions): Promise<Session> {
  try {
    const session = await API.create(options);
    this.sessionCache.set(key, session);
    return session;
  } catch (error) {
    console.error('Session creation failed:', error);

    // Retry once
    try {
      const session = await API.create(options);
      this.sessionCache.set(key, session);
      return session;
    } catch (retryError) {
      console.error('Session creation retry failed:', retryError);
      throw new Error(`Failed to create session: ${retryError.message}`);
    }
  }
}
```

### Error Response Format

All message handlers return standardized error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  errorType:
    | 'unavailable'
    | 'timeout'
    | 'rate_limit'
    | 'session'
    | 'invalid_response';
  manualMode?: boolean;
  retryable?: boolean;
}

// Example
return {
  success: false,
  error: 'Summarizer API unavailable',
  errorType: 'unavailable',
  manualMode: true,
  retryable: false,
};
```

## Session Management

### Session Lifecycle

```
Create → Cache → Use → Validate → Cleanup
```

### Session Caching Strategy

Each manager implements session caching with TTL:

```typescript
class ManagerWithSessions {
  private sessionCache = new Map<string, CachedSession>();
  private readonly SESSION_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(options: SessionOptions): string {
    return `${options.param1}-${options.param2}`;
  }

  private async getOrCreateSession(options: SessionOptions): Promise<Session> {
    const key = this.getCacheKey(options);
    const cached = this.sessionCache.get(key);

    if (cached && Date.now() - cached.createdAt < this.SESSION_TTL) {
      return cached.session;
    }

    const session = await this.createSession(options);
    this.sessionCache.set(key, {
      session,
      createdAt: Date.now(),
    });

    return session;
  }

  destroy(): void {
    for (const cached of this.sessionCache.values()) {
      cached.session.destroy();
    }
    this.sessionCache.clear();
  }
}
```

### Session Validation

Before using a cached session, validate it's still healthy:

```typescript
private async validateSession(session: Session): Promise<boolean> {
  try {
    // Check if session is still responsive
    await session.prompt('test');
    return true;
  } catch (error) {
    return false;
  }
}

private async getValidSession(options: SessionOptions): Promise<Session> {
  const session = await this.getOrCreateSession(options);

  if (!(await this.validateSession(session))) {
    // Session is stale, recreate
    this.sessionCache.delete(this.getCacheKey(options));
    return await this.getOrCreateSession(options);
  }

  return session;
}
```

### Cleanup Strategies

1. **Explicit Cleanup**: Call `destroy()` when done
2. **TTL Expiration**: Sessions expire after 5 minutes
3. **Periodic Cleanup**: Background task removes expired sessions
4. **On Error**: Cleanup failed sessions immediately

```typescript
// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of this.sessionCache.entries()) {
    if (now - cached.createdAt > this.SESSION_TTL) {
      cached.session.destroy();
      this.sessionCache.delete(key);
    }
  }
}, 60000); // Every minute
```

## Message Handlers

### File Location

`src/background/handlers/messageHandlers.ts`

### Message Types

```typescript
type MessageAction =
  | 'summarize'
  | 'write'
  | 'rewrite'
  | 'proofread'
  | 'detectLanguage'
  | 'translate'
  | 'getCapabilities'
  | 'refreshCapabilities'
  | 'checkAllAvailability';

interface Message {
  action: MessageAction;
  data?: any;
}
```

### Handler Implementation

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        success: false,
        error: error.message,
        errorType: 'unknown',
      });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(message: Message): Promise<Response> {
  switch (message.action) {
    case 'summarize':
      return await handleSummarize(message.data);
    case 'write':
      return await handleWrite(message.data);
    case 'rewrite':
      return await handleRewrite(message.data);
    case 'proofread':
      return await handleProofread(message.data);
    case 'detectLanguage':
      return await handleDetectLanguage(message.data);
    case 'translate':
      return await handleTranslate(message.data);
    case 'getCapabilities':
      return { success: true, data: aiService.getCapabilities() };
    case 'refreshCapabilities':
      return {
        success: true,
        data: aiService.refreshCapabilities(message.data?.experimental),
      };
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
}
```

### Example Handler with Fallback

```typescript
async function handleSummarize(data: {
  content: string;
  format: SummaryFormat;
}): Promise<Response> {
  const startTime = Date.now();
  const caps = aiService.getCapabilities();

  try {
    let summary: string[];
    let apiUsed: string;

    if (caps.summarizer) {
      summary = await aiService.summarizer.summarize(data.content, data.format);
      apiUsed = 'summarizer';
    } else if (caps.prompt) {
      summary = await aiService.prompt.summarize(data.content, data.format);
      apiUsed = 'prompt';
    } else {
      return {
        success: false,
        error: 'No AI APIs available',
        errorType: 'unavailable',
        manualMode: true,
      };
    }

    return {
      success: true,
      data: {
        summary,
        apiUsed,
        duration: Date.now() - startTime,
      },
    };
  } catch (error) {
    // Try fallback on error
    if (caps.prompt && !error.message.includes('prompt')) {
      try {
        const summary = await aiService.prompt.summarize(
          data.content,
          data.format
        );
        return {
          success: true,
          data: {
            summary,
            apiUsed: 'prompt-fallback',
            duration: Date.now() - startTime,
          },
        };
      } catch (fallbackError) {
        // Both failed
      }
    }

    return {
      success: false,
      error: error.message,
      errorType: 'timeout',
      retryable: true,
    };
  }
}
```

## Usage Examples

### Complete Reflection Flow

```typescript
// 1. Initialize AI Service
import { aiService } from '@/background/services/ai';
aiService.initialize();

// 2. Check capabilities
const caps = aiService.getCapabilities();
console.log('Available APIs:', caps);

// 3. Detect language (if available)
let detectedLang = 'en';
if (caps.languageDetector) {
  const detection = await languageDetectorManager.detect(content, pageUrl);
  detectedLang = detection.detectedLanguage;
  console.log(`Detected: ${detection.languageName} (${detection.confidence})`);
}

// 4. Translate if needed (if available and not English)
let contentToSummarize = content;
if (caps.translator && detectedLang !== 'en') {
  const canTranslate = await translatorManager.canTranslate(detectedLang, 'en');
  if (canTranslate) {
    contentToSummarize = await translatorManager.translate(content, {
      sourceLanguage: detectedLang,
      targetLanguage: 'en',
    });
  }
}

// 5. Generate summary
let summary: string[];
if (caps.summarizer) {
  summary = await aiService.summarizer.summarize(contentToSummarize, 'bullets');
} else if (caps.prompt) {
  summary = await aiService.prompt.summarize(contentToSummarize, 'bullets');
} else {
  // Manual mode
  summary = ['', '', ''];
}

// 6. Generate draft reflection
let draft = '';
if (caps.writer) {
  draft = await aiService.writer.write({
    topic: 'reflection on article',
    tone: 'calm',
    length: 'short',
    context: summary.join('\n'),
  });
} else if (caps.prompt) {
  draft = await aiService.prompt.generateDraft({
    topic: 'reflection',
    tone: 'calm',
    length: 'short',
  });
}

// 7. User edits reflection...

// 8. Rewrite with tone adjustment (if requested)
if (caps.rewriter && userSelectedTone) {
  const result = await aiService.rewriter.rewrite(userText, {
    tone: toneMapping[userSelectedTone],
  });
  // Show preview, let user accept/discard
}

// 9. Proofread (if enabled and available)
if (caps.proofreader && settings.proofreadEnabled) {
  const result = await aiService.proofreader.proofread(userText);
  // Show diff view, let user accept/discard
}

// 10. Save reflection with metadata
await saveReflection({
  summary,
  reflection: userText,
  detectedLanguage: detectedLang,
  aiMetadata: {
    summarizerUsed: caps.summarizer,
    writerUsed: caps.writer,
    rewriterUsed: caps.rewriter && userSelectedTone !== null,
    proofreaderUsed: caps.proofreader && settings.proofreadEnabled,
    translatorUsed: caps.translator && detectedLang !== 'en',
    promptFallback: !caps.summarizer || !caps.writer,
  },
});
```

### Streaming Example

```typescript
// Writer API streaming
if (caps.writer) {
  const stream = aiService.writer.generateStreaming({
    topic: 'reflection',
    tone: 'calm',
    length: 'short',
  });

  let draft = '';
  for await (const chunk of stream) {
    draft += chunk;
    updateUI(draft); // Update UI progressively
  }
}

// Prompt API streaming
if (caps.prompt) {
  const stream = aiService.prompt.promptStreaming('Generate a reflection...', {
    temperature: 0.7,
  });

  let response = '';
  for await (const chunk of stream) {
    response += chunk;
    updateUI(response);
  }
}
```

### Error Handling Example

```typescript
async function summarizeWithErrorHandling(
  content: string,
  format: SummaryFormat
) {
  try {
    const caps = aiService.getCapabilities();

    if (!caps.summarizer && !caps.prompt) {
      return {
        success: false,
        error: 'No AI APIs available',
        manualMode: true,
      };
    }

    // Try primary API
    if (caps.summarizer) {
      try {
        const summary = await aiService.summarizer.summarize(content, format);
        return { success: true, data: summary, apiUsed: 'summarizer' };
      } catch (error) {
        console.warn('Summarizer failed, trying fallback:', error);
        // Continue to fallback
      }
    }

    // Try fallback
    if (caps.prompt) {
      try {
        const summary = await aiService.prompt.summarize(content, format);
        return { success: true, data: summary, apiUsed: 'prompt' };
      } catch (error) {
        console.error('Prompt API also failed:', error);
        return {
          success: false,
          error: error.message,
          manualMode: true,
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      manualMode: true,
    };
  }
}
```

## Testing

### Unit Tests

Each manager has comprehensive unit tests in `src/background/services/ai/*.test.ts`.

**Test Coverage**:

- Availability checking
- Session creation and caching
- Timeout and retry logic
- Error handling
- Response parsing
- Session cleanup

**Example Test**:

```typescript
describe('SummarizerManager', () => {
  let manager: SummarizerManager;

  beforeEach(() => {
    manager = new SummarizerManager();
    // Mock global Summarizer API
    globalThis.Summarizer = mockSummarizerAPI;
  });

  afterEach(() => {
    manager.destroy();
    delete globalThis.Summarizer;
  });

  it('should detect availability', async () => {
    await manager.checkAvailability();
    expect(manager.isAvailable()).toBe(true);
  });

  it('should generate bullet summary', async () => {
    const summary = await manager.summarize(testContent, 'bullets');
    expect(summary).toHaveLength(3);
    expect(summary[0]).toContain('Insight:');
  });

  it('should handle timeout with retry', async () => {
    mockSummarizerAPI.create = () =>
      new Promise((resolve) => setTimeout(resolve, 10000));

    await expect(manager.summarize(testContent, 'bullets')).rejects.toThrow(
      'timeout'
    );
  });

  it('should cache sessions', async () => {
    await manager.summarize(testContent, 'bullets');
    await manager.summarize(testContent, 'bullets');

    // Should only create session once
    expect(mockSummarizerAPI.create).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Integration tests verify complete workflows in `src/__tests__/ai-workflows.integration.test.ts`.

**Test Scenarios**:

- Complete reflection flow with all APIs
- Fallback behavior when APIs unavailable
- Language detection and translation flow
- Tone adjustment workflow
- Proofreading with diff view
- Settings persistence

**Example Integration Test**:

```typescript
describe('AI Workflows Integration', () => {
  it('should complete multilingual reflection flow', async () => {
    // Setup
    const content = 'Spanish article content...';
    aiService.initialize();

    // Detect language
    const detection = await languageDetectorManager.detect(content);
    expect(detection.detectedLanguage).toBe('es');

    // Translate to English
    const translated = await translatorManager.translate(content, {
      sourceLanguage: 'es',
      targetLanguage: 'en',
    });
    expect(translated).not.toBe(content);

    // Generate summary
    const summary = await aiService.summarizer.summarize(translated, 'bullets');
    expect(summary).toHaveLength(3);

    // Generate draft
    const draft = await aiService.writer.write({
      topic: 'reflection',
      tone: 'calm',
      length: 'short',
      context: summary.join('\n'),
    });
    expect(draft.length).toBeGreaterThan(50);

    // Rewrite with tone
    const rewritten = await aiService.rewriter.rewrite(draft, {
      tone: 'more-formal',
    });
    expect(rewritten.rewritten).not.toBe(draft);

    // Proofread
    const proofread = await aiService.proofreader.proofread(
      rewritten.rewritten
    );
    expect(proofread.correctedText).toBeDefined();
  });
});
```

### API Mock Tests

Mock tests verify fallback behavior in `src/background/services/ai/apiMock.test.ts`.

**Test Coverage**:

- Mock responses for each API
- Simulate API unavailability
- Test Prompt API fallback
- Verify prompt formatting

**Example Mock Test**:

```typescript
describe('API Fallback Behavior', () => {
  it('should fall back to Prompt API when Summarizer unavailable', async () => {
    // Remove Summarizer API
    delete globalThis.Summarizer;

    // Ensure Prompt API available
    globalThis.LanguageModel = mockLanguageModel;

    const caps = detectCapabilities();
    expect(caps.summarizer).toBe(false);
    expect(caps.prompt).toBe(true);

    // Should use Prompt API
    const summary = await aiService.prompt.summarize(content, 'bullets');
    expect(summary).toHaveLength(3);
    expect(mockLanguageModel.create).toHaveBeenCalled();
  });
});
```

### Performance Tests

Performance tests measure operation timing in `src/background/services/ai/performance.test.ts`.

**Metrics**:

- Summarization: < 3s for 1000 words
- Draft generation: < 2s
- Rewriting: < 2s
- Proofreading: < 3s
- Language detection: < 500ms
- Translation: < 2s per 100 words

**Example Performance Test**:

```typescript
describe('AI Performance', () => {
  it('should summarize within 3 seconds', async () => {
    const content = generateTestContent(1000); // 1000 words
    const startTime = Date.now();

    await aiService.summarizer.summarize(content, 'bullets');

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(3000);
  });

  it('should detect language within 500ms', async () => {
    const content = generateTestContent(500);
    const startTime = Date.now();

    await languageDetectorManager.detect(content);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });
});
```

## Best Practices

### 1. Always Check Capabilities

```typescript
// ✅ Good
const caps = aiService.getCapabilities();
if (caps.summarizer) {
  await aiService.summarizer.summarize(content, 'bullets');
}

// ❌ Bad
await aiService.summarizer.summarize(content, 'bullets'); // May fail
```

### 2. Implement Fallback Logic

```typescript
// ✅ Good
if (caps.summarizer) {
  summary = await aiService.summarizer.summarize(content, 'bullets');
} else if (caps.prompt) {
  summary = await aiService.prompt.summarize(content, 'bullets');
} else {
  // Manual mode
}

// ❌ Bad
summary = await aiService.summarizer.summarize(content, 'bullets'); // No fallback
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  const result = await aiService.writer.write(options);
  return { success: true, data: result };
} catch (error) {
  console.error('Writer failed:', error);
  return { success: false, error: error.message, manualMode: true };
}

// ❌ Bad
const result = await aiService.writer.write(options); // Unhandled error
```

### 4. Clean Up Sessions

```typescript
// ✅ Good
try {
  const result = await aiService.summarizer.summarize(content, 'bullets');
  return result;
} finally {
  // Sessions auto-cleanup with TTL, but explicit cleanup is better
  aiService.summarizer.destroySession('bullets');
}

// ❌ Bad
const result = await aiService.summarizer.summarize(content, 'bullets');
return result; // Session leaks
```

### 5. Use Streaming for Long Operations

```typescript
// ✅ Good - Progressive UI updates
const stream = aiService.writer.generateStreaming(options);
for await (const chunk of stream) {
  updateUI(chunk);
}

// ❌ Bad - User waits with no feedback
const result = await aiService.writer.write(options);
updateUI(result);
```

### 6. Cache Aggressively

```typescript
// ✅ Good - Reuse sessions
const session = await manager.getOrCreateSession(options);
await session.operation1();
await session.operation2();

// ❌ Bad - Create new session each time
await manager.createSession(options).operation1();
await manager.createSession(options).operation2();
```

### 7. Monitor Performance

```typescript
// ✅ Good
const startTime = Date.now();
const result = await aiService.summarizer.summarize(content, 'bullets');
const duration = Date.now() - startTime;
console.log(`Summarization took ${duration}ms`);

if (duration > 5000) {
  console.warn('Slow summarization detected');
}
```

## Troubleshooting

### API Not Available

**Symptom**: `isAvailable()` returns `false`

**Solutions**:

1. Check Chrome flags are enabled
2. Restart Chrome completely
3. Verify Chrome version (127+)
4. Check console for errors
5. Try `refreshCapabilities()`

### Timeout Errors

**Symptom**: Operations timeout after 5-8 seconds

**Solutions**:

1. Reduce content length
2. Check device performance
3. Verify Gemini Nano is downloaded
4. Try fallback to Prompt API
5. Increase timeout threshold (not recommended)

### Session Errors

**Symptom**: Session creation fails

**Solutions**:

1. Check API availability
2. Verify session options are valid
3. Clear session cache
4. Restart extension
5. Check for rate limiting

### Memory Leaks

**Symptom**: Extension uses increasing memory

**Solutions**:

1. Call `destroy()` on managers
2. Clear session caches periodically
3. Implement TTL for all caches
4. Monitor cache sizes
5. Use WeakMap for temporary data

## Additional Resources

- [Chrome AI APIs Documentation](../chrome-apis/INDEX.md)
- [Gemini Nano Setup Guide](./GEMINI_NANO_SETUP.md)
- [API Quick References](../chrome-apis/)
- [Integration Examples](../../examples/INTEGRATION_EXAMPLE.md)
- [Testing Guide](../../guides/TESTING_GUIDE.md)

## Conclusion

The AI Service architecture provides a robust, maintainable foundation for integrating all seven Chrome Built-in AI APIs. The lightweight orchestration approach, combined with individual manager responsibility and intelligent fallback logic, ensures a reliable AI-powered experience while maintaining code clarity and testability.

For specific API details, consult the individual manager implementations and their corresponding documentation in the `docs/development/chrome-apis/` directory.
