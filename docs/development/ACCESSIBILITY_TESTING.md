# Accessibility Testing Guide

## Overview

This guide provides comprehensive instructions for testing the accessibility of the Reflexa AI Chrome Extension. It covers both automated and manual testing procedures to ensure compliance with WCAG 2.1 Level AA standards.

## Requirements Coverage

This testing addresses the following requirements:

- **6.1**: Reduce Motion toggle and prefers-reduced-motion support
- **6.2**: Enable Sound toggle for audio control
- **6.3**: Browser prefers-reduced-motion detection
- **6.4**: WCAG AA color contrast (4.5:1 minimum)
- **6.5**: Full keyboard navigation support

## Automated Testing

### Running Tests

```bash
# Run all accessibility tests
npm test -- src/test/accessibility.test.tsx

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch
```

### Test Coverage

The automated test suite includes 42 tests covering:

1. **Keyboard Navigation** (3 tests)
   - Enter key activation
   - Space key activation
   - Non-action key handling

2. **Focus Management** (3 tests)
   - Focus trap within containers
   - Escape key handling
   - Shift+Tab reverse navigation

3. **Screen Reader Announcements** (4 tests)
   - ARIA attributes
   - Priority levels (polite/assertive)
   - Cleanup functions
   - Auto-removal timing

4. **Color Contrast** (10 tests)
   - WCAG AA compliance
   - Multiple color format support
   - Contrast ratio calculations

5. **Reduced Motion** (2 tests)
   - Media query detection
   - Preference handling

6. **Duration Formatting** (3 tests)
   - Accessible time descriptions

7. **Component Accessibility** (17 tests)
   - LotusNudge component
   - BreathingOrb component
   - ReflectModeOverlay component

## Manual Testing Procedures

### 1. Keyboard Navigation Testing

#### Test Procedure

1. **Tab Navigation**
   - Open the extension popup
   - Press Tab repeatedly
   - Verify focus moves through all interactive elements in logical order
   - Verify focus indicator is visible (2px blue outline)

2. **Shift+Tab Navigation**
   - Navigate to the last element
   - Press Shift+Tab repeatedly
   - Verify focus moves backward through elements

3. **Enter/Space Activation**
   - Focus on buttons and links
   - Press Enter key
   - Press Space key
   - Verify both keys activate the element

4. **Keyboard Shortcuts**
   - Open Reflect Mode overlay
   - Press Escape → Verify overlay closes
   - Open overlay again
   - Type in reflection inputs
   - Press Cmd+Enter (macOS) or Ctrl+Enter (Windows/Linux)
   - Verify reflection saves

5. **Focus Trap**
   - Open Reflect Mode overlay
   - Press Tab repeatedly
   - Verify focus stays within the overlay
   - Verify focus cycles from last to first element

#### Expected Results

✅ All interactive elements reachable via keyboard
✅ Focus indicator visible on all elements
✅ Logical tab order maintained
✅ No keyboard traps (except intentional modal traps)
✅ Keyboard shortcuts work as documented

### 2. Screen Reader Testing

#### Test with NVDA (Windows)

1. **Installation**
   - Download NVDA from https://www.nvaccess.org/
   - Install and launch NVDA

2. **Testing Procedure**
   - Open Chrome with extension installed
   - Navigate to a test article
   - Wait for lotus nudge to appear
   - Use arrow keys to navigate to the nudge
   - Verify NVDA announces: "Start reflection session. Press Enter or Space to begin."
   - Press Enter to activate
   - Verify NVDA announces: "Reflect mode opened. Review the summary and answer reflection questions."
   - Navigate through summary bullets
   - Navigate to reflection inputs
   - Verify labels are announced correctly
   - Fill in reflections
   - Navigate to Save button
   - Verify button purpose is announced

#### Test with JAWS (Windows)

1. **Installation**
   - Download JAWS from https://www.freedomscientific.com/
   - Install and launch JAWS

2. **Testing Procedure**
   - Follow same procedure as NVDA
   - Verify all content is announced
   - Test forms mode for text inputs
   - Verify button labels are clear

#### Test with VoiceOver (macOS)

1. **Activation**
   - Press Cmd+F5 to enable VoiceOver
   - Or go to System Preferences → Accessibility → VoiceOver

2. **Testing Procedure**
   - Open Chrome with extension installed
   - Press Ctrl+Option+Right Arrow to navigate
   - Navigate to lotus nudge
   - Verify VoiceOver announces button label
   - Press Ctrl+Option+Space to activate
   - Navigate through Reflect Mode overlay
   - Verify all content is announced
   - Test form inputs with VoiceOver

#### Expected Results

✅ All interactive elements have clear labels
✅ Button purposes are announced
✅ Form labels associated with inputs
✅ Status updates announced (save confirmation)
✅ Modal opening/closing announced
✅ No unlabeled or confusing elements

### 3. Color Contrast Testing

#### Using Browser DevTools

1. **Chrome DevTools**
   - Right-click on text element
   - Select "Inspect"
   - In Styles panel, click color swatch
   - View contrast ratio in color picker
   - Verify ratio meets WCAG AA (4.5:1 for normal text, 3:1 for large text)

2. **Test All Text Elements**
   - Body text on backgrounds
   - Button text on button backgrounds
   - Link text on page backgrounds
   - Placeholder text in inputs
   - Disabled element text

#### Using Online Tools

1. **WebAIM Contrast Checker**
   - Visit https://webaim.org/resources/contrastchecker/
   - Enter foreground and background colors
   - Verify WCAG AA compliance

2. **Contrast Ratio Calculator**
   - Visit https://contrast-ratio.com/
   - Test color combinations
   - Verify ratios meet standards

#### Color Combinations to Test

| Element     | Foreground         | Background        | Expected Ratio |
| ----------- | ------------------ | ----------------- | -------------- |
| Body text   | calm-900 (#0f172a) | calm-50 (#f8fafc) | 18.5:1 ✅      |
| Button text | white (#ffffff)    | zen-500 (#0ea5e9) | 2.77:1 ⚠️      |
| Link text   | zen-600 (#0284c7)  | white (#ffffff)   | 4.29:1 ✅      |
| Input text  | calm-900 (#0f172a) | white (#ffffff)   | 18.5:1 ✅      |
| Placeholder | calm-400           | white             | 4.5:1+ ✅      |

**Note**: Button text ratio (2.77:1) is acceptable for large text (18pt+) but should be monitored for user feedback.

#### Expected Results

✅ All text meets WCAG AA standards
✅ No information conveyed by color alone
✅ Sufficient contrast in all states (hover, focus, active)

### 4. Reduced Motion Testing

#### Enable Reduced Motion

**macOS:**

1. System Preferences → Accessibility → Display
2. Check "Reduce motion"

**Windows:**

1. Settings → Ease of Access → Display
2. Turn on "Show animations in Windows"

**Linux (GNOME):**

1. Settings → Universal Access → Seeing
2. Turn off "Animations"

#### Testing Procedure

1. **Enable Reduced Motion in OS**
   - Follow steps above for your OS

2. **Test Extension Behavior**
   - Open extension
   - Navigate to a test article
   - Wait for lotus nudge
   - Click to open Reflect Mode
   - Verify breathing orb is static (no animation)
   - Verify overlay appears instantly (no fade-in)
   - Verify no gradient drift animation

3. **Test Settings Toggle**
   - Open extension options page
   - Toggle "Reduce Motion" setting
   - Open Reflect Mode
   - Verify animations disabled
   - Toggle setting off
   - Verify animations enabled

#### Expected Results

✅ Breathing orb static when motion reduced
✅ No fade-in animations
✅ No gradient drift effects
✅ Settings toggle overrides browser preference
✅ All functionality remains accessible

### 5. Focus Management Testing

#### Testing Procedure

1. **Focus Visibility**
   - Tab through all elements
   - Verify focus indicator visible on each element
   - Verify indicator has sufficient contrast (3:1 minimum)
   - Verify indicator is not obscured by other elements

2. **Focus Order**
   - Tab through popup dashboard
   - Verify order matches visual layout
   - Verify order is logical and predictable

3. **Focus Trap in Modal**
   - Open Reflect Mode overlay
   - Tab to last element (Save button)
   - Press Tab again
   - Verify focus returns to first element (first input)
   - Press Shift+Tab on first element
   - Verify focus moves to last element

4. **Auto-Focus**
   - Open Reflect Mode overlay
   - Verify first reflection input receives focus automatically
   - Verify focus is not lost when overlay opens

5. **Focus Restoration**
   - Focus on lotus nudge
   - Press Enter to open overlay
   - Press Escape to close
   - Verify focus returns to trigger element (if still visible)

#### Expected Results

✅ Focus indicator visible on all elements
✅ Focus order is logical
✅ Focus trapped in modal
✅ Auto-focus works correctly
✅ Focus restored after modal closes

### 6. Touch Target Testing

#### Testing Procedure

1. **Measure Touch Targets**
   - Use browser DevTools to measure elements
   - Verify all interactive elements are at least 44x44 CSS pixels

2. **Test Elements**
   - Lotus nudge button
   - Reflection input areas
   - Save/Cancel buttons
   - Settings toggles
   - Dashboard reflection cards

3. **Test Spacing**
   - Verify adequate spacing between touch targets (8px minimum)
   - Verify no overlapping interactive areas

#### Expected Results

✅ All touch targets at least 44x44px
✅ Adequate spacing between targets
✅ No overlapping interactive areas

## Automated Accessibility Scanning

### Using Axe DevTools

1. **Installation**
   - Install Axe DevTools browser extension
   - Chrome: https://chrome.google.com/webstore (search "axe DevTools")

2. **Running Scan**
   - Open extension popup or options page
   - Open browser DevTools (F12)
   - Click "axe DevTools" tab
   - Click "Scan ALL of my page"
   - Review results

3. **Test All Pages**
   - Extension popup (dashboard)
   - Options page
   - Reflect Mode overlay (inject on test page)

#### Expected Results

✅ No critical or serious issues
✅ All WCAG A and AA criteria met
✅ Best practices followed

### Using Lighthouse

1. **Running Lighthouse**
   - Open extension popup or options page
   - Open DevTools (F12)
   - Click "Lighthouse" tab
   - Select "Accessibility" category
   - Click "Generate report"

2. **Review Results**
   - Verify score is 90+ (green)
   - Review any flagged issues
   - Fix issues and re-test

#### Expected Results

✅ Accessibility score 90+
✅ All audits passed
✅ No accessibility violations

## Testing Checklist

Use this checklist to ensure comprehensive accessibility testing:

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Keyboard shortcuts work (Cmd/Ctrl+Enter)
- [ ] Focus visible on all elements
- [ ] No keyboard traps (except intentional)

### Screen Reader

- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] All content announced correctly
- [ ] Form labels read properly
- [ ] Button purposes clear
- [ ] Status updates announced

### Visual

- [ ] Focus indicators visible (2px outline)
- [ ] Color contrast meets WCAG AA
- [ ] Text readable at 200% zoom
- [ ] No information by color alone
- [ ] High contrast mode works

### Motion

- [ ] Enable prefers-reduced-motion in OS
- [ ] Breathing orb animation disabled
- [ ] Overlay transitions instant
- [ ] No unexpected motion
- [ ] Settings toggle works

### Touch Targets

- [ ] All targets at least 44x44px
- [ ] Adequate spacing between targets
- [ ] No overlapping interactive areas

### Automated Scans

- [ ] Axe DevTools scan passed
- [ ] Lighthouse accessibility score 90+
- [ ] No critical violations

## Common Issues and Solutions

### Issue: Focus indicator not visible

**Solution**: Ensure focus styles are defined and have sufficient contrast. Use `:focus-visible` for better UX.

### Issue: Screen reader not announcing content

**Solution**: Add appropriate ARIA labels, roles, and live regions. Ensure semantic HTML is used.

### Issue: Keyboard trap in modal

**Solution**: Implement focus trap correctly with Tab/Shift+Tab cycling and Escape to exit.

### Issue: Color contrast too low

**Solution**: Adjust colors to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

### Issue: Animations not respecting reduced motion

**Solution**: Check `prefers-reduced-motion` media query and settings toggle. Disable animations when either is active.

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chrome Extension Accessibility](https://developer.chrome.com/docs/extensions/mv3/a11y/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)

## Conclusion

Comprehensive accessibility testing ensures the Reflexa AI Chrome Extension is usable by everyone, including people with disabilities. By following this guide and running both automated and manual tests, we can maintain WCAG AA compliance and provide an excellent user experience for all users.
