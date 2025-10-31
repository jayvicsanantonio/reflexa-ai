# More Tools Menu Implementation

## Overview

Reorganized the Reflect Mode UI to consolidate tools into a context-aware "More Tools" dropdown menu, improving the interface's cleanliness and usability.

## Changes Made

### 1. New Component: MoreToolsMenu

Created `src/content/components/MoreToolsMenu.tsx` - a context-aware dropdown menu that displays different tools based on the current screen:

**Summary Screen:**

- Summary Format options (Bullets, Paragraph, Headline)

**Reflection Screen (No Content):**

- Generate Draft option (AI-powered starting point using Chrome AI Writer API)

**Reflection Screen (With Content):**

- Rewrite Tone options (Calm, Concise, Empathetic, Academic)
- Proofread option (when proofreader is available)

### 2. Updated ReflectModeOverlay

- Removed standalone Summary Format Dropdown
- Removed Tone Preset Chips from reflection section
- Removed individual Proofread buttons from reflection inputs
- Added screen state tracking (`summary` vs `reflection`)
- Integrated MoreToolsMenu into action buttons area
- Reorganized action buttons layout with left/right sections

### 3. UI Layout Changes

**Action Buttons Section:**

```
[More Tools ▼] [Cancel]                    [Save Reflection]
     ↑              ↑                              ↑
  Left side     Left side                    Right side
```

**More Tools Menu Position:**

- Opens upward from the button (bottom-anchored)
- Positioned on the left side of the action bar
- Contains context-aware options based on current screen

### 4. Accept/Discard Button Alignment

Updated both Rewrite Preview and Proofread Diff View to align Accept/Discard buttons to the right:

**Rewrite Preview:**

- Buttons now aligned to the right in the header
- Added checkmark and X icons for clarity

**Proofread Diff View:**

- Action buttons aligned to the right
- Consistent styling with other action buttons

### 5. Styling

Added comprehensive styles in `src/content/styles.css`:

- `.reflexa-more-tools` - Menu container and trigger button
- `.reflexa-more-tools__menu` - Dropdown menu with upward animation
- `.reflexa-more-tools__section` - Grouped options with titles
- `.reflexa-more-tools__option` - Individual menu items
- `.reflexa-overlay__actions-left/right` - Split action button layout
- `.reflexa-proofread-diff-view__actions` - Right-aligned buttons

## User Experience Improvements

1. **Cleaner Interface**: Tools are hidden until needed, reducing visual clutter
2. **Context-Aware**: Only relevant tools are shown based on current screen and content state
3. **Smart Tool Display**:
   - Generate Draft appears when starting fresh (no content)
   - Tone and Proofread options appear when there's content to work with
4. **Consistent Layout**: All tools accessible from one location
5. **Better Organization**: Related tools grouped together with clear labels
6. **Improved Button Alignment**: Accept/Discard actions consistently positioned on the right

## Technical Details

### Screen Detection

The component automatically switches between `summary` and `reflection` screens:

- Starts in `summary` screen
- Switches to `reflection` when user starts typing in any reflection field
- Active reflection index is tracked for proofread operations

### Menu Behavior

- Opens on click
- Closes when:
  - An option is selected
  - User clicks outside the menu
  - Escape key is pressed
- Smooth animation using `reflexaPopIn` keyframe

### Accessibility

- Proper ARIA attributes (`aria-expanded`, `aria-haspopup`, `role="menu"`)
- Keyboard navigation support (Escape to close)
- Screen reader friendly labels
- Focus management

## Testing

- Added comprehensive test suite in `src/content/components/MoreToolsMenu.test.tsx`
- Updated accessibility test to check for proofread option in More menu
- All existing tests pass with the new implementation

## Files Modified

- `src/content/components/ReflectModeOverlay.tsx` - Integrated More Tools menu
- `src/content/components/ProofreadDiffView.tsx` - No changes needed (already had right-aligned buttons)
- `src/content/styles.css` - Added More Tools and layout styles
- `src/__tests__/accessibility.test.tsx` - Updated proofread button test

## Files Created

- `src/content/components/MoreToolsMenu.tsx` - New component
- `src/content/components/MoreToolsMenu.test.tsx` - Test suite
- `docs/MORE_TOOLS_MENU_IMPLEMENTATION.md` - This documentation

## Latest Updates

### Content-Aware Tool Display

The More Tools menu now adapts based on whether there's content in the reflection fields:

- **No Content** (`hasReflectionContent = false`): Shows "Generate Draft" option to help users get started
- **Has Content** (`hasReflectionContent = true`): Shows "Rewrite Tone" and "Proofread" options for refining existing text

This ensures users see the most relevant tools for their current task, reducing cognitive load and improving the writing flow.

### Generate Draft Feature

Added AI-powered draft generation to help users overcome writer's block:

- Appears in the More Tools menu when reflection fields are empty
- Uses the summary content to generate a contextual starting point
- Integrates with the existing `StartReflectionButton` functionality
- Only available when experimental mode is enabled

### Updated Props

The `MoreToolsMenu` component now accepts:

- `onGenerateDraft`: Handler for generating AI drafts
- `generateDraftDisabled`: Boolean to disable the generate option
- `summary`: Array of summary points for context
- `hasReflectionContent`: Boolean indicating if any reflection has content

### Test Coverage

Added comprehensive tests for the new functionality:

- Generate draft option visibility when no content
- Tone options visibility when there is content
- Proofread option visibility when there is content
- Conditional rendering based on content state
- Generate draft click handler
