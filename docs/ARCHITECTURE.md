# Reflexa AI Architecture Documentation

This document provides a comprehensive overview of the Reflexa AI Chrome Extension architecture, component interactions, and technical implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Storage Architecture](#storage-architecture)
5. [AI Integration](#ai-integration)
6. [Performance Considerations](#performance-considerations)
7. [Security & Privacy](#security--privacy)
8. [Extension Lifecycle](#extension-lifecycle)

## System Overview

Reflexa AI is a Chrome Manifest V3 extension that combines:

- **Content script** for page monitoring and UI injection
- **Background service worker** for AI orchestration and data management
- **Popup dashboard** for reflection history and statistics
- **Options page** for user settings

### Technology Stack

| Layer        | Technology                     | Purpose                                  |
| ------------ | ------------------------------ | ---------------------------------------- |
| Framework    | React 18 + TypeScript 5        | UI components and type safety            |
| Build Tool   | Vite 5 + CRXJS                 | Fast builds and HMR for extensions       |
| Styling      | Tailwind CSS v4                | Utility-first styling with design tokens |
| AI           | Chrome Gemini Nano             | Local on-device inference                |
| Storage      | Chrome Storage API             | Persistent data storage                  |
| Testing      | Vitest + React Testing Library | Unit and integration tests               |
| Code Quality | ESLint 9 + Prettier 3          | Linting and formatting                   |

### Design Principles

1. **Privacy First**: All AI processing happens locally, no external API calls
2. **Performance**: Minimal impact on page load and browsing experience
3. **Accessibility**: WCAG AA compliant with keyboard navigation
4. **Zen Aesthetic**: Calming design with breathing animations and ambient audio
5. **Progressive Enhancement**: Graceful degradation when AI is unavailable

## Component Architecture

### 1. Content Script (`src/content/`)

**Purpose**: Monitors user behavior on web pages and injects the Reflect Mode UI.

#### Key Modules

##### DwellTracker (`dwellTracker.ts`)

Tracks time spent on a page with active engagement.

**Responsibilities**:

- Monitor page visibility using Page Visibility API
- Detect user interactions (scroll, mouse, keyboard, touch)
- Pause timer when tab is hidden or user is inactive
- Notify when dwell threshold is reached

**Key Methods**:

```typescript
class DwellTracker {
  startTracking(): void; // Begin monitoring
  stopTracking(): void; // Stop monitoring
  reset(): void; // Reset timer to zero
  getCurrentDwellTime(): number; // Get current time in seconds
  onThresholdReached(callback): void; // Register threshold callback
  setDwellThreshold(seconds): void; // Update threshold
}
```

**Implementation Details**:

- Uses `setInterval` with 1-second ticks
- Tracks last activity timestamp
- 30-second inactivity timeout pauses tracking
- Bound event handlers for proper cleanup

##### ContentExtractor (`contentExtractor.ts`)

Analyzes DOM structure to extract main article content.

**Responsibilities**:

- Identify main content container using heuristics
- Exclude navigation, ads, sidebars, and footers
- Extract page title from multiple sources
- Calculate word count and estimate tokens
- Cache results for performance

**Key Methods**:

```typescript
class ContentExtractor {
  extractMainContent(): ExtractedContent; // Get main text content
  getPageMetadata(): PageMetadata; // Get title, URL, domain
  clearCache(): void; // Force re-extraction
  checkTokenLimit(content): { exceeds; tokens }; // Check if content too large
  getTruncatedContent(content): ExtractedContent; // Truncate if needed
}
```

**Heuristics**:

1. Try semantic selectors (`<article>`, `<main>`, `[role="article"]`)
2. Calculate content density (text vs markup ratio)
3. Prefer elements with high paragraph count
4. Penalize high link density (suggests navigation)
5. Exclude common ad/nav patterns

**Performance Optimizations**:

- Caches extracted content by URL
- Limits DOM traversal to first 20 elements
- Early exit when high-scoring element found
- Clones elements to avoid DOM modifications

##### React Components

**LotusNudge.tsx**

- Floating lotus icon that appears after dwell threshold
- Pulse animation to draw attention
- Click handler to trigger Reflect Mode
- Positioned with fixed positioning and high z-index

**ReflectModeOverlay.tsx**

- Full-screen overlay with gradient background
- Displays breathing orb, summary, and reflection inputs
- Handles save/cancel actions
- Manages audio playback
- Implements keyboard shortcuts

**BreathingOrb.tsx**

- Animated circular element with 7-second cycle
- CSS-based animation for performance
- Respects reduced motion preferences
- Radial gradient for visual depth

#### Content Script Lifecycle

```
Page Load
    ↓
Initialize DwellTracker & ContentExtractor
    ↓
Start tracking dwell time
    ↓
Threshold reached?
    ↓ Yes
Show LotusNudge
    ↓
User clicks?
    ↓ Yes
Extract content
    ↓
Send to background worker
    ↓
Receive AI results
    ↓
Render ReflectModeOverlay
    ↓
User saves/cancels
    ↓
Clean up and reset
```

### 2. Background Service Worker (`src/background/`)

**Purpose**: Orchestrates AI operations, manages data persistence, and coordinates between components.

#### Key Modules

##### AIManager (`aiManager.ts`)

Handles all interactions with Chrome's Gemini Nano AI.

**Responsibilities**:

- Check AI availability on device
- Initialize and manage AI model sessions
- Generate summaries with three-bullet format
- Create reflection prompts
- Proofread user text
- Handle timeouts and retries
- Parse and validate AI responses

**Key Methods**:

```typescript
class AIManager {
  checkAvailability(): Promise<boolean>;
  summarize(content: string): Promise<string[]>;
  generateReflectionPrompts(summary: string[]): Promise<string[]>;
  proofread(text: string): Promise<string>;
  summarizeStreaming(content: string): AsyncGenerator<string>;
  destroy(): void;
}
```

**AI Session Management**:

- Creates model sessions with 5-minute TTL
- Validates session health before each request
- Recreates stale or invalid sessions
- Monitors download progress for model

**Timeout & Retry Logic**:

- 4-second timeout per request
- Automatic retry once on timeout
- AbortController for cancellation
- Detailed logging for debugging

**Response Parsing**:

- Validates summary has exactly 3 bullets
- Ensures reflection questions end with '?'
- Fallback parsing for unexpected formats
- Word count validation (20 words for summary, 15 for questions)

##### StorageManager (`storageManager.ts`)

Abstracts Chrome Storage API operations.

**Responsibilities**:

- Save and retrieve reflections
- Calculate and update streak data
- Export reflections in JSON/Markdown
- Check storage quota
- Cache reflections for performance

**Key Methods**:

```typescript
class StorageManager {
  saveReflection(reflection: Reflection): Promise<void>;
  getReflections(limit?: number): Promise<Reflection[]>;
  getReflectionById(id: string): Promise<Reflection | null>;
  deleteReflection(id: string): Promise<void>;
  exportJSON(): Promise<string>;
  exportMarkdown(): Promise<string>;
  getStreak(): Promise<StreakData>;
  checkStorageQuota(): Promise<{ bytesUsed; quota }>;
  isStorageNearLimit(): Promise<boolean>;
}
```

**Caching Strategy**:

- In-memory cache with 5-minute TTL
- Invalidated on write operations
- Reduces storage API calls
- Improves dashboard load time

**Streak Calculation**:

- Counts consecutive days with reflections
- Updates on each save
- Recalculates on deletion
- Stores last reflection date

##### SettingsManager (`settingsManager.ts`)

Manages user preferences and configuration.

**Responsibilities**:

- Load and save settings
- Validate setting values
- Provide default settings
- Reset to defaults

**Key Methods**:

```typescript
class SettingsManager {
  getSettings(): Promise<Settings>;
  updateSettings(partial: Partial<Settings>): Promise<void>;
  resetToDefaults(): Promise<void>;
}
```

**Settings Schema**:

```typescript
type Settings = {
  dwellThreshold: number; // 30-300 seconds
  enableSound: boolean; // Audio playback
  reduceMotion: boolean; // Animation control
  proofreadEnabled: boolean; // Proofread feature
  privacyMode: 'local' | 'sync'; // Storage mode
};
```

#### Message Handling

The background worker uses message passing for all communication:

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'summarize':
    // Extract content, call AI, return summary
    case 'reflect':
    // Generate reflection prompts
    case 'proofread':
    // Proofread user text
    case 'save':
    // Save reflection to storage
    case 'load':
    // Load reflections from storage
    case 'checkAI':
    // Check AI availability
  }
});
```

### 3. Popup Dashboard (`src/popup/`)

**Purpose**: Displays reflection history, statistics, and provides export functionality.

#### Component Hierarchy

```
App.tsx
├── Header
│   ├── Logo
│   └── ExportButton
├── StreakCounter
│   ├── StreakDisplay
│   └── LastReflectionDate
├── CalmStats
│   ├── TotalReflections
│   ├── AveragePerDay
│   └── TimeRatioVisualization
├── ReflectionList (VirtualList)
│   └── ReflectionCard[]
│       ├── PageTitle (link)
│       ├── Date
│       ├── SummaryBullets
│       ├── ReflectionText
│       └── DeleteButton
└── ExportModal
    ├── FormatSelector
    └── DownloadButton
```

#### Key Features

**Virtual Scrolling**:

- Renders only visible reflection cards
- Improves performance with large collections
- Smooth scrolling experience
- Implemented with `VirtualList.tsx`

**Streak Counter**:

- Displays current streak with flame icon
- Shows last reflection date
- Animates on streak increase
- Motivates daily reflection habit

**Calm Stats**:

- Total reflections count
- Average reflections per day
- Reading vs reflection time ratio
- Visual progress bars

**Export Modal**:

- Radio buttons for format selection
- Generates filename with current date
- Triggers browser download
- Closes on completion or cancel

### 4. Options Page (`src/options/`)

**Purpose**: Provides user interface for configuring extension settings.

#### Component Structure

```
App.tsx
├── SettingsSection (Behavior)
│   └── Slider (Dwell Threshold)
├── SettingsSection (Accessibility)
│   ├── Toggle (Enable Sound)
│   ├── Toggle (Reduce Motion)
│   └── Toggle (Enable Proofreading)
├── SettingsSection (Privacy)
│   └── RadioGroup (Storage Mode)
├── SaveIndicator
└── ResetButton
```

#### Key Features

**Auto-save**:

- Debounced save on setting change (500ms)
- Visual feedback with SaveIndicator
- No explicit save button needed

**Validation**:

- Dwell threshold: 30-300 seconds
- Boolean toggles: true/false
- Privacy mode: 'local' or 'sync'

**Reset to Defaults**:

- Confirmation dialog
- Restores all settings
- Does not delete reflections

## Data Flow

### Reflection Creation Flow

```
1. User reads article
   ↓
2. Content Script: DwellTracker detects threshold
   ↓
3. Content Script: Shows LotusNudge
   ↓
4. User clicks lotus icon
   ↓
5. Content Script: ContentExtractor extracts content
   ↓
6. Content Script → Background: Send content via message
   ↓
7. Background: AIManager.summarize(content)
   ↓
8. Background: AIManager.generateReflectionPrompts(summary)
   ↓
9. Background → Content Script: Return AI results
   ↓
10. Content Script: Render ReflectModeOverlay
    ↓
11. User enters reflections
    ↓
12. User clicks Save
    ↓
13. Content Script → Background: Send reflection data
    ↓
14. Background: StorageManager.saveReflection()
    ↓
15. Background: Update streak data
    ↓
16. Background → Content Script: Confirm save
    ↓
17. Content Script: Close overlay, play completion sound
```

### Dashboard Load Flow

```
1. User clicks extension icon
   ↓
2. Popup: Load settings from background
   ↓
3. Popup: Request reflections from background
   ↓
4. Background: StorageManager.getReflections()
   ↓
5. Background: Check cache (5-min TTL)
   ↓
6. Background: Return reflections to popup
   ↓
7. Popup: Calculate streak
   ↓
8. Popup: Calculate statistics
   ↓
9. Popup: Render components
   ↓
10. Popup: Virtual scroll renders visible cards
```

### Settings Update Flow

```
1. User changes setting in options page
   ↓
2. Options: Debounce 500ms
   ↓
3. Options → Background: Send updated settings
   ↓
4. Background: SettingsManager.updateSettings()
   ↓
5. Background: Validate values
   ↓
6. Background: Save to chrome.storage.local
   ↓
7. Background → Options: Confirm save
   ↓
8. Options: Show SaveIndicator
   ↓
9. Options: Hide indicator after 2s
```

## Storage Architecture

### Chrome Storage API

Reflexa AI uses `chrome.storage.local` by default, with optional `chrome.storage.sync`.

#### Storage Schema

```typescript
{
  // Reflections array
  "reflexa_reflections": [
    {
      id: "uuid-v4",
      url: "https://example.com/article",
      title: "Article Title",
      createdAt: 1234567890,
      summary: ["Insight", "Surprise", "Apply"],
      reflection: ["Answer 1", "Answer 2"],
      proofreadVersion?: "Proofread text",
      tags?: ["tag1", "tag2"]
    }
  ],

  // Settings object
  "reflexa_settings": {
    dwellThreshold: 60,
    enableSound: true,
    reduceMotion: false,
    proofreadEnabled: false,
    privacyMode: "local"
  },

  // Streak data
  "reflexa_streak": {
    current: 5,
    lastReflectionDate: "2025-01-01"
  }
}
```

#### Storage Limits

| Storage Type         | Limit   | Notes                                   |
| -------------------- | ------- | --------------------------------------- |
| chrome.storage.local | ~5 MB   | Sufficient for thousands of reflections |
| chrome.storage.sync  | ~100 KB | Limited, use only if sync enabled       |
| Reflection size      | ~1-2 KB | Varies based on content length          |

#### Storage Optimization

1. **Caching**: In-memory cache reduces API calls
2. **Compression**: Text is stored as-is (no compression needed for small data)
3. **Indexing**: Reflections sorted by timestamp for fast retrieval
4. **Cleanup**: Export and delete old reflections when near limit

## AI Integration

### Chrome Gemini Nano

Reflexa AI uses Chrome's built-in Prompt API to access Gemini Nano.

#### API Access

```typescript
// Check availability
const availability = await window.ai.languageModel.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create session
const model = await window.ai.languageModel.create({
  systemPrompt: 'You are a helpful assistant...',
  monitor: (m) => {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${e.loaded * 100}%`);
    });
  },
});

// Generate response
const response = await model.prompt('Summarize this article...', {
  signal: abortController.signal,
});

// Streaming response
const stream = model.promptStreaming('Summarize...');
for await (const chunk of stream) {
  console.log(chunk);
}

// Cleanup
model.destroy();
```

#### Session Management

- **TTL**: 5 minutes per session
- **Validation**: Health check before each request
- **Recreation**: Automatic on stale/invalid sessions
- **Cleanup**: Explicit destroy on component unmount

#### Prompt Engineering

**Summarization Prompt**:

```
Summarize the following article into exactly 3 bullets, each no more than 20 words:

1. Insight: The main idea or key takeaway
2. Surprise: Something unexpected or counterintuitive
3. Apply: How to use this information practically

Article:
{content}

Format your response as:
- Insight: [text]
- Surprise: [text]
- Apply: [text]
```

**Reflection Prompt**:

```
Based on this summary, generate exactly 2 concise, action-oriented reflection questions (max 15 words each):

Summary:
{summary}

Format your response as:
1. [First question]
2. [Second question]

Make questions thought-provoking and focused on application or deeper understanding.
```

**Proofreading Prompt**:

```
Proofread the following text for grammar and clarity. Preserve the original tone and voice. Make no more than 2 edits per sentence:

{text}

Return only the proofread version without explanations.
```

#### Error Handling

1. **Unavailable**: Fall back to manual mode
2. **Timeout**: Retry once, then manual mode
3. **Invalid response**: Use fallback parsing
4. **Content too large**: Truncate to 2500 tokens

## Performance Considerations

### Content Script Performance

**Optimization Strategies**:

1. **Shadow DOM**: Isolates styles, prevents conflicts
2. **Lazy loading**: Components loaded only when needed
3. **Event delegation**: Minimizes event listeners
4. **Debouncing**: Activity detection debounced to 30s
5. **Caching**: Content extraction cached by URL

**Performance Targets**:

- Overlay render: < 300ms
- Content extraction: < 100ms
- Dwell tracking overhead: < 1% CPU

### Background Worker Performance

**Optimization Strategies**:

1. **Caching**: 5-minute TTL for reflections
2. **Batch operations**: Group storage writes
3. **Lazy initialization**: AI model created on demand
4. **Session reuse**: Keep model alive for 5 minutes

**Performance Targets**:

- AI summarization: < 4 seconds
- Storage operations: < 50ms
- Message handling: < 10ms

### Dashboard Performance

**Optimization Strategies**:

1. **Virtual scrolling**: Render only visible cards
2. **React.memo**: Prevent unnecessary re-renders
3. **Lazy loading**: Load reflections on demand
4. **Debounced search**: If search feature added

**Performance Targets**:

- Initial load: < 500ms
- Scroll performance: 60 FPS
- Card render: < 16ms per card

### Animation Performance

**Optimization Strategies**:

1. **CSS animations**: Use GPU-accelerated properties
2. **Transform/opacity**: Avoid layout-triggering properties
3. **RequestAnimationFrame**: For JS animations
4. **Reduced motion**: Disable for accessibility

**Performance Targets**:

- Breathing orb: 60 FPS
- Fade animations: 60 FPS
- No layout thrashing

## Security & Privacy

### Privacy Guarantees

1. **Local AI**: All inference happens on-device
2. **No external calls**: Zero network requests for AI
3. **Local storage**: Data stays in Chrome profile
4. **Optional sync**: User must explicitly enable
5. **No tracking**: No analytics or telemetry

### Security Measures

1. **Content Security Policy**: Strict CSP in manifest
2. **Permissions**: Minimal required permissions
3. **Input sanitization**: All user input sanitized
4. **XSS prevention**: React's built-in protection
5. **Storage encryption**: Chrome handles encryption

### Permissions Required

```json
{
  "permissions": [
    "storage", // Save reflections
    "activeTab" // Access current tab content
  ],
  "host_permissions": [
    "<all_urls>" // Inject content script
  ]
}
```

## Extension Lifecycle

### Installation

```
1. User installs extension
   ↓
2. Background worker starts
   ↓
3. Check AI availability
   ↓
4. Initialize default settings
   ↓
5. Show privacy notice on first popup open
```

### Runtime

```
1. User navigates to page
   ↓
2. Content script injected
   ↓
3. DwellTracker starts
   ↓
4. Threshold reached → Show nudge
   ↓
5. User interacts → Reflect Mode
   ↓
6. Save reflection → Update storage
   ↓
7. Page navigation → Reset tracker
```

### Update

```
1. Extension updated
   ↓
2. Background worker restarted
   ↓
3. Content scripts reinjected
   ↓
4. Settings migrated if needed
   ↓
5. Cache invalidated
```

### Uninstallation

```
1. User uninstalls extension
   ↓
2. Chrome removes extension files
   ↓
3. Storage data deleted (unless sync enabled)
   ↓
4. Content scripts removed from pages
```

## Future Enhancements

### Planned Features

1. **Tagging system**: Organize reflections by topic
2. **Search functionality**: Find reflections by keyword
3. **Embedding generation**: Semantic search with vectors
4. **Custom prompts**: User-defined AI prompts
5. **Reflection editing**: Edit saved reflections
6. **Import functionality**: Import from JSON/Markdown
7. **Mobile support**: Chrome for Android
8. **Collaboration**: Share reflections with others

### Technical Debt

1. **Test coverage**: Increase to 80%+
2. **Error boundaries**: Add React error boundaries
3. **Logging**: Structured logging system
4. **Monitoring**: Performance monitoring
5. **Internationalization**: Multi-language support

## Conclusion

Reflexa AI's architecture prioritizes privacy, performance, and user experience. The modular design allows for easy maintenance and future enhancements while maintaining the core principles of local AI processing and calm, reflective interactions.

For more details on specific components, see the inline code comments in the source files.
