# Design Document

## Overview

This design document outlines the architecture for integrating all seven Chrome Built-in AI APIs into Reflexa AI. The integration creates an AI Service layer that orchestrates capability detection, API selection, fallback handling, and error management across all AI operations. The design maintains Reflexa's core principles of privacy-first operation, calm aesthetics, and seamless user experience while adding powerful new capabilities including multilingual support, tone adjustment, grammar polishing, and intelligent content generation. All AI processing remains on-device through Gemini Nano, ensuring zero data transmission to external servers.

**Implementation Update (January 2025)**: The core AI infrastructure has been fully implemented with all seven API managers operational. Each manager handles its own session lifecycle, timeout/retry logic, and error handling. The architecture uses a lightweight orchestration approach where individual managers are accessed directly rather than through a heavy abstraction layer.

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Browser Environment                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Reflexa AI Extension                          │ │
│  │                                                            │ │
│  │  ┌──────────────────┐         ┌──────────────────────┐   │ │
│  │  │  Content Script  │         │  Background Worker   │   │ │
│  │  │                  │         │                      │   │ │
│  │  │  • Reflect Mode  │◄────────┤  Unified AI Service  │   │ │
│  │  │  • UI Components │  msgs   │                      │   │ │
│  │  │  • Language Pill │         │  ┌────────────────┐  │   │ │
│  │  │  • Tone Chips    │         │  │ Capability     │  │   │ │
│  │  │  • Translate Menu│         │  │ Detection      │  │   │ │
│  │  └──────────────────┘         │  └────────────────┘  │   │ │
│  │                                │  ┌────────────────┐  │   │ │
│  │  ┌──────────────────┐         │  │ API Managers   │  │   │ │
│  │  │  Dashboard       │         │  │                │  │   │ │
│  │  │                  │         │  │ • Summarizer   │  │   │ │
│  │  │  • AI Status     │◄────────┤  │ • Writer       │  │   │ │
│  │  │  • Reflections   │         │  │ • Rewriter     │  │   │ │
│  │  └──────────────────┘         │  │ • Proofreader  │  │   │ │
│  │                                │  │ • Language     │  │   │ │
│  │  ┌──────────────────┐         │  │ • Translator   │  │   │ │
│  │  │  Settings Page   │         │  │ • Prompt       │  │   │ │
│  │  │                  │         │  └────────────────┘  │   │ │
│  │  │  • Dev Mode      │◄────────┤                      │   │ │
│  │  │  • AI Status     │         │  ┌────────────────┐  │   │ │
│  │  └──────────────────┘         │  │ Fallback Logic │  │   │ │
│  │                                │  └────────────────┘  │   │ │
│  │                                │  ┌────────────────┐  │   │ │
│  │                                │  │ Error Handling │  │   │ │
│  │                                │  └────────────────┘  │   │ │
│  │                                └──────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                    │                             │
│                                    ▼                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Chrome Built-in AI APIs (Gemini Nano)         │ │
│  │                                                            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐│ │
│  │  │Summarizer│ │  Writer  │ │ Rewriter │ │ Proofreader  ││ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘│ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │ │
│  │  │ Language │ │Translator│ │  Prompt  │                 │ │
│  │  │ Detector │ │          │ │   API    │                 │ │
│  │  └──────────┘ └──────────┘ └──────────┘                 │ │
│  │                                                            │ │
│  │  All processing happens locally on device                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Flow

```
User Action → Content Script → Background Worker → Unified AI Service
                                                          │
                                                          ├─ Capability Check
                                                          ├─ Select Best API
                                                          ├─ Execute with Timeout
                                                          ├─ Handle Errors
                                                          └─ Fallback if Needed
                                                          │
                                                          ▼
                                                    Chrome AI APIs
                                                          │
                                                          ▼
                                                    Response Processing
                                                          │
                                                          ▼
                                                    Return to UI
```

## Components and Interfaces

### AI Service (`src/background/services/ai/aiService.ts`)

**Purpose**: Lightweight orchestration layer that initializes and provides access to all Chrome AI API managers with capability detection.

**Actual Implementation**:

```typescript
export class AIService {
  public readonly prompt: PromptManager;
  public readonly proofreader: ProofreaderManager;
  public readonly summarizer: SummarizerManager;
  public readonly translator: TranslatorManager;
  public readonly writer: WriterManager;
  public readonly rewriter: RewriterManager;

  private capabilities: AICapabilities | null = null;
  private initialized = false;

  constructor() {
    // Instantiate all managers
    this.prompt = new PromptManager();
    this.proofreader = new ProofreaderManager();
    this.summarizer = new SummarizerManager();
    this.translator = new TranslatorManager();
    this.writer = new WriterManager();
    this.rewriter = new RewriterManager();
  }

  initialize(experimentalMode = false): void;
  getCapabilities(): AICapabilities;
  refreshCapabilities(experimentalMode = false): AICapabilities;
  isInitialized(): boolean;
  async checkAllAvailability(): Promise<{...}>;
  destroyAll(): void;
}

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

interface SummarizeOptions {
  format: 'bullets' | 'paragraph' | 'headline-bullets';
  maxLength?: number;
}

interface WriterOptions {
  tone: 'calm' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
}

type TonePreset = 'calm' | 'concise' | 'empathetic' | 'academic';

interface ProofreadResult {
  correctedText: string;
  corrections: {
    startIndex: number;
    endIndex: number;
    original: string;
  }[];
}
```

**Design Decisions**:

- **Lightweight orchestration**: AIService provides access to managers rather than wrapping all operations
- **Direct manager access**: Callers use `aiService.summarizer.summarize()` rather than `aiService.summarize()`
- **Individual responsibility**: Each manager handles its own timeout/retry logic, error handling, and session management
- **Capability detection**: Centralized in `capabilityDetector` service, cached and refreshable
- **No AIResponse wrapper**: Managers return their native types; message handlers add response wrapping
- **Singleton pattern**: Export `aiService` instance for global access
- **Fallback logic**: Implemented in message handlers, not in AIService itself

### API Manager Modules

Each Chrome AI API has a dedicated manager module that wraps the native API with error handling and formatting. All managers are located in `src/background/services/ai/` and follow consistent patterns for availability checking, session management, timeout handling, and error recovery.

**Common Patterns Across All Managers**:
- `checkAvailability()`: Async method that checks API availability using global object detection
- `isAvailable()`: Synchronous getter for cached availability status
- `createSession()`: Private method that creates and caches API sessions
- Timeout logic: 5-second initial timeout, 8-second retry timeout
- Session caching: Sessions cached by configuration key for reuse
- `destroy()`: Cleanup method for session lifecycle management
- Error handling: Try-catch with retry logic and descriptive error messages

#### Summarizer Manager (`src/background/summarizerManager.ts`)

```typescript
interface SummarizerManager {
  isAvailable(): boolean;
  summarize(text: string, format: SummaryFormat): Promise<string[]>;
  createSession(options: SummarizerOptions): Promise<SummarizerSession>;
}

interface SummarizerOptions {
  type: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  format: 'plain-text' | 'markdown';
  length: 'short' | 'medium' | 'long';
}

interface SummarizerSession {
  summarize(text: string): Promise<string>;
  destroy(): void;
}
```

**Actual Implementation** (`src/background/services/ai/summarizerManager.ts`):

- ✅ Check availability using `globalThis.Summarizer` (global object, not under `ai` namespace)
- ✅ Create sessions with options: `type` (key-points, tl;dr, teaser, headline), `format` (plain-text, markdown), `length` (short, medium, long)
- ✅ Session caching by configuration key: `${type}-${format}-${length}`
- ✅ Parse markdown bullets into array format
- ✅ Implement `summarizeBullets()`, `summarizeParagraph()`, `summarizeHeadlineBullets()` methods
- ✅ Timeout logic: 5s initial, 8s retry with `Promise.race`
- ✅ Session cleanup with `destroy()` and `destroySession(format)` methods
- ✅ Handles parallel session creation for headline+bullets format

#### Writer Manager (`src/background/writerManager.ts`)

```typescript
interface WriterManager {
  isAvailable(): boolean;
  generate(options: WriterGenerateOptions): Promise<string>;
  createSession(config: WriterConfig): Promise<WriterSession>;
}

interface WriterGenerateOptions {
  topic: string;
  tone: 'formal' | 'neutral' | 'casual';
  length: 'short' | 'medium' | 'long';
  context?: string;
}

interface WriterConfig {
  sharedContext?: string;
  tone?: string;
  format?: string;
}

interface WriterSession {
  write(prompt: string): Promise<string>;
  destroy(): void;
}
```

**Actual Implementation** (`src/background/services/ai/writerManager.ts`):

- ✅ Check availability using `globalThis.Writer` (global object)
- ✅ Map tone presets: calm→neutral, professional→formal, casual→casual
- ✅ Length ranges: short=50-100 words, medium=100-200, long=200-300
- ✅ Session caching by `${tone}-${format}-${length}` key
- ✅ `write()` method for message handlers, `generate()` for internal use
- ✅ Context support via `sharedContext` and `context` parameters
- ✅ Streaming support with `generateStreaming()` using `for await...of` iteration
- ✅ Word count validation against target ranges
- ✅ Timeout logic: 5s initial, 8s retry

#### Rewriter Manager (`src/background/rewriterManager.ts`)

```typescript
interface RewriterManager {
  isAvailable(): boolean;
  rewrite(text: string, options: RewriteOptions): Promise<string>;
  createSession(config: RewriterConfig): Promise<RewriterSession>;
}

interface RewriteOptions {
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  length?: 'as-is' | 'shorter' | 'longer';
  context?: string;
}

interface RewriterConfig {
  sharedContext?: string;
  tone?: string;
  length?: string;
}

interface RewriterSession {
  rewrite(text: string, context?: string): Promise<string>;
  destroy(): void;
}
```

**Actual Implementation** (`src/background/services/ai/rewriterManager.ts`):

- ✅ Check availability using `globalThis.Rewriter` (global object)
- ✅ Map tone presets: calm→as-is tone, concise→shorter length, empathetic→more-casual, academic→more-formal
- ✅ Session caching by `${tone}-${format}-${length}` key
- ✅ Returns object with `{ original, rewritten }` for comparison
- ✅ Streaming support with `rewriteStreaming()` using `for await...of`
- ✅ Context support via `sharedContext` parameter
- ✅ Preserves paragraph structure and formatting
- ✅ Timeout logic: 5s initial, 8s retry

#### Proofreader Manager (`src/background/proofreaderManager.ts`)

```typescript
interface ProofreaderManager {
  isAvailable(): boolean;
  proofread(text: string): Promise<ProofreadResult>;
  createSession(): Promise<ProofreaderSession>;
}

interface ProofreaderSession {
  proofread(text: string): Promise<ProofreadResult>;
  destroy(): void;
}
```

**Actual Implementation** (`src/background/services/ai/proofreaderManager.ts`):

- ✅ Check availability using `globalThis.Proofreader` (global object)
- ✅ Single session maintained (no caching needed)
- ✅ Configuration: `expectedInputLanguages` array (defaults to ['en'])
- ✅ Returns `ProofreadResult` with `correctedText` and `corrections` array
- ✅ Corrections include `startIndex`, `endIndex`, and `original` text
- ✅ Transforms Chrome API result format to application format
- ✅ Timeout logic: 5s initial, 8s retry
- ✅ No fallback available (specialized API only)

#### Language Detector Manager (`src/background/languageDetectorManager.ts`)

```typescript
interface LanguageDetectorManager {
  isAvailable(): boolean;
  detect(text: string): Promise<LanguageDetection>;
}

interface LanguageDetection {
  detectedLanguage: string; // ISO 639-1 code
  confidence: number; // 0-1
  languageName: string; // Human-readable name
}
```

**Actual Implementation** (`src/background/services/ai/languageDetectorManager.ts`):

- ✅ Check availability using `globalThis.LanguageDetector` (global object)
- ✅ Singleton pattern with exported `languageDetectorManager` instance
- ✅ Uses first 500 characters for speed optimization
- ✅ Comprehensive language mapping: 100+ languages supported
- ✅ Per-page caching with 5-minute TTL
- ✅ Cache methods: `clearCache()`, `clearCacheForPage()`, `cleanupCache()`
- ✅ Returns `LanguageDetection` with `detectedLanguage`, `confidence`, `languageName`
- ✅ Sorts results by confidence and returns top match
- ✅ Cache key generation from page URL or text hash

#### Translator Manager (`src/background/translatorManager.ts`)

```typescript
interface TranslatorManager {
  isAvailable(): boolean;
  translate(text: string, options: TranslateOptions): Promise<string>;
  canTranslate(sourceLang: string, targetLang: string): Promise<boolean>;
  createSession(sourceLang: string, targetLang: string): Promise<TranslatorSession>;
}

interface TranslateOptions {
  sourceLanguage?: string; // Auto-detect if not provided
  targetLanguage: string;
}

interface TranslatorSession {
  translate(text: string): Promise<string>;
  destroy(): void;
}
```

**Actual Implementation** (`src/background/services/ai/translatorManager.ts`):

- ✅ Check availability using `globalThis.Translator` (global object)
- ✅ Singleton pattern with exported `translatorManager` instance
- ✅ Supported languages: en, es, fr, de, it, pt, zh, ja, ko, ar
- ✅ `canTranslate()` method checks language pair availability before translation
- ✅ Session caching by `${sourceLanguage}-${targetLanguage}` with 5-minute TTL
- ✅ Markdown detection and preservation: bullets, numbered lists, headers, bold, italic, links
- ✅ `translateWithMarkdown()` method splits by lines and preserves formatting markers
- ✅ Session cleanup: `cleanupSessions()`, `destroy()`, `destroySession()`
- ✅ Timeout logic: 5s initial, 8s retry
- ✅ Requires source language (no auto-detection yet - needs Language Detector integration)

#### Prompt Manager (`src/background/promptManager.ts`)

```typescript
interface PromptManager {
  isAvailable(): boolean;
  prompt(text: string, options?: PromptOptions): Promise<string>;
  createSession(config: PromptConfig): Promise<PromptSession>;
}

interface PromptOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

interface PromptConfig {
  systemPrompt?: string;
  initialPrompts?: Array<{ role: string; content: string }>;
}

interface PromptSession {
  prompt(text: string): Promise<string>;
  destroy(): void;
}
```

**Actual Implementation** (`src/background/services/ai/promptManager.ts`):

- ✅ Check availability using `globalThis.LanguageModel` (global object)
- ✅ Session caching by `${systemPrompt}-${temperature}` key
- ✅ Temperature presets: factual=0.3, balanced=0.7, creative=0.9
- ✅ General `prompt()` method with configurable system prompt, temperature, topK
- ✅ Specialized fallback methods:
  - `summarize()`: Mimics Summarizer API with format-specific prompts
  - `generateDraft()`: Mimics Writer API with tone/length control
  - `rewrite()`: Mimics Rewriter API with tone preset mapping
  - `proofread()`: Basic grammar/clarity checking
  - `generateReflectionPrompts()`: Backward compatibility method
- ✅ Streaming support with `promptStreaming()` using ReadableStream
- ✅ Advanced methods: `countTokens()`, `cloneSession()`, `getCapabilities()`
- ✅ Response parsing for each format (bullets, paragraph, headline-bullets)
- ✅ Timeout logic: 5s initial, 8s retry

### UI Components

#### Summary Format Dropdown (`src/content/SummaryFormatDropdown.tsx`)

```typescript
interface SummaryFormatDropdownProps {
  selectedFormat: SummaryFormat;
  onFormatChange: (format: SummaryFormat) => void;
  disabled?: boolean;
}

type SummaryFormat = 'bullets' | 'paragraph' | 'headline-bullets';
```

**Design**:

- Dropdown positioned above summary display area
- Icons for each format type (bullet list, paragraph, headline)
- Smooth transition when format changes
- Disabled state when AI is processing

#### Tone Preset Chips (`src/content/TonePresetChips.tsx`)

```typescript
interface TonePresetChipsProps {
  selectedTone?: TonePreset;
  onToneSelect: (tone: TonePreset) => void;
  disabled?: boolean;
}
```

**Design**:

- Horizontal row of four chips: Calm, Concise, Empathetic, Academic
- Active chip highlighted with accent color
- Hover effect with subtle scale animation
- Loading state while rewriting in progress

#### Proofread Diff View (`src/content/ProofreadDiffView.tsx`)

```typescript
interface ProofreadDiffViewProps {
  original: string;
  corrected: string;
  changes: TextChange[];
  onAccept: () => void;
  onDiscard: () => void;
}
```

**Design**:

- Side-by-side comparison layout
- Inline highlighting of changes with color coding
- Tooltip on hover showing change type
- Accept/Discard buttons at bottom
- Smooth transition when accepting changes

#### Language Pill (`src/content/LanguagePill.tsx`)

```typescript
interface LanguagePillProps {
  language: string;
  languageCode: string;
  confidence: number;
}
```

**Design**:

- Small pill in header showing detected language
- Globe icon with language name
- Subtle animation on detection
- Tooltip showing confidence score

#### Translate Dropdown (`src/content/TranslateDropdown.tsx`)

```typescript
interface TranslateDropdownProps {
  currentLanguage: string;
  availableLanguages: Language[];
  onTranslate: (targetLang: string) => void;
  disabled?: boolean;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}
```

**Design**:

- Dropdown with flag icons for each language
- Search/filter for quick language selection
- Show both English and native language names
- Loading indicator during translation

#### AI Status Panel (`src/popup/AIStatusPanel.tsx`)

```typescript
interface AIStatusPanelProps {
  capabilities: AICapabilities;
  usageStats: UsageStats;
  experimentalMode: boolean;
}

interface UsageStats {
  summarizations: number;
  drafts: number;
  rewrites: number;
  proofreads: number;
  translations: number;
  sessionStart: number;
}
```

**Design**:

- Grid layout showing each API status
- Green checkmark for available, gray X for unavailable
- Usage counters for current session
- Experimental mode badge when enabled
- Refresh button to re-check capabilities

## Data Models

### Extended Reflection Type

```typescript
type Reflection = {
  // Existing fields
  id: string;
  url: string;
  title: string;
  createdAt: number;
  summary: string[];
  reflection: string[];

  // New fields for Chrome AI APIs integration
  summaryFormat: SummaryFormat;
  detectedLanguage?: string;
  originalLanguage?: string;
  translatedTo?: string;
  toneUsed?: TonePreset;
  proofreadVersion?: string;
  proofreadChanges?: TextChange[];
  aiMetadata: AIMetadata;
};

interface AIMetadata {
  summarizerUsed: boolean;
  writerUsed: boolean;
  rewriterUsed: boolean;
  proofreaderUsed: boolean;
  translatorUsed: boolean;
  promptFallback: boolean;
  processingTime: number;
}
```

### Extended Settings Type

```typescript
type Settings = {
  // Existing settings
  dwellThreshold: number;
  enableSound: boolean;
  reduceMotion: boolean;
  privacyMode: 'local' | 'sync';

  // New settings for Chrome AI APIs
  defaultSummaryFormat: SummaryFormat;
  enableProofreading: boolean;
  enableTranslation: boolean;
  preferredTranslationLanguage: string;
  experimentalMode: boolean;
  autoDetectLanguage: boolean;
};
```

### Capability Cache

```typescript
interface CapabilityCache {
  capabilities: AICapabilities;
  lastChecked: number;
  ttl: number; // Time to live in milliseconds
}
```

## Error Handling

### API Unavailability

**Scenario**: Specific Chrome AI API not available on user's browser

**Handling**:

1. Unified AI Service detects unavailability during initialization
2. Set capability flag to false for that API
3. Automatically fall back to Prompt API for that operation
4. Hide UI elements that depend on unavailable API
5. Display informational message in AI Status panel

### Rate Limiting

**Scenario**: API returns rate limit error

**Handling**:

1. Catch rate limit error in API manager
2. Implement exponential backoff: wait 2s, then 4s, then 8s
3. Maximum 3 retry attempts
4. If all retries fail, display user message: "AI temporarily busy"
5. Queue request for later retry if user stays on page

### Translation Unavailable

**Scenario**: Requested language pair not supported

**Handling**:

1. Check `canTranslate()` before showing language option
2. Gray out unsupported languages in dropdown
3. Display tooltip: "Translation not available for this language pair"
4. Offer alternative: translate to English first, then to target language

### Timeout Handling

**Scenario**: API call exceeds timeout threshold

**Handling**:

1. Wrap all API calls in `Promise.race()` with 5-second timeout
2. On timeout, cancel operation and show loading spinner
3. Retry once with extended 8-second timeout
4. If second timeout, fall back to Prompt API or manual mode
5. Log timeout for performance monitoring

### Session Management Errors

**Scenario**: AI session creation fails or session becomes invalid

**Handling**:

1. Catch session creation errors
2. Retry session creation once
3. If retry fails, fall back to direct API calls without session
4. Implement session cleanup on page unload
5. Recreate sessions if they become stale (>5 minutes idle)

## Testing Strategy

### Unit Tests

**Coverage Areas**:

- Capability detection logic for each API
- Fallback selection algorithm
- Response parsing and formatting
- Error handling for each error type
- Timeout and retry logic
- Session lifecycle management

**Example Tests**:

```typescript
describe('UnifiedAIService', () => {
  it('should detect all available APIs on initialization', async () => {
    const service = new UnifiedAIService();
    await service.initialize();
    const caps = service.getCapabilities();
    expect(caps).toHaveProperty('summarizer');
    expect(caps).toHaveProperty('writer');
  });

  it('should fall back to Prompt API when Summarizer unavailable', async () => {
    const service = new UnifiedAIService();
    mockSummarizerUnavailable();
    const result = await service.summarize('test content', { format: 'bullets' });
    expect(result.apiUsed).toBe('prompt');
  });

  it('should handle rate limiting with exponential backoff', async () => {
    const service = new UnifiedAIService();
    mockRateLimitError();
    const startTime = Date.now();
    await service.summarize('test', { format: 'bullets' });
    const duration = Date.now() - startTime;
    expect(duration).toBeGreaterThan(2000); // At least one retry
  });
});
```

### Integration Tests

**Coverage Areas**:

- End-to-end flow with all APIs
- UI component interaction with Unified AI Service
- Language detection and translation flow
- Tone adjustment workflow
- Proofreading with diff view
- Settings persistence for new options

**Example Tests**:

```typescript
test('complete multilingual reflection flow', async ({ page, extensionId }) => {
  await page.goto('https://example.com/spanish-article');

  // Trigger reflection
  await page.click('[data-testid="lotus-nudge"]');

  // Verify language detection
  await expect(page.locator('[data-testid="language-pill"]')).toContainText('Spanish');

  // Translate summary
  await page.click('[data-testid="translate-dropdown"]');
  await page.click('[data-testid="translate-to-english"]');

  // Verify translation
  await expect(page.locator('[data-testid="summary-bullet"]').first()).not.toContainText('español');

  // Generate draft
  await page.click('[data-testid="start-reflection-button"]');
  await expect(page.locator('[data-testid="reflection-input"]')).not.toBeEmpty();

  // Adjust tone
  await page.click('[data-testid="tone-chip-academic"]');
  await expect(page.locator('[data-testid="rewrite-preview"]')).toBeVisible();

  // Accept rewrite
  await page.click('[data-testid="accept-rewrite"]');

  // Proofread
  await page.click('[data-testid="proofread-button"]');
  await expect(page.locator('[data-testid="diff-view"]')).toBeVisible();

  // Save
  await page.click('[data-testid="save-button"]');
});
```

### API Mock Tests

**Coverage Areas**:

- Mock responses for each Chrome AI API
- Simulate API unavailability scenarios
- Test fallback behavior
- Verify prompt formatting for Prompt API fallbacks

### Performance Tests

**Coverage Areas**:

- API response times for each operation
- Memory usage with multiple AI sessions
- UI responsiveness during AI operations
- Capability detection overhead

**Metrics**:

- Summarization: <3s for 1000 words
- Draft generation: <2s
- Rewriting: <2s
- Proofreading: <3s
- Language detection: <500ms
- Translation: <2s per 100 words

## Actual Implementation Architecture

### File Structure

```
src/background/services/
├── ai/
│   ├── aiService.ts              # Lightweight orchestration
│   ├── promptManager.ts          # Prompt API + fallbacks
│   ├── summarizerManager.ts      # Summarizer API
│   ├── writerManager.ts          # Writer API
│   ├── rewriterManager.ts        # Rewriter API
│   ├── proofreaderManager.ts     # Proofreader API
│   ├── languageDetectorManager.ts # Language Detector API
│   ├── translatorManager.ts      # Translator API
│   └── index.ts                  # Exports
└── capabilities/
    ├── capabilityDetector.ts     # Centralized capability detection
    └── index.ts                  # Exports
```

### Key Implementation Differences from Original Design

1. **Lightweight Orchestration**: AIService provides manager access rather than wrapping all operations
2. **Direct Manager Access**: `aiService.summarizer.summarize()` instead of `aiService.summarize()`
3. **No AIResponse Wrapper**: Managers return native types; message handlers add response wrapping
4. **Individual Responsibility**: Each manager handles its own timeout/retry/error logic
5. **Fallback in Handlers**: Fallback logic implemented in message handlers, not in AIService
6. **Global API Access**: All APIs accessed via global objects (Writer, Rewriter, etc.), not `ai.writer`
7. **Singleton Exports**: Language Detector and Translator export singleton instances

### Benefits of This Approach

- **Simpler**: Less abstraction layers, more direct code paths
- **Flexible**: Easy to use managers independently or together
- **Maintainable**: Each manager is self-contained with clear responsibilities
- **Testable**: Managers can be tested in isolation
- **Performant**: No unnecessary wrapper overhead

## Design Rationale

### Why Lightweight Orchestration?

The original design called for a heavy "Unified AI Service" that wrapped all operations. The actual implementation uses a lightweight approach where AIService simply provides access to individual managers. This reduces complexity and makes the code more maintainable. Fallback logic is implemented in message handlers where it's needed, not in a central service layer.

### Why Prompt API as Universal Fallback?

The Prompt API is the most flexible and likely to be available across Chrome versions. By crafting specific prompts, we can approximate the behavior of specialized APIs when they're unavailable. This ensures users always have AI functionality even on older Chrome versions or when specific APIs are disabled.

### Why Session-Based API Calls?

Chrome AI APIs support session-based interactions for better performance and context retention. Sessions allow the AI to maintain context across multiple operations, improving response quality. They also reduce initialization overhead for repeated operations.

### Why Capability Caching?

Checking API availability on every call would add latency. Caching capabilities after initialization provides instant access to availability information. The cache is refreshed on settings changes or when experimental mode is toggled.

### Why Inline Diff View for Proofreading?

Showing changes inline helps users understand what was corrected and learn from mistakes. Side-by-side comparison is clearer than simply replacing text. Users can selectively accept or reject changes, maintaining control over their content.

### Why Language Detection Before Translation?

Automatic language detection provides a seamless experience without requiring users to specify the source language. Detecting language also enables smart features like suggesting translation when content is in a different language than the user's preference.

### Why Tone Presets Instead of Free-Form?

Predefined tone presets provide consistent, predictable results and are easier for users to understand than abstract style parameters. The four presets (Calm, Concise, Empathetic, Academic) cover the most common use cases for reflection writing.

### Why Experimental Mode Toggle?

Chrome AI APIs are evolving rapidly. An experimental mode allows users to opt into new features as they become available without affecting the stable experience for other users. This also helps gather feedback on new capabilities before making them default.

### Why Track AI Usage Statistics?

Usage statistics help users understand how they're leveraging AI features and provide valuable data for optimizing the experience. Tracking which APIs are used most frequently informs future development priorities.
