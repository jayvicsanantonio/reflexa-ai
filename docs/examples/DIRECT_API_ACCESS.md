# Direct Chrome AI API Access

**Last Updated**: October 30, 2025

This guide shows how to use Chrome Built-in AI APIs directly using global objects, without wrapper functions.

## Table of Contents

1. [Understanding Global APIs](#understanding-global-apis)
2. [API Factory Pattern](#api-factory-pattern)
3. [Individual API Examples](#individual-api-examples)
4. [Availability Checking](#availability-checking)
5. [Session Management](#session-management)
6. [Best Practices](#best-practices)

## Understanding Global APIs

All Chrome Built-in AI APIs are accessed via **global objects** with capital letters:

```typescript
// ✅ CORRECT - Global objects
Writer;
Rewriter;
Proofreader;
Summarizer;
LanguageModel; // Prompt API
Translator;
LanguageDetector;

// ❌ WRONG - These don't exist
ai.writer;
window.ai.writer;
chrome.ai.writer;
```

### Why Global Objects?

Chrome exposes these APIs as global objects (like `window`, `document`, `console`) for:

- Simple, consistent access pattern
- No need for imports or initialization
- Easy feature detection
- Direct browser integration

## API Factory Pattern

All APIs follow the same pattern:

```typescript
// 1. Check if API exists
if (typeof APIName !== 'undefined') {
  // 2. Create session with options
  const session = await APIName.create(options);

  // 3. Use the API
  const result = await session.method(input);

  // 4. Clean up when done
  session.destroy();
}
```

### Example: Complete Flow

```typescript
async function useWriterAPI() {
  // Check availability
  if (typeof Writer === 'undefined') {
    console.log('Writer API not available');
    return null;
  }

  try {
    // Create session
    const writer = await Writer.create({
      tone: 'casual',
      length: 'short',
    });

    // Use API
    const result = await writer.write('Write a motivational quote');

    // Clean up
    writer.destroy();

    return result;
  } catch (error) {
    console.error('Writer API error:', error);
    return null;
  }
}
```

## Individual API Examples

### 1. Writer API

Generate text with specific tone and length.

```typescript
async function generateDraft() {
  if (typeof Writer === 'undefined') {
    console.log('Writer API not available');
    return;
  }

  // Create writer session
  const writer = await Writer.create({
    tone: 'casual', // 'formal', 'neutral', or 'casual'
    format: 'markdown', // 'plain-text' or 'markdown'
    length: 'short', // 'short', 'medium', or 'long'
  });

  // Generate text
  const draft = await writer.write(
    'Write a reflection about AI and creativity'
  );

  console.log('Generated:', draft);

  // Clean up
  writer.destroy();
}
```

#### Streaming with Writer API

```typescript
async function generateDraftStreaming() {
  if (typeof Writer === 'undefined') return;

  const writer = await Writer.create({
    tone: 'casual',
    length: 'medium',
  });

  // Stream the response
  const stream = writer.writeStreaming('Write about mindfulness');

  let fullText = '';
  for await (const chunk of stream) {
    fullText += chunk;
    console.log('Chunk:', chunk);
    // Update UI progressively
  }

  console.log('Complete:', fullText);
  writer.destroy();
}
```

### 2. Rewriter API

Adjust tone and length of existing text.

```typescript
async function rewriteText(text: string) {
  if (typeof Rewriter === 'undefined') {
    console.log('Rewriter API not available');
    return text;
  }

  // Create rewriter session
  const rewriter = await Rewriter.create({
    tone: 'more-formal', // 'as-is', 'more-formal', or 'more-casual'
    length: 'as-is', // 'as-is', 'shorter', or 'longer'
  });

  // Rewrite text
  const rewritten = await rewriter.rewrite(text);

  console.log('Original:', text);
  console.log('Rewritten:', rewritten);

  // Clean up
  rewriter.destroy();

  return rewritten;
}
```

#### Multiple Tone Options

```typescript
async function getToneVariations(text: string) {
  if (typeof Rewriter === 'undefined') return;

  const variations = {
    formal: '',
    casual: '',
    shorter: '',
    longer: '',
  };

  // More formal
  const formalRewriter = await Rewriter.create({ tone: 'more-formal' });
  variations.formal = await formalRewriter.rewrite(text);
  formalRewriter.destroy();

  // More casual
  const casualRewriter = await Rewriter.create({ tone: 'more-casual' });
  variations.casual = await casualRewriter.rewrite(text);
  casualRewriter.destroy();

  // Shorter
  const shorterRewriter = await Rewriter.create({ length: 'shorter' });
  variations.shorter = await shorterRewriter.rewrite(text);
  shorterRewriter.destroy();

  // Longer
  const longerRewriter = await Rewriter.create({ length: 'longer' });
  variations.longer = await longerRewriter.rewrite(text);
  longerRewriter.destroy();

  return variations;
}
```

### 3. Proofreader API

Fix grammar and improve clarity.

```typescript
async function proofreadText(text: string) {
  if (typeof Proofreader === 'undefined') {
    console.log('Proofreader API not available');
    return text;
  }

  // Create proofreader session (no options needed)
  const proofreader = await Proofreader.create();

  // Proofread text
  const result = await proofreader.proofread(text);

  console.log('Original:', text);
  console.log('Corrected:', result);

  // Clean up
  proofreader.destroy();

  return result;
}
```

#### Example with Errors

```typescript
async function demonstrateProofreading() {
  if (typeof Proofreader === 'undefined') return;

  const textWithErrors = `
    This is a sentance with some grammer errors.
    Its important to proofread you're writing before submiting it.
  `;

  const proofreader = await Proofreader.create();
  const corrected = await proofreader.proofread(textWithErrors);

  console.log('Before:', textWithErrors);
  console.log('After:', corrected);
  // After: "This is a sentence with some grammar errors.
  //         It's important to proofread your writing before submitting it."

  proofreader.destroy();
}
```

### 4. Summarizer API

Generate summaries in different formats.

```typescript
async function summarizeContent(text: string) {
  if (typeof Summarizer === 'undefined') {
    console.log('Summarizer API not available');
    return null;
  }

  // Create summarizer session
  const summarizer = await Summarizer.create({
    type: 'key-points', // 'key-points', 'tl;dr', 'teaser', or 'headline'
    format: 'markdown', // 'plain-text' or 'markdown'
    length: 'medium', // 'short', 'medium', or 'long'
  });

  // Generate summary
  const summary = await summarizer.summarize(text);

  console.log('Summary:', summary);

  // Clean up
  summarizer.destroy();

  return summary;
}
```

#### Different Summary Types

```typescript
async function getAllSummaryTypes(text: string) {
  if (typeof Summarizer === 'undefined') return;

  const summaries = {};

  // Key points
  const keyPointsSummarizer = await Summarizer.create({ type: 'key-points' });
  summaries.keyPoints = await keyPointsSummarizer.summarize(text);
  keyPointsSummarizer.destroy();

  // TL;DR
  const tldrSummarizer = await Summarizer.create({ type: 'tl;dr' });
  summaries.tldr = await tldrSummarizer.summarize(text);
  tldrSummarizer.destroy();

  // Teaser
  const teaserSummarizer = await Summarizer.create({ type: 'teaser' });
  summaries.teaser = await teaserSummarizer.summarize(text);
  teaserSummarizer.destroy();

  // Headline
  const headlineSummarizer = await Summarizer.create({ type: 'headline' });
  summaries.headline = await headlineSummarizer.summarize(text);
  headlineSummarizer.destroy();

  return summaries;
}
```

### 5. Translator API

Translate text between languages.

```typescript
async function translateText(text: string, targetLang: string) {
  if (typeof Translator === 'undefined') {
    console.log('Translator API not available');
    return text;
  }

  // Create translator session
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: targetLang,
  });

  // Translate text
  const translated = await translator.translate(text);

  console.log('Original:', text);
  console.log('Translated:', translated);

  // Clean up
  translator.destroy();

  return translated;
}
```

#### Check Translation Availability

```typescript
async function canTranslate(sourceLang: string, targetLang: string) {
  if (typeof Translator === 'undefined') {
    return false;
  }

  try {
    // Try to create translator
    const translator = await Translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    });

    translator.destroy();
    return true;
  } catch (error) {
    console.log(`Cannot translate ${sourceLang} → ${targetLang}`);
    return false;
  }
}
```

#### Supported Languages

```typescript
async function testSupportedLanguages() {
  const languages = [
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

  console.log('Testing translation support from English:');

  for (const lang of languages) {
    const supported = await canTranslate('en', lang.code);
    console.log(`  ${lang.name} (${lang.code}): ${supported ? '✅' : '❌'}`);
  }
}
```

### 6. Language Detector API

Detect the language of text.

```typescript
async function detectLanguage(text: string) {
  if (typeof LanguageDetector === 'undefined') {
    console.log('Language Detector API not available');
    return null;
  }

  // Create language detector session (no options needed)
  const detector = await LanguageDetector.create();

  // Detect language
  const results = await detector.detect(text);

  // Results is an array sorted by confidence
  const topResult = results[0];

  console.log('Detected language:', topResult.detectedLanguage);
  console.log('Confidence:', topResult.confidence);

  // Clean up
  detector.destroy();

  return topResult;
}
```

#### Detect with Multiple Results

```typescript
async function detectLanguageWithAlternatives(text: string) {
  if (typeof LanguageDetector === 'undefined') return;

  const detector = await LanguageDetector.create();
  const results = await detector.detect(text);

  console.log('Language detection results:');
  results.forEach((result, index) => {
    console.log(
      `  ${index + 1}. ${result.detectedLanguage} (${(result.confidence * 100).toFixed(1)}%)`
    );
  });

  detector.destroy();

  return results;
}
```

#### Example with Different Languages

```typescript
async function demonstrateLanguageDetection() {
  if (typeof LanguageDetector === 'undefined') return;

  const detector = await LanguageDetector.create();

  const samples = [
    { text: 'Hello, how are you?', expected: 'en' },
    { text: 'Bonjour, comment allez-vous?', expected: 'fr' },
    { text: 'Hola, ¿cómo estás?', expected: 'es' },
    { text: 'Guten Tag, wie geht es Ihnen?', expected: 'de' },
    { text: 'こんにちは、お元気ですか？', expected: 'ja' },
  ];

  for (const sample of samples) {
    const results = await detector.detect(sample.text);
    const detected = results[0].detectedLanguage;
    const match = detected === sample.expected ? '✅' : '❌';

    console.log(`${match} "${sample.text}"`);
    console.log(`   Expected: ${sample.expected}, Detected: ${detected}`);
  }

  detector.destroy();
}
```

### 7. Prompt API (LanguageModel)

General-purpose AI for custom prompts.

```typescript
async function askAI(prompt: string) {
  if (typeof LanguageModel === 'undefined') {
    console.log('Prompt API not available');
    return null;
  }

  // Create language model session
  const session = await LanguageModel.create({
    temperature: 0.7, // 0.0 to 1.0 (creativity)
    topK: 40, // Number of tokens to consider
  });

  // Send prompt
  const response = await session.prompt(prompt);

  console.log('Prompt:', prompt);
  console.log('Response:', response);

  // Clean up
  session.destroy();

  return response;
}
```

#### Streaming with Prompt API

```typescript
async function askAIStreaming(prompt: string) {
  if (typeof LanguageModel === 'undefined') return;

  const session = await LanguageModel.create();

  // Stream the response
  const stream = session.promptStreaming(prompt);

  let fullResponse = '';
  for await (const chunk of stream) {
    fullResponse += chunk;
    console.log('Chunk:', chunk);
    // Update UI progressively
  }

  console.log('Complete response:', fullResponse);
  session.destroy();
}
```

#### Multi-turn Conversation

```typescript
async function conversation() {
  if (typeof LanguageModel === 'undefined') return;

  const session = await LanguageModel.create();

  // First message
  const response1 = await session.prompt('What is mindfulness?');
  console.log('AI:', response1);

  // Follow-up (session maintains context)
  const response2 = await session.prompt('How can I practice it daily?');
  console.log('AI:', response2);

  // Another follow-up
  const response3 = await session.prompt('What are the benefits?');
  console.log('AI:', response3);

  session.destroy();
}
```

## Availability Checking

### Check Individual APIs

```typescript
function checkAPIAvailability() {
  const availability = {
    writer: typeof Writer !== 'undefined',
    rewriter: typeof Rewriter !== 'undefined',
    proofreader: typeof Proofreader !== 'undefined',
    summarizer: typeof Summarizer !== 'undefined',
    translator: typeof Translator !== 'undefined',
    languageDetector: typeof LanguageDetector !== 'undefined',
    languageModel: typeof LanguageModel !== 'undefined',
  };

  console.log('API Availability:', availability);
  return availability;
}
```

### Check with Detailed Status

```typescript
async function checkDetailedAvailability() {
  const apis = [
    { name: 'Writer', global: Writer },
    { name: 'Rewriter', global: Rewriter },
    { name: 'Proofreader', global: Proofreader },
    { name: 'Summarizer', global: Summarizer },
    { name: 'Translator', global: Translator },
    { name: 'LanguageDetector', global: LanguageDetector },
    { name: 'LanguageModel', global: LanguageModel },
  ];

  console.log('Chrome AI API Status:');
  console.log('='.repeat(50));

  for (const api of apis) {
    const exists = typeof api.global !== 'undefined';

    if (exists) {
      try {
        // Try to check availability method if it exists
        const status = await api.global.availability?.();
        console.log(`✅ ${api.name}: Available (${status || 'ready'})`);
      } catch (error) {
        console.log(`✅ ${api.name}: Available`);
      }
    } else {
      console.log(`❌ ${api.name}: Not available`);
    }
  }
}
```

### Conditional Feature Enabling

```typescript
function enableFeatures() {
  const features = {
    draftGeneration: typeof Writer !== 'undefined',
    toneAdjustment: typeof Rewriter !== 'undefined',
    grammarCheck: typeof Proofreader !== 'undefined',
    summarization: typeof Summarizer !== 'undefined',
    translation: typeof Translator !== 'undefined',
    languageDetection: typeof LanguageDetector !== 'undefined',
    aiChat: typeof LanguageModel !== 'undefined',
  };

  // Enable UI features based on availability
  if (features.draftGeneration) {
    showDraftButton();
  }

  if (features.toneAdjustment) {
    showTonePresets();
  }

  if (features.grammarCheck) {
    showProofreadButton();
  }

  if (features.translation && features.languageDetection) {
    showTranslationFeatures();
  }

  return features;
}
```

## Session Management

### Reusing Sessions

```typescript
class AISessionManager {
  private writerSession: any = null;
  private rewriterSession: any = null;

  async getWriter() {
    if (!this.writerSession && typeof Writer !== 'undefined') {
      this.writerSession = await Writer.create({
        tone: 'casual',
        length: 'medium',
      });
    }
    return this.writerSession;
  }

  async getRewriter() {
    if (!this.rewriterSession && typeof Rewriter !== 'undefined') {
      this.rewriterSession = await Rewriter.create({
        tone: 'as-is',
        length: 'as-is',
      });
    }
    return this.rewriterSession;
  }

  destroyAll() {
    if (this.writerSession) {
      this.writerSession.destroy();
      this.writerSession = null;
    }
    if (this.rewriterSession) {
      this.rewriterSession.destroy();
      this.rewriterSession = null;
    }
  }
}

// Usage
const sessionManager = new AISessionManager();

async function useWriter() {
  const writer = await sessionManager.getWriter();
  if (writer) {
    return await writer.write('Generate text');
  }
}

// Clean up when done
window.addEventListener('beforeunload', () => {
  sessionManager.destroyAll();
});
```

### Session Lifecycle

```typescript
async function properSessionLifecycle() {
  let writer = null;

  try {
    // 1. Check availability
    if (typeof Writer === 'undefined') {
      throw new Error('Writer API not available');
    }

    // 2. Create session
    writer = await Writer.create({ tone: 'casual' });

    // 3. Use session (can call multiple times)
    const draft1 = await writer.write('First prompt');
    const draft2 = await writer.write('Second prompt');

    return { draft1, draft2 };
  } catch (error) {
    console.error('Error:', error);
    return null;
  } finally {
    // 4. Always clean up
    if (writer) {
      writer.destroy();
    }
  }
}
```

## Best Practices

### 1. Always Check Availability

```typescript
// ✅ GOOD
if (typeof Writer !== 'undefined') {
  const writer = await Writer.create();
  // Use writer...
  writer.destroy();
}

// ❌ BAD
const writer = await Writer.create(); // May throw error
```

### 2. Always Clean Up Sessions

```typescript
// ✅ GOOD
const writer = await Writer.create();
try {
  const result = await writer.write('prompt');
  return result;
} finally {
  writer.destroy(); // Always clean up
}

// ❌ BAD
const writer = await Writer.create();
const result = await writer.write('prompt');
return result; // Memory leak - session not destroyed
```

### 3. Handle Errors Gracefully

```typescript
// ✅ GOOD
async function safeWrite(prompt: string) {
  if (typeof Writer === 'undefined') {
    return { success: false, error: 'API not available' };
  }

  let writer = null;
  try {
    writer = await Writer.create({ tone: 'casual' });
    const result = await writer.write(prompt);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (writer) writer.destroy();
  }
}

// ❌ BAD
async function unsafeWrite(prompt: string) {
  const writer = await Writer.create(); // May fail
  return await writer.write(prompt); // May fail
  // No cleanup, no error handling
}
```

### 4. Use Appropriate Options

```typescript
// ✅ GOOD - Specific options for use case
const formalWriter = await Writer.create({
  tone: 'formal',
  length: 'long',
  format: 'markdown',
});

// ❌ BAD - Using defaults when specific options needed
const writer = await Writer.create(); // Uses defaults
```

### 5. Don't Create Unnecessary Sessions

```typescript
// ✅ GOOD - Reuse session for multiple operations
const writer = await Writer.create({ tone: 'casual' });
const draft1 = await writer.write('First prompt');
const draft2 = await writer.write('Second prompt');
const draft3 = await writer.write('Third prompt');
writer.destroy();

// ❌ BAD - Creating new session each time
for (const prompt of prompts) {
  const writer = await Writer.create({ tone: 'casual' });
  await writer.write(prompt);
  writer.destroy();
}
```

### 6. Provide Fallbacks

```typescript
// ✅ GOOD - Graceful degradation
async function generateText(prompt: string) {
  if (typeof Writer !== 'undefined') {
    const writer = await Writer.create({ tone: 'casual' });
    const result = await writer.write(prompt);
    writer.destroy();
    return result;
  } else if (typeof LanguageModel !== 'undefined') {
    // Fallback to Prompt API
    const session = await LanguageModel.create();
    const result = await session.prompt(prompt);
    session.destroy();
    return result;
  } else {
    // Manual mode
    return null;
  }
}
```

## Complete Example: Multi-API Workflow

```typescript
async function completeReflectionWorkflow(articleText: string) {
  const results = {
    language: null,
    summary: null,
    draft: null,
    proofread: null,
    translated: null,
  };

  try {
    // 1. Detect language
    if (typeof LanguageDetector !== 'undefined') {
      const detector = await LanguageDetector.create();
      const detection = await detector.detect(articleText);
      results.language = detection[0].detectedLanguage;
      detector.destroy();
      console.log('Detected language:', results.language);
    }

    // 2. Summarize
    if (typeof Summarizer !== 'undefined') {
      const summarizer = await Summarizer.create({
        type: 'key-points',
        length: 'medium',
      });
      results.summary = await summarizer.summarize(articleText);
      summarizer.destroy();
      console.log('Summary generated');
    }

    // 3. Generate draft reflection
    if (typeof Writer !== 'undefined' && results.summary) {
      const writer = await Writer.create({
        tone: 'casual',
        length: 'short',
      });
      const prompt = `Write a reflection based on: ${results.summary}`;
      results.draft = await writer.write(prompt);
      writer.destroy();
      console.log('Draft generated');
    }

    // 4. Proofread draft
    if (typeof Proofreader !== 'undefined' && results.draft) {
      const proofreader = await Proofreader.create();
      results.proofread = await proofreader.proofread(results.draft);
      proofreader.destroy();
      console.log('Draft proofread');
    }

    // 5. Translate if needed
    if (typeof Translator !== 'undefined' && results.language !== 'en') {
      const translator = await Translator.create({
        sourceLanguage: results.language,
        targetLanguage: 'en',
      });
      results.translated = await translator.translate(results.summary);
      translator.destroy();
      console.log('Summary translated');
    }

    return results;
  } catch (error) {
    console.error('Workflow error:', error);
    return results;
  }
}
```

## Resources

- [Chrome AI APIs Documentation](https://developer.chrome.com/docs/ai/built-in)
- [API Access Patterns Summary](../development/chrome-apis/API_ACCESS_PATTERNS_SUMMARY.md)
- [Integration Status](../development/chrome-apis/ALL_APIS_INTEGRATION_STATUS.md)
- [Quick References](../development/chrome-apis/INDEX.md)

---

**Last Updated**: October 30, 2025
**Status**: ✅ Complete and Verified
