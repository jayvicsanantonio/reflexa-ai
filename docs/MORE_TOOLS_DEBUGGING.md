# More Tools Menu - Debugging Guide

## Console Logging Added

To help debug why options aren't working, I've added comprehensive console logging to the MoreToolsMenu component.

## How to Debug

### 1. Open Browser Console

- Open Chrome DevTools (F12 or Cmd+Option+I on Mac)
- Go to the Console tab
- Filter by `[MoreToolsMenu]` to see only relevant logs

### 2. Test Each Option

#### Format Change (Summary Screen)

**Expected logs when clicking "Paragraph":**

```
[MoreToolsMenu] Format selected: paragraph Current: bullets
[MoreToolsMenu] onFormatChange exists: true
[MoreToolsMenu] Calling onFormatChange...
Changing summary format to: paragraph
[MoreToolsMenu] onFormatChange completed
```

**If not working, check for:**

- `onFormatChange exists: false` - Handler not passed from parent
- `Skipping - same format or no handler` - Already in that format or handler missing
- No logs at all - Click event not firing

#### Ambient Sound Toggle

**Expected logs when clicking "Mute":**

```
[MoreToolsMenu] Ambient toggle clicked, current muted: false
[MoreToolsMenu] Ambient toggle called
```

**If not working, check for:**

- No logs - Click event not firing
- Handler exists but no audio change - Audio manager issue

#### Tone Selection (Reflection Screen)

**Expected logs when clicking "Calm":**

```
[MoreToolsMenu] Tone selected: calm
[MoreToolsMenu] onToneSelect exists: true
[MoreToolsMenu] Calling onToneSelect...
```

**If not working, check for:**

- `onToneSelect exists: false` - Handler not passed
- `Skipping - disabled or no handler` - Tones disabled or no content

### 3. Common Issues

#### Issue: No logs appear

**Cause**: Click event not reaching the button
**Solutions**:

- Check if menu is actually open
- Check if button is disabled
- Check for z-index issues
- Check for overlapping elements

#### Issue: Handler exists but nothing happens

**Cause**: Handler is called but parent component isn't responding
**Solutions**:

- Check parent component (MeditationFlowOverlay)
- Check if handler is properly connected in index.tsx
- Check for errors in parent handler

#### Issue: "Skipping - same format"

**Cause**: Trying to select already active format
**Solutions**:

- This is expected behavior
- Select a different format

#### Issue: "onFormatChange exists: false"

**Cause**: Handler not passed from parent
**Solutions**:

- Check MeditationFlowOverlay props
- Check if onFormatChange is passed in index.tsx
- Verify step === 1 (summary screen) condition

## Verification Steps

### Step 1: Verify Menu Opens

1. Click "More" button
2. Check console for any errors
3. Verify dropdown appears

### Step 2: Verify Handlers Exist

1. Open menu
2. Click any option
3. Check console for "[MoreToolsMenu] ... exists: true/false"

### Step 3: Verify Handler Execution

1. Click option
2. Check for "Calling ..." log
3. Check for completion log or error

### Step 4: Verify Parent Response

1. After handler called
2. Check for parent component logs (e.g., "Changing summary format to...")
3. Verify UI updates

## Expected Behavior

### Format Change

1. Click "Paragraph"
2. See loading state
3. Summary re-renders as paragraph
4. Menu stays open

### Ambient Sound

1. Click "Mute"
2. Audio stops immediately
3. Icon changes to muted
4. Menu stays open

### Tone Selection

1. Click "Calm"
2. Text rewrites with calm tone
3. Preview appears
4. Menu stays open

### Translation

1. Click "Translate"
2. Language dropdown appears
3. Click "Spanish"
4. Translation starts
5. Menu stays open

## Troubleshooting

### Problem: Logs show handler called but nothing happens

**Check:**

1. Parent component state
2. Network requests (if API calls involved)
3. Error messages in console
4. React DevTools for state changes

**Example for Format Change:**

```javascript
// In index.tsx handleFormatChange
console.log('Current extracted content:', currentExtractedContent);
console.log('Is loading:', isLoadingSummary);
console.log('Sending summarize request...');
```

### Problem: Click doesn't trigger anything

**Check:**

1. Button disabled state
2. CSS pointer-events
3. Z-index layering
4. Event propagation

**Test:**

```javascript
// Add to button onClick
onClick={(e) => {
  console.log('Button clicked!', e);
  // ... rest of handler
}}
```

### Problem: Handler exists but condition fails

**Check:**

```javascript
// Format change
if (format !== currentFormat && onFormatChange) {
  // Check these values
  console.log('Format:', format);
  console.log('Current:', currentFormat);
  console.log('Handler:', onFormatChange);
}
```

## Removing Debug Logs

Once debugging is complete, remove console.log statements:

```typescript
// Before (with logging)
const handleFormatSelect = async (format: SummaryFormat) => {
  console.log('[MoreToolsMenu] Format selected:', format);
  // ...
};

// After (production)
const handleFormatSelect = async (format: SummaryFormat) => {
  if (format !== currentFormat && onFormatChange) {
    await onFormatChange(format);
  }
};
```

## Next Steps

1. Load the extension in Chrome
2. Open a page and trigger meditation flow
3. Open DevTools console
4. Click More button
5. Try each option
6. Share console logs if issues persist

The logs will help identify exactly where the problem is:

- Click not registering
- Handler not passed
- Handler called but fails
- Parent not responding
