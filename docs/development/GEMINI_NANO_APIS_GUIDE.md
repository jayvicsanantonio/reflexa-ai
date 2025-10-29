# Gemini Nano APIs Integration Guide

This guide explains how to use all available Gemini Nano APIs in the Reflexa AI Chrome Extension.

## Overview

Reflexa AI now supports all six Gemini Nano APIs:

1. **💭 Prompt API** - Generate dynamic prompts and structured outputs (with multimodal support)
2. **🔤 Proofreader API** - Correct grammar mistakes with ease
3. **📄 Summarizer API** - Distill complex information into clear insights
4. **🌐 Translator API** - Add multilingual capabilities
5. **✏️ Writer API** - Create original and engaging text
6. **🖊️ Rewriter API** - Improve content with alternative options

## Architecture

All APIs are managed through a unified service located at `src/background/unifiedAIService.ts`:

```typescript
import { unifiedAI } from './background/unifiedAIService';

// Access individual APIs
unifiedAI.prompt; // Prompt API (existing)
unifiedAI.proofreader; // Proofreader API (new)
unifiedAI.summarizer; // Summarizer API (new)
unifiedAI.translator; // Translator API (new)
unifiedAI.writer; // Writer API (new)
unifiedAI.rewriter; // Rewriter API (new)
```

## API Usage Examples

### 1. Prompt API (Existing)

The Prompt API is already integrated for generating summaries and reflection questions.

```typescript
// Summarize content
const summary = await unifiedAI.prompt.summarize(articleContent);
// Returns: ['Insight: ...', 'Surprise: ...', 'Apply: ...']

// Generate reflection questions
const questions = await unifiedAI.prompt.generateReflectionPrompts(summary);
// Returns: ['Question 1?', 'Question 2?']

// Proofread text (using Prompt API)
const proofread = await unifiedAI.prompt.proofread(userText);
```

### 2. Proofreader API (New)

Dedicated API for grammar and spelling corrections.

```typescript
// Check availability
const available = await unifiedAI.proofreader.checkAvailability();

// Proofread text
const correctedText = await unifiedAI.proofreader.proofread(
  'This is a text with some grammer mistakes.'
);
// Returns: "This is a text with some grammar mistakes."
```

**Use Cases:**

- Correct user reflections before saving
- Improve clarity of user-generated content
- Real-time grammar checking in text areas

### 3. Summarizer API (New)

Specialized API for content summarization with multiple formats.

```typescript
// Check availability
const available = await unifiedAI.summarizer.checkAvailability();

// Generate different types of summaries
const tldr = await unifiedAI.summarizer.summarize(content, {
  type: 'tl;dr', // Options: 'tl;dr', 'key-points', 'teaser', 'headline'
  format: 'markdown', // Options: 'plain-text', 'markdown'
  length: 'short', // Options: 'short', 'medium', 'long'
});

// Streaming summary (for real-time display)
for await (const chunk of unifiedAI.summarizer.summarizeStreaming(content, {
  type: 'key-points',
  length: 'medium',
})) {
  console.log(chunk); // Display partial results
}
```

**Use Cases:**

- Alternative to Prompt API for summarization
- Generate headlines for articles
- Create teasers for content previews
- Key points extraction for quick reading

### 4. Translator API (New)

Translate content between languages using the global `Translator` object.

**Important**: The Translator API is accessed via a global `Translator` object, NOT through `ai.translator`.

```typescript
// Check if Translator API is available
if (typeof Translator !== 'undefined') {
  // Check availability for specific language pair
  const status = await Translator.availability({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });
  // Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

  // Create translator for language pair
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });

  // Translate text
  const result = await translator.translate('Hello, how are you?');
  // Returns: "Hola, ¿cómo estás?"

  // Streaming translation for long texts
  const stream = translator.translateStreaming(longText);
  for await (const chunk of stream) {
    console.log(chunk); // Display partial translation
  }

  // Clean up when done
  translator.destroy();
}
```

**Use Cases:**

- Translate article summaries to user's preferred language
- Multilingual reflection support
- Translate reflection questions
- Support non-English content

**Supported Languages** (BCP 47 codes):

- `'en'` - English
- `'es'` - Spanish
- `'fr'` - French
- `'de'` - German
- `'it'` - Italian
- `'pt'` - Portuguese
- `'zh'` - Chinese
- `'ja'` - Japanese
- `'ko'` - Korean
- `'ar'` - Arabic

### 5. Writer API (New)

Generate original creative content.

```typescript
// Check availability
const available = await unifiedAI.writer.checkAvailability();

// Generate content with different tones
const content = await unifiedAI.writer.write(
  'Write a motivational message about daily reflection',
  {
    tone: 'casual', // Options: 'formal', 'neutral', 'casual'
    format: 'markdown', // Options: 'plain-text', 'markdown'
    length: 'short', // Options: 'short', 'medium', 'long'
  }
);

// Streaming generation
for await (const chunk of unifiedAI.writer.writeStreaming(
  'Create a reflection prompt about mindfulness',
  { tone: 'neutral', length: 'medium' }
)) {
  console.log(chunk); // Display as it's generated
}
```

**Use Cases:**

- Generate alternative reflection questions
- Create motivational messages
- Generate example reflections
- Provide writing suggestions

### 6. Rewriter API (New)

Improve existing content with different styles.

```typescript
// Check availability
const available = await unifiedAI.rewriter.checkAvailability();

// Rewrite with different options
const rewritten = await unifiedAI.rewriter.rewrite(
  "This article talks about stuff that's pretty important.",
  {
    tone: 'more-formal', // Options: 'as-is', 'more-formal', 'more-casual'
    format: 'as-is', // Options: 'as-is', 'plain-text', 'markdown'
    length: 'as-is', // Options: 'as-is', 'shorter', 'longer'
  }
);
// Returns: "This article discusses matters of significant importance."

// Streaming rewrite
for await (const chunk of unifiedAI.rewriter.rewriteStreaming(userReflection, {
  tone: 'more-casual',
  length: 'shorter',
})) {
  console.log(chunk); // Display rewritten version progressively
}
```

**Use Cases:**

- Offer alternative phrasings for reflections
- Adjust tone of summaries
- Shorten or expand content
- Improve clarity and readability

## Integration Patterns

### Pattern 1: Fallback Strategy

Use native APIs with Prompt API as fallback:

```typescript
async function proofreadText(text: string): Promise<string> {
  // Try native Proofreader API first
  if (settings.useNativeProofreader) {
    const available = await unifiedAI.proofreader.checkAvailability();
    if (available) {
      return await unifiedAI.proofreader.proofread(text);
    }
  }

  // Fallback to Prompt API
  return await unifiedAI.prompt.proofread(text);
}
```

### Pattern 2: Parallel Processing

Check all APIs availability at once:

```typescript
async function checkAllAPIs() {
  const availability = await unifiedAI.checkAllAvailability();

  console.log('API Availability:', availability);
  // {
  //   prompt: true,
  //   proofreader: true,
  //   summarizer: false,
  //   translator: true,
  //   writer: false,
  //   rewriter: true
  // }

  return availability;
}
```

### Pattern 3: Progressive Enhancement

Enhance features based on available APIs:

```typescript
async function enhanceReflection(reflection: string) {
  const availability = await unifiedAI.checkAllAvailability();

  let enhanced = reflection;

  // Proofread if available
  if (availability.proofreader) {
    enhanced = await unifiedAI.proofreader.proofread(enhanced);
  }

  // Translate if enabled and available
  if (settings.translationEnabled && availability.translator) {
    enhanced = await unifiedAI.translator.translate(
      enhanced,
      'en',
      settings.targetLanguage
    );
  }

  return enhanced;
}
```

## Feature Ideas

### 1. Smart Summarization

Combine Summarizer API with Prompt API for better results:

```typescript
async function smartSummarize(content: string) {
  if (settings.useNativeSummarizer) {
    // Use Summarizer API for key points
    const keyPoints = await unifiedAI.summarizer.summarize(content, {
      type: 'key-points',
      length: 'medium',
    });

    // Use Prompt API to format into Insight/Surprise/Apply
    return await unifiedAI.prompt.summarize(keyPoints);
  }

  // Default: use Prompt API only
  return await unifiedAI.prompt.summarize(content);
}
```

### 2. Multilingual Reflections

Allow users to reflect in their native language:

```typescript
async function createMultilingualReflection(content: string) {
  // Summarize in English
  const summary = await unifiedAI.prompt.summarize(content);

  // Translate summary to user's language
  if (settings.translationEnabled) {
    const translatedSummary = await Promise.all(
      summary.map((bullet) =>
        unifiedAI.translator.translate(bullet, 'en', settings.targetLanguage)
      )
    );

    // Generate questions in user's language
    const questions =
      await unifiedAI.prompt.generateReflectionPrompts(translatedSummary);

    return { summary: translatedSummary, questions };
  }

  return {
    summary,
    questions: await unifiedAI.prompt.generateReflectionPrompts(summary),
  };
}
```

### 3. Writing Assistant

Help users write better reflections:

```typescript
async function assistReflectionWriting(userInput: string) {
  const suggestions = [];

  // Proofread
  if (await unifiedAI.proofreader.checkAvailability()) {
    const proofread = await unifiedAI.proofreader.proofread(userInput);
    if (proofread !== userInput) {
      suggestions.push({ type: 'proofread', text: proofread });
    }
  }

  // Offer rewrite options
  if (await unifiedAI.rewriter.checkAvailability()) {
    const formal = await unifiedAI.rewriter.rewrite(userInput, {
      tone: 'more-formal',
    });
    const casual = await unifiedAI.rewriter.rewrite(userInput, {
      tone: 'more-casual',
    });

    suggestions.push(
      { type: 'formal', text: formal },
      { type: 'casual', text: casual }
    );
  }

  return suggestions;
}
```

### 4. Content Enhancement Pipeline

Process content through multiple APIs:

```typescript
async function enhanceContent(rawContent: string) {
  // Step 1: Summarize
  const summary = await unifiedAI.summarizer.summarize(rawContent, {
    type: 'key-points',
    length: 'medium',
  });

  // Step 2: Rewrite for clarity
  const clarified = await unifiedAI.rewriter.rewrite(summary, {
    tone: 'as-is',
    length: 'shorter',
  });

  // Step 3: Proofread
  const polished = await unifiedAI.proofreader.proofread(clarified);

  // Step 4: Translate if needed
  if (settings.translationEnabled) {
    return await unifiedAI.translator.translate(
      polished,
      'en',
      settings.targetLanguage
    );
  }

  return polished;
}
```

## Settings Integration

Update user settings to control API usage:

```typescript
// In settings UI
interface AISettings {
  useNativeSummarizer: boolean;
  useNativeProofreader: boolean;
  translationEnabled: boolean;
  targetLanguage: string;
}

// Save settings
await chrome.storage.local.set({ settings: newSettings });
```

## Background Service Worker Integration

Update `src/background/index.ts` to handle new message types:

```typescript
import { unifiedAI } from './unifiedAIService';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'translate':
      unifiedAI.translator
        .translate(
          message.payload.text,
          message.payload.source,
          message.payload.target
        )
        .then((result) => sendResponse({ success: true, data: result }));
      return true;

    case 'rewrite':
      unifiedAI.rewriter
        .rewrite(message.payload.text, message.payload.options)
        .then((result) => sendResponse({ success: true, data: result }));
      return true;

    case 'write':
      unifiedAI.writer
        .write(message.payload.prompt, message.payload.options)
        .then((result) => sendResponse({ success: true, data: result }));
      return true;

    case 'checkAllAI':
      unifiedAI
        .checkAllAvailability()
        .then((result) => sendResponse({ success: true, data: result }));
      return true;
  }
});
```

## UI Components

### Translation Toggle

Add to settings page:

```tsx
<label>
  <input
    type="checkbox"
    checked={settings.translationEnabled}
    onChange={(e) => updateSettings({ translationEnabled: e.target.checked })}
  />
  Enable Translation
</label>;

{
  settings.translationEnabled && (
    <select
      value={settings.targetLanguage}
      onChange={(e) => updateSettings({ targetLanguage: e.target.value })}
    >
      {COMMON_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### Writing Assistant Button

Add to reflection input:

```tsx
<button
  onClick={async () => {
    const suggestions = await assistReflectionWriting(userInput);
    setSuggestions(suggestions);
  }}
>
  ✨ Improve Writing
</button>;

{
  suggestions.map((suggestion) => (
    <div key={suggestion.type}>
      <strong>{suggestion.type}:</strong>
      <p>{suggestion.text}</p>
      <button onClick={() => setUserInput(suggestion.text)}>Use This</button>
    </div>
  ));
}
```

## Performance Considerations

1. **Lazy Loading**: Only initialize APIs when needed
2. **Caching**: Cache API availability checks
3. **Streaming**: Use streaming APIs for long content
4. **Parallel Processing**: Run independent API calls in parallel
5. **Fallbacks**: Always have fallback strategies

## Browser Compatibility

All APIs require:

- Chrome 127+ (Canary/Dev recommended)
- Enabled flags:
  - `chrome://flags/#prompt-api-for-gemini-nano`
  - `chrome://flags/#optimization-guide-on-device-model`
  - Additional flags may be needed for new APIs (check Chrome documentation)

## Testing

Test each API individually:

```typescript
// Test script
async function testAllAPIs() {
  console.log('Testing Gemini Nano APIs...');

  const availability = await unifiedAI.checkAllAvailability();
  console.log('Availability:', availability);

  if (availability.proofreader) {
    const result = await unifiedAI.proofreader.proofread('test text');
    console.log('Proofreader:', result);
  }

  if (availability.summarizer) {
    const result = await unifiedAI.summarizer.summarize('long content...', {
      type: 'tl;dr',
      length: 'short',
    });
    console.log('Summarizer:', result);
  }

  // ... test other APIs
}
```

## Next Steps

1. **Update background service worker** to handle new message types
2. **Add UI controls** for new features in settings page
3. **Implement feature flags** to gradually roll out new APIs
4. **Add telemetry** to track API usage and performance
5. **Create user documentation** explaining new features
6. **Test thoroughly** with different content types and languages

## Resources

- [Chrome AI APIs Documentation](https://developer.chrome.com/docs/ai/)
- [Prompt API Guide](https://developer.chrome.com/docs/ai/prompt-api)
- [Proofreader API Guide](https://developer.chrome.com/docs/ai/proofreader-api)
- [Summarizer API Guide](https://developer.chrome.com/docs/ai/summarizer-api)
- [Translator API Guide](https://developer.chrome.com/docs/ai/translator-api)
- [Writer API Guide](https://developer.chrome.com/docs/ai/writer-api)
- [Rewriter API Guide](https://developer.chrome.com/docs/ai/rewriter-api)
