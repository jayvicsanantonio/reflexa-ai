# Design Document

## Overview

This design addresses structural issues in the React component codebase by extracting custom hooks, creating shared components, and reorganizing files. The approach prioritizes practical improvements over theoretical purity - abstractions are only created when they provide clear value through reuse or testability.

## Architecture

The refactoring follows a layered approach:

1. **Extract hooks first** - Move stateful logic out of large components into dedicated hooks
2. **Create shared components** - Identify truly duplicated UI patterns and consolidate them
3. **Reorganize files** - Move entry point components into their feature folders
4. **Clean up** - Run knip to remove dead code, simplify prop interfaces

```
src/
├── content/
│   ├── components/
│   │   ├── shared/                    # New: shared modal components
│   │   │   ├── ModalHeader.tsx
│   │   │   └── ModalFooter.tsx
│   │   ├── MeditationFlowOverlay/
│   │   │   ├── index.tsx              # Main component (moved from parent)
│   │   │   ├── hooks/
│   │   │   │   ├── useVoiceInputManager.ts
│   │   │   │   ├── useRewritePreview.ts
│   │   │   │   ├── useProofreadResult.ts
│   │   │   │   └── useOverlayKeyboardShortcuts.ts
│   │   │   └── ... (existing sub-components)
│   │   └── ... (other components)
│   └── ...
├── popup/
│   ├── hooks/
│   │   ├── useReflections.ts
│   │   ├── useStreak.ts
│   │   ├── useCalmStats.ts
│   │   └── usePopupKeyboardShortcuts.ts
│   ├── components/
│   │   ├── HeroSection.tsx
│   │   └── PrivacyModal.tsx
│   └── App.tsx                        # Simplified main component
├── options/
│   ├── hooks/
│   │   ├── useSettings.ts
│   │   └── useCapabilities.ts
│   └── App.tsx                        # Simplified main component
└── ...
```

## Components and Interfaces

### New Hooks for MeditationFlowOverlay

#### useVoiceInputManager

Manages both voice input instances and their shared state.

```typescript
interface VoiceInputManagerConfig {
  language: string;
  autoStopDelay: number;
  enableSound: boolean;
  audioManager: AudioManager | null;
}

interface VoiceInputManagerResult {
  voiceInputs: [ReturnType<typeof useVoiceInput>, ReturnType<typeof useVoiceInput>];
  voiceInputStates: { isRecording: boolean; interimText: string }[];
  voiceError: VoiceInputError | null;
  clearVoiceError: () => void;
  handleVoiceToggle: (index: 0 | 1) => void;
}

function useVoiceInputManager(config: VoiceInputManagerConfig): VoiceInputManagerResult
```

#### useRewritePreview

Manages rewrite preview state with accept/discard actions.

```typescript
interface RewritePreviewState {
  index: number;
  original: string;
  rewritten: string;
} | null

interface UseRewritePreviewResult {
  preview: RewritePreviewState;
  setPreview: (preview: RewritePreviewState) => void;
  acceptRewrite: () => string | null;  // Returns rewritten text or null
  discardRewrite: () => void;
}

function useRewritePreview(): UseRewritePreviewResult
```

#### useProofreadResult

Manages proofread result state with accept/discard actions.

```typescript
interface ProofreadResultState {
  index: number;
  result: ProofreadResult;
} | null

interface UseProofreadResultResult {
  result: ProofreadResultState;
  setResult: (result: ProofreadResultState) => void;
  acceptProofread: (index: 0 | 1) => string | null;  // Returns corrected text or null
  discardProofread: () => void;
}

function useProofreadResult(): UseProofreadResultResult
```

#### useOverlayKeyboardShortcuts

Handles keyboard navigation and shortcuts for the overlay.

```typescript
interface OverlayKeyboardConfig {
  step: number;
  isLoadingSummary: boolean;
  isProcessing: boolean;
  writerAvailable: boolean;
  answers: string[];
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  onGenerateDraft: (index: 0 | 1) => void;
}

function useOverlayKeyboardShortcuts(config: OverlayKeyboardConfig): void
```

### New Hooks for Popup

#### useReflections

Manages reflections data loading, storage sync, and deletion.

```typescript
interface UseReflectionsResult {
  reflections: Reflection[];
  isLoading: boolean;
  deleteReflection: (id: string) => Promise<void>;
}

function useReflections(): UseReflectionsResult
```

#### useStreak

Manages streak data loading and storage sync.

```typescript
interface UseStreakResult {
  streak: StreakData;
  isLoading: boolean;
}

function useStreak(): UseStreakResult
```

#### useCalmStats

Derives calm stats from reflections (pure computation, no side effects).

```typescript
function useCalmStats(reflections: Reflection[]): CalmStats
```

### New Hooks for Options

#### useSettings

Manages settings with debounced auto-save.

```typescript
interface UseSettingsResult {
  settings: Settings;
  isLoading: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => Promise<void>;
  showSaveIndicator: boolean;
}

function useSettings(): UseSettingsResult
```

#### useCapabilities

Manages AI capabilities checking.

```typescript
interface UseCapabilitiesResult {
  capabilities: AICapabilities | null;
  isChecking: boolean;
  refresh: (experimentalMode?: boolean) => Promise<void>;
}

function useCapabilities(experimentalMode: boolean): UseCapabilitiesResult
```

### Shared Modal Components

#### SharedModalHeader

```typescript
interface SharedModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
}

function SharedModalHeader(props: SharedModalHeaderProps): JSX.Element
```

#### SharedModalFooter

```typescript
interface SharedModalFooterProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
}

function SharedModalFooter(props: SharedModalFooterProps): JSX.Element
```

## Data Models

No new data models are introduced. Existing types are reused:
- `Reflection`, `StreakData`, `CalmStats` from `src/types`
- `Settings`, `AICapabilities` from `src/types`
- `ProofreadResult`, `VoiceInputError` from existing definitions

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Rewrite preview state consistency

*For any* sequence of setPreview, acceptRewrite, and discardRewrite operations on useRewritePreview, the preview state should be null after either accept or discard, and acceptRewrite should return the rewritten text only when a preview exists.

**Validates: Requirements 1.4**

### Property 2: Proofread result state consistency

*For any* sequence of setResult, acceptProofread, and discardProofread operations on useProofreadResult, the result state should be null after either accept or discard, and acceptProofread should return the corrected text only when a result exists for the given index.

**Validates: Requirements 1.5**

### Property 3: Keyboard shortcut event mapping

*For any* keyboard event (ArrowRight, ArrowLeft, Escape, Cmd+G) in the overlay, the corresponding callback (onNext, onPrev, onCancel, onGenerateDraft) should be invoked exactly once, respecting disabled states.

**Validates: Requirements 1.6**

### Property 4: Calm stats derivation correctness

*For any* non-empty list of reflections, useCalmStats should return stats where totalReflections equals the list length, averagePerDay is positive, and reflectionRatio is between 0 and 1.

**Validates: Requirements 2.3**

### Property 5: Settings debounce behavior

*For any* sequence of rapid updateSetting calls within the debounce window, only one save operation should be triggered after the debounce delay.

**Validates: Requirements 3.1**

## Error Handling

- Hooks that interact with Chrome storage will catch errors internally and expose loading/error states
- Voice input errors are surfaced through the `voiceError` state in useVoiceInputManager
- Settings save failures will not throw but will not show the save indicator
- All async operations in hooks use proper cleanup to prevent state updates on unmounted components

## Testing Strategy

### Unit Tests

- Test shared modal components render correctly with various prop combinations
- Test that hooks return expected initial states
- Test that hook callbacks update state correctly

### Property-Based Tests

Using `fast-check` for property-based testing:

1. **useRewritePreview state transitions** - Generate random sequences of operations and verify state invariants
2. **useProofreadResult state transitions** - Same approach as rewrite preview
3. **useOverlayKeyboardShortcuts event handling** - Generate keyboard events and verify callback invocations
4. **useCalmStats derivation** - Generate random reflection arrays and verify output constraints
5. **useSettings debounce** - Generate rapid update sequences and verify single save

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the property number and requirements reference
- Use smart generators that constrain inputs to valid states

