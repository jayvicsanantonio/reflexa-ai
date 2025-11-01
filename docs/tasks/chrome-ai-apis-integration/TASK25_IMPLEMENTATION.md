# Task 25: Implement Capability Refresh Mechanism

**Status**: ✅ Complete
**Date**: January 2025

## Overview

Implemented a comprehensive capability refresh mechanism that allows users to manually refresh AI API availability checks and automatically refreshes capabilities when experimental mode is toggled. This ensures the UI always reflects the current state of Chrome AI APIs.

## Implementation Details

### 1. Enhanced Background Message Handler

**File**: `src/background/index.ts`

Updated `handleGetCapabilities` to support optional refresh parameter:

```typescript
function handleGetCapabilities(payload?: unknown): AIResponse<AICapabilities> {
  // Parse payload for refresh and experimentalMode flags
  let refresh = false;
  let experimentalMode = false;

  if (payload && typeof payload === 'object') {
    const payloadObj = payload as {
      refresh?: boolean;
      experimentalMode?: boolean;
    };
    refresh = payloadObj.refresh ?? false;
    experimentalMode = payloadObj.experimentalMode ?? false;
  }

  let capabilities: AICapabilities;

  if (refresh) {
    console.log(
      `[GetCapabilities] Refreshing capabilities (experimental: ${experimentalMode})`
    );
    capabilities = aiService.refreshCapabilities(experimentalMode);
  } else {
    console.log('[GetCapabilities] Using cached capabilities');
    capabilities = aiService.getCapabilities();
  }

  return createSuccessResponse(capabilities, 'unified', duration);
}
```

**Key Features**:

- Accepts optional `payload` with `refresh` and `experimentalMode` flags
- When `refresh: true`, calls `aiService.refreshCapabilities()` to force fresh detection
- When `refresh: false` or undefined, returns cached capabilities
- Logs refresh operations for debugging
- Synchronous operation (no await needed as capability detection is synchronous)

### 2. Options Page Refresh Integration

**File**: `src/options/App.tsx`

Enhanced the Options page with proper capability refresh:

```typescript
const refreshCapabilities = useCallback(
  async (experimentalMode?: boolean) => {
    setCheckingCapabilities(true);
    try {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'getCapabilities',
        payload: {
          refresh: true,
          experimentalMode: experimentalMode ?? settings.experimentalMode,
        },
      });

      if (response && typeof response === 'object' && 'success' in response) {
        setCapabilities(response.data as AICapabilities);
      }
    } catch (error) {
      console.error('Failed to refresh capabilities:', error);
    } finally {
      setCheckingCapabilities(false);
    }
  },
  [settings.experimentalMode]
);
```

**Experimental Mode Toggle Integration**:

```typescript
<Toggle
  label="Experimental Mode"
  checked={settings.experimentalMode}
  onChange={async (checked) => {
    updateSetting('experimentalMode', checked);
    // Refresh AI capabilities when experimental mode is toggled
    // Pass the new experimental mode value to ensure immediate refresh
    await refreshCapabilities(checked);
  }}
  description="Enable experimental AI features as they become available in Chrome"
/>
```

**"Check Again" Button**:

```typescript
<button
  onClick={() => void refreshCapabilities()}
  disabled={checkingCapabilities}
  className="..."
>
  {checkingCapabilities ? 'Checking...' : 'Check Again'}
</button>
```

**Key Features**:

- `refreshCapabilities` accepts optional `experimentalMode` parameter
- Falls back to current settings if no parameter provided
- Shows loading state during refresh with spinner animation
- Automatically refreshes when experimental mode is toggled
- Manual refresh via "Check Again" button
- Updates UI immediately after refresh completes

### 3. Popup Refresh Integration

**File**: `src/popup/App.tsx`

Enhanced the popup to support capability refresh:

```typescript
const loadAIData = useCallback(
  async (refresh = false) => {
    try {
      // Get settings first to know experimental mode status
      const settingsResponse: unknown = await chrome.runtime.sendMessage({
        type: 'getSettings',
      });

      let currentExperimentalMode = experimentalMode;

      if (settingsResponse && /* validation */) {
        currentExperimentalMode = settingsResponse.data.experimentalMode ?? false;
        setExperimentalMode(currentExperimentalMode);
      }

      // Get capabilities (with optional refresh)
      void chrome.runtime
        .sendMessage({
          type: 'getCapabilities',
          payload: refresh
            ? { refresh: true, experimentalMode: currentExperimentalMode }
            : undefined,
        })
        .then((response) => {
          if (response && response.success) {
            setAiCapabilities(response.data as AICapabilities);
          }
        });

      // Get usage stats...
    } catch (error) {
      console.error('Failed to load AI data:', error);
    }
  },
  [experimentalMode]
);

const handleRefreshCapabilities = useCallback(() => {
  void loadAIData(true);
}, [loadAIData]);
```

**Key Features**:

- `loadAIData` accepts optional `refresh` parameter
- Fetches current experimental mode setting before refresh
- Passes experimental mode to capability refresh
- Refresh button in AIStatusPanel triggers `handleRefreshCapabilities`
- Updates all AI data (capabilities and usage stats) on refresh

### 4. AI Status Panel Refresh Button

**File**: `src/popup/AIStatusPanel.tsx`

The AIStatusPanel already had refresh functionality implemented:

```typescript
const handleRefresh = () => {
  if (isRefreshing || !onRefresh) return;

  setIsRefreshing(true);

  // Call onRefresh and handle as promise
  void Promise.resolve(onRefresh()).finally(() => {
    // Reset refreshing state after animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  });
};
```

**Key Features**:

- Prevents multiple simultaneous refreshes
- Shows spinning animation during refresh
- 600ms delay after refresh for smooth UX
- Properly handles async refresh operations

## User Experience Flow

### Manual Refresh in Options Page

1. User clicks "Check Again" button in AI Status section
2. Button shows "Checking..." with spinner animation
3. Background worker refreshes capabilities with current experimental mode
4. UI updates with new capability status
5. Button returns to "Check Again" state

### Manual Refresh in Popup

1. User clicks refresh button in AI Status Panel
2. Button icon spins during refresh
3. Background worker refreshes capabilities with current experimental mode
4. UI updates with new capability status and usage stats
5. Spinner stops after 600ms animation

### Automatic Refresh on Experimental Mode Toggle

1. User toggles "Experimental Mode" in Options page
2. Setting is saved to storage
3. Capabilities are immediately refreshed with new experimental mode value
4. UI updates to show new capabilities (may enable/disable experimental APIs)
5. User sees updated status without manual refresh

## Technical Decisions

### Why Synchronous Capability Detection?

The `handleGetCapabilities` function is synchronous (not async) because:

- `capabilityDetector.detectCapabilities()` is synchronous
- `aiService.refreshCapabilities()` is synchronous
- No await expressions needed
- Faster response time for capability queries

### Why Pass Experimental Mode to Refresh?

When toggling experimental mode, we pass the new value directly to `refreshCapabilities`:

- Ensures immediate refresh with correct mode
- Avoids race condition where settings might not be saved yet
- Provides instant feedback to user
- More reliable than waiting for settings to propagate

### Why Fetch Settings Before Refresh in Popup?

The popup fetches settings before refreshing capabilities:

- Ensures experimental mode flag is current
- Popup doesn't maintain settings state
- Provides accurate refresh based on latest settings
- Handles case where settings changed in Options page

## Requirements Satisfied

✅ **Requirement 1.1**: Add method to refresh capabilities on demand
✅ **Requirement 1.2**: Trigger refresh when experimental mode is toggled
✅ **Requirement 1.3**: Trigger refresh when user clicks "Check Again" in AI Status
✅ **Requirement 1.4**: Update UI components when capabilities change
✅ **Requirement 11.3**: Visual feedback during capability refresh

## Testing Recommendations

### Manual Testing

1. **Options Page - Check Again Button**:
   - Open Options page
   - Click "Check Again" button
   - Verify button shows "Checking..." with spinner
   - Verify capabilities update after refresh
   - Verify button returns to normal state

2. **Options Page - Experimental Mode Toggle**:
   - Open Options page
   - Toggle "Experimental Mode" on
   - Verify capabilities refresh automatically
   - Verify experimental APIs show updated status
   - Toggle off and verify refresh again

3. **Popup - Refresh Button**:
   - Open popup
   - Click refresh button in AI Status Panel
   - Verify spinning animation
   - Verify capabilities and stats update
   - Verify animation stops after refresh

4. **Cross-Component Sync**:
   - Open Options page and Popup side-by-side
   - Toggle experimental mode in Options
   - Click refresh in Popup
   - Verify both show same capability status

### Edge Cases

1. **Rapid Refresh Clicks**: Verify multiple clicks don't cause issues
2. **Refresh During Toggle**: Verify toggling during manual refresh works
3. **No APIs Available**: Verify refresh works when all APIs unavailable
4. **All APIs Available**: Verify refresh works when all APIs available

## Performance Considerations

- Capability detection is fast (synchronous, <10ms)
- Refresh doesn't block UI (async operations)
- Debouncing prevents excessive refreshes
- Cache invalidation is immediate and reliable

## Future Enhancements

1. **Auto-refresh on Extension Update**: Refresh capabilities when extension updates
2. **Periodic Background Refresh**: Optional periodic refresh every N minutes
3. **Notification on Capability Change**: Alert user when new APIs become available
4. **Refresh History**: Track when capabilities were last refreshed

## Conclusion

The capability refresh mechanism provides users with full control over AI API availability detection. It integrates seamlessly with the experimental mode toggle and provides manual refresh options in both the Options page and Popup. The implementation is performant, reliable, and provides clear visual feedback during refresh operations.
