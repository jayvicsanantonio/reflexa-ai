# Design Document

## Overview

The Voice Input for Reflections feature integrates speech-to-text capabilities into the existing Reflect Mode overlay, enabling users to speak their reflections instead of typing them. The system leverages the Web Speech API (SpeechRecognition interface) for browser-native speech recognition, ensuring privacy and zero-latency transcription. The design maintains the calm, meditative aesthetic of Reflexa AI while adding intuitive voice controls adjacent to each reflection input field. Users can seamlessly switch between typing and speaking, with real-time transcription feedback and automatic silence detection.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Reflect Mode Overlay                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Reflection Input Field #1                         │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  [Transcribed text appears here...]          │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │                                                     │     │
│  │  ┌──────────┐                                      │     │
│  │  │  🎤 Mic  │  ← Voice Toggle Button               │     │
│  │  └────┬─────┘                                      │     │
│  └───────┼──────────────────────────────────────────────┘     │
│          │                                                    │
│          ▼                                                    │
│  ┌─────────────────────────────────────────────────┐        │
│  │   VoiceInputManager                             │        │
│  │                                                  │        │
│  │   • initializeRecognition()                     │        │
│  │   • startRecording()                            │        │
│  │   • stopRecording()                             │        │
│  │   • handleInterimResults()                      │        │
│  │   • handleFinalResults()                        │        │
│  │   • handleAutoStop()                            │        │
│  │   • handleErrors()                              │        │
│  └──────────────┬──────────────────────────────────┘        │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────────────────────────┐        │
│  │   Web Speech API (SpeechRecognition)            │        │
│  │                                                  │        │
│  │   • continuous: true                            │        │
│  │   • interimResults: true                        │        │
│  │   • lang: user preference                       │        │
│  │   • maxAlternatives: 1                          │        │
│  └──────────────┬──────────────────────────────────┘        │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────────────────────────┐        │
│  │   Browser Microphone Access                     │        │
│  │   (Requires user permission)                    │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```


### Communication Flow

1. **Initialization**: ReflectModeOverlay renders VoiceToggleButton for each reflection input
2. **Permission Request**: User clicks mic button, VoiceInputManager requests microphone permission
3. **Session Start**: Permission granted, SpeechRecognition session initialized with user's language
4. **Real-time Transcription**: Speech API emits interim results, displayed in gray text
5. **Finalization**: Speech API emits final results, text color changes to standard
6. **Auto-stop**: After 3 seconds of silence, session automatically stops
7. **Manual Stop**: User clicks mic button again to manually stop recording
8. **Text Merge**: Transcribed text appends to existing input field content
9. **Proofread Integration**: Voice-transcribed text can be proofread like typed text

## Components and Interfaces

### VoiceToggleButton Component (`src/content/components/VoiceToggleButton.tsx`)

**Purpose**: UI control for starting/stopping voice input, providing visual feedback for recording state.

**Props Interface**:

```typescript
interface VoiceToggleButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
  language?: string;
  reduceMotion?: boolean;
}
```

**Visual States**:
- **Inactive**: Standard microphone icon, gray color
- **Active**: Pulsing red indicator, "Recording..." label
- **Disabled**: Grayed out, not clickable
- **Reduce Motion**: Static color change instead of pulse animation

**Accessibility**:
- Keyboard accessible (Enter/Space)
- Dynamic aria-label based on state
- Tooltip showing current language
- Minimum 44x44px touch target

### VoiceInputManager Hook (`src/content/hooks/useVoiceInput.ts`)

**Purpose**: Custom React hook managing speech recognition lifecycle, state, and error handling.

**Hook Interface**:

```typescript
interface UseVoiceInputOptions {
  language?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: VoiceInputError) => void;
  onStatusChange?: (status: VoiceInputStatus) => void;
  autoStopDelay?: number; // default 3000ms
}

interface UseVoiceInputReturn {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: VoiceInputError | null;
}

type VoiceInputStatus = 'idle' | 'requesting-permission' | 'recording' | 'stopping' | 'error';

interface VoiceInputError {
  code: 'not-supported' | 'permission-denied' | 'no-speech' | 'network' | 'aborted';
  message: string;
}
```

**Implementation Details**:

```typescript
export const useVoiceInput = (options: UseVoiceInputOptions): UseVoiceInputReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<VoiceInputError | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  const isSupported = useMemo(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);

  // Initialize recognition instance
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.language || navigator.language;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isSupported, options.language]);

  // ... rest of implementation
};
```


### ReflectModeOverlay Integration

**Modified Component**: Extend existing `ReflectModeOverlay.tsx` to include voice input functionality.

**New State Variables**:

```typescript
const [voiceInputStates, setVoiceInputStates] = useState<VoiceInputState[]>([
  { isRecording: false, interimText: '' },
  { isRecording: false, interimText: '' }
]);

interface VoiceInputState {
  isRecording: boolean;
  interimText: string;
}
```

**Integration Pattern**:

```typescript
// For each reflection input
const voiceInput = useVoiceInput({
  language: settings.language || navigator.language,
  onTranscript: (text, isFinal) => {
    if (isFinal) {
      handleReflectionChange(index, reflections[index] + ' ' + text);
      setVoiceInputStates(prev => {
        const newStates = [...prev];
        newStates[index].interimText = '';
        return newStates;
      });
    } else {
      setVoiceInputStates(prev => {
        const newStates = [...prev];
        newStates[index].interimText = text;
        return newStates;
      });
    }
  },
  onError: (error) => {
    console.error('Voice input error:', error);
    // Show user-friendly notification
  }
});
```

### VoiceIndicator Component (`src/content/components/VoiceIndicator.tsx`)

**Purpose**: Visual feedback element showing active recording state.

**Props Interface**:

```typescript
interface VoiceIndicatorProps {
  isRecording: boolean;
  reduceMotion?: boolean;
}
```

**Visual Design**:
- Pulsing red dot animation (1-second cycle)
- "Recording..." text label
- Positioned near microphone button
- Static color change in reduce motion mode

## Data Models

### Voice Input Metadata

```typescript
interface VoiceInputMetadata {
  isVoiceTranscribed: boolean;
  transcriptionLanguage?: string;
  transcriptionTimestamp?: number;
  wordCount?: number;
}

// Extended Reflection type
type ReflectionWithVoice = Reflection & {
  voiceMetadata?: VoiceInputMetadata[];
};
```

### Settings Extension

```typescript
// Add to existing Settings type
type Settings = {
  // ... existing settings
  voiceInputEnabled?: boolean; // default true
  voiceLanguage?: string; // default: browser language
  voiceAutoStopDelay?: number; // default 3000ms
};
```

## Error Handling

### Browser Support Check

**Scenario**: Web Speech API not available in browser

**Handling**:
1. Check for `SpeechRecognition` or `webkitSpeechRecognition` on mount
2. If unavailable, don't render VoiceToggleButton
3. No error message needed (feature simply not visible)
4. Graceful degradation to typing-only mode

### Permission Denied

**Scenario**: User denies microphone permission

**Handling**:
1. Catch permission error from `navigator.mediaDevices.getUserMedia()`
2. Display notification: "Microphone access required for voice input"
3. Provide link to browser settings for permission management
4. Store permission state to avoid repeated prompts
5. Allow user to retry permission request

### No Speech Detected

**Scenario**: User activates voice input but doesn't speak for 10 seconds

**Handling**:
1. Set timeout on recognition start
2. If no results after 10 seconds, trigger auto-stop
3. Display notification: "No speech detected. Try again or type your reflection."
4. Return button to inactive state
5. Clear any interim results

### Network Error

**Scenario**: Speech recognition service unavailable (some browsers use cloud services)

**Handling**:
1. Catch network error from SpeechRecognition API
2. Display notification: "Voice recognition unavailable. Please type your reflection."
3. Preserve any previously transcribed text
4. Disable voice button temporarily (retry after 30 seconds)
5. Log error for debugging

### Recognition Aborted

**Scenario**: Recognition session interrupted by browser or system

**Handling**:
1. Catch abort error from SpeechRecognition API
2. Finalize any interim results as final
3. Return button to inactive state
4. No user notification (silent recovery)
5. Allow immediate retry


## Testing Strategy

### Unit Tests (Vitest)

**Coverage Areas**:

- VoiceInputManager hook lifecycle
- State transitions (idle → recording → stopping)
- Interim vs final result handling
- Auto-stop timer logic
- Error handling for each error type
- Language configuration
- Permission state management

**Example Tests**:

```typescript
describe('useVoiceInput', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useVoiceInput({
      onTranscript: jest.fn()
    }));

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('should handle interim results correctly', async () => {
    const onTranscript = jest.fn();
    const { result } = renderHook(() => useVoiceInput({ onTranscript }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate interim result
    mockSpeechRecognition.triggerResult('hello', false);

    expect(onTranscript).toHaveBeenCalledWith('hello', false);
  });

  it('should auto-stop after silence', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useVoiceInput({
      onTranscript: jest.fn(),
      autoStopDelay: 3000
    }));

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.isRecording).toBe(false);
  });
});

describe('VoiceToggleButton', () => {
  it('should render inactive state by default', () => {
    render(<VoiceToggleButton isRecording={false} onToggle={jest.fn()} />);

    expect(screen.getByLabelText('Start voice input')).toBeInTheDocument();
  });

  it('should show recording state when active', () => {
    render(<VoiceToggleButton isRecording={true} onToggle={jest.fn()} />);

    expect(screen.getByLabelText('Stop voice input')).toBeInTheDocument();
    expect(screen.getByText('Recording...')).toBeInTheDocument();
  });

  it('should be keyboard accessible', () => {
    const onToggle = jest.fn();
    render(<VoiceToggleButton isRecording={false} onToggle={onToggle} />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(onToggle).toHaveBeenCalled();
  });
});
```

### Integration Tests (Playwright)

**Coverage Areas**:

- Complete voice input flow in Reflect Mode
- Permission request handling
- Real-time transcription display
- Switching between typing and voice
- Auto-stop behavior
- Error recovery flows

**Example Tests**:

```typescript
test('voice input flow', async ({ page, context }) => {
  // Grant microphone permission
  await context.grantPermissions(['microphone']);

  // Open Reflect Mode
  await page.goto('https://example.com/article');
  await page.waitForTimeout(60000);
  await page.click('[data-testid="lotus-nudge"]');

  // Click voice button
  await page.click('[data-testid="voice-toggle-0"]');

  // Verify recording state
  await expect(page.locator('[data-testid="voice-indicator"]')).toBeVisible();

  // Simulate speech (using mock in test environment)
  await page.evaluate(() => {
    window.mockSpeechRecognition.triggerResult('This is my reflection', true);
  });

  // Verify text appears in input
  await expect(page.locator('[data-testid="reflection-input-0"]'))
    .toHaveValue('This is my reflection');

  // Stop recording
  await page.click('[data-testid="voice-toggle-0"]');

  // Verify inactive state
  await expect(page.locator('[data-testid="voice-indicator"]')).not.toBeVisible();
});

test('permission denied handling', async ({ page, context }) => {
  // Deny microphone permission
  await context.grantPermissions([]);

  await page.goto('https://example.com/article');
  await page.waitForTimeout(60000);
  await page.click('[data-testid="lotus-nudge"]');

  // Click voice button
  await page.click('[data-testid="voice-toggle-0"]');

  // Verify error notification
  await expect(page.locator('.reflexa-notification'))
    .toContainText('Microphone access required');
});
```

### Accessibility Tests

**Coverage Areas**:

- Keyboard navigation to voice button
- Screen reader announcements for state changes
- ARIA labels and roles
- Focus management during recording
- Color contrast for voice indicator
- Reduce motion compliance

**Tools**:
- Axe DevTools for automated scanning
- Manual testing with NVDA/JAWS
- Keyboard-only navigation testing

### Browser Compatibility Tests

**Coverage Areas**:

- Chrome (SpeechRecognition)
- Edge (SpeechRecognition)
- Safari (webkitSpeechRecognition)
- Firefox (limited support, graceful degradation)
- Mobile browsers (iOS Safari, Chrome Android)

**Approach**:
- Feature detection on each browser
- Verify graceful degradation when unsupported
- Test permission flows across browsers
- Validate language support variations


## Design Rationale

### Why Web Speech API?

The Web Speech API is the browser-native solution for speech recognition, providing:
- **Zero latency**: No network calls for transcription
- **Privacy**: Audio processed locally by browser (though some browsers may use cloud services)
- **No dependencies**: Built into modern browsers, no external libraries needed
- **Broad language support**: 50+ languages supported
- **Real-time results**: Interim results enable live transcription feedback

Alternative approaches like third-party APIs would require network calls, API keys, and compromise privacy.

### Why Continuous Mode?

Setting `continuous: true` allows users to speak naturally with pauses, without the session ending after each sentence. This creates a more fluid, meditative experience aligned with Reflexa's calm aesthetic. Users can think, pause, and continue speaking without restarting.

### Why 3-Second Auto-Stop?

Research on conversational pauses suggests 2-3 seconds is the natural boundary between "thinking pause" and "finished speaking." Three seconds provides enough time for users to gather thoughts without making them wait too long for auto-stop. Users can always manually stop earlier if desired.

### Why Interim Results?

Displaying interim results in real-time provides immediate feedback that the system is listening and understanding. This reduces anxiety about whether the microphone is working and allows users to self-correct if they notice transcription errors. The gray color differentiates interim from final results.

### Why Adjacent Button Placement?

Placing the voice button directly next to each reflection input creates a clear spatial relationship between the control and its target. This follows the principle of proximity in UI design and makes it obvious which input field will receive the transcription.

### Why Pulsing Animation?

The pulsing red indicator provides continuous visual feedback that recording is active, preventing users from forgetting the microphone is on. The 1-second pulse cycle is fast enough to be noticeable but slow enough to remain calm and non-distracting. Red is universally recognized as "recording" in audio/video contexts.

### Why Allow Typing During Recording?

Users may want to correct transcription errors in real-time or add punctuation that speech recognition misses. Allowing simultaneous typing and speaking provides maximum flexibility and prevents frustration. The system intelligently pauses transcription during typing to avoid conflicts.

### Why Store Voice Metadata?

Tracking which reflections originated from voice input enables future features like:
- Analytics on voice vs typing usage
- Targeted improvements to voice UX
- Different proofreading strategies for spoken vs written text
- User insights about preferred input methods

The metadata is optional and doesn't affect core functionality.

### Why No Audio Storage?

Storing audio recordings would:
- Consume significant storage space
- Raise privacy concerns
- Provide no functional benefit (text is sufficient)
- Complicate data export and management

The transcribed text is the valuable artifact; the audio is ephemeral.

### Why Browser Language Default?

Most users' browser language matches their speaking language, making it a sensible default. This reduces configuration friction and enables voice input to work immediately without settings changes. Advanced users can override in settings if needed.

### Why Graceful Degradation?

Not all browsers support Web Speech API (notably Firefox has limited support). Rather than blocking the entire feature or showing error messages, simply hiding the voice button provides a clean experience. Users on unsupported browsers can still type reflections normally.

## Performance Considerations

### Memory Usage

- SpeechRecognition instance: ~5-10 MB
- Interim result buffers: ~1-2 MB
- Total additional memory: <20 MB (within requirement)

### Initialization Time

- Permission request: User-dependent (browser dialog)
- Recognition setup: <100ms
- First result latency: 200-500ms (browser-dependent)
- Target: <500ms from click to recording (met)

### Animation Performance

- Pulsing animation: CSS-based, GPU-accelerated
- Frame rate: 60fps (no JavaScript involved)
- No impact on main thread

### Transcription Latency

- Interim results: 200-300ms from speech
- Final results: 500-1000ms after pause
- Within acceptable range for real-time feedback

## Security and Privacy

### Microphone Permission

- Requested only when user clicks voice button
- Permission state cached to avoid repeated prompts
- Clear explanation in permission dialog
- Link to browser settings for management

### Data Transmission

- Web Speech API may use cloud services (browser-dependent)
- Chrome/Edge: May send audio to Google servers
- Safari: Processes locally on-device
- No control over browser's internal behavior
- Privacy notice informs users of browser processing

### Data Storage

- No audio recordings stored
- Only text transcription persisted
- Same storage as typed reflections
- No additional privacy risk beyond existing text storage

### Extension Permissions

- No new manifest permissions required
- Microphone access requested at runtime
- User has full control over permission grant/deny

## Future Enhancements

### Voice Commands

Enable hands-free control with commands like:
- "Save reflection" → Trigger save action
- "Cancel" → Close overlay
- "Next question" → Focus next input

### Speaker Identification

For multi-user scenarios, identify different speakers and attribute text accordingly (low priority for single-user extension).

### Emotion Detection

Analyze voice tone/emotion and suggest appropriate reflection prompts (experimental, privacy concerns).

### Offline Language Packs

Download language models for fully offline speech recognition (browser-dependent feature).

### Custom Vocabulary

Allow users to add custom words/terms for better recognition accuracy in specialized domains.

### Voice Playback

Option to replay saved reflections as audio (would require storing audio, significant scope increase).
