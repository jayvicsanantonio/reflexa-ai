# More Panel Redesign - Context-Aware Tools

## Overview

Move all AI tools (Voice, Generate, Tone, Proofread) into the "More" panel and make it context-aware based on the current step.

## Changes Required

### 1. Remove Toolbars

**Delete** the unified toolbar sections from both step 2 and step 3:

- Remove all Voice, Generate, Tone Chips, and Proofread buttons from below textareas
- Keep only the textarea itself

### 2. Update More Panel Content

The More panel should show different tools based on `step`:

#### Step 0 (Breathing/Loading)

```typescript
// No tools available
<div>Take a moment to breathe...</div>
```

#### Step 1 (Summary)

```typescript
// Summary format selector
<div>
  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
    Summary Format
  </div>
  <div style={{ display: 'flex', gap: 6 }}>
    <button onClick={() => onFormatChange('bullets')}>Bullets</button>
    <button onClick={() => onFormatChange('paragraph')}>Paragraph</button>
    <button onClick={() => onFormatChange('headline-bullets')}>Headline</button>
  </div>
</div>

// Translation
<div style={{ marginTop: 16 }}>
  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
    Translate Summary
  </div>
  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
    {COMMON_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
  </select>
  <button onClick={() => onTranslate(targetLang)}>Translate</button>
</div>

// Ambient sound
<div style={{ marginTop: 16 }}>
  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
    Ambient Sound
  </div>
  <button onClick={() => { setIsMuted(!isMuted); onToggleAmbient(!isMuted); }}>
    {isMuted ? 'Unmute' : 'Mute'}
  </button>
</div>
```

#### Step 2 & 3 (Reflection Questions)

```typescript
const currentIndex = step === 2 ? 0 : 1;

// Voice Input
{voiceInput[currentIndex].isSupported && (
  <div>
    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
      Voice Input
    </div>
    <button
      onClick={async () => {
        if (voiceInput[currentIndex].isRecording) {
          voiceInput[currentIndex].stopRecording();
        } else {
          await voiceInput[currentIndex].startRecording();
        }
      }}
      style={{
        background: voiceInput[currentIndex].isRecording ? 'rgba(239,68,68,0.15)' : 'transparent',
        border: '1px solid rgba(226,232,240,0.25)',
        color: voiceInput[currentIndex].isRecording ? '#ef4444' : '#e2e8f0',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      {voiceInput[currentIndex].isRecording ? '⏹ Stop Recording' : '🎤 Start Voice Input'}
    </button>
  </div>
)}

// Generate Draft
{writerAvailable && !answers[currentIndex] && (
  <div style={{ marginTop: 16 }}>
    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
      Generate Draft
    </div>
    <button
      onClick={() => handleGenerateDraft(currentIndex)}
      disabled={isDraftGenerating[currentIndex]}
      style={{
        background: 'transparent',
        border: '1px solid rgba(226,232,240,0.25)',
        color: '#e2e8f0',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: isDraftGenerating[currentIndex] ? 'wait' : 'pointer',
        width: '100%',
      }}
    >
      {isDraftGenerating[currentIndex] ? '⏳ Generating...' : '✨ Generate Draft'}
    </button>
  </div>
)}

// Rewrite Tone
{rewriterAvailable && answers[currentIndex] && answers[currentIndex].trim().length > 20 && (
  <div style={{ marginTop: 16 }}>
    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
      Rewrite Tone
    </div>
    <TonePresetChips
      selectedTone={selectedTone}
      onToneSelect={handleToneSelect}
      disabled={isRewriting[currentIndex]}
      isLoading={isRewriting[currentIndex]}
    />
  </div>
)}

// Proofread
{onProofread && answers[currentIndex] && answers[currentIndex].trim().length > 20 && (
  <div style={{ marginTop: 16 }}>
    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
      Proofread
    </div>
    <button
      onClick={async () => {
        setIsProofreading(prev => {
          const next = [...prev];
          next[currentIndex] = true;
          return next;
        });
        try {
          const result = await onProofread(answers[currentIndex], currentIndex);
          setProofreadResult({ index: currentIndex, result });
        } catch (error) {
          console.error('Proofread failed:', error);
        } finally {
          setIsProofreading(prev => {
            const next = [...prev];
            next[currentIndex] = false;
            return next;
          });
        }
      }}
      disabled={isProofreading[currentIndex]}
      style={{
        background: 'transparent',
        border: '1px solid rgba(226,232,240,0.25)',
        color: '#e2e8f0',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: isProofreading[currentIndex] ? 'wait' : 'pointer',
        width: '100%',
      }}
    >
      {isProofreading[currentIndex] ? '⏳ Checking...' : '✎ Proofread Text'}
    </button>
  </div>
)}
```

### 3. Update Accept/Discard Buttons

Change the button alignment to right:

```typescript
<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
  <button onClick={handleDiscard}>× Discard</button>
  <button onClick={handleAccept}>✓ Accept</button>
</div>
```

### 4. Implementation Steps

1. **Find and remove toolbars**:
   - Search for `{/* Unified Toolbar */}` in step 2
   - Delete entire toolbar div and all its contents
   - Repeat for step 3

2. **Update More panel**:
   - Find `{showMore && (` section
   - Replace content with context-aware tools based on `step`

3. **Update preview panels**:
   - Find Accept/Discard button divs
   - Change `justifyContent: 'center'` to `justifyContent: 'flex-end'`
   - Swap button order (Discard first, Accept second)

### 5. Benefits

- **Cleaner UI**: No clutter below textareas
- **Context-aware**: Only relevant tools shown
- **Organized**: All tools in one place
- **Discoverable**: "More" button indicates additional options
- **Consistent**: Same pattern across all steps

### 6. Visual Result

#### Step 1 (Summary)

```
[Textarea]

[← Back]  [··· More]  [Next →]

More Panel (when open):
┌─────────────────────┐
│ Summary Format      │
│ [Bullets] [Para...] │
│                     │
│ Translate Summary   │
│ [Dropdown] [Trans...│
│                     │
│ Ambient Sound       │
│ [Mute/Unmute]       │
└─────────────────────┘
```

#### Step 2/3 (Reflection)

```
[Textarea]

[← Back]  [··· More]  [Next →]

More Panel (when open):
┌─────────────────────┐
│ Voice Input         │
│ [🎤 Start Voice...] │
│                     │
│ Generate Draft      │
│ [✨ Generate Draft] │
│                     │
│ Rewrite Tone        │
│ [Calm] [Concise]... │
│                     │
│ Proofread           │
│ [✎ Proofread Text]  │
└─────────────────────┘
```

### 7. Code Location

File: `src/content/components/MeditationFlowOverlay.tsx`

**Sections to modify**:

1. Line ~1018: Remove step 2 toolbar
2. Line ~1473: Remove step 3 toolbar
3. Line ~1850: Update More panel content
4. Line ~1260 & ~1720: Update Accept/Discard alignment

### 8. Testing Checklist

- [ ] Step 0: No tools in More panel
- [ ] Step 1: Summary format, translate, ambient sound
- [ ] Step 2: Voice, generate, tone, proofread (when applicable)
- [ ] Step 3: Voice, generate, tone, proofread (when applicable)
- [ ] Accept/Discard buttons aligned right
- [ ] All tools function correctly from More panel
- [ ] Clean UI with no toolbar clutter

## Conclusion

This redesign creates a cleaner, more organized interface where all tools are accessible through a context-aware More panel, reducing visual clutter while maintaining full functionality.
