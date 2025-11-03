# Phase 5.3: Manual Testing Checklist

**Date**: 2025-11-02
**Purpose**: Comprehensive manual testing guide for Reflexa AI Chrome Extension
**Status**: Ready for Testing

---

## Pre-Testing Setup

### 1. Chrome Extension Installation
- [ ] Load extension from `dist/` folder in Chrome
- [ ] Verify extension appears in Chrome Extensions page
- [ ] Enable extension (toggle on)
- [ ] Verify extension icon appears in toolbar

### 2. Chrome AI Flags Setup
- [ ] Enable `#optimization-guide-on-device-model` (Enabled + BypassPerfRequirement)
- [ ] Enable `#prompt-api-for-gemini-nano`
- [ ] Enable `#summarization-api-for-gemini-nano`
- [ ] Enable `#writer-api`
- [ ] Enable `#rewriter-api`
- [ ] Enable `#proofreader-api`
- [ ] Enable `#translator-api`
- [ ] Enable `#language-detection-api`
- [ ] Restart Chrome after enabling flags
- [ ] Verify AI Status modal shows all APIs as "Available"

---

## Core Functionality Tests

### 3. Dwell Tracking
- [ ] Open any article/blog page
- [ ] Stay on page for dwell threshold duration (default: 30s)
- [ ] Verify Lotus nudge icon appears in bottom-right corner
- [ ] Hover over nudge - verify quick action buttons appear (Dashboard, AI Status, Settings)
- [ ] Verify nudge disappears when navigating to new page
- [ ] Verify nudge resets when going back/forward (SPA navigation)

**Test Pages**:
- Long-form article (1000+ words)
- Short blog post (200-500 words)
- SPA (React/Vue app)
- Wikipedia page

### 4. Content Extraction
- [ ] Dwell threshold reached on article page
- [ ] Click "Reflect" on lotus nudge
- [ ] Verify overlay opens
- [ ] Verify summary appears with extracted content
- [ ] Test on different content types:
  - [ ] Standard article with paragraphs
  - [ ] List-based content
  - [ ] Code-heavy pages
  - [ ] Mixed content (text + images + ads)

### 5. Reflection Flow - Step 0: Breathing Phase
- [ ] After clicking "Reflect", verify breathing orb appears
- [ ] Verify orb animates (breathing pulse)
- [ ] Verify meditative phrases rotate
- [ ] Verify "Preparing..." message while summary loads
- [ ] Verify step advances automatically when summary is ready
- [ ] Test with `reduceMotion: true` - verify animation disabled

### 6. Reflection Flow - Step 1: Summary Phase
- [ ] Verify summary appears after breathing phase
- [ ] Verify 3 summary points displayed (default bullets format)
- [ ] Test format switching:
  - [ ] Switch to "Paragraph" format - verify single paragraph
  - [ ] Switch to "Headline + Bullets" - verify headline with bullets
  - [ ] Switch back to "Bullets" - verify bullets return
- [ ] Verify format persists during session
- [ ] Test with different summary lengths (short, medium, long content)

### 7. Reflection Flow - Step 2 & 3: Reflection Questions
- [ ] Click "Next" after summary phase
- [ ] Verify Question 1 appears: "What did you find most interesting?"
- [ ] Verify Question 2 appears after answering Q1: "How might you apply this?"
- [ ] Test text input:
  - [ ] Type answer - verify text appears
  - [ ] Verify auto-save (check localStorage)
  - [ ] Refresh page - verify answer persists
- [ ] Test voice input:
  - [ ] Click voice button - verify recording starts
  - [ ] Speak answer - verify transcription appears
  - [ ] Verify auto-stop after silence
  - [ ] Test stop button
  - [ ] Verify audio cues play (voice stop cue)
- [ ] Test Back/Next navigation
- [ ] Verify answers persist when navigating steps

---

## AI Feature Tests

### 8. Summarization
- [ ] Verify summary generates automatically
- [ ] Test streaming - verify text appears progressively
- [ ] Test different formats (bullets, paragraph, headline-bullets)
- [ ] Verify summary quality (coherent, relevant points)
- [ ] Test with very long content (3000+ words) - verify completes
- [ ] Test with very short content (<100 words) - verify handles gracefully

### 9. Language Detection & Translation
- [ ] Open article in non-English language (e.g., Spanish, French)
- [ ] Verify language badge appears on summary
- [ ] Click "Translate" dropdown
- [ ] Select target language
- [ ] Verify summary translates
- [ ] Verify translation quality
- [ ] Test language detection accuracy:
  - [ ] English article → "English"
  - [ ] Spanish article → "Español"
  - [ ] Mixed content → detects primary language
- [ ] Test auto-translation preference (if enabled in settings)

### 10. Writer API (Draft Generation)
- [ ] Navigate to reflection question (Q1 or Q2)
- [ ] Leave answer field empty
- [ ] Click "Generate Draft" (or keyboard shortcut)
- [ ] Verify draft generates progressively (character-by-character animation)
- [ ] Verify draft is contextual and relevant
- [ ] Verify can accept/modify draft
- [ ] Test with different tones (if experimental mode enabled)

### 11. Rewriter API
- [ ] Type or speak an answer
- [ ] Select tone preset (Calm, Concise, Empathetic, Academic)
- [ ] Verify rewrite preview appears
- [ ] Verify original and rewritten text shown side-by-side
- [ ] Test "Accept" - verify rewritten text replaces original
- [ ] Test "Discard" - verify original text retained
- [ ] Test multiple rewrites with different tones

### 12. Proofreader API
- [ ] Type answer with intentional grammar/spelling errors
- [ ] Click "Proofread" button
- [ ] Verify proofreading results appear
- [ ] Verify diff view shows original vs. corrected
- [ ] Verify corrections highlighted
- [ ] Hover over highlights - verify tooltip shows correction type
- [ ] Test "Apply Corrections" - verify all corrections applied
- [ ] Test "Keep Original" - verify no changes applied
- [ ] Verify handles text with no errors gracefully

---

## UI Component Tests

### 13. Modals
**Dashboard Modal**:
- [ ] Open via nudge quick actions or shortcut
- [ ] Verify streak counter displays correctly
- [ ] Verify reflections list shows recent entries
- [ ] Verify reflections sorted by date (newest first)
- [ ] Test delete reflection - verify removes from list
- [ ] Test export (JSON and Markdown)
- [ ] Verify exported files are valid
- [ ] Test close button and Escape key

**AI Status Modal**:
- [ ] Open via nudge quick actions
- [ ] Verify all 7 APIs listed
- [ ] Verify availability status (Available/Unavailable)
- [ ] Verify setup guide shows all required flags
- [ ] Test "Copy" buttons for flag URLs
- [ ] Verify experimental mode banner (if enabled)

**Quick Settings Modal**:
- [ ] Open via nudge quick actions or shortcut
- [ ] Verify all settings sections visible:
  - Behavior (dwell threshold, sound, motion)
  - Experience (format, translation preferences)
  - AI Features (proofreading, translation toggle)
  - Privacy (data storage preferences)
  - Voice (voice input settings)
- [ ] Test each toggle/switch
- [ ] Test dropdowns (language selection)
- [ ] Test sliders (dwell threshold, voice auto-stop)
- [ ] Verify changes apply immediately (live updates)
- [ ] Test "Reset to Defaults" button
- [ ] Verify settings persist after page reload

**Help Setup Modal**:
- [ ] Open via nudge quick actions
- [ ] Verify step-by-step flag setup instructions
- [ ] Verify all 8 flags listed with descriptions
- [ ] Test "Got it" button closes modal

**Error Modal**:
- [ ] Trigger error (e.g., AI unavailable, network issue)
- [ ] Verify error modal appears
- [ ] Verify error message is user-friendly
- [ ] Verify "Close" button works
- [ ] Verify Escape key closes modal

**Notification Toasts**:
- [ ] Trigger various notifications:
  - Settings updated
  - Translation complete
  - Proofreading complete
  - Error messages
- [ ] Verify notification appears
- [ ] Verify auto-dismiss after timeout
- [ ] Verify can manually dismiss

### 14. More Tools Menu
- [ ] Open More Tools menu in overlay
- [ ] Verify all tool sections visible:
  - Format options (bullets, paragraph, headline-bullets)
  - Generate Draft button (when answer empty)
  - Tone presets (when experimental mode enabled)
  - Proofread button
  - Ambient sound toggle
  - Reduce motion toggle
  - Translation dropdown
- [ ] Test each tool functionality
- [ ] Verify menu closes after selection
- [ ] Verify menu persists when appropriate

---

## Error Handling Tests

### 15. Error Scenarios
- [ ] **AI Unavailable**: Disable AI flags → verify graceful error message
- [ ] **Network Offline**: Go offline → verify local fallback or clear error
- [ ] **Storage Full**: Fill Chrome storage → verify error handling
- [ ] **Invalid Content**: Test with empty page → verify error handling
- [ ] **Timeout**: Test with very large content (5000+ words) → verify timeout handling
- [ ] **API Errors**: Test with malformed responses → verify error recovery

### 16. Edge Cases
- [ ] **Very Long Content**: Article with 10,000+ words
- [ ] **Very Short Content**: Article with <50 words
- [ ] **No Text Content**: Image-only page
- [ ] **Mixed Languages**: Content with multiple languages
- [ ] **Special Characters**: Content with emojis, symbols, unicode
- [ ] **Multiple Tabs**: Open extension in multiple tabs simultaneously
- [ ] **Rapid Navigation**: Navigate pages quickly (test race conditions)

---

## Accessibility Tests

### 17. Keyboard Navigation
- [ ] **Tab Navigation**: Verify all interactive elements focusable
- [ ] **Enter/Space**: Verify activates buttons/controls
- [ ] **Escape**: Verify closes modals and dropdowns
- [ ] **Arrow Keys**: Verify navigation in dropdowns and lists
- [ ] **Focus Indicators**: Verify visible focus outlines
- [ ] **Focus Trap**: Verify focus stays within modals
- [ ] **Focus Management**: Verify focus returns to trigger after closing modal

### 18. Screen Reader Compatibility
- [ ] **NVDA/JAWS**: Test with screen reader (if available)
- [ ] **ARIA Labels**: Verify all interactive elements have labels
- [ ] **Role Attributes**: Verify proper roles (dialog, button, etc.)
- [ ] **Live Regions**: Verify dynamic content announced
- [ ] **Headings**: Verify logical heading hierarchy

### 19. Visual Accessibility
- [ ] **Color Contrast**: Verify sufficient contrast ratios (4.5:1 minimum)
- [ ] **Reduce Motion**: Enable → verify animations disabled
- [ ] **High Contrast Mode**: Test in Windows High Contrast (if available)
- [ ] **Zoom**: Test at 200% zoom → verify UI remains usable
- [ ] **Text Size**: Test with browser text size increased → verify readable

---

## Performance Tests

### 20. Responsiveness
- [ ] **Overlay Render**: Verify appears within 300ms
- [ ] **Summary Generation**: Verify completes within acceptable time
- [ ] **Animations**: Verify smooth 60fps during breathing orb
- [ ] **UI Interactions**: Verify no lag when clicking buttons
- [ ] **Memory Usage**: Monitor in Chrome Task Manager → verify <150MB

### 21. Resource Management
- [ ] **Page Unload**: Close tab → verify cleanup (check console for errors)
- [ ] **Navigation**: Navigate pages → verify no memory leaks
- [ ] **Multiple Sessions**: Open/close overlay multiple times → verify no leaks
- [ ] **Long Sessions**: Keep extension active for 30+ minutes → verify stability

---

## Integration Tests

### 22. Settings Persistence
- [ ] Change settings → reload page → verify settings persist
- [ ] Change settings → close/reopen browser → verify settings persist
- [ ] Change settings in one tab → verify other tabs updated (if applicable)
- [ ] Test "Reset to Defaults" → verify all settings reset

### 23. Data Management
- [ ] **Save Reflection**: Complete reflection flow → verify saved
- [ ] **Load Reflections**: Open Dashboard → verify reflections load
- [ ] **Delete Reflection**: Delete from Dashboard → verify removed
- [ ] **Export**: Export reflections → verify file downloads
- [ ] **Streak**: Complete reflection → verify streak increments
- [ ] **Streak Reset**: Skip day → verify streak resets appropriately

### 24. Cross-Tab Behavior
- [ ] Open extension in Tab A → verify works independently
- [ ] Open extension in Tab B → verify works independently
- [ ] Save reflection in Tab A → verify appears in Tab B Dashboard
- [ ] Change settings in Tab A → verify updates in Tab B (if applicable)

---

## Browser Compatibility

### 25. Chrome Versions
- [ ] **Chrome 120+**: Test on latest Chrome version
- [ ] **Chrome Canary**: Test on Canary build (if available)
- [ ] **Chrome Beta**: Test on Beta build (if available)

### 26. Operating Systems
- [ ] **Windows**: Test on Windows 10/11
- [ ] **macOS**: Test on macOS (current)
- [ ] **Linux**: Test on Linux (if available)

---

## Special Scenarios

### 27. First-Time User Experience
- [ ] **Fresh Install**: Install extension → verify onboarding/help
- [ ] **First Launch**: Verify first launch detection
- [ ] **Missing Flags**: Verify helpful setup guide
- [ ] **Tutorial**: Verify any tutorial/guide appears

### 28. Power User Features
- [ ] **Experimental Mode**: Enable → verify beta features available
- [ ] **Keyboard Shortcuts**: Test all shortcuts (if documented)
- [ ] **Advanced Settings**: Test all advanced options
- [ ] **Developer Mode**: Test with console open → verify no errors

---

## Performance Benchmarks

### 29. Measured Metrics
Document actual performance during manual testing:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Overlay Render Time | <300ms | ___ms | ⬜ |
| Summary Generation | <3s | ___s | ⬜ |
| Animation FPS | 60fps | ___fps | ⬜ |
| Memory Usage | <150MB | ___MB | ⬜ |
| AI Latency (500 words) | <2s | ___s | ⬜ |
| AI Latency (3000 words) | <4s | ___s | ⬜ |

---

## Test Results Summary

### Pass/Fail Count
- **Total Tests**: ___
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___

### Critical Issues Found
1. [ ] Issue 1: _______
2. [ ] Issue 2: _______
3. [ ] Issue 3: _______

### Minor Issues Found
1. [ ] Issue 1: _______
2. [ ] Issue 2: _______

### Suggestions for Improvement
1. _______
2. _______
3. _______

---

## Notes
_Add any additional observations, edge cases discovered, or testing notes here._

---

**Tester**: _______________
**Date Completed**: _______________
**Chrome Version**: _______________
**OS**: _______________

