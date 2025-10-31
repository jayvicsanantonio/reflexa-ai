# Reflexa AI API Reference

This document provides detailed API documentation for all major classes and modules in the Reflexa AI Chrome Extension.

**Note:** For detailed Chrome Built-in AI APIs documentation, see:

- [Chrome AI APIs Documentation](../development/chrome-apis/README.md) - Main documentation hub
- [Documentation Index](../development/chrome-apis/INDEX.md) - Complete index of all API docs
- Individual API Quick References in `docs/development/chrome-apis/`

## Table of Contents

1. [PromptManager](#promptmanager) (formerly AIManager)
2. [ProofreaderManager](#proofreadermanager) (new)
3. [SummarizerManager](#summarizermanager) (new)
4. [TranslatorManager](#translatormanager) (new)
5. [WriterManager](#writermanager) (new)
6. [RewriterManager](#rewritermanager) (new)
7. [LanguageDetectorManager](#languagedetectormanager) (new)
8. [UnifiedAIService](#unifiedaiservice) (new)
9. [StorageManager](#storagemanager)
10. [SettingsManager](#settingsmanager)
11. [DwellTracker](#dwelltracker)
12. [ContentExtractor](#contentextractor)
13. [Utility Functions](#utility-functions)
14. [Type Definitions](#type-definitions)
15. [Message API](#message-api)

---

## WriterManager

Manages Chrome Writer API sessions for creative content generation with tone and length control.

### Constructor

```typescript
const writerManager = new WriterManager();
```

No parameters required. The manager initializes lazily on first use.

### Methods

#### `checkAvailability(): Promise<boolean>`

Checks if Writer API is available on the user's system.

**Returns**: `Promise<boolean>` - `true` if Writer API is available, `false` otherwise

**Example**:

```typescript
const available = await writerManager.checkAvailability();
if (available) {
  console.log('Writer API is ready to use');
}
```

---

#### `isAvailable(): boolean`

Synchronously checks if Writer API is available (after calling `checkAvailability()`).

**Returns**: `boolean` - `true` if Writer API is available

**Example**:

```typescript
if (writerManager.isAvailable()) {
  // Use Writer API
}
```

---

#### `generate(topic: string, options: WriterOptions, context?: string): Promise<string>`

Generates draft text with specified tone and length options.

**Parameters**:

- `topic` (string): The topic or prompt for text generation
- `options` (WriterOptions): Configuration object with `tone` and `length`
  - `tone`: `'calm'` | `'professional'` | `'casual'`
  - `length`: `'short'` | `'medium'` | `'long'`
- `context` (string, optional): Additional context to guide generation

**Returns**: `Promise<string>` - Generated draft text

**Example**:

```typescript
const draft = await writerManager.generate(
  'Write about the importance of mindful reading',
  {
    tone: 'calm',
    length: 'medium',
  },
  'This is for a reflection journal entry'
);
```

**Notes**:

- Implements 5-second timeout with automatic retry (8 seconds)
- Tone mapping: `calm` → `neutral`, `professional` → `formal`, `casual` → `casual`
- Length ranges: short (50-100 words), medium (100-200 words), long (200-300 words)
- Sessions are cached and reused for same configuration

---

#### `write(prompt: string, options?: WriterOptions): Promise<string>`

Alternative method for generating text (used by message handlers).

**Parameters**:

- `prompt` (string): The writing prompt
- `options` (WriterOptions, optional): Tone and length configuration

**Returns**: `Promise<string>` - Generated text

**Example**:

```typescript
const result = await writerManager.write(
  'Draft a motivational message about learning',
  {
    tone: 'professional',
    length: 'short',
  }
);
```

---

#### `generateStreaming(topic: string, options: WriterOptions, context: string | undefined, onChunk: (chunk: string) => void): Promise<string>`

Generates text with streaming support for progressive UI updates.

**Parameters**:

- `topic` (string): The topic or prompt
- `options` (WriterOptions): Tone and length configuration
- `context` (string | undefined): Optional context
- `onChunk` (function): Callback invoked for each text chunk

**Returns**: `Promise<string>` - Complete generated text

**Example**:

```typescript
let progressiveText = '';

const fullText = await writerManager.generateStreaming(
  'Write about reflection benefits',
  { tone: 'calm', length: 'medium' },
  'For a mindfulness app',
  (chunk) => {
    progressiveText += chunk;
    updateUI(progressiveText); // Update UI progressively
  }
);
```

**Notes**:

- Provides real-time updates as text generates
- Useful for showing progress to users
- Returns complete text when generation finishes

---

#### `destroy(): void`

Destroys all active writer sessions and frees resources.

**Example**:

```typescript
writerManager.destroy();
```

**Notes**:

- Call this when the manager is no longer needed
- Cleans up all cached sessions
- Sessions are automatically recreated on next use

---

#### `destroySession(options: WriterOptions): void`

Destroys a specific writer session.

**Parameters**:

- `options` (WriterOptions): Configuration identifying the session to destroy

**Example**:

```typescript
writerManager.destroySession({
  tone: 'calm',
  length: 'medium',
});
```

---

## PromptManager

Handles interactions with Chrome's Prompt API (LanguageModel).

**Note:** This was formerly called `AIManager`. See [Migration Guide](../product/MIGRATION_GUIDE.md) for details.

### Constructor

```typescript
const promptManager = new PromptManager();
```

No parameters required. The manager initializes lazily on first use.

### Methods

#### `checkAvailability(): Promise<boolean>`

Checks if Prompt API (LanguageModel) is available on the user's system.

**Returns**: `Promise<boolean>` - `true` if API is available, `false` otherwise

**Example**:

```typescript
const available = await promptManager.checkAvailability();
if (available) {
  console.log('Prompt API is ready to use');
} else {
  console.log('Prompt API unavailable, falling back to manual mode');
}
```

---

#### `summarize(content: string): Promise<string[]>`

Generates a three-bullet summary of the provided content.

**Parameters**:

- `content` (string): The article text to summarize

**Returns**: `Promise<string[]>` - Array of 3 summary bullets, or empty array on failure

**Example**:

```typescript
const content = 'Long article text here...';
const summary = await promptManager.summarize(content);
// Returns: [
//   "Insight: Main idea here",
//   "Surprise: Unexpected finding",
//   "Apply: Practical application"
// ]
```

**Notes**:

- Content is truncated to 2500 tokens if it exceeds 3000 tokens
- Implements 4-second timeout with one retry
- Returns empty array if AI is unavailable or times out

---

#### `generateReflectionPrompts(summary: string[]): Promise<string[]>`

Generates two reflection questions based on the summary.

**Parameters**:

- `summary` (string[]): Array of 3 summary bullets

**Returns**: `Promise<string[]>` - Array of 2 reflection questions, or empty array on failure

**Example**:

```typescript
const summary = [
  'Insight: Main idea',
  'Surprise: Unexpected finding',
  'Apply: Practical application',
];
const prompts = await promptManager.generateReflectionPrompts(summary);
// Returns: [
//   "How can you apply this insight to your current project?",
//   "What surprised you most about this finding?"
// ]
```

---

#### `proofread(text: string): Promise<string>`

Proofreads text for grammar and clarity improvements.

**Parameters**:

- `text` (string): The text to proofread

**Returns**: `Promise<string>` - Proofread version, or original text on failure

**Example**:

```typescript
const original = 'This is my reflection it has some errors.';
const proofread = await promptManager.proofread(original);
// Returns: "This is my reflection. It has some errors."
```

**Notes**:

- Preserves original tone and voice
- Makes maximum 2 edits per sentence
- Returns original text if AI is unavailable

---

#### `summarizeStreaming(content: string): AsyncGenerator<string>`

Generates summary with streaming response for progressive display.

**Parameters**:

- `content` (string): The article text to summarize

**Returns**: `AsyncGenerator<string>` - Yields partial summary text as it's generated

**Example**:

```typescript
for await (const chunk of promptManager.summarizeStreaming(content)) {
  console.log('Received chunk:', chunk);
  // Update UI progressively
}
```

---

#### `destroy(): void`

Destroys the current AI model session and frees resources.

**Example**:

```typescript
promptManager.destroy();
```

**Notes**:

- Call this when the manager is no longer needed
- Sessions are automatically recreated on next use

---

## StorageManager

Handles all Chrome storage operations for reflections and settings.

### Constructor

```typescript
const storageManager = new StorageManager();
```

### Methods

#### `saveReflection(reflection: Reflection): Promise<void>`

Saves a new reflection to storage.

**Parameters**:

- `reflection` (Reflection): The reflection object to save

**Returns**: `Promise<void>`

**Throws**: `StorageFullError` if storage quota is exceeded

**Example**:

```typescript
const reflection: Reflection = {
  id: generateUUID(),
  url: 'https://example.com/article',
  title: 'Article Title',
  createdAt: Date.now(),
  summary: ['Insight', 'Surprise', 'Apply'],
  reflection: ['Answer 1', 'Answer 2'],
};

await storageManager.saveReflection(reflection);
```

---

#### `getReflections(limit?: number): Promise<Reflection[]>`

Retrieves all reflections sorted by date (most recent first).

**Parameters**:

- `limit` (number, optional): Maximum number of reflections to return

**Returns**: `Promise<Reflection[]>` - Array of reflections

**Example**:

```typescript
// Get all reflections
const allReflections = await storageManager.getReflections();

// Get last 10 reflections
const recentReflections = await storageManager.getReflections(10);
```

**Notes**:

- Uses in-memory cache with 5-minute TTL
- Cache is invalidated on write operations

---

#### `getReflectionById(id: string): Promise<Reflection | null>`

Retrieves a single reflection by ID.

**Parameters**:

- `id` (string): The reflection ID (UUID)

**Returns**: `Promise<Reflection | null>` - The reflection or null if not found

**Example**:

```typescript
const reflection = await storageManager.getReflectionById('uuid-here');
if (reflection) {
  console.log('Found:', reflection.title);
}
```

---

#### `deleteReflection(id: string): Promise<void>`

Deletes a reflection by ID.

**Parameters**:

- `id` (string): The reflection ID to delete

**Returns**: `Promise<void>`

**Example**:

```typescript
await storageManager.deleteReflection('uuid-here');
```

**Notes**:

- Recalculates streak after deletion
- Invalidates cache

---

#### `exportJSON(): Promise<string>`

Exports all reflections in JSON format.

**Returns**: `Promise<string>` - JSON string of all reflections

**Example**:

```typescript
const json = await storageManager.exportJSON();
const blob = new Blob([json], { type: 'application/json' });
// Trigger download...
```

---

#### `exportMarkdown(): Promise<string>`

Exports all reflections in Markdown format.

**Returns**: `Promise<string>` - Markdown string of all reflections

**Example**:

```typescript
const markdown = await storageManager.exportMarkdown();
const blob = new Blob([markdown], { type: 'text/markdown' });
// Trigger download...
```

---

#### `getStreak(): Promise<StreakData>`

Gets current streak data.

**Returns**: `Promise<StreakData>` - Object with current streak and last reflection date

**Example**:

```typescript
const streak = await storageManager.getStreak();
console.log(`Current streak: ${streak.current} days`);
console.log(`Last reflection: ${streak.lastReflectionDate}`);
```

---

#### `checkStorageQuota(): Promise<{bytesUsed: number, quota: number}>`

Checks storage usage and quota.

**Returns**: `Promise<{bytesUsed: number, quota: number}>` - Storage statistics

**Example**:

```typescript
const { bytesUsed, quota } = await storageManager.checkStorageQuota();
const percentUsed = (bytesUsed / quota) * 100;
console.log(`Storage: ${percentUsed.toFixed(1)}% used`);
```

---

#### `isStorageNearLimit(): Promise<boolean>`

Checks if storage is near the quota limit (>90%).

**Returns**: `Promise<boolean>` - `true` if near limit

**Example**:

```typescript
if (await storageManager.isStorageNearLimit()) {
  console.warn('Storage nearly full. Consider exporting reflections.');
}
```

---

## SettingsManager

Manages user preferences and configuration.

### Constructor

```typescript
const settingsManager = new SettingsManager();
```

### Methods

#### `getSettings(): Promise<Settings>`

Loads current settings from storage.

**Returns**: `Promise<Settings>` - Current settings object

**Example**:

```typescript
const settings = await settingsManager.getSettings();
console.log(`Dwell threshold: ${settings.dwellThreshold}s`);
```

---

#### `updateSettings(partial: Partial<Settings>): Promise<void>`

Updates one or more settings.

**Parameters**:

- `partial` (Partial<Settings>): Object with settings to update

**Returns**: `Promise<void>`

**Example**:

```typescript
await settingsManager.updateSettings({
  dwellThreshold: 90,
  enableSound: false,
});
```

**Notes**:

- Only provided settings are updated
- Values are validated before saving
- Invalid values are rejected

---

#### `resetToDefaults(): Promise<void>`

Resets all settings to default values.

**Returns**: `Promise<void>`

**Example**:

```typescript
await settingsManager.resetToDefaults();
```

---

## DwellTracker

Monitors page visibility and user interaction to track dwell time.

### Constructor

```typescript
const dwellTracker = new DwellTracker(dwellThreshold?: number);
```

**Parameters**:

- `dwellThreshold` (number, optional): Threshold in seconds (default: 60)

### Methods

#### `startTracking(): void`

Starts tracking dwell time.

**Example**:

```typescript
dwellTracker.startTracking();
```

**Notes**:

- Sets up event listeners for visibility and user activity
- Starts internal timer
- Safe to call multiple times (no-op if already tracking)

---

#### `stopTracking(): void`

Stops tracking dwell time.

**Example**:

```typescript
dwellTracker.stopTracking();
```

**Notes**:

- Removes event listeners
- Stops internal timer
- Preserves current dwell time value

---

#### `reset(): void`

Resets dwell timer to zero.

**Example**:

```typescript
dwellTracker.reset();
```

**Notes**:

- Call this on page navigation
- Resets threshold reached flag

---

#### `getCurrentDwellTime(): number`

Gets current dwell time in seconds.

**Returns**: `number` - Current dwell time

**Example**:

```typescript
const dwellTime = dwellTracker.getCurrentDwellTime();
console.log(`User has been reading for ${dwellTime} seconds`);
```

---

#### `onThresholdReached(callback: () => void): void`

Registers callback to invoke when threshold is reached.

**Parameters**:

- `callback` (function): Function to call when threshold reached

**Example**:

```typescript
dwellTracker.onThresholdReached(() => {
  console.log('Threshold reached! Show lotus nudge.');
  showLotusNudge();
});
```

---

#### `setDwellThreshold(threshold: number): void`

Updates the dwell threshold.

**Parameters**:

- `threshold` (number): New threshold in seconds

**Example**:

```typescript
dwellTracker.setDwellThreshold(120); // 2 minutes
```

---

#### `destroy(): void`

Cleans up resources and removes event listeners.

**Example**:

```typescript
dwellTracker.destroy();
```

---

## ContentExtractor

Analyzes DOM structure and extracts main article content.

### Constructor

```typescript
const contentExtractor = new ContentExtractor(doc?: Document);
```

**Parameters**:

- `doc` (Document, optional): Document to extract from (default: `document`)

### Methods

#### `extractMainContent(): ExtractedContent`

Extracts main readable content from the page.

**Returns**: `ExtractedContent` - Object with title, text, url, and word count

**Example**:

```typescript
const content = contentExtractor.extractMainContent();
console.log(`Title: ${content.title}`);
console.log(`Words: ${content.wordCount}`);
console.log(`Text: ${content.text.substring(0, 100)}...`);
```

**Notes**:

- Uses heuristics to identify main content
- Excludes navigation, ads, sidebars
- Results are cached by URL

---

#### `getPageMetadata(): PageMetadata`

Extracts page metadata.

**Returns**: `PageMetadata` - Object with title, url, domain, and timestamp

**Example**:

```typescript
const metadata = contentExtractor.getPageMetadata();
console.log(`Domain: ${metadata.domain}`);
console.log(`Timestamp: ${new Date(metadata.timestamp)}`);
```

---

#### `clearCache(): void`

Clears cached content.

**Example**:

```typescript
contentExtractor.clearCache();
```

**Notes**:

- Forces re-extraction on next call
- Useful for testing or dynamic content

---

#### `checkTokenLimit(content: ExtractedContent): {exceeds: boolean, tokens: number}`

Checks if content exceeds token limit.

**Parameters**:

- `content` (ExtractedContent): Content to check

**Returns**: `{exceeds: boolean, tokens: number}` - Limit check result

**Example**:

```typescript
const content = contentExtractor.extractMainContent();
const { exceeds, tokens } = contentExtractor.checkTokenLimit(content);
if (exceeds) {
  console.warn(`Content has ${tokens} tokens (max: 3000)`);
}
```

---

#### `getTruncatedContent(content: ExtractedContent): ExtractedContent`

Truncates content if it exceeds token limit.

**Parameters**:

- `content` (ExtractedContent): Content to potentially truncate

**Returns**: `ExtractedContent` - Original or truncated content

**Example**:

```typescript
const content = contentExtractor.extractMainContent();
const truncated = contentExtractor.getTruncatedContent(content);
// Use truncated content for AI processing
```

---

## Utility Functions

### UUID Generation

#### `generateUUID(): string`

Generates a UUID v4 string.

**Returns**: `string` - UUID in format `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Example**:

```typescript
const id = generateUUID();
// Returns: "550e8400-e29b-41d4-a716-446655440000"
```

---

### Date Formatting

#### `formatDate(timestamp: number): string`

Formats timestamp as human-readable date.

**Parameters**:

- `timestamp` (number): Unix timestamp in milliseconds

**Returns**: `string` - Formatted date (e.g., "January 1, 2025")

**Example**:

```typescript
const formatted = formatDate(Date.now());
// Returns: "January 27, 2025"
```

---

#### `formatISODate(timestamp: number): string`

Formats timestamp as ISO date string.

**Parameters**:

- `timestamp` (number): Unix timestamp in milliseconds

**Returns**: `string` - ISO date (e.g., "2025-01-01")

**Example**:

```typescript
const iso = formatISODate(Date.now());
// Returns: "2025-01-27"
```

---

### Text Processing

#### `sanitizeText(text: string): string`

Sanitizes text by removing extra whitespace and normalizing.

**Parameters**:

- `text` (string): Text to sanitize

**Returns**: `string` - Sanitized text

**Example**:

```typescript
const sanitized = sanitizeText('  Multiple   spaces\n\n\nhere  ');
// Returns: "Multiple spaces here"
```

---

#### `countWords(text: string): number`

Counts words in text.

**Parameters**:

- `text` (string): Text to count words in

**Returns**: `number` - Word count

**Example**:

```typescript
const count = countWords('Hello world, this is a test.');
// Returns: 6
```

---

#### `estimateTokens(text: string): number`

Estimates token count for text.

**Parameters**:

- `text` (string): Text to estimate tokens for

**Returns**: `number` - Estimated token count

**Example**:

```typescript
const tokens = estimateTokens('This is a sample text.');
// Returns: ~6 (1 token ≈ 0.75 words)
```

**Notes**:

- Uses simple estimation: 1 token ≈ 0.75 words
- Actual token count may vary

---

#### `truncateToTokens(text: string, maxTokens: number): string`

Truncates text to maximum token count.

**Parameters**:

- `text` (string): Text to truncate
- `maxTokens` (number): Maximum tokens

**Returns**: `string` - Truncated text

**Example**:

```typescript
const truncated = truncateToTokens(longText, 2500);
// Returns text with ~2500 tokens
```

---

### Streak Calculation

#### `calculateStreak(dates: string[]): number`

Calculates reflection streak from dates.

**Parameters**:

- `dates` (string[]): Array of ISO date strings (sorted, most recent first)

**Returns**: `number` - Current streak in days

**Example**:

```typescript
const dates = ['2025-01-27', '2025-01-26', '2025-01-25'];
const streak = calculateStreak(dates);
// Returns: 3
```

**Notes**:

- Dates must be in ISO format (YYYY-MM-DD)
- Dates should be sorted (most recent first)
- Streak breaks if any day is missing

---

### Domain Extraction

#### `extractDomain(url: string): string`

Extracts domain from URL.

**Parameters**:

- `url` (string): Full URL

**Returns**: `string` - Domain name

**Example**:

```typescript
const domain = extractDomain('https://www.example.com/article');
// Returns: "example.com"
```

---

## Type Definitions

### Reflection

```typescript
type Reflection = {
  id: string; // UUID v4
  url: string; // Full page URL
  title: string; // Page title
  createdAt: number; // Unix timestamp (ms)
  summary: string[]; // [Insight, Surprise, Apply]
  reflection: string[]; // User answers to prompts
  proofreadVersion?: string; // Optional proofread text
  tags?: string[]; // Optional user tags
  embedding?: number[]; // Optional 128-d vector
};
```

---

### Settings

```typescript
type Settings = {
  dwellThreshold: number; // 0-60 seconds (0 = instant)
  enableSound: boolean; // Audio playback
  reduceMotion: boolean; // Animation control
  proofreadEnabled: boolean; // Proofread feature
  privacyMode: 'local' | 'sync'; // Storage mode
};
```

---

### ExtractedContent

```typescript
type ExtractedContent = {
  title: string; // Page title
  text: string; // Main content text
  url: string; // Page URL
  wordCount: number; // Word count
};
```

---

### PageMetadata

```typescript
type PageMetadata = {
  title: string; // Page title
  url: string; // Page URL
  domain: string; // Domain name
  timestamp: number; // Unix timestamp (ms)
};
```

---

### StreakData

```typescript
type StreakData = {
  current: number; // Current streak in days
  lastReflectionDate: string; // ISO date string
};
```

---

## Message API

The extension uses Chrome's message passing API for communication between components.

### Message Format

```typescript
type Message = {
  action: string; // Action type
  data?: any; // Optional data payload
};

type Response = {
  success: boolean; // Success flag
  data?: any; // Optional response data
  error?: string; // Optional error message
};
```

---

### Content Script → Background

#### Summarize Content

```typescript
chrome.runtime.sendMessage(
  {
    action: 'summarize',
    data: {
      content: 'Article text here...',
    },
  },
  (response) => {
    if (response.success) {
      const summary = response.data.summary; // string[]
    }
  }
);
```

---

#### Generate Reflection Prompts

```typescript
chrome.runtime.sendMessage(
  {
    action: 'reflect',
    data: {
      summary: ['Insight', 'Surprise', 'Apply'],
    },
  },
  (response) => {
    if (response.success) {
      const prompts = response.data.prompts; // string[]
    }
  }
);
```

---

#### Proofread Text

```typescript
chrome.runtime.sendMessage(
  {
    action: 'proofread',
    data: {
      text: 'User reflection text...',
    },
  },
  (response) => {
    if (response.success) {
      const proofread = response.data.proofread; // string
    }
  }
);
```

---

#### Save Reflection

```typescript
chrome.runtime.sendMessage(
  {
    action: 'save',
    data: {
      reflection: {
        id: generateUUID(),
        url: window.location.href,
        title: document.title,
        createdAt: Date.now(),
        summary: ['...'],
        reflection: ['...'],
      },
    },
  },
  (response) => {
    if (response.success) {
      console.log('Reflection saved');
    }
  }
);
```

---

### Popup → Background

#### Load Reflections

```typescript
chrome.runtime.sendMessage(
  {
    action: 'load',
    data: {
      limit: 50, // optional
    },
  },
  (response) => {
    if (response.success) {
      const reflections = response.data.reflections; // Reflection[]
    }
  }
);
```

---

#### Check AI Availability

```typescript
chrome.runtime.sendMessage(
  {
    action: 'checkAI',
  },
  (response) => {
    if (response.success) {
      const available = response.data.available; // boolean
    }
  }
);
```

---

## Error Handling

All async methods may throw errors. Always use try-catch blocks:

```typescript
try {
  const summary = await promptManager.summarize(content);
  // Handle success
} catch (error) {
  if (error instanceof StorageFullError) {
    // Handle storage full
  } else {
    // Handle other errors
  }
}
```

### Custom Errors

#### StorageFullError

```typescript
class StorageFullError extends Error {
  bytesUsed: number;
  quota: number;

  constructor(message?: string, bytesUsed?: number, quota?: number);
}
```

**Example**:

```typescript
try {
  await storageManager.saveReflection(reflection);
} catch (error) {
  if (error instanceof StorageFullError) {
    console.error(`Storage full: ${error.bytesUsed}/${error.quota} bytes`);
    // Prompt user to export
  }
}
```

---

## Best Practices

1. **Always check AI availability** before calling AI methods
2. **Handle timeouts gracefully** with fallback to manual mode
3. **Cache aggressively** to reduce storage API calls
4. **Validate user input** before saving to storage
5. **Clean up resources** by calling `destroy()` methods
6. **Use TypeScript** for type safety and better IDE support
7. **Log errors** to console for debugging
8. **Test edge cases** like empty content, storage full, AI unavailable

---

## Examples

### Complete Reflection Flow

```typescript
// 1. Track dwell time
const dwellTracker = new DwellTracker(60);
dwellTracker.onThresholdReached(async () => {
  // 2. Extract content
  const extractor = new ContentExtractor();
  const content = extractor.extractMainContent();

  // 3. Check AI availability
  const promptManager = new PromptManager();
  const available = await promptManager.checkAvailability();

  if (!available) {
    // Fall back to manual mode
    showManualReflectionMode();
    return;
  }

  // 4. Generate summary
  const summary = await promptManager.summarize(content.text);

  // 5. Generate prompts
  const prompts = await promptManager.generateReflectionPrompts(summary);

  // 6. Show overlay
  showReflectModeOverlay(summary, prompts);

  // 7. User enters reflections and saves
  // (handled by overlay component)
});

dwellTracker.startTracking();
```

---

For more examples, see the source code in `src/` directory.
