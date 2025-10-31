# Translation Implementation for Meditation Flow

## 🎯 Goal: Add Translation Without Breaking Zen

This guide shows how to integrate translation into your existing meditation flow while maintaining the calm, intentional experience.

---

## Current Meditation Flow

```typescript
Step 0: Settle
  • Breathing orb (8s cycles)
  • Meditative phrases
  • Ambient audio
  • User centers themselves

Step 1: Summary
  • Read 3 key insights
  • Absorb content
  • Format options (bullets/paragraph)

Step 2-3: Reflect
  • Answer 2 prompts
  • Voice or text input
  • Tone presets for rewriting
  • Proofreading support

Save: Store reflection
```

---

## Recommended Integration: "Ambient Translation"

### Principle: Translate During Breathing

**Why:** The breathing phase (Step 0) is perfect for background processing.

- User is centering, not reading
- 8+ seconds is enough time to translate
- Feels seamless when they reach Step 1

### Implementation

#### 1. Modify `initiateReflectionFlow()` in `src/content/index.tsx`

```typescript
const initiateReflectionFlow = async () => {
  try {
    console.log('Starting reflection flow...');
    setNudgeLoadingState(true);

    // Extract content
    contentExtractor ??= new ContentExtractor();
    currentExtractedContent = contentExtractor.extractMainContent();

    // Check AI availability
    if (aiAvailable === null) {
      const aiCheckResponse = await sendMessageToBackground<boolean>({
        type: 'checkAI',
      });
      aiAvailable = aiCheckResponse.success ? aiCheckResponse.data : false;
    }

    // Show overlay immediately with breathing phase
    isLoadingSummary = true;
    currentSummary = [];
    currentPrompts = [
      'What did you find most interesting?',
      'How might you apply this?',
    ];
    void showReflectModeOverlay();

    // 🌐 NEW: Detect language in parallel with summarization
    const [summaryResponse, languageResponse] = await Promise.all([
      // Existing summarization
      sendMessageToBackground<string[]>({
        type: 'summarize',
        payload: {
          content: currentExtractedContent.text,
          format: currentSettings?.defaultSummaryFormat ?? 'bullets',
        },
      }),

      // NEW: Language detection
      sendMessageToBackground<LanguageDetection>({
        type: 'detectLanguage',
        payload: {
          text: currentExtractedContent.text.substring(0, 500),
          pageUrl: currentExtractedContent.url,
        },
      }),
    ]);

    // Handle summary
    if (summaryResponse.success) {
      currentSummary = summaryResponse.data;
    } else {
      currentSummary = ['', '', ''];
    }

    // 🌐 NEW: Handle language detection
    if (languageResponse.success) {
      currentLanguageDetection = languageResponse.data;
      console.log('Language detected:', currentLanguageDetection);

      // 🌐 NEW: Auto-translate if needed (during breathing phase)
      if (shouldAutoTranslate(currentLanguageDetection, currentSettings)) {
        console.log('Auto-translating during breathing phase...');
        await handleAutoTranslate(currentLanguageDetection);
      }
    }

    isLoadingSummary = false;

    // Re-render overlay with summary and language info
    void showReflectModeOverlay();

    // Request reflection prompts
    const promptsResponse = await sendMessageToBackground<string[]>({
      type: 'reflect',
      payload: currentSummary,
    });

    if (promptsResponse.success) {
      currentPrompts = promptsResponse.data;
      void showReflectModeOverlay();
    }
  } catch (error) {
    console.error('Error in reflection flow:', error);
    currentSummary = ['', '', ''];
    void showReflectModeOverlay();
  } finally {
    setNudgeLoadingState(false);
  }
};
```

#### 2. Add Auto-Translate Helper

```typescript
/**
 * Determine if content should be auto-translated
 */
function shouldAutoTranslate(
  detection: LanguageDetection,
  settings: Settings | null
): boolean {
  if (!settings?.enableTranslation) return false;
  if (!detection) return false;

  const userLang = navigator.language.split('-')[0];

  // Don't translate if already in user's language
  if (detection.detectedLanguage === userLang) return false;

  // Don't translate if already in preferred language
  if (detection.detectedLanguage === settings.preferredTranslationLanguage) {
    return false;
  }

  // Only auto-translate if confidence is very high
  const threshold = settings.autoTranslateThreshold ?? 0.9;
  if (detection.confidence < threshold) return false;

  return true;
}

/**
 * Auto-translate content during breathing phase
 */
async function handleAutoTranslate(detection: LanguageDetection) {
  try {
    const targetLang =
      currentSettings?.preferredTranslationLanguage ??
      navigator.language.split('-')[0];

    // Check cache first
    const cacheKey = `translation:${currentExtractedContent?.url}:${detection.detectedLanguage}:${targetLang}`;
    const cached = await chrome.storage.local.get(cacheKey);

    if (cached[cacheKey]) {
      const cachedData = cached[cacheKey] as {
        summary: string[];
        timestamp: number;
      };
      const age = Date.now() - cachedData.timestamp;

      // Use cache if less than 24 hours old
      if (age < 24 * 60 * 60 * 1000) {
        console.log('Using cached translation');
        currentSummary = cachedData.summary;
        return;
      }
    }

    // Translate each bullet
    const translatedSummary: string[] = [];
    for (const bullet of currentSummary) {
      const response = await sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: bullet,
          source: detection.detectedLanguage,
          target: targetLang,
        },
      });

      if (response.success) {
        translatedSummary.push(response.data);
      } else {
        translatedSummary.push(bullet); // Keep original on error
      }
    }

    // Update summary
    currentSummary = translatedSummary;

    // Cache result
    await chrome.storage.local.set({
      [cacheKey]: {
        summary: translatedSummary,
        timestamp: Date.now(),
      },
    });

    console.log('Auto-translation complete');
  } catch (error) {
    console.error('Auto-translation failed:', error);
    // Keep original summary on error
  }
}
```

#### 3. Update MeditationFlowOverlay to Show Language Badge

```typescript
// In Step 1 (Summary), add subtle language indicator
{step === 1 && (
  <div className="reflexa-meditation-slide">
    {/* Language badge - subtle, top-right */}
    {languageDetection && (
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.15)',
          borderRadius: 999,
          fontSize: 12,
          color: 'rgba(226, 232, 240, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span>🌐</span>
        <span>{languageDetection.languageName}</span>

        {/* Show if translated */}
        {wasTranslated && (
          <span style={{ fontSize: 10, opacity: 0.6 }}>
            → {getUserLanguageName()}
          </span>
        )}
      </div>
    )}

    <h2 style={{ fontSize: 22, margin: '0 0 12px', fontWeight: 800 }}>
      Summary
    </h2>

    {isLoadingSummary ? (
      <div style={{ color: '#cbd5e1' }}>Generating…</div>
    ) : (
      <div
        style={{
          color: '#f1f5f9',
          fontSize: 16,
          lineHeight: 1.8,
          textAlign: 'left',
          margin: '0 auto',
          maxWidth: 720,
        }}
      >
        {currentFormat === 'bullets' ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.map((s, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>{summary.join(' ')}</p>
        )}
      </div>
    )}
  </div>
)}
```

#### 4. Add Translation Option to "More" Panel

```typescript
// In the "More" panel (when showMore is true)
{showMore && (
  <div
    style={{
      position: 'absolute',
      bottom: 80,
      right: 24,
      background: 'rgba(2, 8, 23, 0.95)',
      border: '1px solid rgba(226, 232, 240, 0.2)',
      borderRadius: 12,
      padding: 16,
      minWidth: 200,
      backdropFilter: 'blur(10px)',
    }}
  >
    {/* Existing options */}
    <button onClick={handleFormatChange}>Change format</button>

    {/* NEW: Translation option */}
    {languageDetection &&
     languageDetection.detectedLanguage !== getUserLanguage() && (
      <button
        onClick={async () => {
          setShowMore(false);
          await handleManualTranslate();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid rgba(96, 165, 250, 0.3)',
          borderRadius: 8,
          color: 'rgba(96, 165, 250, 0.9)',
          cursor: 'pointer',
          width: '100%',
          marginTop: 8,
        }}
      >
        <span>🌐</span>
        <span>Translate to {getUserLanguageName()}</span>
      </button>
    )}

    {/* Show original option if translated */}
    {wasTranslated && (
      <button
        onClick={() => {
          setShowMore(false);
          handleShowOriginal();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid rgba(226, 232, 240, 0.3)',
          borderRadius: 8,
          color: 'rgba(226, 232, 240, 0.7)',
          cursor: 'pointer',
          width: '100%',
          marginTop: 8,
        }}
      >
        <span>↩️</span>
        <span>Show original</span>
      </button>
    )}
  </div>
)}
```

---

## Settings Integration

### Add to Settings Interface

```typescript
// In src/types/index.ts (already exists, just document)
interface Settings {
  // ... existing settings

  // Translation settings
  enableTranslation: boolean; // Enable feature
  autoDetectLanguage: boolean; // Detect in background
  preferredTranslationLanguage: string; // User's native language
  autoTranslateThreshold: number; // 0-1, default 0.9
  showOriginalWithTranslation: boolean; // Bilingual mode
}
```

### Add to Settings UI (Popup)

```typescript
// In settings panel
<div className="setting-group">
  <h3>Translation</h3>

  <label>
    <input
      type="checkbox"
      checked={settings.enableTranslation}
      onChange={(e) => updateSettings({ enableTranslation: e.target.checked })}
    />
    Enable automatic translation
  </label>

  {settings.enableTranslation && (
    <>
      <label>
        Preferred language:
        <select
          value={settings.preferredTranslationLanguage}
          onChange={(e) => updateSettings({
            preferredTranslationLanguage: e.target.value
          })}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>
      </label>

      <label>
        Auto-translate confidence:
        <input
          type="range"
          min="0.6"
          max="1.0"
          step="0.05"
          value={settings.autoTranslateThreshold}
          onChange={(e) => updateSettings({
            autoTranslateThreshold: parseFloat(e.target.value)
          })}
        />
        <span>{Math.round(settings.autoTranslateThreshold * 100)}%</span>
      </label>
    </>
  )}
</div>
```

---

## User Experience Flow

### Scenario 1: Spanish Article, English User (Auto-Translate)

```
1. User clicks "Reflect" on Spanish article
2. Lotus nudge disappears
3. Overlay appears with Step 0 (Breathing orb)
   └─ User sees: "Take a deep breath..."
   └─ Behind the scenes: Language detected (Spanish, 95% confidence)
   └─ Behind the scenes: Auto-translating to English
4. After 8 seconds, Step 1 appears
   └─ Summary is in English (seamless!)
   └─ Small badge shows: "🌐 Spanish → English"
5. User reads English summary, reflects normally
6. Never felt interrupted
```

### Scenario 2: French Article, Language Learner (Manual)

```
1. User clicks "Reflect" on French article
2. Step 0: Breathing
   └─ Language detected (French, 88% confidence)
   └─ Below threshold (90%), so no auto-translate
3. Step 1: Summary in French
   └─ Badge shows: "🌐 French"
   └─ User reads, understands most of it
4. User clicks "··· More" button
5. Sees option: "Translate to English"
6. Clicks it
7. Smooth transition to English summary
8. Can toggle back to French if needed
```

### Scenario 3: English Article, English User (No Translation)

```
1. User clicks "Reflect" on English article
2. Step 0: Breathing
   └─ Language detected (English, 98% confidence)
   └─ Matches user language, no translation needed
3. Step 1: Summary in English
   └─ No language badge shown
4. User reflects normally
5. Never sees translation feature
```

---

## Keyboard Shortcuts (Optional)

```typescript
// Add to existing keyboard handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Existing shortcuts...

    // Cmd/Ctrl + T = Quick translate
    if ((e.metaKey || e.ctrlKey) && e.key === 't' && step === 1) {
      e.preventDefault();
      if (languageDetection && !wasTranslated) {
        void handleManualTranslate();
      }
    }

    // Cmd/Ctrl + Shift + T = Toggle original/translated
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T' && step === 1) {
      e.preventDefault();
      if (wasTranslated) {
        handleToggleOriginal();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [step, languageDetection, wasTranslated]);
```

---

## Testing Checklist

### Manual Testing

- [ ] Open Spanish article → Should auto-translate during breathing
- [ ] Open French article (low confidence) → Should NOT auto-translate
- [ ] Click "More" → Should see translate option
- [ ] Translate manually → Should work smoothly
- [ ] Toggle back to original → Should work
- [ ] Open English article → Should not show translation features
- [ ] Test keyboard shortcuts (Cmd+T, Cmd+Shift+T)

### Edge Cases

- [ ] Very long articles (translation takes > 8s)
- [ ] Mixed language content
- [ ] Unsupported language pairs
- [ ] Network errors during translation
- [ ] Cache hit (instant translation)

---

## Performance Considerations

### Optimization 1: Translate During Breathing

- User doesn't notice the delay
- Feels seamless
- No loading spinners needed

### Optimization 2: Cache Aggressively

```typescript
// Cache key format
const cacheKey = `translation:${pageUrl}:${sourceLang}:${targetLang}`;

// Cache for 24 hours
const TTL = 24 * 60 * 60 * 1000;
```

### Optimization 3: Parallel Processing

```typescript
// Detect language + summarize in parallel
const [summary, language] = await Promise.all([
  summarize(content),
  detectLanguage(content),
]);
```

---

## Accessibility

### Screen Reader Support

```typescript
<div
  role="status"
  aria-live="polite"
  aria-label={`Content detected in ${languageDetection.languageName}`}
>
  {wasTranslated && (
    <span className="sr-only">
      Translated to {getUserLanguageName()}
    </span>
  )}
</div>
```

### Keyboard Navigation

- All translation controls accessible via keyboard
- Tab order makes sense
- Focus indicators visible

---

## Summary

**Translation integrates seamlessly into meditation flow by:**

1. **Detecting silently** during content extraction
2. **Translating during breathing** (Step 0) - user doesn't notice
3. **Showing subtly** with small badge in Step 1
4. **Offering manually** via "More" panel for edge cases
5. **Never interrupting** the calm, intentional experience

**Result:** Non-English speakers get the same zen experience, and English speakers never see it unless they want to.

This is **inclusive mindfulness** done right.
