# Reflexa AI - Local Testing Guide

This guide will walk you through testing the Reflexa AI Chrome Extension locally on your machine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Building the Extension](#building-the-extension)
4. [Loading in Chrome](#loading-in-chrome)
5. [Testing Scenarios](#testing-scenarios)
6. [Development Workflow](#development-workflow)
7. [Debugging](#debugging)
8. [Common Issues](#common-issues)
9. [Testing Checklist](#testing-checklist)

---

## Prerequisites

### Required Software

- **Node.js**: v22 or higher
- **npm**: v10 or higher (comes with Node.js)
- **Chrome**: Version 127 or higher
- **Git**: For cloning the repository

### Check Your Versions

```bash
node --version    # Should be v22.x.x or higher
npm --version     # Should be v10.x.x or higher
google-chrome --version  # Should be 127.x.x or higher
```

---

## Initial Setup

### Step 1: Enable Gemini Nano in Chrome

Gemini Nano is Chrome's built-in AI that powers Reflexa AI. You need to enable all Chrome AI APIs first.

1. **Enable Base AI Model**:
   - Navigate to: `chrome://flags/#optimization-guide-on-device-model`
   - Find "Optimization Guide On Device Model"
   - Set dropdown to: **"Enabled BypassPerfRequirement"**

2. **Enable Prompt API**:
   - Navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
   - Find "Prompt API for Gemini Nano"
   - Set dropdown to: **"Enabled"**

3. **Enable Summarizer API**:
   - Navigate to: `chrome://flags/#summarization-api-for-gemini-nano`
   - Find "Summarization API for Gemini Nano"
   - Set dropdown to: **"Enabled"**

4. **Enable Writer API**:
   - Navigate to: `chrome://flags/#writer-api`
   - Find "Writer API"
   - Set dropdown to: **"Enabled"**

5. **Enable Rewriter API**:
   - Navigate to: `chrome://flags/#rewriter-api`
   - Find "Rewriter API"
   - Set dropdown to: **"Enabled"**

6. **Enable Proofreader API**:
   - Navigate to: `chrome://flags/#proofreader-api`
   - Find "Proofreader API"
   - Set dropdown to: **"Enabled"**

7. **Enable Translator API**:
   - Navigate to: `chrome://flags/#translator-api`
   - Find "Translator API"
   - Set dropdown to: **"Enabled"**

8. **Enable Language Detector API**:
   - Navigate to: `chrome://flags/#language-detection-api`
   - Find "Language Detection API"
   - Set dropdown to: **"Enabled"**

9. **Restart Chrome**:
   - Click the "Relaunch" button that appears at the bottom
   - Or manually close and reopen Chrome

10. **Verify All APIs are Available**:
    - Open DevTools (F12) on any page
    - Go to the Console tab
    - Copy and paste this code:

    ```javascript
    // Check all Chrome AI APIs
    console.log('Writer:', typeof Writer);
    console.log('Rewriter:', typeof Rewriter);
    console.log('Proofreader:', typeof Proofreader);
    console.log('Summarizer:', typeof Summarizer);
    console.log('LanguageModel:', typeof LanguageModel);
    console.log('Translator:', typeof Translator);
    console.log('LanguageDetector:', typeof LanguageDetector);
    ```

    - Press Enter
    - All should return: `"function"`
    - If any return `"undefined"`, that API is not available

11. **Check AI Model Status** (Optional):
    - In the same console, type: `await LanguageModel.availability()`
    - Press Enter
    - Should return: `"available"` or `"downloadable"`

> **Note**: If it returns `"downloadable"`, Chrome will download the AI model in the background. This may take a few minutes depending on your connection. All APIs use the same underlying Gemini Nano model.

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/reflexa-ai-chrome-extension.git
cd reflexa-ai-chrome-extension

# Install dependencies
npm install
```

---

## Building the Extension

### Production Build

For testing the full production experience:

```bash
npm run build
```

This command:

- Runs TypeScript type checking
- Runs ESLint for code quality
- Checks code formatting with Prettier
- Builds optimized production bundle to `dist/` directory

**Output**: You should see a `dist/` folder with all the extension files.

### Development Build

For faster iteration during development:

```bash
npm run build:dev
```

This command:

- Skips quality checks
- Builds faster
- Includes source maps for debugging

### Watch Mode (Recommended for Development)

For automatic rebuilds on file changes:

```bash
npm run dev
```

This command:

- Starts Vite dev server with Hot Module Replacement (HMR)
- Automatically rebuilds when you save files
- Faster than manual rebuilds

> **Important**: Keep this terminal window open while developing. The extension will auto-reload in Chrome when you make changes!

---

## Loading in Chrome

### Step 1: Open Extensions Page

1. Open Chrome
2. Navigate to: `chrome://extensions/`
3. Or: Menu (⋮) → Extensions → Manage Extensions

### Step 2: Enable Developer Mode

1. Look for the **"Developer mode"** toggle in the top-right corner
2. Click to enable it
3. You should see new buttons appear: "Load unpacked", "Pack extension", "Update"

### Step 3: Load the Extension

1. Click the **"Load unpacked"** button
2. A file picker dialog will open
3. Navigate to your project folder
4. Select the **`dist`** directory (not the root folder!)
5. Click "Select" or "Open"

### Step 4: Verify Installation

You should now see:

- Reflexa AI listed in your extensions
- A lotus icon in your Chrome toolbar (you may need to click the puzzle piece icon to pin it)
- Extension status showing as "On"

### Step 5: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Reflexa AI"
3. Click the pin icon to keep it visible

---

## Testing Scenarios

### Test 1: Dashboard (Popup)

**Purpose**: Verify the popup dashboard loads correctly.

**Steps**:

1. Click the Reflexa AI icon in your toolbar
2. The dashboard should open in a popup window

**Expected Results**:

- ✅ Dashboard opens without errors
- ✅ Shows "No reflections yet" message (if first time)
- ✅ Displays streak counter (0 days initially)
- ✅ Shows calm stats section
- ✅ Export button is visible in header
- ✅ Settings gear icon is visible

**Check DevTools**:

- Right-click the popup → Inspect
- Console should have no errors (red text)

---

### Test 2: Settings Page

**Purpose**: Verify settings can be accessed and modified.

**Steps**:

1. Click the Reflexa AI icon
2. Click the gear icon in the dashboard
3. Or: Right-click extension icon → Options

**Expected Results**:

- ✅ Settings page opens in a new tab
- ✅ All settings sections are visible:
  - Behavior (Dwell Threshold slider)
  - Accessibility (Sound, Motion, Proofreading toggles)
  - Privacy (Storage mode radio buttons)
- ✅ Slider moves smoothly (30-300 seconds)
- ✅ Toggles switch on/off
- ✅ "Reset to Defaults" button is visible

**Test Interactions**:

1. Move the dwell threshold slider
2. Toggle sound on/off
3. Change privacy mode
4. Click "Reset to Defaults"
5. Verify settings return to original values

---

### Test 3: Content Script Injection

**Purpose**: Verify the content script loads on web pages.

**Steps**:

1. Navigate to any article page (suggestions below)
2. Open DevTools (F12)
3. Go to Console tab
4. Look for initialization logs

**Good Test Articles**:

- https://paulgraham.com/greatwork.html
- https://waitbutwhy.com/2015/01/artificial-intelligence-revolution-1.html
- https://www.nytimes.com/interactive/2023/12/18/opinion/ai-technology-productivity.html
- Any Medium article
- Any blog post with substantial text

**Expected Results**:

- ✅ No errors in console
- ✅ You may see logs like "DwellTracker initialized" (if logging enabled)
- ✅ Page loads normally without visual changes (yet)

---

### Test 4: Dwell Detection

**Purpose**: Verify the extension detects sustained reading.

**Steps**:

1. Navigate to a test article (see suggestions above)
2. Start reading and scrolling
3. Keep the tab active and visible
4. Move your mouse occasionally
5. Wait for 60 seconds (default threshold)

**Expected Results**:

- ✅ After ~60 seconds, a **lotus icon** appears in the bottom-right corner
- ✅ The lotus icon has a gentle pulse animation
- ✅ Icon is positioned above the page content (high z-index)

**Troubleshooting**:

- If lotus doesn't appear:
  - Check that you're actively interacting (scroll, mouse movement)
  - Verify the tab is visible (not hidden or minimized)
  - Check console for errors
  - Try lowering dwell threshold in settings to 30 seconds

---

### Test 5: Reflect Mode Activation

**Purpose**: Verify the reflection overlay works correctly.

**Steps**:

1. Wait for the lotus icon to appear (see Test 4)
2. Click the lotus icon

**Expected Results**:

- ✅ Full-screen overlay appears with gradient background
- ✅ Breathing orb animation is visible and smooth
- ✅ Entry chime plays (if sound enabled)
- ✅ Ambient audio loop starts (if sound enabled)
- ✅ "Generating summary..." loading state appears
- ✅ After a few seconds, summary appears with 3 bullets:
  - Insight: [text]
  - Surprise: [text]
  - Apply: [text]
- ✅ Two reflection questions appear below summary
- ✅ Text areas are ready for input
- ✅ Save and Cancel buttons are visible

**Check Animation Performance**:

- Breathing orb should be smooth (60 FPS)
- No stuttering or lag
- Gradient should drift gently

---

### Test 6: Summarizer API - Summary Generation

**Purpose**: Verify Summarizer API generates quality summaries.

**Steps**:

1. Trigger Reflect Mode (see Test 5)
2. Wait for AI to generate summary
3. Read the generated content
4. Try changing summary format (Bullets, Paragraph, Headline + Bullets)

**Expected Results**:

- ✅ Summary appears within 4 seconds
- ✅ Exactly 3 bullets are shown (in Bullets format)
- ✅ Each bullet is labeled (Insight, Surprise, Apply)
- ✅ Bullets are concise (~20 words each)
- ✅ Content is relevant to the article
- ✅ Two reflection questions appear
- ✅ Questions end with "?"
- ✅ Questions are action-oriented
- ✅ Format dropdown allows switching between formats
- ✅ Changing format regenerates summary in new format

**If Summarizer API Unavailable**:

- ✅ Falls back to Prompt API automatically
- ✅ Summary still generates correctly
- ✅ No visible difference to user

**If AI Times Out**:

- ✅ Error message appears: "AI taking longer than expected..."
- ✅ Manual input mode is available
- ✅ You can still enter reflections manually

---

### Test 7: Writer API - Draft Generation

**Purpose**: Verify Writer API generates reflection drafts.

**Steps**:

1. Enter Reflect Mode
2. Look for "Generate Draft" button (if Writer API available)
3. Click the button
4. Wait for AI to generate draft

**Expected Results**:

- ✅ Draft appears within 4 seconds
- ✅ Draft is relevant to the article summary
- ✅ Draft follows selected tone (casual/neutral/formal)
- ✅ Draft length matches setting (short/medium/long)
- ✅ Draft appears in reflection text area
- ✅ User can edit the generated draft
- ✅ Draft uses summary as context

**If Writer API Unavailable**:

- ✅ "Generate Draft" button is hidden
- ✅ User can still type reflections manually
- ✅ No error messages shown

---

### Test 8: Rewriter API - Tone Adjustment

**Purpose**: Verify Rewriter API adjusts tone correctly.

**Steps**:

1. Enter Reflect Mode
2. Type a reflection in the text area
3. Look for tone preset chips (Calm, Concise, Empathetic, Academic)
4. Click a tone preset
5. Review rewritten version

**Expected Results**:

- ✅ Rewritten version appears within 3 seconds
- ✅ Tone matches selected preset:
  - Calm: Soothing, peaceful language
  - Concise: Shorter, direct phrasing
  - Empathetic: Warm, understanding tone
  - Academic: Formal, scholarly language
- ✅ Original meaning is preserved
- ✅ Side-by-side preview shows both versions
- ✅ Accept button replaces original with rewrite
- ✅ Discard button keeps original text
- ✅ Can try different tones before accepting

**If Rewriter API Unavailable**:

- ✅ Tone preset chips are hidden
- ✅ Falls back to Prompt API (if available)
- ✅ User can still edit text manually

---

### Test 9: Proofreader API - Grammar Checking

**Purpose**: Verify Proofreader API fixes grammar and improves clarity.

**Steps**:

1. Enable proofreading in settings first
2. Enter Reflect Mode
3. Type text with intentional errors:
   ```
   This article make me think about how AI is changing things its really interesting
   ```
4. Click "Proofread" button

**Expected Results**:

- ✅ Proofread version appears within 3 seconds
- ✅ Grammar errors are fixed:
  - "make" → "makes"
  - "its" → "it's"
- ✅ Punctuation improved
- ✅ Diff view shows changes with color coding:
  - Red: Removed text
  - Green: Added text
- ✅ Original meaning preserved
- ✅ Tone remains similar
- ✅ Accept/Discard buttons for individual corrections
- ✅ Can accept all or reject all changes

**If Proofreader API Unavailable**:

- ✅ "Proofread" button is hidden
- ✅ Feature is disabled in settings (grayed out)
- ✅ No fallback (Prompt API cannot replicate this)

---

### Test 10: Translator API - Translation

**Purpose**: Verify Translator API translates content accurately.

**Steps**:

1. Navigate to an article (English or non-English)
2. Enter Reflect Mode
3. Look for language dropdown or translate button
4. Select target language (e.g., Spanish, French, German)
5. Click "Translate" button

**Expected Results**:

- ✅ Translation appears within 4 seconds
- ✅ Summary is translated accurately
- ✅ Formatting preserved:
  - Bullet points remain bullets
  - Line breaks maintained
  - Markdown formatting intact
- ✅ Reflection questions are translated
- ✅ Can translate back to original language
- ✅ Translation quality is natural and readable
- ✅ Technical terms handled appropriately

**Test Multiple Languages**:

- English → Spanish
- English → French
- English → German
- Spanish → English (if on Spanish article)

**If Translator API Unavailable**:

- ✅ Translation dropdown is hidden
- ✅ Feature disabled in settings
- ✅ No fallback available

---

### Test 11: Language Detector API - Language Detection

**Purpose**: Verify Language Detector API identifies languages correctly.

**Steps**:

1. Navigate to a non-English article (try Spanish, French, or German)
2. Enter Reflect Mode
3. Check for language pill in header

**Expected Results**:

- ✅ Language pill appears automatically
- ✅ Shows detected language name (e.g., "Spanish", "French")
- ✅ Language is correctly identified
- ✅ Confidence score displayed (if available)
- ✅ Detection happens within 1 second
- ✅ Works with mixed-language content

**Test Different Languages**:

- Spanish article: Should detect "Spanish"
- French article: Should detect "French"
- German article: Should detect "German"
- English article: Should detect "English"

**If Language Detector API Unavailable**:

- ✅ Language pill is hidden
- ✅ Translation features may be limited
- ✅ No error messages shown

---

### Test 12: Reflection Input

**Purpose**: Verify users can enter and save reflections.

**Steps**:

1. In Reflect Mode, type answers in the text areas
2. Try typing multiple lines
3. Test keyboard navigation (Tab key)

**Expected Results**:

- ✅ Text areas accept input
- ✅ Text areas auto-expand as you type
- ✅ Tab key moves between inputs
- ✅ Text is readable (good contrast)
- ✅ Cursor is visible

---

### Test 13: Save Reflection

**Purpose**: Verify reflections are saved correctly.

**Steps**:

1. Complete a reflection in Reflect Mode
2. Click "Save" button
3. Or press Cmd/Ctrl + Enter

**Expected Results**:

- ✅ Completion bell plays (if sound enabled)
- ✅ Overlay closes smoothly
- ✅ You return to the article
- ✅ No errors in console

**Verify Save**:

1. Click the Reflexa AI icon to open dashboard
2. Your reflection should appear in the list
3. Check that it shows:
   - ✅ Article title (clickable link)
   - ✅ Current date
   - ✅ Summary bullets with icons
   - ✅ Your reflection text
   - ✅ Delete button (on hover)

---

### Test 14: Reflection History

**Purpose**: Verify dashboard displays reflections correctly.

**Steps**:

1. Create 2-3 reflections on different articles
2. Open the dashboard
3. Scroll through the list

**Expected Results**:

- ✅ All reflections are listed
- ✅ Most recent appears first
- ✅ Each card is properly formatted
- ✅ Scrolling is smooth
- ✅ Clicking article title opens the URL
- ✅ Hover over card shows delete button

---

### Test 15: Streak Tracking

**Purpose**: Verify streak calculation works.

**Steps**:

1. Create a reflection today
2. Check the streak counter in dashboard

**Expected Results**:

- ✅ Streak shows "1 day"
- ✅ Flame icon is visible
- ✅ Last reflection date is today

**Test Streak Continuation** (Next Day):

1. Come back tomorrow
2. Create another reflection
3. Streak should increment to "2 days"

**Test Streak Break**:

1. Skip a day
2. Create a reflection
3. Streak should reset to "1 day"

---

### Test 16: Export Functionality

**Purpose**: Verify reflections can be exported.

**Steps**:

1. Create at least one reflection
2. Open dashboard
3. Click "Export" button
4. Select JSON format
5. Click "Download"
6. Repeat with Markdown format

**Expected Results**:

- ✅ Export modal opens
- ✅ Format options are visible (JSON, Markdown)
- ✅ Download button is enabled
- ✅ File downloads to your Downloads folder
- ✅ Filename includes current date
- ✅ JSON file is valid JSON
- ✅ Markdown file is properly formatted

**Verify File Contents**:

```bash
# Check JSON
cat ~/Downloads/reflexa-reflections-*.json | jq .

# Check Markdown
cat ~/Downloads/reflexa-reflections-*.md
```

---

### Test 17: Delete Reflection

**Purpose**: Verify reflections can be deleted.

**Steps**:

1. Open dashboard
2. Hover over a reflection card
3. Click the delete button (trash icon)
4. Confirm deletion if prompted

**Expected Results**:

- ✅ Delete button appears on hover
- ✅ Reflection is removed from list
- ✅ Streak is recalculated if needed
- ✅ No errors in console

---

### Test 18: Keyboard Shortcuts

**Purpose**: Verify keyboard navigation works.

**Steps**:

1. Enter Reflect Mode
2. Test these shortcuts:
   - Tab: Navigate between inputs
   - Cmd/Ctrl + Enter: Save reflection
   - Escape: Cancel and close overlay

**Expected Results**:

- ✅ Tab moves focus logically
- ✅ Focus indicators are visible
- ✅ Cmd/Ctrl + Enter saves
- ✅ Escape closes overlay
- ✅ No errors occur

---

### Test 19: Accessibility Features

**Purpose**: Verify accessibility compliance.

**Steps**:

1. Enable "Reduce Motion" in settings
2. Enter Reflect Mode
3. Verify animations are reduced

**Expected Results**:

- ✅ Breathing orb animation is disabled or minimal
- ✅ Gradient drift is disabled
- ✅ Transitions are instant or very fast
- ✅ Functionality still works

**Test Screen Reader** (Optional):

1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate through the dashboard
3. Verify all elements are announced

---

### Test 20: Privacy Mode

**Purpose**: Verify storage modes work correctly.

**Steps**:

1. Go to Settings
2. Change Privacy Mode to "Sync"
3. Create a reflection
4. Open Chrome on another device (if available)
5. Check if reflection synced

**Expected Results**:

- ✅ Setting saves correctly
- ✅ Reflections sync across devices (if sync enabled)
- ✅ Local mode keeps data on device only

---

### Test 21: Storage Limits

**Purpose**: Verify storage quota handling.

**Steps**:

1. Create many reflections (20+)
2. Check storage usage in DevTools:
   - F12 → Application → Storage → Local Storage
   - Look for `reflexa_reflections`

**Expected Results**:

- ✅ Reflections are stored
- ✅ No errors when approaching limits
- ✅ Warning appears if storage is >90% full

---

### Test 22: Multiple Tabs

**Purpose**: Verify extension works across multiple tabs.

**Steps**:

1. Open 3 different articles in separate tabs
2. Trigger Reflect Mode in each tab
3. Save reflections in each

**Expected Results**:

- ✅ Each tab tracks dwell time independently
- ✅ Lotus icon appears in each tab separately
- ✅ Reflect Mode works in all tabs
- ✅ All reflections are saved
- ✅ No conflicts or errors

---

### Test 23: Page Navigation

**Purpose**: Verify dwell tracker resets on navigation.

**Steps**:

1. Start reading an article
2. Wait 30 seconds (don't reach threshold)
3. Navigate to a different page
4. Dwell time should reset

**Expected Results**:

- ✅ Dwell timer resets on navigation
- ✅ Lotus icon disappears (if it was showing)
- ✅ New page starts fresh tracking

---

### Test 24: Error Handling

**Purpose**: Verify graceful error handling.

**Test AI Unavailable**:

1. Disable AI flags in Chrome
2. Restart Chrome
3. Try to create a reflection

**Expected Results**:

- ✅ Error message appears: "Local AI disabled..."
- ✅ Manual mode is available
- ✅ You can still enter reflections manually
- ✅ No crashes or blank screens

**Test Network Offline**:

1. Disconnect from internet
2. Try to create a reflection

**Expected Results**:

- ✅ Extension still works (AI is local)
- ✅ Reflections save locally
- ✅ Sync is deferred until online

---

## Development Workflow

### Recommended Workflow

1. **Start dev server**:

   ```bash
   npm run dev
   ```

2. **Make code changes** in your editor

3. **Extension auto-reloads** in Chrome (thanks to HMR)

4. **Test your changes** immediately

5. **Check console** for errors or logs

6. **Iterate quickly** without manual rebuilds

### Manual Reload (If Needed)

If HMR doesn't work or you need a full reload:

1. Go to `chrome://extensions/`
2. Find Reflexa AI
3. Click the refresh icon (↻)
4. Or click "Update" button at the top

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

### Code Quality Checks

```bash
# Run all checks
npm run check

# Type checking only
npm run type-check

# Linting only
npm run lint

# Fix auto-fixable lint errors
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

---

## Debugging

### Chrome DevTools

#### Content Script Debugging

1. Open the page where content script runs
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for logs from content script
5. Set breakpoints in Sources tab

**Useful Console Commands**:

```javascript
// Check AI availability
await LanguageModel.availability();

// Check if content script loaded
document.querySelector('#reflexa-shadow-root');

// Get current dwell time (if exposed)
// (You may need to add this to your code)
```

#### Background Worker Debugging

1. Go to `chrome://extensions/`
2. Find Reflexa AI
3. Click "service worker" link (under "Inspect views")
4. DevTools opens for background worker
5. Check Console for logs
6. Set breakpoints in Sources tab

#### Popup Debugging

1. Click the extension icon to open popup
2. Right-click anywhere in the popup
3. Select "Inspect"
4. DevTools opens for popup
5. Check Console and Elements tabs

#### Options Page Debugging

1. Open options page (right-click icon → Options)
2. Press F12 to open DevTools
3. Debug like a normal web page

### Common Debug Logs

Look for these in the console:

```
[AI] Checking availability...
[AI] AI availability status: available
[AI] Attempt 1 of 2
[AI] Sending prompt to model...
[AI] Response received in 1234ms
Content extraction completed in 45.67ms ✓
DwellTracker: Threshold reached
```

### Performance Profiling

1. Open DevTools
2. Go to Performance tab
3. Click Record (●)
4. Trigger Reflect Mode
5. Stop recording
6. Analyze flame graph for bottlenecks

**Look for**:

- Content extraction should be < 100ms
- Overlay render should be < 300ms
- Animations should be 60 FPS

---

## Common Issues

### Issue 1: Lotus Icon Not Appearing

**Symptoms**: Reading for 60+ seconds but no lotus icon shows.

**Possible Causes**:

- Tab is hidden or minimized
- No user interaction (not scrolling or moving mouse)
- Content script failed to inject
- JavaScript error in content script

**Solutions**:

1. Check console for errors
2. Ensure tab is visible and active
3. Scroll or move mouse to trigger activity
4. Reload the page
5. Check if content script is injected:
   ```javascript
   document.querySelector('#reflexa-shadow-root');
   ```

---

### Issue 2: AI Not Available

**Symptoms**: Error message "Local AI disabled" or AI times out.

**Possible Causes**:

- Chrome flags not enabled
- Chrome version too old
- AI model not downloaded yet
- Device doesn't meet requirements

**Solutions**:

1. Verify Chrome flags are enabled (see Initial Setup)
2. Restart Chrome after enabling flags
3. Check Chrome version: `chrome://version/`
4. Wait for model download (check `chrome://components/`)
5. Check AI availability in console:
   ```javascript
   await LanguageModel.availability();
   ```

---

### Issue 3: Extension Not Loading

**Symptoms**: Extension doesn't appear in `chrome://extensions/`.

**Possible Causes**:

- Wrong directory selected (selected root instead of `dist/`)
- Build failed or `dist/` doesn't exist
- Manifest errors

**Solutions**:

1. Verify `dist/` folder exists
2. Rebuild: `npm run build`
3. Load unpacked and select `dist/` directory (not root)
4. Check for errors in extension list
5. Click "Errors" button if shown

---

### Issue 4: Overlay Doesn't Close

**Symptoms**: Reflect Mode overlay is stuck on screen.

**Solutions**:

1. Press Escape key
2. Refresh the page (Cmd/Ctrl + R)
3. Check console for errors
4. Reload extension in `chrome://extensions/`

---

### Issue 5: Reflections Not Saving

**Symptoms**: Click Save but reflection doesn't appear in dashboard.

**Possible Causes**:

- Storage quota exceeded
- JavaScript error during save
- Background worker crashed

**Solutions**:

1. Check console for errors
2. Check storage usage:
   - F12 → Application → Storage → Local Storage
3. Export and delete old reflections if storage full
4. Reload extension
5. Check background worker console for errors

---

### Issue 6: HMR Not Working

**Symptoms**: Changes don't auto-reload during development.

**Solutions**:

1. Stop dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Manually reload extension in Chrome
4. Check terminal for build errors
5. Try full rebuild: `npm run build`

---

### Issue 7: Audio Not Playing

**Symptoms**: No sound during Reflect Mode.

**Possible Causes**:

- Sound disabled in settings
- Browser tab muted
- Audio files missing
- Browser audio permissions

**Solutions**:

1. Check settings: Enable Sound should be ON
2. Unmute the tab (right-click tab → Unmute)
3. Check browser volume
4. Verify audio files exist in `dist/audio/`
5. Check console for audio loading errors

---

### Issue 8: Poor Performance

**Symptoms**: Laggy animations, slow overlay render.

**Possible Causes**:

- Too many browser tabs open
- Heavy page content
- Slow device
- Memory leak

**Solutions**:

1. Close unnecessary tabs
2. Check memory usage in Task Manager
3. Reload extension to clear memory
4. Disable animations (Reduce Motion in settings)
5. Profile with DevTools Performance tab

---

## Testing Checklist

Use this checklist to ensure comprehensive testing of all features including all 7 Chrome AI APIs:

### Installation & Setup

- [ ] Base AI model flag enabled (`#optimization-guide-on-device-model`)
- [ ] Prompt API flag enabled (`#prompt-api-for-gemini-nano`)
- [ ] Summarizer API flag enabled (`#summarization-api-for-gemini-nano`)
- [ ] Writer API flag enabled (`#writer-api`)
- [ ] Rewriter API flag enabled (`#rewriter-api`)
- [ ] Proofreader API flag enabled (`#proofreader-api`)
- [ ] Translator API flag enabled (`#translator-api`)
- [ ] Language Detector API flag enabled (`#language-detection-api`)
- [ ] Chrome restarted after enabling flags
- [ ] All APIs verified in console (all return "function")
- [ ] Extension built successfully
- [ ] Extension loaded in Chrome
- [ ] Extension icon visible in toolbar
- [ ] No errors in extension list

### Dashboard

- [ ] Dashboard opens without errors
- [ ] Shows "No reflections yet" initially
- [ ] Streak counter displays correctly
- [ ] Stats section visible
- [ ] Export button works
- [ ] Settings icon works

### Settings

- [ ] Settings page opens
- [ ] All settings sections visible
- [ ] Dwell threshold slider works (30-300s)
- [ ] Sound toggle works
- [ ] Reduce motion toggle works
- [ ] Proofreading toggle works
- [ ] Privacy mode switches work
- [ ] Reset to defaults works
- [ ] Settings persist after reload

### Content Script

- [ ] Injects on article pages
- [ ] No console errors
- [ ] Doesn't break page layout
- [ ] Dwell tracking starts automatically

### Dwell Detection

- [ ] Lotus icon appears after threshold
- [ ] Icon has pulse animation
- [ ] Icon positioned correctly
- [ ] Resets on page navigation
- [ ] Pauses when tab hidden
- [ ] Pauses when user inactive

### Reflect Mode

- [ ] Overlay appears on lotus click
- [ ] Gradient background displays
- [ ] Breathing orb animates smoothly
- [ ] Entry chime plays (if sound on)
- [ ] Ambient loop plays (if sound on)
- [ ] Loading state shows
- [ ] Summary generates within 4s
- [ ] 3 bullets display correctly
- [ ] 2 questions display correctly
- [ ] Text areas accept input
- [ ] Text areas auto-expand
- [ ] Keyboard navigation works
- [ ] Save button works
- [ ] Cancel button works
- [ ] Escape key closes overlay
- [ ] Cmd/Ctrl+Enter saves

### AI Features

#### Summarizer API

- [ ] AI availability check works
- [ ] Summary is relevant
- [ ] Summary has 3 bullets (in Bullets format)
- [ ] Format dropdown works (Bullets, Paragraph, Headline)
- [ ] Changing format regenerates summary
- [ ] Falls back to Prompt API if unavailable

#### Writer API

- [ ] "Generate Draft" button appears (if available)
- [ ] Draft generates within 4 seconds
- [ ] Draft is relevant to summary
- [ ] Tone setting is respected
- [ ] Length setting is respected
- [ ] Draft is editable

#### Rewriter API

- [ ] Tone preset chips appear (if available)
- [ ] Rewrite completes within 3 seconds
- [ ] Tone matches preset (Calm, Concise, Empathetic, Academic)
- [ ] Original meaning preserved
- [ ] Side-by-side preview works
- [ ] Accept/Discard buttons work

#### Proofreader API

- [ ] "Proofread" button appears (if enabled)
- [ ] Proofreading completes within 3 seconds
- [ ] Grammar errors are fixed
- [ ] Diff view shows changes clearly
- [ ] Accept/Discard individual corrections works
- [ ] Original voice preserved

#### Translator API

- [ ] Translation dropdown appears (if available)
- [ ] Translation completes within 4 seconds
- [ ] Translation is accurate
- [ ] Formatting preserved (bullets, etc.)
- [ ] Multiple languages work
- [ ] Can translate back to original

#### Language Detector API

- [ ] Language pill appears automatically
- [ ] Language is correctly identified
- [ ] Detection happens quickly (<1s)
- [ ] Works with multiple languages

#### Prompt API

- [ ] Questions are action-oriented
- [ ] Questions end with "?"
- [ ] Serves as fallback for other APIs
- [ ] Timeout handled gracefully
- [ ] Manual mode available as fallback

### Reflection Management

- [ ] Reflections save correctly
- [ ] Reflections appear in dashboard
- [ ] Reflections sorted by date
- [ ] Article links work
- [ ] Delete button works
- [ ] Streak updates correctly
- [ ] Stats update correctly

### Export

- [ ] Export modal opens
- [ ] JSON export works
- [ ] Markdown export works
- [ ] Files download correctly
- [ ] File contents are valid
- [ ] Filename includes date

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Reduce motion works
- [ ] Color contrast sufficient
- [ ] ARIA labels present

### Performance

- [ ] Content extraction < 100ms
- [ ] Overlay render < 300ms
- [ ] Animations at 60 FPS
- [ ] No memory leaks
- [ ] Smooth scrolling in dashboard

### Error Handling

- [ ] AI unavailable handled
- [ ] Timeout handled
- [ ] Storage full handled
- [ ] Network offline handled
- [ ] Invalid content handled
- [ ] No crashes or blank screens

### Cross-Tab

- [ ] Works in multiple tabs
- [ ] Independent dwell tracking
- [ ] No conflicts
- [ ] All reflections saved

### Privacy & Security

- [ ] No external API calls
- [ ] Data stays local (or syncs if enabled)
- [ ] No tracking or analytics
- [ ] Storage encrypted by Chrome

---

## Next Steps

After completing local testing:

1. **Run automated tests**: `npm test`
2. **Check code coverage**: `npm run test:coverage`
3. **Run linting**: `npm run lint`
4. **Build for production**: `npm run build:prod`
5. **Create package**: `npm run package`
6. **Test on different machines** (if possible)
7. **Get feedback from beta testers**
8. **Prepare for Chrome Web Store submission**

---

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Gemini Nano Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/devguide/)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/yourusername/reflexa-ai-chrome-extension/issues)
2. Search for similar problems
3. Create a new issue with:
   - Chrome version
   - Extension version
   - Steps to reproduce
   - Console errors
   - Screenshots if applicable

---

Happy testing! 🧪🌸
