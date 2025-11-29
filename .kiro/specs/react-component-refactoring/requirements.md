# Requirements Document

## Introduction

This specification addresses structural issues, SOLID principle violations, and organizational inconsistencies found in the React component codebase. The goal is to improve maintainability, reduce code duplication, and establish consistent patterns across the codebase without over-engineering or creating unnecessary abstractions.

## Glossary

- **SRP**: Single Responsibility Principle - a component should have one reason to change
- **Barrel Export**: An `index.ts` file that re-exports modules from a directory
- **Collocation**: Placing related code (components, hooks, utils) together in the same directory
- **Custom Hook**: A reusable function that encapsulates stateful logic using React hooks

## Requirements

### Requirement 1: Refactor MeditationFlowOverlay Component

**User Story:** As a developer, I want the MeditationFlowOverlay component to be smaller and more focused, so that I can understand and modify specific features without navigating 1300+ lines of code.

#### Acceptance Criteria

1. WHEN the MeditationFlowOverlay component is loaded THEN the system SHALL render the overlay using composed sub-components with the main file under 300 lines
2. WHEN voice input functionality is needed THEN the system SHALL delegate to a dedicated `useVoiceInputManager` hook that manages both voice input instances
3. WHEN writer streaming is needed THEN the system SHALL delegate to the existing `useWriterStreaming` hook without duplicating logic in the main component
4. WHEN rewrite preview state changes THEN the system SHALL manage that state through a dedicated `useRewritePreview` hook
5. WHEN proofread result state changes THEN the system SHALL manage that state through a dedicated `useProofreadResult` hook
6. WHEN keyboard shortcuts are triggered THEN the system SHALL delegate to a `useOverlayKeyboardShortcuts` hook

### Requirement 2: Refactor Popup App Component

**User Story:** As a developer, I want the popup App component to have clear separation of concerns, so that data fetching, calculations, and rendering are independently testable.

#### Acceptance Criteria

1. WHEN reflections data is needed THEN the system SHALL load and manage it through a `useReflections` hook
2. WHEN streak data is needed THEN the system SHALL load and manage it through a `useStreak` hook
3. WHEN calm stats are calculated THEN the system SHALL compute them through a `useCalmStats` hook that derives from reflections
4. WHEN the popup App component is loaded THEN the system SHALL render using composed sub-components with the main file under 150 lines
5. WHEN keyboard shortcuts are registered THEN the system SHALL delegate to a `usePopupKeyboardShortcuts` hook

### Requirement 3: Refactor Options App Component

**User Story:** As a developer, I want the options App component to separate settings management from UI rendering, so that settings logic can be reused and tested independently.

#### Acceptance Criteria

1. WHEN settings are loaded or updated THEN the system SHALL manage them through a `useSettings` hook with debounced auto-save
2. WHEN AI capabilities are checked THEN the system SHALL manage them through a `useCapabilities` hook
3. WHEN the options App component is loaded THEN the system SHALL render using composed sub-components with the main file under 200 lines

### Requirement 4: Create Shared Modal Components

**User Story:** As a developer, I want to reuse common modal patterns across different modals, so that I avoid duplicating header and footer implementations.

#### Acceptance Criteria

1. WHEN a modal needs a standard header with title and close button THEN the system SHALL use a shared `ModalHeader` component from `content/components/shared/`
2. WHEN a modal needs a standard footer with action buttons THEN the system SHALL use a shared `ModalFooter` component from `content/components/shared/`
3. WHEN existing modal-specific headers have unique functionality THEN the system SHALL extend the shared component or keep the specific implementation
4. WHEN the shared components are created THEN the system SHALL update existing modals to use them where appropriate

### Requirement 5: Consolidate Component Entry Points

**User Story:** As a developer, I want consistent component organization where the main component file lives inside its feature folder, so that the codebase follows a predictable pattern.

#### Acceptance Criteria

1. WHEN a component has a dedicated folder with sub-components THEN the system SHALL place the main component as `index.tsx` inside that folder
2. WHEN the main component is moved THEN the system SHALL update all import paths accordingly
3. WHEN barrel exports exist THEN the system SHALL export the main component from the barrel file
4. IF a component folder contains only the main component with no sub-components THEN the system SHALL keep it as a single file without a folder

### Requirement 6: Simplify Large Prop Interfaces

**User Story:** As a developer, I want prop interfaces to be manageable and grouped logically, so that component APIs are easier to understand and use.

#### Acceptance Criteria

1. WHEN MeditationFlowOverlayProps has related props THEN the system SHALL group them into logical sub-objects (e.g., `voiceConfig`, `translationConfig`)
2. WHEN MoreToolsMenuProps has context-dependent props THEN the system SHALL use discriminated unions to make the API clearer
3. WHEN props are grouped THEN the system SHALL maintain backward compatibility or update all call sites

### Requirement 7: Remove Unused Code

**User Story:** As a developer, I want the codebase to be free of dead code, so that I can trust that all code serves a purpose.

#### Acceptance Criteria

1. WHEN refactoring is complete THEN the system SHALL run `knip` to identify unused exports, files, and dependencies
2. WHEN unused code is identified THEN the system SHALL remove it from the codebase
3. WHEN code is removed THEN the system SHALL verify the build and tests still pass

### Requirement 8: Reduce Unnecessary useEffect Usage

**User Story:** As a developer, I want effects to be used only when necessary, so that component behavior is predictable and easier to debug.

#### Acceptance Criteria

1. WHEN a useEffect is used for derived state THEN the system SHALL replace it with useMemo or inline calculation
2. WHEN a useEffect is used for event subscription THEN the system SHALL verify it cannot be handled through event handlers
3. WHEN a useEffect remains necessary THEN the system SHALL document why in a comment only if the reason is non-obvious

