# Design Document

## Overview

Reflexa AI is architected as a Chrome Manifest V3 extension with four primary components: a content script for page interaction monitoring and UI injection, a background service worker for AI orchestration and data management, a popup dashboard for reflection history, and an options page for user settings. The system leverages Chrome's Gemini Nano AI for on-device summarization and reflection prompting, ensuring complete privacy by never transmitting data externally. The design emphasizes a Zen-inspired aesthetic with calming animations, ambient audio, and a breathing orb visual that creates a meditative reflection experience.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────────────────┐      │
│  │  Web Page    │         │   Extension Popup        │      │
│  │              │         │   (Dashboard)            │      │
│  │  ┌────────┐  │         │                          │      │
│  │  │Content │  │         │  - Reflection History    │      │
│  │  │Script  │  │         │  - Streak Counter        │      │
│  │  │        │  │         │  - Calm Stats            │      │
│  │  │ • Dwell│  │         │  - Export Button         │      │
│  │  │   Timer│  │         └──────────────────────────┘      │
│  │  │ • DOM  │  │                                            │
│  │  │   Extract│ │         ┌──────────────────────────┐     │
│  │  │ • Overlay│ │         │   Options Page           │     │
│  │  │   Inject│  │         │                          │     │
│  │  └────┬───┘  │         │  - Dwell Threshold       │     │
│  │       │      │         │  - Enable Sound          │     │
│  │  ┌────▼────┐ │         │  - Reduce Motion         │     │
│  │  │ Reflect │ │         │  - Privacy Mode          │     │
│  │  │  Mode   │ │         │  - Proofread Enable      │     │
│  │  │ Overlay │ │         └──────────────────────────┘     │
│  │  └─────────┘ │                                            │
│  └──────────────┘                                            │
│         │                                                    │
│         │ chrome.runtime.sendMessage()                      │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────┐        │
│  │   Background Service Worker                     │        │
│  │                                                  │        │
│  │   ┌──────────────┐      ┌──────────────────┐   │        │
│  │   │ AI Manager   │      │ Storage Manager  │   │        │
│  │   │              │      │                  │   │        │
│  │   │ • Summarize  │      │ • Save/Load      │   │        │
│  │   │ • Reflect    │      │ • Export         │   │        │
│  │   │ • Proofread  │      │ • Settings       │   │        │
│  │   └──────┬───────┘      └──────────────────┘   │        │
│  │          │                                      │        │
│  │          ▼                                      │        │
│  │   ┌──────────────────────────────────┐         │        │
│  │   │  chrome.aiOriginTrial            │         │        │
│  │   │  (Gemini Nano)                   │         │        │
│  │   │                                  │         │        │
│  │   │  • Local AI Inference            │         │        │
│  │   │  • No Network Calls              │         │        │
│  │   └──────────────────────────────────┘         │        │
│  └─────────────────────────────────────────────────┘        │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────┐        │
│  │   Chrome Storage API                            │        │
│  │                                                  │        │
│  │   • chrome.storage.local (default)              │        │
│  │   • chrome.storage.sync (opt-in)                │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Dwell Detection**: Content script monitors page visibility and user interaction, tracking time spent on page
2. **Nudge Display**: When threshold reached, content script shows floating lotus icon
3. **Activation**: User clicks lotus icon, content script sends message to background worker
4. **Content Extraction**: Content script extracts main article text and sends to background worker
5. **AI Processing**: Background worker calls Gemini Nano for summarization and reflection prompts
6. **UI Rendering**: Content script receives AI results and renders Reflect Mode overlay
7. **User Interaction**: User reads summary, answers reflection questions in overlay
8. **Data Persistence**: User saves reflection, background worker stores to Chrome storage
9. **Dashboard Access**: User opens popup, dashboard loads reflections from storage

## Components and Interfaces

### Content Script (`src/content/`)

**Purpose**: Monitors user behavior on web pages, extracts content, and injects the Reflect Mode UI.

**Key Modules**:

- `detectDwell.ts`: Tracks page visibility and user interaction to calculate dwell time
- `extractContent.ts`: Parses DOM to identify and extract main article content
- `overlay.tsx`: React component for Reflect Mode full-screen overlay
- `nudge.tsx`: React component for floating lotus icon
- `styles.css`: Tailwind-based styles for injected UI

**Interfaces**:

```typescript
interface DwellTracker {
  startTracking(): void;
  stopTracking(): void;
  getCurrentDwellTime(): number;
  onThresholdReached(callback: () => void): void;
}

interface ContentExtractor {
  extractMainContent(): ExtractedContent;
  getPageMetadata(): PageMetadata;
}

interface ExtractedContent {
  title: string;
  text: string;
  url: string;
  wordCount: number;
}

interface PageMetadata {
  title: string;
  url: string;
  domain: string;
  timestamp: number;
}
```

**Design Decisions**:

- Use Intersection Observer API for efficient visibility tracking
- Employ heuristics to identify main content (article tags, content density, semantic HTML)
- Inject React root into isolated shadow DOM to prevent style conflicts
- Limit content extraction to 3000 tokens to respect AI model limits

### Background Service Worker (`src/background/`)

**Purpose**: Orchestrates AI operations, manages data persistence, and coordinates between components.

**Key Modules**:

- `index.ts`: Main service worker entry point and message router
- `aiManager.ts`: Handles all Gemini Nano API interactions
- `storageManager.ts`: Abstracts Chrome storage operations
- `settingsManager.ts`: Manages user preferences and configuration

**Interfaces**:

```typescript
interface AIManager {
  summarize(content: string): Promise<string[]>;
  generateReflectionPrompts(content: string): Promise<string[]>;
  proofread(text: string): Promise<string>;
  checkAvailability(): Promise<boolean>;
}

interface StorageManager {
  saveReflection(reflection: Reflection): Promise<void>;
  getReflections(limit?: number): Promise<Reflection[]>;
  getReflectionById(id: string): Promise<Reflection | null>;
  deleteReflection(id: string): Promise<void>;
  exportReflections(format: 'json' | 'markdown'): Promise<string>;
}

interface SettingsManager {
  getSettings(): Promise<Settings>;
  updateSettings(partial: Partial<Settings>): Promise<void>;
  resetToDefaults(): Promise<void>;
}
```

**Design Decisions**:

- Use message passing for all cross-component communication
- Implement retry logic with exponential backoff for AI calls
- Cache settings in memory to reduce storage reads
- Implement graceful degradation when Gemini Nano unavailable

### Popup Dashboard (`src/popup/`)

**Purpose**: Displays reflection history, statistics, and provides export functionality.

**Key Components**:

- `App.tsx`: Main popup application shell
- `Dashboard.tsx`: Primary view with reflection list and stats
- `ReflectionCard.tsx`: Individual reflection display component
- `StreakCounter.tsx`: Visual streak display with animation
- `CalmStats.tsx`: Reading vs reflection time visualization
- `ExportModal.tsx`: Export format selection and download

**Interfaces**:

```typescript
interface DashboardProps {
  reflections: Reflection[];
  streak: number;
  stats: CalmStats;
  onExport: (format: 'json' | 'markdown') => void;
}

interface ReflectionCardProps {
  reflection: Reflection;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

interface CalmStats {
  totalReflections: number;
  averagePerDay: number;
  totalReadingTime: number;
  totalReflectionTime: number;
  reflectionRatio: number;
}
```

**Design Decisions**:

- Use React Context for theme and settings state
- Implement virtual scrolling for large reflection lists
- Cache reflection data with 5-minute TTL to reduce storage reads
- Use Framer Motion for smooth card animations

### Options Page (`src/options/`)

**Purpose**: Provides user interface for configuring extension settings.

**Key Components**:

- `Settings.tsx`: Main settings page component
- `SettingsSection.tsx`: Reusable settings group component
- `Toggle.tsx`: Accessible toggle switch component
- `Slider.tsx`: Range slider for dwell threshold

**Interfaces**:

```typescript
interface SettingsPageProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}
```

**Design Decisions**:

- Auto-save settings on change with debouncing
- Provide visual feedback for save operations
- Include reset to defaults button
- Display current values alongside controls

### Reflect Mode Overlay (`src/content/overlay.tsx`)

**Purpose**: Full-screen meditative interface for viewing summaries and writing reflections.

**Key Features**:

- Breathing orb animation (7-second cycle)
- Gradient background with subtle drift animation
- Three-bullet summary display
- Reflection question prompts
- Text input areas with auto-resize
- Optional proofread button
- Save and cancel actions
- Ambient audio playback

**Component Structure**:

```typescript
interface OverlayProps {
  summary: string[];
  prompts: string[];
  onSave: (reflections: string[]) => void;
  onCancel: () => void;
  settings: Settings;
}

interface BreathingOrbProps {
  enabled: boolean;
  duration: number;
}

interface SummaryDisplayProps {
  bullets: string[];
}

interface ReflectionInputProps {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  onProofread?: () => void;
}
```

**Design Decisions**:

- Use CSS animations for breathing orb (better performance than JS)
- Implement backdrop blur for depth perception
- Auto-focus first reflection input on mount
- Escape key to cancel, Cmd/Ctrl+Enter to save
- Disable page scroll while overlay active

## Data Models

### Reflection Type

```typescript
type Reflection = {
  id: string; // UUID v4
  url: string; // Full page URL
  title: string; // Page title
  createdAt: number; // Unix timestamp
  summary: string[]; // [Insight, Surprise, Apply]
  reflection: string[]; // User answers to prompts
  proofreadVersion?: string; // Optional proofread text
  tags?: string[]; // Optional user tags
  embedding?: number[]; // Optional 128-d vector
};
```

### Settings Type

```typescript
type Settings = {
  dwellThreshold: number; // 30-300 seconds, default 60
  enableSound: boolean; // default true
  reduceMotion: boolean; // default false
  proofreadEnabled: boolean; // default false
  privacyMode: 'local' | 'sync'; // default 'local'
};
```

### Storage Schema

**chrome.storage.local**:

```typescript
{
  reflections: Reflection[]; // Array of all reflections
  settings: Settings; // User settings
  lastSync: number; // Last sync timestamp
  streak: {
    current: number;
    lastReflectionDate: string; // ISO date string
  };
}
```

## Error Handling

### AI Unavailability

**Scenario**: Gemini Nano not available on user's system

**Handling**:

1. Background worker checks `chrome.aiOriginTrial` availability on startup
2. If unavailable, set global flag `aiAvailable = false`
3. Content script checks flag before showing nudge
4. Display modal: "Local AI disabled — manual reflection available"
5. Render overlay with empty summary fields for manual entry
6. Store reflection with `summary: []` to indicate manual mode

### AI Timeout

**Scenario**: Gemini Nano request exceeds 4-second timeout

**Handling**:

1. Wrap AI calls in Promise.race with 4-second timeout
2. On timeout, retry once with same content
3. If second attempt times out, fall back to manual mode
4. Log error to console for debugging
5. Display user-friendly message: "AI taking longer than expected. You can enter your summary manually."

### Content Too Large

**Scenario**: Extracted content exceeds 3000 tokens

**Handling**:

1. Tokenize content using simple word-based estimation (1 token ≈ 0.75 words)
2. If exceeds limit, truncate to first 2500 tokens
3. Display notification in overlay: "Long article detected. Summary based on first section."
4. Provide "Regenerate with full text" button that chunks content

### Storage Full

**Scenario**: Chrome storage quota exceeded

**Handling**:

1. Catch storage quota exceeded error
2. Calculate current storage usage
3. Display modal: "Storage full. Export older reflections to free space."
4. Provide one-click export button in modal
5. After export, offer to delete exported reflections

### Network Errors

**Scenario**: User offline (should not occur with local AI)

**Handling**:

1. All AI operations are local, no network dependency
2. Storage operations work offline
3. Only sync operations require network
4. If sync fails, queue for retry when online
5. Display sync status indicator in dashboard

## Testing Strategy

### Unit Tests (Vitest)

**Coverage Areas**:

- Dwell time calculation logic
- Content extraction heuristics
- Storage manager CRUD operations
- Settings validation and defaults
- Reflection data transformations
- Export format generation

**Example Tests**:

```typescript
describe('DwellTracker', () => {
  it('should calculate dwell time correctly', () => {
    const tracker = new DwellTracker();
    tracker.startTracking();
    // Advance time by 30 seconds
    expect(tracker.getCurrentDwellTime()).toBe(30);
  });

  it('should reset on page navigation', () => {
    const tracker = new DwellTracker();
    tracker.startTracking();
    tracker.stopTracking();
    expect(tracker.getCurrentDwellTime()).toBe(0);
  });
});

describe('ContentExtractor', () => {
  it('should extract main article content', () => {
    const html = '<article><p>Main content</p></article>';
    const extractor = new ContentExtractor(html);
    const content = extractor.extractMainContent();
    expect(content.text).toContain('Main content');
  });

  it('should exclude navigation and ads', () => {
    const html = '<nav>Menu</nav><article>Content</article>';
    const extractor = new ContentExtractor(html);
    const content = extractor.extractMainContent();
    expect(content.text).not.toContain('Menu');
  });
});
```

### Integration Tests (Playwright)

**Coverage Areas**:

- End-to-end reflection flow
- Overlay rendering and interaction
- Dashboard display and navigation
- Settings persistence
- Export functionality

**Example Tests**:

```typescript
test('complete reflection flow', async ({ page, extensionId }) => {
  await page.goto('https://example.com/article');

  // Wait for dwell threshold
  await page.waitForTimeout(60000);

  // Click lotus nudge
  await page.click('[data-testid="lotus-nudge"]');

  // Verify overlay appears
  await expect(
    page.locator('[data-testid="reflect-overlay"]')
  ).toBeVisible();

  // Verify summary displayed
  await expect(
    page.locator('[data-testid="summary-bullet"]')
  ).toHaveCount(3);

  // Enter reflection
  await page.fill(
    '[data-testid="reflection-input-0"]',
    'My reflection'
  );

  // Save
  await page.click('[data-testid="save-button"]');

  // Verify overlay closes
  await expect(
    page.locator('[data-testid="reflect-overlay"]')
  ).not.toBeVisible();
});
```

### AI Mock Tests

**Coverage Areas**:

- Summarization prompt formatting
- Reflection prompt generation
- Proofreading transformations
- Error handling for invalid responses

**Example Tests**:

```typescript
describe('AIManager', () => {
  it('should format summarization prompt correctly', async () => {
    const mockAI = {
      prompt: jest.fn().mockResolvedValue('Insight\nSurprise\nApply'),
    };

    const manager = new AIManager(mockAI);
    await manager.summarize('Article content');

    expect(mockAI.prompt).toHaveBeenCalledWith(
      expect.stringContaining('Summarize into 3 bullets')
    );
  });

  it('should handle AI timeout gracefully', async () => {
    const mockAI = {
      prompt: jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 5000))
        ),
    };

    const manager = new AIManager(mockAI);
    const result = await manager.summarize('Content');

    expect(result).toEqual([]);
  });
});
```

### Performance Tests

**Coverage Areas**:

- Overlay render time (target: <300ms)
- Animation frame rate (target: 60fps)
- Memory usage (target: <150MB)
- AI latency (target: <4s)

**Measurement Approach**:

- Use Chrome DevTools Performance profiler
- Record metrics during typical usage scenarios
- Automated Lighthouse audits in CI pipeline
- Memory snapshots before/after reflection sessions

### Accessibility Tests

**Coverage Areas**:

- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Motion preferences
- Focus management

**Tools**:

- Axe DevTools for automated scanning
- Manual testing with NVDA/JAWS
- Keyboard-only navigation testing
- Color contrast analyzer

## Design Rationale

### Why Manifest V3?

Manifest V3 is the current standard for Chrome extensions and required for new submissions to the Chrome Web Store. It provides better security through service workers instead of persistent background pages, and aligns with modern web platform standards.

### Why React for UI?

React provides component reusability across content script, popup, and options page. The virtual DOM efficiently handles dynamic reflection lists in the dashboard. The ecosystem includes Framer Motion for animations and extensive TypeScript support.

### Why Tailwind CSS?

Tailwind enables rapid prototyping with utility classes while maintaining design consistency through the configuration file. The design tokens from the design system map directly to Tailwind config. The JIT compiler keeps bundle size minimal.

### Why Shadow DOM for Content Script?

Injecting UI into arbitrary web pages risks style conflicts. Shadow DOM provides style encapsulation, ensuring the Reflect Mode overlay renders consistently regardless of host page styles. This prevents both the extension affecting the page and the page affecting the extension.

### Why Local Storage Over IndexedDB?

Chrome Storage API provides simpler async interface than IndexedDB, built-in sync capabilities, and automatic quota management. For the expected data volume (hundreds of reflections), the storage limits are sufficient. The API is specifically designed for extension use cases.

### Why 7-Second Breathing Cycle?

Research on breathing exercises suggests 5-7 seconds per breath cycle promotes relaxation. The 7-second cycle (3.5s expand, 3.5s contract) aligns with common mindfulness practices and creates a calming visual rhythm without being too slow or fast.

### Why Three-Bullet Summary Format?

Cognitive load research suggests 3-5 items is optimal for retention. The specific structure (Insight, Surprise, Apply) follows the learning science principle of connecting new information to existing knowledge and planning application, which improves retention.

### Why On-Device AI Only?

Privacy is a core value proposition. On-device processing eliminates data transmission risks, enables offline functionality, reduces latency, and builds user trust. Gemini Nano's capabilities are sufficient for the summarization and reflection tasks required.
