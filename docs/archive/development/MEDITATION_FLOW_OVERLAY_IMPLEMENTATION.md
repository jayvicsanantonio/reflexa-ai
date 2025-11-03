# MeditationFlowOverlay Implementation Guide

## Overview

`MeditationFlowOverlay` is the core meditation-focused reflection interface in Reflexa AI. It provides a calm, step-by-step journey through breathing, summary review, and reflection with integrated AI assistance.

## Architecture

### Component Location

- **File**: `src/content/components/MeditationFlowOverlay.tsx`
- **Type**: React Functional Component
- **Rendering**: Injected into page via content script
- **Styling**: `src/content/styles.css` (`.reflexa-overlay--meditation`)

### Key Dependencies

```typescript
import { BreathingOrb } from './BreathingOrb';
import { Notification } from './Notification';
import { VoiceToggleButton } from './VoiceToggleButton';
import { MoreToolsMenu } from './MoreToolsMenu';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { AudioManager } from '../../utils/audioManager';
```

## Flow Structure

### 4-Step Journey

```
Step 0: Settle (Breathing)
  ↓
Step 1: Summary (Review insights)
  ↓
Step 2: Reflect (First question)
  ↓
Step 3: Reflect (Second question)
  ↓
Save: Store reflection with metadata
```

### Step Details

#### Step 0: Settle

**Purpose**: Center the user before reflection

**Features**:

- Breathing orb animation (8-second cycles)
- Rotating meditative phrases (20 phrases, 4s rotation)
- Breath cues (inhale/exhale guidance)
- Loading state handling

**Behavior**:

- If `isLoadingSummary = true`: Continuous breathing + phrases
- If `isLoadingSummary = false`: Two breath cycles, then auto-advance
- Auto-advances to Step 1 when loading completes

**Implementation**:

```typescript
// Auto-advance logic
useEffect(() => {
  if (
    step === 0 &&
    prevLoadingRef.current === true &&
    isLoadingSummary === false
  ) {
    console.log('[MeditationFlow] Loading complete, auto-advancing to summary');
    setStep(1);
  }
  prevLoadingRef.current = isLoadingSummary;
}, [step, isLoadingSummary]);
```

#### Step 1: Summary

**Purpose**: Review AI-generated insights

**Features**:

- 3-bullet summary display (Insight, Surprise, Apply)
- Format switching (bullets, paragraph, headline+bullets)
- Language detection badge (top-right)
- Translation support
- Markdown rendering

**Language Badge**:

```typescript
{languageDetection && (
  <div style={{
    position: 'absolute',
    top: -8,
    right: 0,
    // Subtle badge styling
  }}>
    <span>🌐</span>
    <span>{languageDetection.languageName}</span>
    {/* Shows "(translated)" if applicable */}
  </div>
)}
```

#### Steps 2 & 3: Reflect

**Purpose**: Answer reflection prompts

**Features**:

- Large textarea for reflection input
- Voice input support (Web Speech API)
- AI-powered draft generation (Writer API)
- Tone adjustment (Rewriter API)
- Proofreading (Proofreader API)
- Real-time character tracking
- Auto-pause voice on typing

**Textarea Behavior**:

- Blue border/background when recording
- Interim transcription shown in real-time
- Typing detection pauses voice input
- Auto-resume after 2s of no typing

## Voice Input Integration

### Dual Voice Input System

Each reflection field has its own independent voice input:

```typescript
// Voice input for field 0
const voiceInput0 = useVoiceInput({
  language: settings.voiceLanguage ?? navigator.language,
  onTranscript: handleTranscript0,
  onError: handleVoiceError0,
  onAutoStop: handleAutoStop0,
  autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
});

// Voice input for field 1
const voiceInput1 = useVoiceInput({
  language: settings.voiceLanguage ?? navigator.language,
  onTranscript: handleTranscript1,
  onError: handleVoiceError1,
  onAutoStop: handleAutoStop1,
  autoStopDelay: settings.voiceAutoStopDelay ?? 3000,
});
```

### Smart Text Merging

Voice transcriptions are appended to existing text:

```typescript
const handleTranscript0 = useCallback((text: string, isFinal: boolean) => {
  if (isFinal) {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      const currentText = newAnswers[0] || '';
      newAnswers[0] = currentText
        ? `${currentText} ${text.trim()}`
        : text.trim();
      return newAnswers;
    });
  } else {
    // Show interim transcription
    setVoiceInputStates((prev) => {
      const newStates = [...prev];
      newStates[0].interimText = text;
      return newStates;
    });
  }
}, []);
```

### Typing Detection

Automatically pauses voice when user types:

```typescript
onChange={(e) => {
  const newValue = e.target.value;
  const lastValue = lastTextValueRef.current[0];

  // Detect typing and pause voice if recording
  if (
    newValue !== lastValue &&
    voiceInput0.isRecording &&
    !voiceInput0.isPaused
  ) {
    voiceInput0.pauseRecording();

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Resume after 2s of no typing
    typingTimerRef.current = setTimeout(() => {
      if (voiceInput0.isRecording && voiceInput0.isPaused) {
        voiceInput0.resumeRecording();
      }
    }, 2000);
  }

  setAnswers((prev) => [newValue, prev[1] ?? '']);
  lastTextValueRef.current[0] = newValue;
}}
```

## AI Integration

### Writer API - Draft Generation

**Purpose**: Generate initial reflection drafts

**Implementation**:

```typescript
const handleGenerateDraft = async (index: 0 | 1) => {
  if (!writerAvailable) return;

  setIsDraftGenerating((prev) => {
    const next = [...prev];
    next[index] = true;
    return next;
  });

  const prompt = prompts[index];
  const summaryContext = summary.join('\n');
  const writerPrompt = `${prompt}\n\nContext: ${summaryContext}`;

  // Try streaming first
  try {
    await attemptStreaming();
  } catch (streamError) {
    // Fallback to batch mode
    const response = await chrome.runtime.sendMessage({
      type: 'write',
      payload: {
        prompt: writerPrompt,
        options: { tone: 'neutral', length: 'short' },
      },
    });

    if (response.success) {
      writerTargetTextRef.current[index] = response.data;
      startWriterAnimation(index, true);
    }
  }
};
```

**Streaming Implementation**:

- Uses `chrome.runtime.connect()` for streaming
- Displays text progressively (2 chars per 24ms)
- Fallback to batch mode on error
- Cleanup on unmount

### Rewriter API - Tone Adjustment

**Purpose**: Rewrite reflections in different tones

**Tone Presets**:

- **Calm** 🧘: `tone: 'as-is', length: 'as-is'`
- **Concise** ✂️: `tone: 'as-is', length: 'shorter'`
- **Empathetic** 💙: `tone: 'more-casual', length: 'as-is'`
- **Academic** 🎓: `tone: 'more-formal', length: 'as-is'`

**Implementation**:

```typescript
const handleToneSelect = async (tone: TonePreset) => {
  if (!rewriterAvailable) return;

  const index = step === 2 ? 0 : 1;
  const text = answers[index];

  if (!text || text.trim().length === 0) return;

  setIsRewriting((prev) => {
    const next = [...prev];
    next[index] = true;
    return next;
  });

  const response = await chrome.runtime.sendMessage({
    type: 'rewrite',
    payload: {
      text,
      preset: tone,
      context: summary.join('\n'),
    },
  });

  if (response.success) {
    setRewritePreview({
      index,
      original: response.data.original,
      rewritten: response.data.rewritten,
    });
  }
};
```

**Preview System**:

- Shows original vs rewritten side-by-side
- Accept/Discard buttons (right-aligned)
- Only one preview active at a time

### Proofreader API - Grammar Checking

**Purpose**: Fix grammar and improve clarity

**Implementation**:

```typescript
onProofread={async (_index) => {
  if (!onProofread) return;
  const idx = step === 2 ? 0 : 1;

  setIsProofreading((prev) => {
    const next = [...prev];
    next[idx] = true;
    return next;
  });

  try {
    const result = await onProofread(answers[idx] ?? '', idx);
    setProofreadResult({ index: idx, result });
  } finally {
    setIsProofreading((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });
  }
}}
```

**Preview System**:

- Shows corrected text
- Accept/Discard buttons
- Does not auto-apply (user must accept)

## More Tools Menu Integration

### Context-Aware Tools

The `MoreToolsMenu` component shows different tools based on the current step:

**Step 1 (Summary)**:

- Summary Format selector
- Translation options
- Ambient sound toggle
- Reduce motion toggle

**Steps 2 & 3 (Reflections)**:

- Generate Draft (when field is empty)
- Rewrite Tone (when text > 20 chars)
- Proofread (when text > 20 chars)

### Implementation

```typescript
<MoreToolsMenu
  currentScreen={step === 1 ? 'summary' : 'reflection'}
  currentFormat={currentFormat}
  onFormatChange={step === 1 ? onFormatChange : undefined}
  isLoadingSummary={isLoadingSummary}
  onGenerateDraft={
    settings.experimentalMode &&
    (step === 2 || step === 3) &&
    !answers[step - 2]?.trim()
      ? (draft) => {
          const idx = step - 2;
          setAnswers((prev) => {
            const next = [...prev];
            next[idx] = draft;
            return next;
          });
        }
      : undefined
  }
  selectedTone={_selectedTones[step === 2 ? 0 : 1]}
  onToneSelect={
    settings.experimentalMode && (step === 2 || step === 3)
      ? handleToneSelect
      : undefined
  }
  hasReflectionContent={
    step === 2 || step === 3 ? !!answers[step - 2]?.trim() : false
  }
  onProofread={/* ... */}
  proofreaderAvailable={proofreaderAvailable}
  activeReflectionIndex={step - 2}
/>
```

## Audio Management

### AudioManager Integration

```typescript
const audioManagerRef = useRef<AudioManager | null>(null);

useEffect(() => {
  audioManagerRef.current = new AudioManager(settings);
  audioManagerRef.current.loadAudioFiles();

  return () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.cleanup();
    }
  };
}, [settings]);
```

### Audio Cues

- **Voice stop**: Plays when recording stops
- **Ambient sound**: Background audio during meditation
- **Completion**: Plays when reflection is saved

## Keyboard Navigation

### Supported Shortcuts

```typescript
const onKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      if (step === 0 && isLoadingSummary) return;
      setStep((s) => Math.min(3, s + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setStep((s) => Math.max(0, s - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  },
  [onCancel, step, isLoadingSummary]
);
```

### Additional Shortcuts

- **Cmd/Ctrl + G**: Generate draft (when field is empty)
- **Arrow keys**: Navigate between steps
- **Enter**: Advance to next step
- **Escape**: Close overlay

## State Management

### Core State

```typescript
const [step, setStep] = useState<number>(0); // 0-3
const [answers, setAnswers] = useState<string[]>(['', '']);
const [breathCue, setBreathCue] = useState<'inhale' | 'hold' | 'exhale'>(
  'inhale'
);
const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
```

### Voice State

```typescript
const [voiceInputStates, setVoiceInputStates] = useState<
  { isRecording: boolean; interimText: string }[]
>([
  { isRecording: false, interimText: '' },
  { isRecording: false, interimText: '' },
]);
const [voiceError, setVoiceError] = useState<VoiceInputError | null>(null);
const [autoStopNotification, setAutoStopNotification] =
  useState<boolean>(false);
```

### AI State

```typescript
const [rewritePreview, setRewritePreview] = useState<{
  index: number;
  original: string;
  rewritten: string;
} | null>(null);

const [proofreadResult, setProofreadResult] = useState<{
  index: number;
  result: ProofreadResult;
} | null>(null);

const [isProofreading, setIsProofreading] = useState<boolean[]>([false, false]);
const [_isDraftGenerating, setIsDraftGenerating] = useState<boolean[]>([
  false,
  false,
]);
const [_isRewriting, setIsRewriting] = useState<boolean[]>([false, false]);
```

### Writer Animation State

```typescript
const writerStreamCleanupRef = useRef<CleanupFn[]>([]);
const writerTargetTextRef = useRef<string[]>(['', '']);
const writerDisplayIndexRef = useRef<number[]>([0, 0]);
const writerAnimationTimerRef = useRef<number[]>([0, 0]);
const WRITER_CHAR_STEP = 2;
const WRITER_FRAME_DELAY = 24;
```

## Notifications

### Notification Types

1. **Voice Input Error**: Permission denied, network error, etc.
2. **Auto-Stop**: Recording stopped after silence
3. **Language Fallback**: Selected language not supported

### Implementation

```typescript
{voiceError && (
  <Notification
    title="Voice Input Error"
    message={voiceError.message}
    type="error"
    duration={5000}
    onClose={() => setVoiceError(null)}
  />
)}

{autoStopNotification && (
  <Notification
    title="Voice Input Stopped"
    message="Recording stopped after silence detected"
    type="info"
    duration={3000}
    onClose={() => setAutoStopNotification(false)}
  />
)}

{languageFallbackNotification.show && (
  <Notification
    title="Language Not Supported"
    message={`The selected language is not supported. Using ${languageFallbackNotification.languageName} instead.`}
    type="warning"
    duration={5000}
    onClose={() => setLanguageFallbackNotification({ show: false, languageName: '' })}
  />
)}
```

## Accessibility

### Focus Management

```typescript
useEffect(() => {
  if (!contentRef.current) return;
  return trapFocus(contentRef.current, onCancel);
}, [onCancel]);
```

### ARIA Attributes

- `role="dialog"` on overlay
- `aria-modal="true"` for modal behavior
- `aria-label` on all interactive elements
- `aria-disabled` on disabled buttons

### Reduce Motion Support

```typescript
// Disable animations when reduceMotion is true
<BreathingOrb
  enabled={!settings?.reduceMotion}
  duration={8}
  iterations={isLoadingSummary ? Infinity : 2}
  size={140}
  mode="pulse"
/>
```

## Performance Optimizations

### Memoization

```typescript
const handleTranscript0 = useCallback((text: string, isFinal: boolean) => {
  // Handler logic
}, []);

const handleVoiceError0 = useCallback((error: VoiceInputError) => {
  // Error handling
}, []);
```

### Cleanup

```typescript
useEffect(() => {
  const cleanupRef = [...writerStreamCleanupRef.current];
  return () => {
    cleanupRef.forEach((cleanup) => {
      cleanup?.();
    });
    writerAnimationTimerRef.current.forEach((timer, index) => {
      if (timer) {
        window.clearTimeout(timer);
        writerAnimationTimerRef.current[index] = 0;
      }
    });
  };
}, []);
```

### Debouncing

- Typing detection: 2s delay before resuming voice
- Format changes: Immediate (no debounce needed)

## Voice Metadata

When reflections are saved, metadata is included:

```typescript
const voiceMetadata: VoiceInputMetadata[] = answers.map((_, index) => {
  const voiceInput = index === 0 ? voiceInput0 : voiceInput1;
  const hasVoiceTranscription =
    voiceInputStates[index].isRecording ||
    (lastTextValueRef.current[index] !== '' &&
      voiceInput.hasPermission === true);

  if (!hasVoiceTranscription) {
    return { isVoiceTranscribed: false };
  }

  const wordCount = (lastTextValueRef.current[index] || '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return {
    isVoiceTranscribed: true,
    transcriptionLanguage: voiceInput.effectiveLanguage,
    transcriptionTimestamp: Date.now(),
    wordCount,
  };
});

onSave(answers, voiceMetadata);
```

## Styling

### CSS Classes

- `.reflexa-overlay--meditation`: Main overlay container
- `.reflexa-meditation-fade`: Fade-in animation for Step 0
- `.reflexa-meditation-slide`: Slide-in animation for Steps 1-3
- `.reflexa-overlay__reflection-input`: Textarea styling
- `.reflexa-overlay__reflection-input--recording`: Recording state
- `.reflexa-overlay__reflection-input-wrapper`: Container with voice button

### Animations

```css
@keyframes reflexaMeditationFade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes reflexaMeditationSlide {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Testing Considerations

### Unit Tests

- Voice input state management
- Step navigation logic
- AI integration handlers
- Keyboard shortcuts

### Integration Tests

- Full flow from Step 0 to Save
- Voice + AI combo workflows
- Error handling scenarios
- Accessibility compliance

### Manual Testing Checklist

- [ ] Step 0 auto-advances when loading completes
- [ ] Voice input works independently for both fields
- [ ] Typing pauses voice input
- [ ] Generate draft creates contextual text
- [ ] Tone adjustment shows preview
- [ ] Proofreading shows corrections
- [ ] Language badge appears when detected
- [ ] More Tools menu shows correct options per step
- [ ] Keyboard navigation works
- [ ] Reduce motion disables animations
- [ ] Audio cues play when enabled

## Known Limitations

1. **Voice Enhancement Prompt**: Currently disabled (commented out)
2. **Draft Auto-Save**: Removed per user request
3. **Resume Draft Popup**: Removed per user request
4. **Translated Target Pill**: Removed per user request
5. **Streaming Fallback**: Falls back to batch mode on error

## Future Enhancements

1. **Multi-language Voice Input**: Support language switching mid-session
2. **Voice Commands**: "Next step", "Save reflection", etc.
3. **Collaborative Reflections**: Share with others
4. **Reflection Templates**: Pre-defined reflection structures
5. **Export Options**: PDF, Markdown, Notion integration

## Troubleshooting

### Voice Input Not Working

- Check browser permissions
- Verify Web Speech API support
- Check microphone access
- Review console for errors

### AI Features Not Available

- Verify Chrome Built-in AI APIs are enabled
- Check `chrome://flags/#optimization-guide-on-device-model`
- Ensure Gemini Nano is downloaded
- Review background service worker logs

### Performance Issues

- Check for memory leaks in cleanup
- Verify animation frame rates
- Review console for warnings
- Test on lower-end devices

## Conclusion

`MeditationFlowOverlay` is a sophisticated component that combines meditation principles with AI-powered reflection tools. Its step-by-step approach, voice integration, and context-aware AI assistance create a unique and calming reflection experience.

The component is designed to be:

- **Calm**: Breathing exercises and meditative phrases
- **Intelligent**: AI-powered drafts, rewrites, and proofreading
- **Accessible**: Keyboard navigation, screen reader support, reduce motion
- **Performant**: Optimized animations, cleanup, and state management
- **Flexible**: Context-aware tools, multiple input methods, customizable settings

For implementation details on specific features, see:

- Voice Input: `docs/VOICE_INPUT_IMPLEMENTATION.md`
- Writer/Rewriter: `docs/WRITER_REWRITER_UX_INTEGRATION.md`
