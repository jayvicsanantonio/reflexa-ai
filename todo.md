# Reflexa AI Refactoring TODO

## Current Status: Planning Complete ✅

**Last Updated**: 2025-01-XX

## Phase 1: Extract State Management

### Step 1.1: Create Content Script State Store
- [ ] Create `src/content/state/types.ts`
- [ ] Define state interfaces (UIState, ReflectionState, LanguageState, AIState, AudioState)
- [ ] Create `src/content/state/contentState.ts`
- [ ] Implement ContentScriptStateStore class
- [ ] Export singleton instance
- [ ] Update `src/content/index.tsx` to use state store
- [ ] Remove all global `let` variables
- [ ] Run `npm run build` and verify
- [ ] Run tests and verify

**Status**: 🔴 Not Started

---

### Step 1.2: Create Instance Manager
- [ ] Create `src/content/core/instanceManager.ts`
- [ ] Implement InstanceManager class
- [ ] Add initialization methods for DwellTracker, ContentExtractor, AudioManager
- [ ] Add getter methods
- [ ] Add cleanup method
- [ ] Export singleton instance
- [ ] Update `src/content/index.tsx` to use instanceManager
- [ ] Remove global instance variables
- [ ] Run `npm run build` and verify
- [ ] Run tests and verify

**Status**: 🔴 Not Started

---

## Phase 2: Extract UI Management

### Step 2.1: Extract UI Component Lifecycle Manager
- [ ] Create `src/content/ui/types.ts`
- [ ] Define UI manager interfaces
- [ ] Create `src/content/ui/uiManager.ts`
- [ ] Implement UIManager class
- [ ] Extract showNudge/hideNudge
- [ ] Extract showOverlay/hideOverlay
- [ ] Extract showErrorModal/hideErrorModal
- [ ] Extract showNotification/hideNotification
- [ ] Extract showDashboardModal/hideDashboardModal
- [ ] Add cleanup method
- [ ] Export singleton instance
- [ ] Update `src/content/index.tsx` to use uiManager
- [ ] Remove UI-related functions
- [ ] Run `npm run build` and verify
- [ ] Test all UI components appear/disappear correctly

**Status**: 🔴 Not Started

---

### Step 2.2: Extract UI State Helpers
- [ ] Create `src/content/ui/uiStateHelpers.ts`
- [ ] Extract setNudgeLoadingState
- [ ] Extract notification helpers
- [ ] Extract error modal helpers
- [ ] Update `src/content/index.tsx` to use helpers
- [ ] Run `npm run build` and verify

**Status**: 🔴 Not Started

---

## Phase 3: Extract Business Logic

### Step 3.1: Extract Reflection Flow Orchestrator
- [ ] Create `src/content/workflows/types.ts`
- [ ] Define workflow interfaces
- [ ] Create `src/content/workflows/reflectionFlow.ts`
- [ ] Implement ReflectionFlowOrchestrator class
- [ ] Extract checkAIAvailability
- [ ] Extract getAICapabilities
- [ ] Extract extractContent
- [ ] Extract detectLanguage
- [ ] Extract summarizeContent
- [ ] Extract generatePrompts
- [ ] Extract handleStreamingResponse
- [ ] Update `src/content/index.tsx` to use orchestrator
- [ ] Run `npm run build` and verify
- [ ] Test complete reflection flow

**Status**: 🔴 Not Started

---

### Step 3.2: Extract Language Management Logic
- [ ] Create `src/content/features/language/languageManager.ts`
- [ ] Implement LanguageManager class
- [ ] Extract detectLanguage
- [ ] Extract translateToLanguage
- [ ] Extract applyTranslationPreference
- [ ] Extract handleLanguageOverride
- [ ] Export singleton instance
- [ ] Update `src/content/index.tsx` to use languageManager
- [ ] Run `npm run build` and verify
- [ ] Test language detection and translation

**Status**: 🔴 Not Started

---

### Step 3.3: Extract Message Handlers
- [ ] Create `src/content/runtime/messageHandlers.ts`
- [ ] Extract handleSettingsUpdated
- [ ] Extract handleOpenDashboard
- [ ] Extract handleStartReflection
- [ ] Create setupMessageListener function
- [ ] Update `src/content/index.tsx` to use message handlers
- [ ] Run `npm run build` and verify
- [ ] Test message passing

**Status**: 🔴 Not Started

---

## Phase 4: Component Refactoring

### Step 4.1: Split MeditationFlowOverlay into Sub-Components
- [ ] Create `src/content/components/MeditationFlowOverlay/` directory
- [ ] Create BreathingPhase.tsx
- [ ] Create SummaryPhase.tsx
- [ ] Create ReflectionInput.tsx
- [ ] Create ToolsSection.tsx
- [ ] Create `hooks/useReflectionState.ts`
- [ ] Create `hooks/useVoiceInputState.ts`
- [ ] Create `hooks/useWriterStreaming.ts`
- [ ] Refactor MeditationFlowOverlay.tsx to compose sub-components
- [ ] Run `npm run build` and verify
- [ ] Test all overlay functionality

**Status**: 🔴 Not Started

---

### Step 4.2: Extract Modal Components Logic
- [ ] Create `src/content/components/AIStatusModal/` directory
- [ ] Split AIStatusModal into sub-components
- [ ] Create `src/content/components/MoreToolsMenu/` directory
- [ ] Split MoreToolsMenu into feature sections
- [ ] Create `src/content/components/QuickSettingsModal/` directory
- [ ] Split QuickSettingsModal into setting sections
- [ ] Run `npm run build` and verify
- [ ] Test all modal functionality

**Status**: 🔴 Not Started

---

## Phase 5: Integration & Testing

### Step 5.1: Update Dependencies and Imports
- [ ] Review all imports in `src/content/index.tsx`
- [ ] Check for unused imports
- [ ] Verify import paths
- [ ] Check for circular dependencies (`npx madge --circular src/content`)
- [ ] Fix any circular dependencies
- [ ] Verify singleton instances
- [ ] Update test files
- [ ] Run full test suite
- [ ] Fix failing tests

**Status**: 🔴 Not Started

---

### Step 5.2: Update Type Definitions
- [ ] Create `src/content/state/index.ts`
- [ ] Create `src/content/core/index.ts`
- [ ] Create `src/content/ui/index.ts`
- [ ] Create `src/content/workflows/index.ts`
- [ ] Create `src/content/features/language/index.ts`
- [ ] Update imports to use barrel exports
- [ ] Run `npm run type-check`
- [ ] Fix type errors

**Status**: 🔴 Not Started

---

### Step 5.3: Final Integration Testing
- [ ] Test dwell tracking triggers reflection flow
- [ ] Test content extraction
- [ ] Test language detection
- [ ] Test summarization with streaming
- [ ] Test reflection prompts generation
- [ ] Test voice input
- [ ] Test proofreading
- [ ] Test translation
- [ ] Test rewrite
- [ ] Test all modals
- [ ] Test error handling
- [ ] Test notifications
- [ ] Test UI cleanup
- [ ] Run `npm run test`
- [ ] Run `npm run test:coverage`
- [ ] Check for memory leaks
- [ ] Verify performance
- [ ] Run `npm run build`
- [ ] Verify bundle size

**Status**: 🔴 Not Started

---

## Completed Steps

### Background Script Refactoring ✅
- ✅ Split `src/background/index.ts` into handler modules
- ✅ Created handler directory structure
- ✅ Extracted AI handlers
- ✅ Extracted streaming handlers
- ✅ Extracted storage handlers
- ✅ Extracted settings handlers
- ✅ Extracted utility handlers
- ✅ All tests passing
- ✅ Build successful

---

## Metrics Tracking

### Before Refactoring
- `src/content/index.tsx`: 2,649 lines
- `src/content/components/MeditationFlowOverlay.tsx`: 1,996 lines
- `src/content/components/AIStatusModal.tsx`: 947 lines
- `src/content/components/MoreToolsMenu.tsx`: 881 lines
- `src/content/components/QuickSettingsModal.tsx`: 840 lines

### Target After Refactoring
- `src/content/index.tsx`: <500 lines (80% reduction)
- `src/content/components/MeditationFlowOverlay.tsx`: <400 lines (80% reduction)
- Modal components: 60-70% reduction
- Improved test coverage
- No functionality regressions

---

## Blockers

None currently.

---

## Notes

- Each step should be completed independently
- Run tests after each step
- Commit after each successful step
- Don't skip steps
- Focus on functionality preservation

