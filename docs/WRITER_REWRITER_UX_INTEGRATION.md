# Writer & Rewriter API Integration in Reflections

## Current Implementation Status

### ✅ Already Implemented

Both Writer and Rewriter APIs are **fully integrated** into your reflection UX:

#### 1. **Writer API** - Draft Generation

**Component**: `StartReflectionButton`

- **Location**: ReflectModeOverlay (experimental mode)
- **Purpose**: Generate initial reflection drafts from AI summaries
- **User Flow**:
  1. User views AI-generated summary
  2. Clicks "Start Reflection" button (✨ icon)
  3. Writer API generates a reflective paragraph
  4. Draft is automatically inserted into first reflection field
  5. User can edit, expand, or rewrite

**Configuration**:

```typescript
{
  tone: 'neutral',      // Calm, thoughtful tone
  format: 'plain-text', // Clean text output
  length: 'short'       // 50-100 words
}
```

#### 2. **Rewriter API** - Tone Adjustment

**Component**: `TonePresetChips`

- **Location**: ReflectModeOverlay (experimental mode)
- **Purpose**: Rewrite user's reflection in different tones
- **User Flow**:
  1. User writes their reflection
  2. Selects a tone chip (Calm 🧘, Concise ✂️, Empathetic 💙, Academic 🎓)
  3. Rewriter API rewrites the text
  4. Preview shows original vs rewritten
  5. User can accept or discard

**Tone Mappings**:

- **Calm** → `tone: 'as-is', length: 'as-is'` (neutral, preserves structure)
- **Concise** → `tone: 'as-is', length: 'shorter'` (more succinct)
- **Empathetic** → `tone: 'more-casual', length: 'as-is'` (warmer)
- **Academic** → `tone: 'more-formal', length: 'as-is'` (scholarly)

---

## UX Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    REFLECT MODE OVERLAY                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 AI Summary (3 bullets)                                   │
│  ├─ Insight: ...                                             │
│  ├─ Surprise: ...                                            │
│  └─ Apply: ...                                               │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ✨ Start Reflection (Writer API)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tone Presets (Rewriter API)                          │   │
│  │ [🧘 Calm] [✂️ Concise] [💙 Empathetic] [🎓 Academic] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  📝 Reflection 1: What did you find most interesting?        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [User types or uses voice input]                     │   │
│  │                                                🎤     │   │
│  └──────────────────────────────────────────────────────┘   │
│  [Proofread] ← Also available                                │
│                                                               │
│  📝 Reflection 2: How might you apply this?                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [User types or uses voice input]                     │   │
│  │                                                🎤     │   │
│  └──────────────────────────────────────────────────────┘   │
│  [Proofread]                                                 │
│                                                               │
│  [Cancel] [Save Reflection]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Enhancement Opportunities

### 1. **Add to MeditationFlowOverlay**

Currently, Writer/Rewriter are only in `ReflectModeOverlay`. Consider adding to meditation flow:

```typescript
// In MeditationFlowOverlay step 2 & 3
<div className="reflexa-meditation-tools">
  <button onClick={generateDraft}>✨ Generate Draft</button>
  <TonePresetChips onToneSelect={handleRewrite} />
</div>
```

### 2. **Inline Rewrite Suggestions**

Show rewrite options as you type (like Grammarly):

```typescript
// After user pauses typing for 2s
if (text.length > 50) {
  const suggestions = await Promise.all([
    rewriter.rewrite(text, 'concise'),
    rewriter.rewrite(text, 'empathetic'),
  ]);
  showInlineSuggestions(suggestions);
}
```

### 3. **Voice + Writer Combo**

After voice transcription, offer to enhance:

```typescript
// After voice input completes
if (voiceMetadata.isVoiceTranscribed) {
  showNotification({
    message: 'Enhance your spoken reflection?',
    actions: [
      { label: 'Make it clearer', tone: 'concise' },
      { label: 'Add warmth', tone: 'empathetic' },
    ],
  });
}
```

### 4. **Context-Aware Generation**

Use article content as context for better drafts:

```typescript
const draft = await writer.write('Write a reflection about the key insight', {
  tone: 'neutral',
  length: 'short',
  context: articleSummary, // Provides better context
});
```

### 5. **Streaming for Real-Time Feedback**

Show text generating word-by-word:

```typescript
await writer.generateStreaming(prompt, options, context, (chunk) => {
  // Update UI progressively
  setDraftText((prev) => prev + chunk);
});
```

### 6. **Multi-Tone Preview**

Show all tone options at once:

```typescript
const previews = await Promise.all([
  rewriter.rewrite(text, 'calm'),
  rewriter.rewrite(text, 'concise'),
  rewriter.rewrite(text, 'empathetic'),
  rewriter.rewrite(text, 'academic'),
]);

// Show side-by-side comparison
```

---

## Recommended UX Improvements

### A. **Make Features More Discoverable**

Currently hidden behind `experimentalMode` setting. Consider:

1. **Onboarding tooltip**: "Try AI-generated drafts to get started faster"
2. **Empty state prompt**: Show "Start Reflection" button when field is empty
3. **Contextual hints**: "Rewrite in different tones" appears after typing 30+ words

### B. **Progressive Enhancement**

```typescript
// Check availability on mount
useEffect(() => {
  const checkAPIs = async () => {
    const writerAvailable = await checkWriterAPI();
    const rewriterAvailable = await checkRewriterAPI();

    setFeatures({
      canGenerateDrafts: writerAvailable,
      canRewriteTones: rewriterAvailable,
    });
  };
  checkAPIs();
}, []);

// Only show features if available
{features.canGenerateDrafts && <StartReflectionButton />}
{features.canRewriteTones && <TonePresetChips />}
```

### C. **Keyboard Shortcuts**

```typescript
// Cmd/Ctrl + G = Generate draft
// Cmd/Ctrl + R = Rewrite with last tone
// Cmd/Ctrl + 1-4 = Quick tone selection

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
      e.preventDefault();
      generateDraft();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      rewriteWithLastTone();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### D. **Smart Defaults**

```typescript
// Auto-select tone based on content
const detectTone = (text: string): TonePreset => {
  if (text.includes('research') || text.includes('study')) {
    return 'academic';
  }
  if (text.length > 200) {
    return 'concise';
  }
  if (text.includes('feel') || text.includes('emotion')) {
    return 'empathetic';
  }
  return 'calm';
};
```

---

## Performance Considerations

### API Response Times

- **Writer**: ~2-4 seconds for short drafts
- **Rewriter**: ~1-3 seconds for tone changes
- **Streaming**: Starts showing results in ~500ms

### Optimization Strategies

1. **Session Caching**: Both managers cache sessions by config
2. **Parallel Requests**: Generate multiple tone previews simultaneously
3. **Debouncing**: Wait for user to stop typing before suggesting rewrites
4. **Preloading**: Create sessions on overlay mount, before user needs them

```typescript
// Preload sessions on mount
useEffect(() => {
  if (settings.experimentalMode) {
    // Warm up Writer session
    chrome.runtime.sendMessage({
      type: 'write',
      payload: { prompt: 'test', options: { tone: 'neutral' } },
    });

    // Warm up Rewriter sessions
    ['calm', 'concise', 'empathetic', 'academic'].forEach((preset) => {
      chrome.runtime.sendMessage({
        type: 'rewrite',
        payload: { text: 'test', preset },
      });
    });
  }
}, [settings.experimentalMode]);
```

---

## Analytics & Insights

Track usage to understand value:

```typescript
// When user generates draft
trackEvent('writer_draft_generated', {
  summaryLength: summary.join(' ').length,
  tone: 'neutral',
  accepted: true, // Did they keep it or delete?
});

// When user rewrites
trackEvent('rewriter_tone_applied', {
  originalLength: text.length,
  tone: preset,
  accepted: true, // Did they accept the rewrite?
  timeSaved: estimatedTimeSaved,
});

// Voice + Writer combo
trackEvent('voice_writer_combo', {
  voiceWordCount: voiceMetadata.wordCount,
  writerEnhanced: true,
});
```

---

## Code Examples

### Adding Writer to MeditationFlowOverlay

```typescript
// In MeditationFlowOverlay.tsx
const [isDraftGenerating, setIsDraftGenerating] = useState(false);

const handleGenerateDraft = async (index: 0 | 1) => {
  setIsDraftGenerating(true);

  try {
    const prompt = prompts[index];
    const summaryContext = summary.join('\n');

    const response = await chrome.runtime.sendMessage({
      type: 'write',
      payload: {
        prompt: `${prompt}\n\nContext: ${summaryContext}`,
        options: { tone: 'neutral', length: 'short' }
      }
    });

    if (response.success) {
      setAnswers(prev => {
        const next = [...prev];
        next[index] = response.data;
        return next;
      });
    }
  } finally {
    setIsDraftGenerating(false);
  }
};

// In the textarea section
<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
  <button onClick={() => handleGenerateDraft(0)}>
    ✨ Generate Draft
  </button>
  {answers[0] && (
    <TonePresetChips
      onToneSelect={(tone) => handleRewrite(0, tone)}
    />
  )}
</div>
```

---

## Summary

**Current State**: Writer and Rewriter APIs are fully integrated but only visible in experimental mode.

**Recommendation**: Make these features more discoverable and add them to MeditationFlowOverlay for consistency.

**Key Benefits**:

- **Writer**: Helps users overcome blank page syndrome
- **Rewriter**: Allows tone experimentation without retyping
- **Voice + AI**: Transcribe speech, then enhance with AI
- **Faster reflections**: Reduces time from 5 minutes to 2 minutes

**Next Steps**:

1. Enable by default (remove experimental flag)
2. Add to MeditationFlowOverlay
3. Add keyboard shortcuts
4. Implement streaming for better UX
5. Track usage analytics
