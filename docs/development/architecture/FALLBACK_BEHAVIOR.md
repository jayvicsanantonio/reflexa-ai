# Chrome AI APIs Fallback Behavior

**Last Updated**: January 2025

This document explains how Reflexa AI handles API unavailability and implements intelligent fallback strategies.

## Overview

Reflexa AI uses a three-tier fallback strategy to ensure users always have a functional experience:

```
Specialized API → Prompt API → Manual Mode
```

## Fallback Matrix

| Operation       | Primary API       | Fallback   | Manual Mode | Notes                         |
| --------------- | ----------------- | ---------- | ----------- | ----------------------------- |
| Summarize       | Summarizer API    | Prompt API | ✅          | User writes 3 bullets         |
| Generate Draft  | Writer API        | Prompt API | ✅          | User starts with blank input  |
| Rewrite Tone    | Rewriter API      | Prompt API | ✅          | User manually rewrites        |
| Proofread       | Proofreader API   | None       | ❌          | Feature hidden if unavailable |
| Detect Language | Language Detector | None       | ❌          | Feature hidden if unavailable |
| Translate       | Translator API    | None       | ❌          | Feature hidden if unavailable |

## Fallback Implementation

### Summarization Fallback

**Primary**: Summarizer API
**Fallback**: Prompt API with specialized prompts
**Manual**: User writes summary manually

```typescript
async function summarizeWithFallback(content: string, format: SummaryFormat) {
  const caps = aiService.getCapabilities();

  // Try Summarizer API
  if (caps.summarizer) {
    try {
      return await aiService.summarizer.summarize(content, format);
    } catch (error) {
      console.warn('Summarizer failed, trying fallback:', error);
    }
  }

  // Fall back to Prompt API
  if (caps.prompt) {
    try {
      return await aiService.prompt.summarize(content, format);
    } catch (error) {
      console.error('Prompt API also failed:', error);
    }
  }

  // Manual mode
  return null; // UI shows empty summary fields for user to fill
}
```

**Prompt API Fallback Prompts**:

```typescript
// Bullets format
const bulletsPrompt = `
Summarize the following article into exactly 3 bullets, each no more than 20 words:

1. Insight: The main idea or key takeaway
2. Surprise: Something unexpected or counterintuitive
3. Apply: How to use this information practically

Article:
${content}

Format your response as:
- Insight: [text]
- Surprise: [text]
- Apply: [text]
`;

// Paragraph format
const paragraphPrompt = `
Summarize the following article in a single concise paragraph (max 150 words):

${content}

Provide only the summary paragraph, no additional text.
`;

// Headline format
const headlinePrompt = `
Summarize the following article with:
1. A 10-word headline
2. Three key bullet points (max 20 words each)

Article:
${content}

Format your response as:
Headline: [10-word headline]
• [First bullet]
• [Second bullet]
• [Third bullet]
`;
```

### Draft Generation Fallback

**Primary**: Writer API
**Fallback**: Prompt API with tone/length control
**Manual**: User starts with blank input

```typescript
async function generateDraftWithFallback(options: WriterOptions) {
  const caps = aiService.getCapabilities();

  // Try Writer API
  if (caps.writer) {
    try {
      return await aiService.writer.write(options);
    } catch (error) {
      console.warn('Writer failed, trying fallback:', error);
    }
  }

  // Fall back to Prompt API
  if (caps.prompt) {
    try {
      return await aiService.prompt.generateDraft(options);
    } catch (error) {
      console.error('Prompt API also failed:', error);
    }
  }

  // Manual mode
  return ''; // UI shows empty text area
}
```

**Prompt API Fallback Prompts**:

```typescript
// Tone mapping
const toneInstructions = {
  calm: 'Write in a calm, reflective tone. Use gentle language and thoughtful phrasing.',
  professional:
    'Write in a professional, formal tone. Use precise language and structured sentences.',
  casual:
    'Write in a casual, conversational tone. Use friendly language and natural phrasing.',
};

// Length mapping
const lengthInstructions = {
  short: 'Write 50-100 words.',
  medium: 'Write 100-200 words.',
  long: 'Write 200-300 words.',
};

const draftPrompt = `
Write a first draft reflection on the following topic.

Topic: ${options.topic}

${toneInstructions[options.tone]}
${lengthInstructions[options.length]}

${options.context ? `Context:\n${options.context}\n\n` : ''}

Write only the reflection text, no additional commentary.
`;
```

### Tone Adjustment Fallback

**Primary**: Rewriter API
**Fallback**: Prompt API with tone instructions
**Manual**: User manually rewrites

```typescript
async function rewriteWithFallback(text: string, tone: TonePreset) {
  const caps = aiService.getCapabilities();

  // Try Rewriter API
  if (caps.rewriter) {
    try {
      const toneMapping = {
        calm: 'as-is',
        concise: 'shorter',
        empathetic: 'more-casual',
        academic: 'more-formal',
      };

      return await aiService.rewriter.rewrite(text, {
        tone: toneMapping[tone],
      });
    } catch (error) {
      console.warn('Rewriter failed, trying fallback:', error);
    }
  }

  // Fall back to Prompt API
  if (caps.prompt) {
    try {
      const rewritten = await aiService.prompt.rewrite(text, tone);
      return { original: text, rewritten };
    } catch (error) {
      console.error('Prompt API also failed:', error);
    }
  }

  // Manual mode
  return null; // UI hides rewrite feature
}
```

**Prompt API Fallback Prompts**:

```typescript
const tonePrompts = {
  calm: `
Rewrite the following text to maintain a calm, reflective tone.
Preserve the original meaning and key points.

Original text:
${text}

Provide only the rewritten text, no explanations.
`,

  concise: `
Rewrite the following text to be more concise.
Remove unnecessary words while preserving meaning.

Original text:
${text}

Provide only the rewritten text, no explanations.
`,

  empathetic: `
Rewrite the following text with a more empathetic, understanding tone.
Use warmer, more personal language.

Original text:
${text}

Provide only the rewritten text, no explanations.
`,

  academic: `
Rewrite the following text in a more formal, academic tone.
Use precise, scholarly language.

Original text:
${text}

Provide only the rewritten text, no explanations.
`,
};
```

### Proofreading (No Fallback)

**Primary**: Proofreader API
**Fallback**: None
**Manual**: Feature hidden

```typescript
async function proofreadIfAvailable(text: string) {
  const caps = aiService.getCapabilities();

  if (!caps.proofreader) {
    // Hide proofread button in UI
    return null;
  }

  try {
    return await aiService.proofreader.proofread(text);
  } catch (error) {
    console.error('Proofreading failed:', error);
    // Show error message, don't fall back
    return null;
  }
}
```

**Why No Fallback?**

Proofreading requires precise grammar and clarity analysis that the Prompt API cannot reliably provide. Incorrect proofreading suggestions could harm user writing quality. Better to hide the feature than provide unreliable corrections.

### Language Detection (No Fallback)

**Primary**: Language Detector API
**Fallback**: None
**Manual**: Feature hidden

```typescript
async function detectLanguageIfAvailable(text: string, pageUrl: string) {
  const caps = aiService.getCapabilities();

  if (!caps.languageDetector) {
    // Hide language pill in UI
    return null;
  }

  try {
    return await languageDetectorManager.detect(text, pageUrl);
  } catch (error) {
    console.error('Language detection failed:', error);
    return null;
  }
}
```

**Why No Fallback?**

Language detection requires specialized models trained on linguistic patterns. The Prompt API cannot reliably identify languages, especially for short text or less common languages. Incorrect detection would break translation features.

### Translation (No Fallback)

**Primary**: Translator API
**Fallback**: None
**Manual**: Feature hidden

```typescript
async function translateIfAvailable(text: string, options: TranslateOptions) {
  const caps = aiService.getCapabilities();

  if (!caps.translator) {
    // Hide translate dropdown in UI
    return null;
  }

  // Check if language pair is supported
  const canTranslate = await translatorManager.canTranslate(
    options.sourceLanguage,
    options.targetLanguage
  );

  if (!canTranslate) {
    // Gray out language option in UI
    return null;
  }

  try {
    return await translatorManager.translate(text, options);
  } catch (error) {
    console.error('Translation failed:', error);
    return null;
  }
}
```

**Why No Fallback?**

Translation requires specialized language models and accurate linguistic knowledge. The Prompt API cannot reliably translate between languages, especially for:

- Idiomatic expressions
- Cultural context
- Grammar rules
- Formatting preservation

Incorrect translations could mislead users or change meaning significantly.

## UI Behavior

### When Specialized API Available

```typescript
// Show all features
<SummaryFormatDropdown />
<StartReflectionButton />
<TonePresetChips />
<ProofreadButton />
<LanguagePill />
<TranslateDropdown />
```

### When Only Prompt API Available

```typescript
// Show features with fallback, hide others
<SummaryFormatDropdown /> // Uses Prompt API
<StartReflectionButton /> // Uses Prompt API
<TonePresetChips /> // Uses Prompt API
// ProofreadButton hidden
// LanguagePill hidden
// TranslateDropdown hidden
```

### When No AI Available

```typescript
// Manual mode - all AI features hidden
// User writes summary and reflection manually
<ManualSummaryInput />
<ManualReflectionInput />
```

## Error Handling with Fallback

### Timeout with Fallback

```typescript
async function operationWithTimeoutFallback(
  operation: string,
  content: string
) {
  const caps = aiService.getCapabilities();

  try {
    // Try primary API with 5-second timeout
    return await withTimeout(primaryOperation(content), 5000);
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.warn(`${operation} timeout, trying fallback`);

      // Try fallback with 8-second timeout
      if (caps.prompt) {
        try {
          return await withTimeout(fallbackOperation(content), 8000);
        } catch (fallbackError) {
          console.error('Fallback also timed out');
        }
      }
    }
  }

  // Manual mode
  return null;
}
```

### Rate Limiting with Fallback

```typescript
async function operationWithRateLimitFallback(
  operation: string,
  content: string
) {
  const caps = aiService.getCapabilities();

  try {
    return await primaryOperation(content);
  } catch (error) {
    if (error.message.includes('rate limit')) {
      console.warn(`${operation} rate limited, trying fallback`);

      // Try fallback immediately (different API, different quota)
      if (caps.prompt) {
        try {
          return await fallbackOperation(content);
        } catch (fallbackError) {
          console.error('Fallback also rate limited');

          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return await fallbackOperation(content);
        }
      }
    }
  }

  return null;
}
```

## Capability Detection

### Initial Detection

```typescript
// On extension initialization
aiService.initialize();

const caps = aiService.getCapabilities();
console.log('Available APIs:', caps);

// Configure UI based on capabilities
configureUI(caps);
```

### Runtime Refresh

```typescript
// When user toggles experimental mode
function onExperimentalModeToggle(enabled: boolean) {
  const caps = aiService.refreshCapabilities(enabled);
  console.log('Updated capabilities:', caps);

  // Reconfigure UI
  configureUI(caps);
}

// When user clicks "Check Again" in AI Status panel
function onCheckAgainClick() {
  const caps = aiService.refreshCapabilities();
  console.log('Refreshed capabilities:', caps);

  // Update AI Status panel
  updateAIStatusPanel(caps);
}
```

### Capability-Based UI Configuration

```typescript
function configureUI(caps: AICapabilities) {
  // Summary format dropdown (always show - has fallback)
  showSummaryFormatDropdown(true);

  // Start reflection button (always show - has fallback)
  showStartReflectionButton(true);

  // Tone preset chips (show if Rewriter or Prompt available)
  showTonePresetChips(caps.rewriter || caps.prompt);

  // Proofread button (show only if Proofreader available)
  showProofreadButton(caps.proofreader);

  // Language pill (show only if Language Detector available)
  showLanguagePill(caps.languageDetector);

  // Translate dropdown (show only if Translator available)
  showTranslateDropdown(caps.translator);

  // AI Status panel
  updateAIStatusPanel(caps);
}
```

## Best Practices

### 1. Always Check Capabilities Before Operations

```typescript
// ✅ Good
const caps = aiService.getCapabilities();
if (caps.summarizer) {
  await aiService.summarizer.summarize(content, 'bullets');
} else if (caps.prompt) {
  await aiService.prompt.summarize(content, 'bullets');
}

// ❌ Bad
await aiService.summarizer.summarize(content, 'bullets'); // May fail
```

### 2. Implement Graceful Degradation

```typescript
// ✅ Good - Progressive enhancement
if (caps.proofreader) {
  showProofreadButton();
} else {
  // Feature simply not available
}

// ❌ Bad - Show broken feature
showProofreadButton(); // Breaks if API unavailable
```

### 3. Provide User Feedback

```typescript
// ✅ Good
if (!caps.summarizer && caps.prompt) {
  showNotification('Using fallback AI for summarization');
}

if (!caps.summarizer && !caps.prompt) {
  showNotification('AI unavailable. Please write summary manually.');
}

// ❌ Bad - Silent failure
// User doesn't know why feature isn't working
```

### 4. Log Fallback Usage

```typescript
// ✅ Good
console.log(
  `Summarization: ${caps.summarizer ? 'Summarizer API' : 'Prompt API fallback'}`
);

// Track fallback usage for analytics
trackFallbackUsage('summarize', caps.summarizer ? 'primary' : 'fallback');
```

### 5. Test All Fallback Paths

```typescript
// Test with Summarizer available
// Test with only Prompt available
// Test with no AI available
// Test with API failures
// Test with timeouts
// Test with rate limiting
```

## Troubleshooting

### Fallback Not Working

**Symptom**: Operation fails even though Prompt API is available

**Solutions**:

1. Check Prompt API availability: `await LanguageModel.availability()`
2. Verify fallback logic in message handlers
3. Check console for error messages
4. Ensure Prompt API prompts are correctly formatted
5. Test Prompt API directly in console

### Feature Hidden When It Should Be Available

**Symptom**: UI doesn't show feature even though API is available

**Solutions**:

1. Refresh capabilities: `aiService.refreshCapabilities()`
2. Check capability detection logic
3. Verify UI configuration code
4. Check for JavaScript errors in console
5. Restart extension

### Incorrect Fallback Behavior

**Symptom**: Using wrong fallback or no fallback when expected

**Solutions**:

1. Review fallback matrix in this document
2. Check message handler implementation
3. Verify capability flags are correct
4. Test with different API availability scenarios
5. Check error handling logic

## Additional Resources

- [AI Service Architecture](./AI_SERVICE_ARCHITECTURE.md)
- [Chrome AI Operations Examples](../examples/CHROME_AI_OPERATIONS.md)
- [Error Handling Guide](./ERROR_HANDLING.md)
- [Testing Guide](../guides/TESTING_GUIDE.md)
