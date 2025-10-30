# Chrome AI Operations Examples

**Last Updated**: January 2025

This document provides practical examples for each Chrome AI API operation in Reflexa AI.

## Table of Contents

1. [Summarization](#summarization)
2. [Draft Generation](#draft-generation)
3. [Tone Adjustment](#tone-adjustment)
4. [Proofreading](#proofreading)
5. [Language Detection](#language-detection)
6. [Translation](#translation)
7. [Complete Workflows](#complete-workflows)

## Summarization

### Basic Summarization

```typescript
import { aiService } from '@/background/services/ai';

// Initialize
aiService.initialize();

// Check availability
const caps = aiService.getCapabilities();
if (!caps.summarizer && !caps.prompt) {
  console.error('No summarization APIs available');
  return;
}

// Summarize in bullets format
const content = `
  Long article content here...
  Multiple paragraphs...
  Key insights and information...
`;

const summary = await aiService.summarizer.summarize(content, 'bullets');
console.log(summary);
// Output: [
//   "Insight: Main idea here",
//   "Surprise: Unexpected finding",
//   "Apply: Practical application"
// ]
```

### Different Summary Formats

```typescript
// Bullets format (default)
const bullets = await aiService.summarizer.summarize(content, 'bullets');
// Returns: ["Insight: ...", "Surprise: ...", "Apply: ..."]

// Paragraph format
const paragraph = await aiService.summarizer.summarize(content, 'paragraph');
// Returns: ["A concise paragraph summary (max 150 words)"]

// Headline + Bullets format
const headlineBullets = await aiService.summarizer.summarize(
  content,
  'headline-bullets'
);
// Returns: [
//   "Headline: 10-word headline",
//   "• First key point",
//   "• Second key point",
//   "• Third key point"
// ]
```

### Summarization with Fallback

```typescript
async function summarizeWithFallback(content: string, format: SummaryFormat) {
  const caps = aiService.getCapabilities();

  try {
    // Try Summarizer API first
    if (caps.summarizer) {
      return await aiService.summarizer.summarize(content, format);
    }

    // Fall back to Prompt API
    if (caps.prompt) {
      return await aiService.prompt.summarize(content, format);
    }

    // No AI available - manual mode
    return null;
  } catch (error) {
    console.error('Summarization failed:', error);

    // Try fallback on error
    if (caps.prompt) {
      try {
        return await aiService.prompt.summarize(content, format);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    return null;
  }
}
```

## Draft Generation

### Basic Draft Generation

```typescript
// Generate a short, calm reflection draft
const draft = await aiService.writer.write({
  topic: 'reflection on article about AI',
  tone: 'calm',
  length: 'short',
});

console.log(draft);
// Output: "This article explores the transformative potential of AI..."
// (50-100 words)
```

### Draft with Context

```typescript
// Use summary as context for better drafts
const summary = await aiService.summarizer.summarize(content, 'bullets');

const draft = await aiService.writer.write({
  topic: 'reflection on article',
  tone: 'calm',
  length: 'medium',
  context: summary.join('\n'),
});

console.log(draft);
// Output: More contextually relevant draft (100-200 words)
```

### Different Tones and Lengths

```typescript
// Professional tone, long length
const professionalDraft = await aiService.writer.write({
  topic: 'business analysis',
  tone: 'professional',
  length: 'long',
});
// Output: 200-300 words, formal tone

// Casual tone, short length
const casualDraft = await aiService.writer.write({
  topic: 'personal thoughts',
  tone: 'casual',
  length: 'short',
});
// Output: 50-100 words, conversational tone
```

### Streaming Draft Generation

```typescript
// Generate draft with progressive UI updates
const stream = aiService.writer.generateStreaming({
  topic: 'reflection',
  tone: 'calm',
  length: 'medium',
});

let draft = '';
for await (const chunk of stream) {
  draft += chunk;
  updateUI(draft); // Update UI as text generates
}

console.log('Final draft:', draft);
```

## Tone Adjustment

### Basic Tone Adjustment

```typescript
const originalText = `
  I think this article makes some good points about AI.
  It's pretty interesting how they explain the technology.
`;

// Make it more formal
const result = await aiService.rewriter.rewrite(originalText, {
  tone: 'more-formal',
  length: 'as-is',
});

console.log('Original:', result.original);
console.log('Rewritten:', result.rewritten);
// Output: "This article presents compelling arguments regarding AI.
//          The explanation of the technology is particularly insightful."
```

### Tone Presets

```typescript
// Calm tone (as-is)
const calm = await aiService.rewriter.rewrite(text, {
  tone: 'as-is',
});

// Concise (shorter)
const concise = await aiService.rewriter.rewrite(text, {
  length: 'shorter',
});

// Empathetic (more casual)
const empathetic = await aiService.rewriter.rewrite(text, {
  tone: 'more-casual',
});

// Academic (more formal)
const academic = await aiService.rewriter.rewrite(text, {
  tone: 'more-formal',
});
```

### Streaming Rewrite

```typescript
const stream = aiService.rewriter.rewriteStreaming(text, {
  tone: 'more-formal',
});

let rewritten = '';
for await (const chunk of stream) {
  rewritten += chunk;
  updatePreview(rewritten); // Show preview as it generates
}
```

## Proofreading

### Basic Proofreading

```typescript
const userText = `
  This is a sentance with some grammer errors.
  Its important to proofread you're writing.
`;

const result = await aiService.proofreader.proofread(userText);

console.log('Corrected:', result.correctedText);
// Output: "This is a sentence with some grammar errors.
//          It's important to proofread your writing."

console.log('Changes:', result.corrections);
// Output: [
//   { startIndex: 10, endIndex: 18, original: 'sentance' },
//   { startIndex: 29, endIndex: 36, original: 'grammer' },
//   { startIndex: 45, endIndex: 48, original: 'Its' },
//   { startIndex: 72, endIndex: 78, original: "you're" }
// ]
```

### Proofread with Diff View

```typescript
async function proofreadWithDiff(text: string) {
  const result = await aiService.proofreader.proofread(text);

  // Display side-by-side comparison
  displayDiff({
    original: text,
    corrected: result.correctedText,
    changes: result.corrections,
  });

  // Let user accept or discard
  const accepted = await getUserChoice();

  if (accepted) {
    return result.correctedText;
  } else {
    return text;
  }
}
```

## Language Detection

### Basic Language Detection

```typescript
import { languageDetectorManager } from '@/background/services/ai';

const content = `
  Bonjour! Ceci est un article en français.
  Il parle de l'intelligence artificielle.
`;

const detection = await languageDetectorManager.detect(content);

console.log('Language:', detection.languageName); // "French"
console.log('Code:', detection.detectedLanguage); // "fr"
console.log('Confidence:', detection.confidence); // 0.95
```

### Language Detection with Caching

```typescript
// Detect language for a specific page (with caching)
const pageUrl = 'https://example.com/article';
const detection = await languageDetectorManager.detect(content, pageUrl);

// Subsequent calls for same page use cache (5-minute TTL)
const cached = await languageDetectorManager.detect(content, pageUrl);
// Returns immediately from cache

// Clear cache for specific page
languageDetectorManager.clearCacheForPage(pageUrl);

// Clear all cache
languageDetectorManager.clearCache();
```

### Language Detection for UI

```typescript
async function detectAndDisplayLanguage(content: string, pageUrl: string) {
  const detection = await languageDetectorManager.detect(content, pageUrl);

  // Show language pill in UI
  showLanguagePill({
    language: detection.languageName,
    code: detection.detectedLanguage,
    confidence: detection.confidence,
  });

  // Offer translation if not English
  if (detection.detectedLanguage !== 'en') {
    showTranslateButton(detection.detectedLanguage);
  }
}
```

## Translation

### Basic Translation

```typescript
import { translatorManager } from '@/background/services/ai';

// Check if translation is possible
const canTranslate = await translatorManager.canTranslate('es', 'en');

if (canTranslate) {
  const translated = await translatorManager.translate('Hola mundo', {
    sourceLanguage: 'es',
    targetLanguage: 'en',
  });

  console.log(translated); // "Hello world"
}
```

### Translation with Markdown Preservation

```typescript
const markdownText = `
# Título Principal

Este es un artículo con **formato markdown**.

- Primer punto
- Segundo punto
- Tercer punto

[Enlace](https://example.com)
`;

const translated = await translatorManager.translateWithMarkdown(markdownText, {
  sourceLanguage: 'es',
  targetLanguage: 'en',
});

console.log(translated);
// Output:
// # Main Title
//
// This is an article with **markdown formatting**.
//
// - First point
// - Second point
// - Third point
//
// [Link](https://example.com)
```

### Supported Languages

```typescript
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

// Check which language pairs are available
for (const lang of supportedLanguages) {
  const canDo = await translatorManager.canTranslate('en', lang.code);
  console.log(`English → ${lang.name}: ${canDo ? '✅' : '❌'}`);
}
```

### Translation with Auto-Detection

```typescript
async function translateWithAutoDetect(text: string, targetLang: string) {
  // Detect source language
  const detection = await languageDetectorManager.detect(text);
  const sourceLang = detection.detectedLanguage;

  // Check if translation is possible
  const canTranslate = await translatorManager.canTranslate(
    sourceLang,
    targetLang
  );

  if (!canTranslate) {
    console.error(`Cannot translate from ${sourceLang} to ${targetLang}`);
    return null;
  }

  // Translate
  const translated = await translatorManager.translate(text, {
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
  });

  return {
    original: text,
    translated,
    sourceLang,
    targetLang,
  };
}
```

## Complete Workflows

### Multilingual Reflection Workflow

```typescript
async function createMultilingualReflection(content: string, pageUrl: string) {
  // 1. Detect language
  const detection = await languageDetectorManager.detect(content, pageUrl);
  console.log(`Detected: ${detection.languageName}`);

  // 2. Translate to English if needed
  let contentToSummarize = content;
  if (detection.detectedLanguage !== 'en') {
    const canTranslate = await translatorManager.canTranslate(
      detection.detectedLanguage,
      'en'
    );

    if (canTranslate) {
      contentToSummarize = await translatorManager.translate(content, {
        sourceLanguage: detection.detectedLanguage,
        targetLanguage: 'en',
      });
      console.log('Translated to English');
    }
  }

  // 3. Generate summary
  const summary = await aiService.summarizer.summarize(
    contentToSummarize,
    'bullets'
  );
  console.log('Summary:', summary);

  // 4. Generate draft reflection
  const draft = await aiService.writer.write({
    topic: 'reflection on article',
    tone: 'calm',
    length: 'short',
    context: summary.join('\n'),
  });
  console.log('Draft:', draft);

  // 5. User edits reflection...
  const userText = await getUserInput(draft);

  // 6. Rewrite with tone adjustment (if requested)
  let finalText = userText;
  const selectedTone = await getUserTonePreference();
  if (selectedTone) {
    const rewritten = await aiService.rewriter.rewrite(userText, {
      tone: selectedTone,
    });

    const accepted = await showRewritePreview(rewritten);
    if (accepted) {
      finalText = rewritten.rewritten;
    }
  }

  // 7. Proofread (if enabled)
  if (settings.proofreadEnabled) {
    const proofread = await aiService.proofreader.proofread(finalText);
    const accepted = await showProofreadDiff(proofread);
    if (accepted) {
      finalText = proofread.correctedText;
    }
  }

  // 8. Save reflection
  await saveReflection({
    url: pageUrl,
    summary,
    reflection: finalText,
    detectedLanguage: detection.detectedLanguage,
    aiMetadata: {
      summarizerUsed: true,
      writerUsed: true,
      rewriterUsed: selectedTone !== null,
      proofreaderUsed: settings.proofreadEnabled,
      translatorUsed: detection.detectedLanguage !== 'en',
    },
  });

  console.log('Reflection saved!');
}
```

### Fallback Workflow

```typescript
async function createReflectionWithFallback(content: string) {
  const caps = aiService.getCapabilities();

  // 1. Summarize with fallback
  let summary: string[];
  if (caps.summarizer) {
    summary = await aiService.summarizer.summarize(content, 'bullets');
  } else if (caps.prompt) {
    summary = await aiService.prompt.summarize(content, 'bullets');
  } else {
    // Manual mode
    summary = await getUserManualSummary();
  }

  // 2. Generate draft with fallback
  let draft: string;
  if (caps.writer) {
    draft = await aiService.writer.write({
      topic: 'reflection',
      tone: 'calm',
      length: 'short',
      context: summary.join('\n'),
    });
  } else if (caps.prompt) {
    draft = await aiService.prompt.generateDraft({
      topic: 'reflection',
      tone: 'calm',
      length: 'short',
    });
  } else {
    // Manual mode
    draft = '';
  }

  // 3. User edits...
  const userText = await getUserInput(draft);

  // 4. Rewrite with fallback (if available)
  if (caps.rewriter || caps.prompt) {
    const selectedTone = await getUserTonePreference();
    if (selectedTone) {
      let rewritten: string;
      if (caps.rewriter) {
        const result = await aiService.rewriter.rewrite(userText, {
          tone: selectedTone,
        });
        rewritten = result.rewritten;
      } else if (caps.prompt) {
        rewritten = await aiService.prompt.rewrite(userText, selectedTone);
      }

      const accepted = await showRewritePreview({
        original: userText,
        rewritten,
      });
      if (accepted) {
        userText = rewritten;
      }
    }
  }

  // 5. Proofread (no fallback - hide if unavailable)
  if (caps.proofreader && settings.proofreadEnabled) {
    const proofread = await aiService.proofreader.proofread(userText);
    const accepted = await showProofreadDiff(proofread);
    if (accepted) {
      userText = proofread.correctedText;
    }
  }

  // 6. Save
  await saveReflection({
    summary,
    reflection: userText,
    aiMetadata: {
      summarizerUsed: caps.summarizer,
      writerUsed: caps.writer,
      rewriterUsed: caps.rewriter,
      proofreaderUsed: caps.proofreader && settings.proofreadEnabled,
      promptFallback: !caps.summarizer || !caps.writer || !caps.rewriter,
    },
  });
}
```

### Error Handling Workflow

```typescript
async function createReflectionWithErrorHandling(content: string) {
  try {
    // Try summarization with timeout and retry
    const summary = await withRetry(
      () => aiService.summarizer.summarize(content, 'bullets'),
      { maxRetries: 2, timeout: 8000 }
    );

    // Try draft generation
    const draft = await withRetry(
      () =>
        aiService.writer.write({
          topic: 'reflection',
          tone: 'calm',
          length: 'short',
          context: summary.join('\n'),
        }),
      { maxRetries: 2, timeout: 8000 }
    );

    return { summary, draft };
  } catch (error) {
    console.error('AI operations failed:', error);

    // Fall back to Prompt API
    try {
      const summary = await aiService.prompt.summarize(content, 'bullets');
      const draft = await aiService.prompt.generateDraft({
        topic: 'reflection',
        tone: 'calm',
        length: 'short',
      });
      return { summary, draft };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);

      // Manual mode
      return {
        summary: await getUserManualSummary(),
        draft: '',
      };
    }
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries: number; timeout: number }
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= options.maxRetries; i++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), options.timeout)
        ),
      ]);
    } catch (error) {
      lastError = error;
      if (i < options.maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError;
}
```

## Best Practices

### 1. Always Check Capabilities

```typescript
// ✅ Good
const caps = aiService.getCapabilities();
if (caps.summarizer) {
  await aiService.summarizer.summarize(content, 'bullets');
}

// ❌ Bad
await aiService.summarizer.summarize(content, 'bullets'); // May fail
```

### 2. Implement Fallback Logic

```typescript
// ✅ Good
if (caps.summarizer) {
  summary = await aiService.summarizer.summarize(content, 'bullets');
} else if (caps.prompt) {
  summary = await aiService.prompt.summarize(content, 'bullets');
} else {
  summary = await getUserManualSummary();
}

// ❌ Bad
summary = await aiService.summarizer.summarize(content, 'bullets'); // No fallback
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  const result = await aiService.writer.write(options);
  return { success: true, data: result };
} catch (error) {
  console.error('Writer failed:', error);
  return { success: false, error: error.message, manualMode: true };
}

// ❌ Bad
const result = await aiService.writer.write(options); // Unhandled error
```

### 4. Use Streaming for Better UX

```typescript
// ✅ Good - Progressive updates
const stream = aiService.writer.generateStreaming(options);
for await (const chunk of stream) {
  updateUI(chunk);
}

// ❌ Bad - User waits with no feedback
const result = await aiService.writer.write(options);
updateUI(result);
```

### 5. Cache Language Detection

```typescript
// ✅ Good - Use page URL for caching
const detection = await languageDetectorManager.detect(content, pageUrl);

// ❌ Bad - No caching, repeated detection
const detection = await languageDetectorManager.detect(content);
```

## Additional Resources

- [AI Service Architecture](../development/AI_SERVICE_ARCHITECTURE.md)
- [Chrome AI APIs Documentation](../development/chrome-apis/INDEX.md)
- [Gemini Nano Setup Guide](../development/GEMINI_NANO_SETUP.md)
- [Testing Guide](../guides/TESTING_GUIDE.md)
