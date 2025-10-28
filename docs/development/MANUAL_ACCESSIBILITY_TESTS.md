# Manual Accessibility Testing Procedures

## Overview

This document provides step-by-step instructions for performing manual accessibility tests on the Reflexa AI Chrome Extension. These tests complement the automated test suite and verify real-world usability with assistive technologies.

## Prerequisites

- Chrome browser with Reflexa AI extension installed
- Test article pages for dwell time testing
- Screen reader software (NVDA, JAWS, or VoiceOver)
- Color contrast analyzer tool
- Access to OS accessibility settings

## Test Procedures

### 1. Keyboard Navigation Test

**Objective**: Verify all functionality is accessible via keyboard only.

**Steps**:

1. Open the extension popup by clicking the extension icon
2. Press Tab key repeatedly
3. Observe focus indicator on each element
4. Press Shift+Tab to navigate backwards
5. Press Enter or Space on buttons to activate
6. Navigate to a test article page
7. Wait for lotus nudge to appear
8. Tab to the lotus nudge
9. Press Enter to open Reflect Mode
10. Tab through all elements in the overlay
11. Press Escape to close
12. Type in reflection inputs
13. Press Cmd+Enter (macOS) or Ctrl+Enter (Windows) to save

**Expected Results**:

- ✅ All interactive elements reachable via Tab
- ✅ Focus indicator visible (2px blue outline)
- ✅ Logical tab order maintained
- ✅ Enter and Space keys activate buttons
- ✅ Escape closes modal
- ✅ Keyboard shortcuts work correctly
- ✅ Focus trapped in modal (cycles from last to first)

**Status**: ⏳ Pending manual verification

---

### 2. Screen Reader Test (NVDA - Windows)

**Objective**: Verify content is properly announced to screen reader users.

**Setup**:

1. Download and install NVDA from https://www.nvaccess.org/
2. Launch NVDA (Ctrl+Alt+N)
3. Open Chrome with extension installed

**Steps**:

1. Navigate to a test article
2. Wait for lotus nudge to appear
3. Use arrow keys to navigate to the nudge
4. Listen for announcement: "Start reflection session. Press Enter or Space to begin."
5. Press Enter to activate
6. Listen for announcement: "Reflect mode opened. Review the summary and answer reflection questions."
7. Navigate through summary section
8. Verify each bullet is announced with its label (Insight, Surprise, Apply)
9. Navigate to reflection questions
10. Verify question labels are announced
11. Type in text inputs
12. Navigate to Save button
13. Verify button label is announced: "Save Reflection Cmd+Enter" or "Save Reflection Ctrl+Enter"
14. Navigate to Cancel button
15. Verify button label is announced: "Cancel Esc"

**Expected Results**:

- ✅ All interactive elements have clear labels
- ✅ Button purposes are announced
- ✅ Form labels associated with inputs
- ✅ Status updates announced (save confirmation)
- ✅ Modal opening/closing announced
- ✅ Summary bullets announced with labels
- ✅ No unlabeled or confusing elements

**Status**: ⏳ Pending manual verification

---

### 3. Screen Reader Test (VoiceOver - macOS)

**Objective**: Verify content is properly announced to VoiceOver users.

**Setup**:

1. Press Cmd+F5 to enable VoiceOver
2. Or go to System Preferences → Accessibility → VoiceOver
3. Open Chrome with extension installed

**Steps**:

1. Navigate to a test article
2. Wait for lotus nudge to appear
3. Press Ctrl+Option+Right Arrow to navigate
4. Navigate to the lotus nudge
5. Listen for announcement
6. Press Ctrl+Option+Space to activate
7. Navigate through Reflect Mode overlay
8. Verify all content is announced correctly
9. Test form inputs with VoiceOver
10. Navigate to buttons and verify labels

**Expected Results**:

- ✅ All content announced correctly
- ✅ Navigation works smoothly
- ✅ Form inputs properly labeled
- ✅ Button purposes clear
- ✅ Modal structure understood

**Status**: ⏳ Pending manual verification

---

### 4. Color Contrast Test

**Objective**: Verify all text meets WCAG AA contrast standards (4.5:1).

**Tools**:

- Chrome DevTools color picker
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Contrast Ratio Calculator: https://contrast-ratio.com/

**Steps**:

1. **Test Body Text**
   - Inspect body text elements
   - Note foreground color: calm-900 (#0f172a)
   - Note background color: calm-50 (#f8fafc)
   - Calculate ratio: Expected 18.5:1 ✅

2. **Test Button Text**
   - Inspect Save button
   - Note foreground: white (#ffffff)
   - Note background: zen-500 (#0ea5e9)
   - Calculate ratio: Expected 2.77:1 ⚠️ (acceptable for large text)

3. **Test Link Text**
   - Inspect links in dashboard
   - Note foreground: zen-600 (#0284c7)
   - Note background: white (#ffffff)
   - Calculate ratio: Expected 4.29:1 ✅

4. **Test Input Text**
   - Inspect text inputs
   - Note foreground: calm-900 (#0f172a)
   - Note background: white (#ffffff)
   - Calculate ratio: Expected 18.5:1 ✅

5. **Test Placeholder Text**
   - Inspect input placeholders
   - Verify contrast meets 4.5:1 minimum

**Expected Results**:

- ✅ All text meets WCAG AA standards
- ✅ Body text: 18.5:1 ratio
- ✅ Link text: 4.29:1 ratio
- ✅ Input text: 18.5:1 ratio
- ⚠️ Button text: 2.77:1 (acceptable for large text 18pt+)

**Status**: ⏳ Pending manual verification

---

### 5. Reduced Motion Test

**Objective**: Verify animations are disabled when user prefers reduced motion.

**Setup (macOS)**:

1. System Preferences → Accessibility → Display
2. Check "Reduce motion"

**Setup (Windows)**:

1. Settings → Ease of Access → Display
2. Turn off "Show animations in Windows"

**Steps**:

1. Enable reduced motion in OS (see setup above)
2. Open extension
3. Navigate to a test article
4. Wait for lotus nudge to appear
5. Click to open Reflect Mode
6. Observe breathing orb - should be static (no animation)
7. Observe overlay appearance - should be instant (no fade-in)
8. Verify no gradient drift animation
9. Close overlay
10. Open extension options page
11. Toggle "Reduce Motion" setting ON
12. Open Reflect Mode again
13. Verify animations disabled
14. Toggle setting OFF
15. Verify animations enabled

**Expected Results**:

- ✅ Breathing orb static when motion reduced
- ✅ No fade-in animations
- ✅ No gradient drift effects
- ✅ Settings toggle overrides browser preference
- ✅ All functionality remains accessible
- ✅ No unexpected motion

**Status**: ⏳ Pending manual verification

---

### 6. Focus Management Test

**Objective**: Verify focus is managed correctly throughout the application.

**Steps**:

1. **Focus Visibility**
   - Tab through all elements in popup
   - Verify focus indicator visible on each element
   - Verify indicator has sufficient contrast (3:1 minimum)
   - Verify indicator is not obscured

2. **Focus Order**
   - Tab through popup dashboard
   - Verify order matches visual layout (top to bottom, left to right)
   - Verify order is logical and predictable

3. **Focus Trap in Modal**
   - Open Reflect Mode overlay
   - Tab to last element (Save button)
   - Press Tab again
   - Verify focus returns to first element (first input)
   - Press Shift+Tab on first element
   - Verify focus moves to last element (Save button)

4. **Auto-Focus**
   - Open Reflect Mode overlay
   - Verify first reflection input receives focus automatically
   - Verify cursor is in the input field

5. **Focus Restoration**
   - Focus on lotus nudge
   - Press Enter to open overlay
   - Press Escape to close
   - Verify focus returns to trigger element (if still visible)

**Expected Results**:

- ✅ Focus indicator visible on all elements
- ✅ Focus order is logical
- ✅ Focus trapped in modal
- ✅ Tab cycles from last to first element
- ✅ Shift+Tab cycles from first to last element
- ✅ Auto-focus works correctly
- ✅ Focus restored after modal closes

**Status**: ⏳ Pending manual verification

---

### 7. Touch Target Test

**Objective**: Verify all interactive elements meet minimum touch target size (44x44px).

**Tools**: Chrome DevTools element inspector

**Steps**:

1. **Measure Lotus Nudge**
   - Inspect lotus nudge button
   - Verify width and height ≥ 44px
   - Expected: 48x48px ✅

2. **Measure Reflection Inputs**
   - Inspect text input areas
   - Verify height ≥ 44px
   - Verify adequate width for touch

3. **Measure Buttons**
   - Inspect Save button
   - Verify height ≥ 44px
   - Inspect Cancel button
   - Verify height ≥ 44px

4. **Measure Settings Toggles**
   - Inspect toggle switches
   - Verify touch area ≥ 44x44px

5. **Measure Dashboard Cards**
   - Inspect reflection cards
   - Verify clickable area is adequate

6. **Check Spacing**
   - Verify spacing between touch targets ≥ 8px
   - Verify no overlapping interactive areas

**Expected Results**:

- ✅ All touch targets at least 44x44px
- ✅ Adequate spacing between targets (8px minimum)
- ✅ No overlapping interactive areas
- ✅ Touch targets easy to activate on mobile/tablet

**Status**: ⏳ Pending manual verification

---

### 8. Axe DevTools Scan

**Objective**: Run automated accessibility scan using Axe DevTools.

**Setup**:

1. Install Axe DevTools extension from Chrome Web Store
2. Open extension popup or options page

**Steps**:

1. Open extension popup (dashboard)
2. Open Chrome DevTools (F12)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review results
6. Note any issues found
7. Repeat for options page
8. Repeat for Reflect Mode overlay (on test page)

**Expected Results**:

- ✅ No critical issues
- ✅ No serious issues
- ✅ All WCAG A and AA criteria met
- ✅ Best practices followed

**Status**: ⏳ Pending manual verification

---

### 9. Lighthouse Accessibility Audit

**Objective**: Run Lighthouse accessibility audit and achieve 90+ score.

**Steps**:

1. Open extension popup
2. Open Chrome DevTools (F12)
3. Click "Lighthouse" tab
4. Select "Accessibility" category only
5. Click "Generate report"
6. Review score and results
7. Note any flagged issues
8. Repeat for options page

**Expected Results**:

- ✅ Accessibility score ≥ 90 (green)
- ✅ All audits passed
- ✅ No accessibility violations
- ✅ Best practices followed

**Status**: ⏳ Pending manual verification

---

## Testing Checklist

Use this checklist to track manual testing progress:

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Keyboard shortcuts work (Cmd/Ctrl+Enter)
- [ ] Focus visible on all elements
- [ ] No keyboard traps (except intentional)

### Screen Reader (NVDA)

- [ ] All content announced correctly
- [ ] Form labels read properly
- [ ] Button purposes clear
- [ ] Status updates announced
- [ ] Modal opening/closing announced

### Screen Reader (VoiceOver)

- [ ] All content announced correctly
- [ ] Navigation works smoothly
- [ ] Form inputs properly labeled
- [ ] Button purposes clear

### Color Contrast

- [ ] Body text meets WCAG AA
- [ ] Button text acceptable
- [ ] Link text meets WCAG AA
- [ ] Input text meets WCAG AA
- [ ] Placeholder text meets WCAG AA

### Reduced Motion

- [ ] OS preference detected
- [ ] Breathing orb animation disabled
- [ ] Overlay transitions instant
- [ ] Settings toggle works
- [ ] No unexpected motion

### Focus Management

- [ ] Focus indicators visible
- [ ] Focus order logical
- [ ] Focus trapped in modal
- [ ] Auto-focus works
- [ ] Focus restoration works

### Touch Targets

- [ ] All targets ≥ 44x44px
- [ ] Adequate spacing (≥ 8px)
- [ ] No overlapping areas

### Automated Scans

- [ ] Axe DevTools scan passed
- [ ] Lighthouse score ≥ 90
- [ ] No critical violations

## Test Results

**Date**: ******\_******

**Tester**: ******\_******

**Overall Status**: ⏳ Pending

### Issues Found

| Issue      | Severity | Component | Status |
| ---------- | -------- | --------- | ------ |
| _None yet_ | -        | -         | -      |

### Notes

_Add any additional observations or recommendations here._

## Sign-off

**Tested by**: ******\_******

**Date**: ******\_******

**Approved**: ☐ Yes ☐ No ☐ With conditions

**Conditions/Notes**: **********************\_**********************

---

## Next Steps

After completing manual testing:

1. Document any issues found in the Issues table
2. Create GitHub issues for any accessibility problems
3. Fix issues and re-test
4. Update ACCESSIBILITY_TEST_RESULTS.md with findings
5. Get sign-off from accessibility specialist (if available)
6. Mark task 28 as complete in tasks.md

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chrome Extension Accessibility](https://developer.chrome.com/docs/extensions/mv3/a11y/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [WebAIM Resources](https://webaim.org/)
