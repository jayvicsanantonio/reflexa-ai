# Accessibility Testing Guide for Reflexa AI

This document provides a comprehensive guide for testing the accessibility features implemented in Reflexa AI Chrome Extension.

## Overview

Reflexa AI has been designed to meet WCAG AA standards with the following key accessibility features:

- Full keyboard navigation support
- Screen reader compatibility
- Focus management and focus trapping in modals
- ARIA labels and roles for all interactive elements
- Color contrast ratios meeting 4.5:1 minimum
- Reduced motion support
- Accessible form controls

## Testing Checklist

### 1. Keyboard Navigation

#### Reflect Mode Overlay

- [ ] Press Tab to navigate through all interactive elements
- [ ] Verify focus moves in logical order: summary → first input → second input → proofread buttons → cancel → save
- [ ] Press Shift+Tab to navigate backwards
- [ ] Verify focus is trapped within the overlay (cannot tab out to page content)
- [ ] Press Escape to close the overlay
- [ ] Press Cmd/Ctrl+Enter to save reflection
- [ ] Verify first input receives focus automatically when overlay opens

#### Lotus Nudge

- [ ] Tab to the lotus nudge button
- [ ] Press Enter or Space to activate
- [ ] Verify visible focus indicator appears

#### Dashboard Popup

- [ ] Press Tab to navigate through: Export button → Reflection cards → Delete buttons
- [ ] Verify "Skip to main content" link appears on Tab press
- [ ] Press Enter on "Skip to main content" to jump to main content
- [ ] Press Cmd/Ctrl+E to open export modal
- [ ] Press Escape to close modals

#### Options Page

- [ ] Tab through all settings controls
- [ ] Use arrow keys to adjust slider values
- [ ] Press Space or Enter to toggle switches
- [ ] Use arrow keys to navigate between radio options
- [ ] Verify all controls are reachable via keyboard

### 2. Screen Reader Testing

Test with NVDA (Windows), JAWS (Windows), or VoiceOver (macOS).

#### Reflect Mode Overlay

- [ ] Verify announcement: "Reflect mode opened. Review the summary and answer reflection questions."
- [ ] Verify dialog role is announced
- [ ] Verify summary section is announced with "Article Summary" label
- [ ] Verify each summary bullet is read with its label (Insight, Surprise, Apply)
- [ ] Verify reflection questions are read with proper labels
- [ ] Verify text inputs have accessible labels
- [ ] Verify button labels are clear: "Cancel" and "Save Reflection"
- [ ] Verify keyboard shortcuts are announced (Esc, Cmd+Enter)

#### Dashboard Popup

- [ ] Verify streak counter announces: "Current streak: X days"
- [ ] Verify calm stats progress bar announces current value
- [ ] Verify each reflection card is announced with title and date
- [ ] Verify delete buttons have clear labels: "Delete reflection"

#### Options Page

- [ ] Verify slider announces: "Dwell Threshold. X seconds"
- [ ] Verify slider value changes are announced
- [ ] Verify toggle switches announce state: "Enabled" or "Disabled"
- [ ] Verify radio groups announce selected option
- [ ] Verify descriptions are read for each control

### 3. Focus Visible Styles

- [ ] Verify all interactive elements show a 2px blue outline (#0ea5e9) when focused via keyboard
- [ ] Verify outline has 2px offset for clarity
- [ ] Verify focus styles are NOT shown when clicking with mouse (only keyboard)
- [ ] Verify focus styles work on: buttons, links, inputs, textareas, sliders, toggles, radio buttons

### 4. Color Contrast

Use a color contrast analyzer tool (e.g., WebAIM Contrast Checker) to verify:

#### Text Contrast

- [ ] Dark text on light background: #0f172a on #f8fafc (calm-900 on calm-50)
- [ ] Light text on dark background: #f8fafc on #0f172a (calm-50 on calm-900)
- [ ] Button text: white on #0ea5e9 (zen-500)
- [ ] Link text: #0284c7 (zen-600) on white
- [ ] All text meets 4.5:1 minimum ratio

#### Interactive Elements

- [ ] Button borders and backgrounds have sufficient contrast
- [ ] Focus indicators have sufficient contrast
- [ ] Disabled states are visually distinct but still readable

### 5. Reduced Motion

#### Browser Settings

1. Enable reduced motion in browser/OS:
   - **macOS**: System Preferences → Accessibility → Display → Reduce motion
   - **Windows**: Settings → Ease of Access → Display → Show animations
   - **Chrome**: chrome://settings/accessibility

#### Testing

- [ ] Verify breathing orb animation is disabled
- [ ] Verify overlay fade-in is instant (no animation)
- [ ] Verify lotus nudge pulse animation is disabled
- [ ] Verify all transitions are instant or very brief (<0.01s)
- [ ] Verify gradient drift effects are disabled

### 6. ARIA Attributes

Use browser DevTools to inspect elements and verify:

#### Reflect Mode Overlay

- [ ] `role="dialog"`
- [ ] `aria-modal="true"`
- [ ] `aria-labelledby` points to title
- [ ] Summary section has `aria-label="Article Summary"`
- [ ] Reflection section has `aria-label="Reflection Questions"`
- [ ] Breathing orb has `aria-hidden="true"` and `role="presentation"`

#### Dashboard

- [ ] Streak counter has `role="status"` and `aria-live="polite"`
- [ ] Progress bars have `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Reflection cards have `aria-label` with title
- [ ] Loading states have `aria-busy="true"`

#### Options Page

- [ ] Sliders have `aria-valuetext` with human-readable value
- [ ] Toggles have `role="switch"` and `aria-checked`
- [ ] Radio groups have `role="radiogroup"` with `aria-labelledby`
- [ ] Each radio has `role="radio"` and `aria-checked`

### 7. Form Controls

#### Sliders

- [ ] Can be adjusted with arrow keys (left/right or up/down)
- [ ] Home key jumps to minimum value
- [ ] End key jumps to maximum value
- [ ] Page Up/Down adjusts by larger increments
- [ ] Current value is announced when changed

#### Toggles

- [ ] Space or Enter toggles the switch
- [ ] Current state is announced when changed
- [ ] Visual indicator clearly shows on/off state

#### Radio Buttons

- [ ] Arrow keys navigate between options
- [ ] Space or Enter selects option
- [ ] Only selected option is in tab order (tabindex=0)
- [ ] Other options have tabindex=-1

### 8. Touch Targets

Verify all interactive elements meet minimum touch target size (44x44px):

- [ ] Buttons
- [ ] Links
- [ ] Toggle switches
- [ ] Radio buttons
- [ ] Checkboxes
- [ ] Lotus nudge icon

### 9. Error Handling

- [ ] Error messages have `role="alert"`
- [ ] Errors are announced to screen readers
- [ ] Error messages have sufficient color contrast
- [ ] Errors are associated with form fields via `aria-describedby`

### 10. Loading States

- [ ] Loading indicators have `aria-busy="true"`
- [ ] Loading messages are announced to screen readers
- [ ] Skeleton UI provides visual feedback
- [ ] Loading states don't trap focus

## Automated Testing

Run automated accessibility tests using:

```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/cli

# Run axe on popup page
axe chrome-extension://[extension-id]/popup/index.html

# Run axe on options page
axe chrome-extension://[extension-id]/options/index.html
```

## Manual Testing Tools

### Browser Extensions

- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Includes accessibility audit
- **Color Contrast Analyzer**: Check color ratios

### Screen Readers

- **NVDA** (Windows): Free, open-source
- **JAWS** (Windows): Industry standard (paid)
- **VoiceOver** (macOS): Built-in, free
- **ChromeVox** (Chrome): Browser-based

### Keyboard Testing

- Use only keyboard (no mouse) for 5-10 minutes
- Verify all functionality is accessible
- Check for keyboard traps
- Verify focus is always visible

## Common Issues to Watch For

1. **Focus Traps**: Ensure focus can always escape from modals/overlays
2. **Missing Labels**: All form inputs must have associated labels
3. **Poor Contrast**: Text must be readable against backgrounds
4. **Keyboard-Only**: All mouse actions must have keyboard equivalents
5. **Screen Reader**: All content must be accessible to screen readers
6. **Motion Sensitivity**: Respect prefers-reduced-motion setting

## Reporting Issues

When reporting accessibility issues, include:

1. **Component**: Which component has the issue
2. **Issue Type**: Keyboard, screen reader, contrast, etc.
3. **Steps to Reproduce**: How to encounter the issue
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **WCAG Criterion**: Which WCAG guideline is violated (if applicable)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Chrome Extension Accessibility](https://developer.chrome.com/docs/extensions/mv3/a11y/)
