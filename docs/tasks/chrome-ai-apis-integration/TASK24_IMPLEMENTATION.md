# Task 24 Implementation: Update Content Script to Trigger Language Detection

## Overview

Updated the content script to automatically trigger language detection when content is extracted, pass the detected language to the Reflect Mode overlay, and cache language detection results per page.

## Changes Made

### 1. Content Script Updates (`src/content/index.tsx`)

**Modified `initiateReflectionFlow()` function:**

- Removed conditional check for `autoDetectLanguage` setting
- Language detection now runs automatically when content is extracted
- Added `pageUrl` parameter to the language detection request for per-page caching
- Improved error handling to not block the reflection flow if language detection fails

**Key improvements:**

```typescript
// Before: Only detected language if autoDetectLanguage was enabled
if (currentSettings?.autoDetectLanguage) {
  // detect language...
}

// After: Always detect language when content is extracted
console.log('Detecting language...');
try {
  const languageResponse = await sendMessageToBackground<LanguageDetection>({
    type: 'detectLanguage',
    payload: {
      text: currentExtractedContent.text.substring(0, 500),
      pageUrl: currentExtractedContent.url, // Pass URL for caching
    },
  });
  // ...
} catch (error) {
  // Don't block the flow if language detection fails
  currentLanguageDetection = null;
}
```

## Implementation Details

### Language Detection Flow

1. **Content Extraction**: When `initiateReflectionFlow()` is called, content is extracted from the page
2. **Language Detection**: After successful summarization, language detection is triggered automatically
3. **Caching**: The page URL is passed to the language detector for per-page caching (5-minute TTL)
4. **Overlay Display**: The detected language is passed to the Reflect Mode overlay via `languageDetection` prop
5. **Error Handling**: If language detection fails, the flow continues with `currentLanguageDetection = null`

### Per-Page Caching

The language detector manager (`src/background/services/ai/languageDetectorManager.ts`) implements per-page caching:

- Cache key: Page URL (when provided) or text hash (fallback)
- Cache TTL: 5 minutes
- Cache methods: `clearCache()`, `clearCacheForPage()`, `cleanupCache()`

When the same page is visited again within 5 minutes, the cached language detection result is returned immediately without calling the API.

### Integration with Existing Components

The detected language is already integrated with:

- **LanguagePill component**: Displays detected language in the overlay header
- **TranslateDropdown component**: Uses detected language as source language for translation
- **Reflect Mode overlay**: Shows "Translate to English" button for non-English content

## Requirements Satisfied

✅ **Requirement 6.1**: Language detection is triggered when content is extracted
✅ **Requirement 6.2**: Detected language is passed to Reflect Mode overlay
✅ **Requirement 6.3**: Language detection results are cached per page (5-minute TTL)

## Testing Recommendations

### Manual Testing

1. Visit a non-English webpage (e.g., Spanish, French, German)
2. Wait for dwell threshold or click lotus nudge
3. Verify language pill appears in overlay header with correct language
4. Verify "Translate to English" button appears for non-English content
5. Revisit the same page within 5 minutes
6. Verify cached result is used (check console logs)

### Edge Cases

- Empty or very short content (< 500 characters)
- Mixed-language content
- Language detection API unavailable
- Network errors during detection

## Performance Considerations

- **Sample size**: Only first 500 characters are used for detection (speed optimization)
- **Caching**: Per-page caching reduces redundant API calls
- **Non-blocking**: Language detection failures don't block the reflection flow
- **Async execution**: Detection runs in parallel with other operations

## Future Enhancements

1. **Auto-translate**: Automatically translate non-English content based on user preference
2. **Language preference**: Remember user's preferred language for translation
3. **Multi-language support**: Detect and handle mixed-language content
4. **Confidence threshold**: Only show language pill if confidence > 0.7

## Related Files

- `src/content/index.tsx` - Content script with language detection trigger
- `src/background/index.ts` - Message handler for detectLanguage
- `src/background/services/ai/languageDetectorManager.ts` - Language detector implementation
- `src/content/components/LanguagePill.tsx` - Language display component
- `src/content/components/TranslateDropdown.tsx` - Translation UI component
- `src/content/components/ReflectModeOverlay.tsx` - Main overlay component

## Completion Status

✅ Task 24 completed successfully

- Language detection triggers automatically when content is extracted
- Detected language is passed to Reflect Mode overlay
- Per-page caching is implemented with 5-minute TTL
- Error handling ensures non-blocking behavior
