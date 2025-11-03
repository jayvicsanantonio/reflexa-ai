# Reflexa AI Content Script Refactoring Plan

## Executive Summary

This plan outlines the systematic refactoring of the most complex files in the Reflexa AI Chrome extension codebase. The primary focus is on breaking down monolithic files into smaller, maintainable, and testable modules.

## Current State Analysis

### Most Complex Files

1. **`src/content/index.tsx`** (2,649 lines)
   - Main content script orchestrator
   - Manages 40+ global state variables
   - Handles UI lifecycle (nudge, overlay, modals, notifications)
   - Orchestrates complete reflection workflow
   - Manages streaming AI responses
   - Complex language detection/translation logic

2. **`src/content/components/MeditationFlowOverlay.tsx`** (1,996 lines)
   - Single large React component
   - Manages 20+ state variables
   - Handles voice input, writer streaming, proofreading
   - Complex animation and UI state logic

3. **`src/content/components/AIStatusModal.tsx`** (947 lines)
   - Large modal component with complex state

4. **`src/content/components/MoreToolsMenu.tsx`** (881 lines)
   - Large menu component with many features

5. **`src/content/components/QuickSettingsModal.tsx`** (840 lines)
   - Large settings modal with complex state management

### Key Problems Identified

1. **Tight Coupling**: Global state variables scattered throughout `index.tsx`
2. **Single Responsibility Violation**: One file handles UI, state, orchestration, streaming
3. **Testability Issues**: Hard to test functions with global state dependencies
4. **Maintainability**: Changes require navigating through thousands of lines
5. **Reusability**: Logic is not reusable due to global state dependencies

## Refactoring Strategy

### Phase 1: Extract State Management (Foundation)
**Goal**: Centralize and organize all global state into manageable modules

### Phase 2: Extract UI Management (Separation of Concerns)
**Goal**: Separate UI lifecycle management from business logic

### Phase 3: Extract Business Logic (Clean Architecture)
**Goal**: Extract workflow orchestration into separate modules

### Phase 4: Component Refactoring (React Best Practices)
**Goal**: Split large React components into smaller, focused components

### Phase 5: Integration & Testing (Verification)
**Goal**: Wire everything together and ensure tests pass

---

## Phase 1: Extract State Management

### Step 1.1: Create Content Script State Store
**Purpose**: Centralize all module-level state variables

**Tasks**:
- Create `src/content/state/contentState.ts`
- Define state interfaces for all state categories:
  - UI State (nudge, overlay, modals, notifications)
  - Reflection State (content, summary, prompts, format)
  - Language State (detection, translation, target language)
  - AI State (capabilities, availability, streaming)
  - Audio State (ambient, muted)
- Move all global `let` variables into structured state objects
- Export getters/setters for state access

**Files to Create**:
- `src/content/state/contentState.ts`
- `src/content/state/types.ts`

**Files to Modify**:
- `src/content/index.tsx` (replace global variables with state store)

---

```text
Extract all module-level state variables from src/content/index.tsx into a centralized state store.

Create:
1. src/content/state/types.ts - Define TypeScript interfaces for:
   - UIState (nudge, overlay, modal, notification visibility and containers)
   - ReflectionState (extracted content, summary, prompts, format, loading states)
   - LanguageState (detection, translation, target language, overrides)
   - AIState (capabilities, availability)
   - AudioState (ambient muted state)
   - ContentScriptState (union of all above)

2. src/content/state/contentState.ts - Implement a state store:
   - Create a ContentScriptStateStore class
   - Initialize with default values for all state
   - Provide getters for reading state: getUIState(), getReflectionState(), etc.
   - Provide setters for updating state: setUIState(), updateReflectionState(), etc.
   - Include helper methods: resetReflectionState(), resetUIState(), etc.
   - Export a singleton instance: export const contentState = new ContentScriptStateStore()

3. Update src/content/index.tsx:
   - Import contentState from the new state store
   - Replace all global `let` variable declarations with state store access
   - Replace all direct variable assignments with state store setters
   - Keep the same behavior but use state.contentState.getUIState() instead of direct variables

Verify: Run npm run build and ensure no TypeScript errors. All global variables should be removed and replaced with state store access.
```

---

### Step 1.2: Create Instance Manager
**Purpose**: Centralize management of component instances (DwellTracker, ContentExtractor, AudioManager)

**Tasks**:
- Create `src/content/core/instanceManager.ts`
- Manage lifecycle of DwellTracker, ContentExtractor, AudioManager
- Provide initialization and cleanup methods
- Export getters for accessing instances

**Files to Create**:
- `src/content/core/instanceManager.ts`

**Files to Modify**:
- `src/content/index.tsx` (replace instance variables with instanceManager)

---

```text
Extract instance management logic from src/content/index.tsx into a dedicated InstanceManager.

Create:
1. src/content/core/instanceManager.ts - Implement InstanceManager class:
   - Private properties: dwellTracker, contentExtractor, audioManager, settings
   - initializeDwellTracker(threshold: number): Creates and starts DwellTracker
   - initializeContentExtractor(): Creates ContentExtractor instance
   - initializeAudioManager(): Creates AudioManager instance
   - setSettings(settings: Settings): Updates settings
   - getDwellTracker(): Returns DwellTracker or null
   - getContentExtractor(): Returns ContentExtractor or null
   - getAudioManager(): Returns AudioManager or null
   - getSettings(): Returns Settings or null
   - cleanup(): Destroys all instances and resets to null
   - Export singleton: export const instanceManager = new InstanceManager()

2. Update src/content/index.tsx:
   - Remove global instance variables (dwellTracker, contentExtractor, audioManager, currentSettings)
   - Import instanceManager
   - Replace all direct instance access with instanceManager.getDwellTracker(), etc.
   - Update initialization to use instanceManager.initialize*() methods
   - Update cleanup to use instanceManager.cleanup()

Verify: Run npm run build and ensure initialization and cleanup logic still works correctly.
```

---

## Phase 2: Extract UI Management

### Step 2.1: Extract UI Component Lifecycle Manager
**Purpose**: Centralize all UI component mounting/unmounting logic

**Tasks**:
- Create `src/content/ui/uiManager.ts`
- Extract all UI component creation/destruction functions:
  - Nudge (show/hide)
  - Overlay (show/hide)
  - Error Modal (show/hide)
  - Notification (show/hide)
  - Dashboard Modal (show/hide)
- Use Shadow DOM pattern consistently
- Manage React roots lifecycle

**Files to Create**:
- `src/content/ui/uiManager.ts`
- `src/content/ui/types.ts`

**Files to Modify**:
- `src/content/index.tsx` (replace UI functions with uiManager calls)

---

```text
Extract all UI component lifecycle management from src/content/index.tsx into a UI Manager.

Create:
1. src/content/ui/types.ts - Define:
   - UIManagerState interface with containers, roots, and visibility flags
   - ErrorModalOptions, NotificationOptions interfaces

2. src/content/ui/uiManager.ts - Implement UIManager class:
   - Private state: containers, roots, visibility flags for each UI component
   - showNudge(): Creates container, shadow DOM, mounts LotusNudge component
   - hideNudge(): Unmounts and removes container
   - showOverlay(props): Creates and mounts MeditationFlowOverlay
   - hideOverlay(): Unmounts and removes overlay container
   - showErrorModal(options): Creates and mounts ErrorModal
   - hideErrorModal(): Unmounts and removes error modal
   - showNotification(options): Creates and mounts Notification
   - hideNotification(): Unmounts and removes notification
   - showDashboardModal(): Creates and mounts DashboardModal
   - hideDashboardModal(): Unmounts and removes dashboard modal
   - cleanup(): Destroys all UI components
   - Helper methods: createShadowContainer(id, stylesheetPath)
   - Export singleton: export const uiManager = new UIManager()

3. Update src/content/index.tsx:
   - Remove all UI-related global variables (containers, roots, visibility flags)
   - Remove all show*/hide* functions
   - Import uiManager
   - Replace all show*/hide* function calls with uiManager.show*/hide*()
   - Update message handlers to use uiManager methods

Verify: Run npm run build and test that all UI components still appear/disappear correctly.
```

---

### Step 2.2: Extract UI State Helpers
**Purpose**: Extract helper functions for UI state management (loading states, notifications)

**Tasks**:
- Create `src/content/ui/uiStateHelpers.ts`
- Extract functions like `setNudgeLoadingState`, notification helpers
- Keep UI-related logic separate from business logic

**Files to Create**:
- `src/content/ui/uiStateHelpers.ts`

**Files to Modify**:
- `src/content/index.tsx` (move helper functions)

---

```text
Extract UI state helper functions from src/content/index.tsx into dedicated helpers.

Create:
1. src/content/ui/uiStateHelpers.ts - Export helper functions:
   - setNudgeLoadingState(isLoading: boolean): Updates nudge loading state via uiManager
   - Helper to show notifications with proper styling based on type
   - Helper to show error modals with action buttons
   - Any other UI state manipulation helpers

2. Update src/content/index.tsx:
   - Remove helper functions
   - Import from uiStateHelpers
   - Update all calls to use imported helpers

Verify: Build passes and UI interactions still work correctly.
```

---

## Phase 3: Extract Business Logic

### Step 3.1: Extract Reflection Flow Orchestrator
**Purpose**: Extract the main reflection workflow into a dedicated module

**Tasks**:
- Create `src/content/workflows/reflectionFlow.ts`
- Extract `initiateReflectionFlow` function
- Extract helper functions for each step:
  - Content extraction
  - Language detection
  - Summarization (with streaming)
  - Prompt generation
- Make functions pure where possible, inject dependencies

**Files to Create**:
- `src/content/workflows/reflectionFlow.ts`
- `src/content/workflows/types.ts`

**Files to Modify**:
- `src/content/index.tsx` (replace flow function with orchestrator)

---

```text
Extract the reflection workflow orchestration from src/content/index.tsx into a dedicated workflow module.

Create:
1. src/content/workflows/types.ts - Define:
   - ReflectionFlowConfig interface
   - FlowStep enum or type
   - FlowResult interface

2. src/content/workflows/reflectionFlow.ts - Implement ReflectionFlowOrchestrator class:
   - Constructor accepts dependencies: instanceManager, uiManager, messageBus, state store
   - async executeFlow(): Main entry point for reflection flow
   - Private methods:
     - checkAIAvailability(): Checks AI status
     - getAICapabilities(): Fetches capabilities
     - extractContent(): Extracts page content
     - detectLanguage(content): Detects content language
     - summarizeContent(content, language, format): Requests summarization
     - generatePrompts(summary): Generates reflection prompts
     - handleStreamingResponse(): Manages streaming summary updates
   - Each method should be testable in isolation
   - Update state via state store, show UI via uiManager

3. Update src/content/index.tsx:
   - Remove initiateReflectionFlow function
   - Create ReflectionFlowOrchestrator instance
   - Replace flow initiation with orchestrator.executeFlow()
   - Update message handlers to work with orchestrator

Verify: Build passes and reflection flow still works end-to-end.
```

---

### Step 3.2: Extract Language Management Logic
**Purpose**: Extract all language detection and translation logic

**Tasks**:
- Create `src/content/features/language/languageManager.ts`
- Extract `applyTranslationPreference` function
- Extract language detection handlers
- Extract translation request logic
- Extract language override logic

**Files to Create**:
- `src/content/features/language/languageManager.ts`

**Files to Modify**:
- `src/content/index.tsx` (replace language functions)

---

```text
Extract language detection and translation management from src/content/index.tsx.

Create:
1. src/content/features/language/languageManager.ts - Implement LanguageManager class:
   - Constructor accepts: messageBus, state store
   - async detectLanguage(text, url): Detects language from text
   - async translateToLanguage(text, targetLanguage): Translates text
   - applyTranslationPreference(settings): Applies user translation preferences
   - handleLanguageOverride(language): Handles manual language selection
   - updateLanguageState(): Updates state store with language info
   - Export singleton: export const languageManager = new LanguageManager(...)

2. Update src/content/index.tsx:
   - Remove applyTranslationPreference function
   - Remove language detection logic
   - Import languageManager
   - Replace all language-related code with languageManager methods
   - Update message handlers to use languageManager

Verify: Language detection and translation still work correctly.
```

---

### Step 3.3: Extract Message Handlers
**Purpose**: Extract and organize all message handling logic

**Tasks**:
- Create `src/content/runtime/messageHandlers.ts`
- Extract all `chrome.runtime.onMessage` handlers
- Organize handlers by category (settings, dashboard, reflection)
- Keep handlers focused and testable

**Files to Create**:
- `src/content/runtime/messageHandlers.ts`

**Files to Modify**:
- `src/content/index.tsx` (replace message listener setup)

---

```text
Extract message handling logic from src/content/index.tsx into organized handlers.

Create:
1. src/content/runtime/messageHandlers.ts - Export handler functions:
   - createMessageHandlers(dependencies): Returns object with handler functions
   - Handlers organized by category:
     - handleSettingsUpdated(message): Updates settings when background changes
     - handleOpenDashboard(message): Opens dashboard modal
     - handleStartReflection(message): Initiates reflection flow
   - Each handler receives dependencies (uiManager, orchestrator, etc.)
   - Export setupMessageListener(dependencies): Sets up chrome.runtime.onMessage listener

2. Update src/content/index.tsx:
   - Remove setupMessageListener function
   - Remove all message handler implementations
   - Import setupMessageListener from messageHandlers
   - Call setupMessageListener with required dependencies during initialization

Verify: Message passing between content script and background still works correctly.
```

---

## Phase 4: Component Refactoring

### Step 4.1: Split MeditationFlowOverlay into Sub-Components
**Purpose**: Break down the 1,996-line component into focused sub-components

**Tasks**:
- Identify logical sections:
  - Breathing phase component
  - Summary display component
  - Reflection input components (with voice)
  - Tools menu integration
  - Proofreading UI
  - Translation UI
- Create component hierarchy
- Extract custom hooks for complex state logic

**Files to Create**:
- `src/content/components/MeditationFlowOverlay/BreathingPhase.tsx`
- `src/content/components/MeditationFlowOverlay/SummaryPhase.tsx`
- `src/content/components/MeditationFlowOverlay/ReflectionInput.tsx`
- `src/content/components/MeditationFlowOverlay/ToolsSection.tsx`
- `src/content/components/MeditationFlowOverlay/hooks/useReflectionState.ts`
- `src/content/components/MeditationFlowOverlay/hooks/useVoiceInputState.ts`
- `src/content/components/MeditationFlowOverlay/hooks/useWriterStreaming.ts`

**Files to Modify**:
- `src/content/components/MeditationFlowOverlay.tsx` (refactor to compose sub-components)

---

```text
Split MeditationFlowOverlay.tsx into smaller, focused sub-components.

Create component structure:
1. src/content/components/MeditationFlowOverlay/index.tsx - Main container:
   - Manages step state (0: breathing, 1: summary, 2: q1, 3: q2)
   - Composes sub-components based on current step
   - Handles navigation between steps
   - Passes props to sub-components

2. src/content/components/MeditationFlowOverlay/BreathingPhase.tsx:
   - Renders breathing animation/cues
   - Manages breathCue state
   - Shows summary loading indicator

3. src/content/components/MeditationFlowOverlay/SummaryPhase.tsx:
   - Displays summary with markdown rendering
   - Handles format switching
   - Shows format selector

4. src/content/components/MeditationFlowOverlay/ReflectionInput.tsx:
   - Text input for reflection answers
   - Voice input integration
   - Proofreading UI
   - Rewrite preview UI
   - Accepts index prop (0 or 1)

5. src/content/components/MeditationFlowOverlay/ToolsSection.tsx:
   - MoreToolsMenu integration
   - Voice toggle button
   - Translation controls
   - Accepts all tool-related props

6. Create custom hooks:
   - src/content/components/MeditationFlowOverlay/hooks/useReflectionState.ts:
     - Manages answers state
     - Handles answer updates
     - Returns [answers, setAnswer, resetAnswers]

   - src/content/components/MeditationFlowOverlay/hooks/useVoiceInputState.ts:
     - Manages voice input states for both inputs
     - Handles voice recording start/stop
     - Returns voice state and handlers

   - src/content/components/MeditationFlowOverlay/hooks/useWriterStreaming.ts:
     - Manages writer/rewriter streaming state
     - Handles streaming cleanup
     - Returns streaming state and handlers

7. Update MeditationFlowOverlay.tsx:
   - Import and use sub-components
   - Use custom hooks for state management
   - Reduce component from 1996 lines to ~300-400 lines
   - Keep main orchestration logic but delegate to sub-components

Verify: All MeditationFlowOverlay functionality still works. Build and tests pass.
```

---

### Step 4.2: Extract Modal Components Logic
**Purpose**: Refactor large modal components using similar patterns

**Tasks**:
- Split AIStatusModal into sub-components
- Split MoreToolsMenu into feature-specific sections
- Split QuickSettingsModal into setting category components

**Files to Create**:
- `src/content/components/AIStatusModal/` (with sub-components)
- `src/content/components/MoreToolsMenu/` (with feature sections)
- `src/content/components/QuickSettingsModal/` (with setting sections)

**Files to Modify**:
- Each large modal component file

---

```text
Refactor large modal components by splitting into focused sub-components.

For AIStatusModal (947 lines):
1. Create src/content/components/AIStatusModal/StatusSection.tsx - Shows AI availability
2. Create src/content/components/AIStatusModal/CapabilitiesSection.tsx - Lists capabilities
3. Create src/content/components/AIStatusModal/UsageSection.tsx - Shows usage stats
4. Create src/content/components/AIStatusModal/PerformanceSection.tsx - Shows performance
5. Update AIStatusModal.tsx to compose these sections

For MoreToolsMenu (881 lines):
1. Create src/content/components/MoreToolsMenu/TranslationSection.tsx
2. Create src/content/components/MoreToolsMenu/ProofreadingSection.tsx
3. Create src/content/components/MoreToolsMenu/WritingSection.tsx
4. Update MoreToolsMenu.tsx to compose these sections

For QuickSettingsModal (840 lines):
1. Create src/content/components/QuickSettingsModal/GeneralSettings.tsx
2. Create src/content/components/QuickSettingsModal/AISettings.tsx
3. Create src/content/components/QuickSettingsModal/AdvancedSettings.tsx
4. Update QuickSettingsModal.tsx to compose these sections

Verify: All modals still function correctly. UI/UX unchanged.
```

---

## Phase 5: Integration & Testing

### Step 5.1: Update Dependencies and Imports
**Purpose**: Ensure all modules are properly wired together

**Tasks**:
- Update all import statements
- Verify dependency injection is working
- Fix any circular dependencies
- Ensure singleton pattern is used correctly

---

```text
Wire all refactored modules together and fix dependencies.

Tasks:
1. Review all imports in src/content/index.tsx:
   - Ensure all new modules are imported correctly
   - Check for unused imports
   - Verify import paths are correct

2. Check for circular dependencies:
   - Run: npx madge --circular src/content
   - Fix any circular dependencies found

3. Verify singleton instances:
   - Ensure instanceManager, uiManager, languageManager are singletons
   - Check that state store is properly initialized

4. Update test files:
   - Mock new modules where needed
   - Update integration tests to work with new structure

5. Run full test suite:
   - npm run test
   - Fix any failing tests

Verify: All tests pass. No circular dependencies. Build succeeds.
```

---

### Step 5.2: Update Type Definitions
**Purpose**: Ensure TypeScript types are properly exported and used

**Tasks**:
- Create barrel exports for each new module directory
- Update type exports
- Ensure type safety is maintained

---

```text
Organize type definitions and create barrel exports.

1. Create index.ts files for each new directory:
   - src/content/state/index.ts - Export all state types and store
   - src/content/core/index.ts - Export instanceManager
   - src/content/ui/index.ts - Export uiManager and helpers
   - src/content/workflows/index.ts - Export reflectionFlow orchestrator
   - src/content/features/language/index.ts - Export languageManager

2. Update imports throughout codebase to use barrel exports where possible

3. Verify TypeScript compilation:
   - npm run type-check
   - Fix any type errors

Verify: Type-check passes. All types are properly exported and imported.
```

---

### Step 5.3: Final Integration Testing
**Purpose**: Verify end-to-end functionality

**Tasks**:
- Test complete reflection flow
- Test all UI components
- Test error handling
- Test edge cases
- Run integration tests

---

```text
Perform comprehensive end-to-end testing of refactored code.

1. Manual Testing Checklist:
   - [ ] Dwell tracking triggers reflection flow
   - [ ] Content extraction works correctly
   - [ ] Language detection works
   - [ ] Summarization with streaming works
   - [ ] Reflection prompts generate correctly
   - [ ] Voice input works in overlay
   - [ ] Proofreading works
   - [ ] Translation works
   - [ ] Rewrite works
   - [ ] Settings modal opens/closes
   - [ ] Dashboard modal opens/closes
   - [ ] Error handling displays correctly
   - [ ] Notifications appear correctly
   - [ ] All UI cleanup works on page unload

2. Run automated tests:
   - npm run test
   - npm run test:coverage
   - Ensure coverage hasn't decreased

3. Performance check:
   - Verify no memory leaks (check cleanup functions)
   - Verify no performance regressions

4. Build verification:
   - npm run build
   - Verify bundle size hasn't increased significantly

Verify: All functionality works. Tests pass. No regressions.
```

---

## Success Criteria

### Metrics
- `src/content/index.tsx` reduced from 2,649 lines to <500 lines (80% reduction)
- `src/content/components/MeditationFlowOverlay.tsx` reduced from 1,996 lines to <400 lines (80% reduction)
- Modal components reduced by 60-70%
- All tests passing
- No functionality regressions
- Improved test coverage

### Quality Improvements
- ✅ Clear separation of concerns
- ✅ Testable modules
- ✅ Reusable components
- ✅ Type-safe state management
- ✅ Better error handling
- ✅ Maintainable codebase

## Risk Mitigation

### Potential Issues
1. **Breaking Changes**: All refactoring done incrementally with tests
2. **State Management Complexity**: Use proven patterns (singleton store)
3. **Component Communication**: Use props and callbacks, avoid prop drilling with context if needed
4. **Testing Challenges**: Extract pure functions where possible

### Rollback Plan
- Each step is independently committable
- Can rollback individual steps without affecting others
- Tests act as safety net

## Timeline Estimate

- **Phase 1**: 2-3 days (Foundation)
- **Phase 2**: 2-3 days (UI Management)
- **Phase 3**: 3-4 days (Business Logic)
- **Phase 4**: 4-5 days (Components)
- **Phase 5**: 2-3 days (Integration)

**Total**: ~13-18 days of focused development

## Notes

- Each step should be implemented independently
- Run tests after each step
- Commit after each successful step
- Don't proceed to next step until current step is verified
- Prioritize functionality preservation over perfection
- Can iterate on improvements after initial refactoring

