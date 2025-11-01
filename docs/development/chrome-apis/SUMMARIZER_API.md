# Summarizer API - Complete Reference

**Official Documentation**: https://developer.chrome.com/docs/ai/summarizer-api

## Quick Reference

Summarize text content using Chrome's built-in Summarizer API powered by Gemini Nano.

### Basic Usage

```typescript
// Feature detection
if ('Summarizer' in self) {
  // Summarizer API is supported
}

// Check availability
const status = await Summarizer.availability();

// Create summarizer
const summarizer = await Summarizer.create({
  type: 'key-points',
  format: 'markdown',
  length: 'medium',
});

// Summarize text
const summary = await summarizer.summarize(longText);
console.log(summary);

// Clean up
summarizer.destroy();
```

### Summary Types

| Type         | Purpose                | Output Format    |
| ------------ | ---------------------- | ---------------- |
| `tldr`       | Quick overview         | Sentences        |
| `key-points` | Bulleted list          | Markdown bullets |
| `teaser`     | Most interesting parts | Sentences        |
| `headline`   | Article headline       | Short phrase     |

### Length Options

| Length   | tldr/teaser | key-points | headline |
| -------- | ----------- | ---------- | -------- |
| `short`  | 1 sentence  | 3 bullets  | 12 words |
| `medium` | 3 sentences | 5 bullets  | 17 words |
| `long`   | 5 sentences | 7 bullets  | 22 words |

---

## Complete Guide

### Overview

The Chrome Summarizer API helps create concise summaries of text content. It's powered by Gemini Nano and runs entirely on-device for privacy.

### Key Features

- **Multiple Summary Types**: TL;DR, key points, teaser, headline
- **Length Control**: Short, medium, or long summaries
- **Format Control**: Markdown or plain text output
- **Context Support**: Provide shared context for better summaries
- **Streaming Support**: Progressive summarization for long texts
- **Language Support**: Specify expected input/output languages

### API Structure

#### Summarizer Factory

The Summarizer API is accessed via the global `Summarizer` object:

```typescript
// Feature detection
if ('Summarizer' in self) {
  // Summarizer API is supported
}

// Check availability
const availability = await Summarizer.availability();
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'

// Create a summarizer
const summarizer = await Summarizer.create(options);
```

#### Summarizer Session

Once created, a summarizer can summarize multiple texts:

```typescript
// Non-streaming summarization
const summary = await summarizer.summarize(text, { context });

// Streaming summarization
const stream = summarizer.summarizeStreaming(text, { context });
for await (const chunk of stream) {
  console.log(chunk);
}

// Clean up
summarizer.destroy();
```

### Full Configuration Options

```typescript
interface SummarizerCreateOptions {
  // Shared context for all summarizations
  sharedContext?: string;

  // Summary type
  type?: 'tldr' | 'key-points' | 'teaser' | 'headline'; // default: 'tldr'

  // Output format
  format?: 'markdown' | 'plain-text'; // default: 'markdown'

  // Summary length
  length?: 'short' | 'medium' | 'long'; // default: 'medium'

  // Expected input languages (ISO 639-1 codes)
  expectedInputLanguages?: string[]; // e.g., ['en', 'es', 'ja']

  // Expected context languages
  expectedContextLanguages?: string[];

  // Output language
  outputLanguage?: string; // e.g., 'en'

  // Monitor download progress
  monitor?: (monitor: {
    addEventListener: (
      event: string,
      callback: (e: { loaded: number; total: number }) => void
    ) => void;
  }) => void;

  // Abort signal
  signal?: AbortSignal;
}
```

---

## Usage Examples

### TL;DR Summary

```typescript
const summarizer = await Summarizer.create({
  type: 'tldr',
  length: 'short',
});

const summary = await summarizer.summarize(longArticle);
console.log(summary);
// "This article discusses the benefits of mindful reading and how it improves focus."

summarizer.destroy();
```

### Key Points Summary

```typescript
const summarizer = await Summarizer.create({
  type: 'key-points',
  format: 'markdown',
  length: 'medium',
});

const summary = await summarizer.summarize(longArticle);
console.log(summary);
// - Mindful reading improves focus and comprehension
// - Taking breaks enhances retention
// - Reflection deepens understanding
// - Regular practice builds better habits
// - Digital distractions reduce effectiveness

summarizer.destroy();
```

### Headline Generation

```typescript
const summarizer = await Summarizer.create({
  type: 'headline',
  length: 'medium',
});

const headline = await summarizer.summarize(article);
console.log(headline);
// "How Mindful Reading Transforms Your Learning Experience"

summarizer.destroy();
```

### Teaser Summary

```typescript
const summarizer = await Summarizer.create({
  type: 'teaser',
  length: 'long',
});

const teaser = await summarizer.summarize(article);
console.log(teaser);
// "Discover how mindful reading can transform your learning. Learn practical techniques
// to improve focus and retention. Find out why reflection is key to deeper understanding."

summarizer.destroy();
```

### With Context

```typescript
const summarizer = await Summarizer.create({
  type: 'key-points',
  sharedContext: 'These are scientific articles for a general audience',
});

const summary = await summarizer.summarize(article, {
  context: 'This article is about neuroscience research',
});

summarizer.destroy();
```

### Streaming Summarization

```typescript
const summarizer = await Summarizer.create({
  type: 'tldr',
  length: 'long',
});

const stream = summarizer.summarizeStreaming(veryLongArticle);

let fullSummary = '';
for await (const chunk of stream) {
  fullSummary += chunk;
  updateUI(fullSummary); // Progressive update
}

summarizer.destroy();
```

### Multiple Summaries (Session Reuse)

```typescript
const summarizer = await Summarizer.create({
  type: 'key-points',
  length: 'short',
});

const articles = [article1, article2, article3];

const summaries = await Promise.all(
  articles.map((article) => summarizer.summarize(article))
);

summaries.forEach((summary, i) => {
  console.log(`Article ${i + 1}:`);
  console.log(summary);
});

summarizer.destroy();
```

### With Language Support

```typescript
const summarizer = await Summarizer.create({
  type: 'tldr',
  expectedInputLanguages: ['en', 'es', 'fr'],
  outputLanguage: 'en',
  sharedContext: 'Multilingual news articles',
});

const englishSummary = await summarizer.summarize(englishArticle);
const spanishSummary = await summarizer.summarize(spanishArticle);
const frenchSummary = await summarizer.summarize(frenchArticle);

summarizer.destroy();
```

### With Abort Signal

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 10000);

try {
  const summarizer = await Summarizer.create({
    type: 'key-points',
    signal: controller.signal,
  });

  const summary = await summarizer.summarize(text, {
    signal: controller.signal,
  });

  console.log(summary);
  summarizer.destroy();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Summarization cancelled');
  }
}
```

---

## Reflexa AI Integration

### Use Case: Article Summarization

```typescript
async function summarizeArticle(content: string, type: 'quick' | 'detailed') {
  const summarizer = await Summarizer.create({
    type: type === 'quick' ? 'tldr' : 'key-points',
    length: type === 'quick' ? 'short' : 'medium',
    format: 'markdown',
    sharedContext: 'Web articles for mindful reading',
  });

  const summary = await summarizer.summarize(content);
  summarizer.destroy();

  return summary;
}
```

### Use Case: Progressive Summarization

```typescript
async function summarizeWithProgress(
  content: string,
  onProgress: (partial: string) => void
) {
  const summarizer = await Summarizer.create({
    type: 'key-points',
    length: 'medium',
  });

  const stream = summarizer.summarizeStreaming(content);

  let fullSummary = '';
  for await (const chunk of stream) {
    fullSummary += chunk;
    onProgress(fullSummary);
  }

  summarizer.destroy();
  return fullSummary;
}
```

---

## Best Practices

### 1. Check Availability First

```typescript
const availability = await Summarizer.availability();

if (availability === 'unavailable') {
  // Fall back to manual summarization
  return;
}

if (availability === 'downloadable') {
  // Inform user that model needs to be downloaded
  showDownloadNotice();
}
```

### 2. Choose Appropriate Type and Length

```typescript
// For quick overview
const quickSummarizer = await Summarizer.create({
  type: 'tldr',
  length: 'short',
});

// For detailed analysis
const detailedSummarizer = await Summarizer.create({
  type: 'key-points',
  length: 'long',
});

// For social media
const teaserSummarizer = await Summarizer.create({
  type: 'teaser',
  length: 'medium',
});
```

### 3. Reuse Summarizer Sessions

```typescript
// ✅ GOOD - Create once, use multiple times
const summarizer = await Summarizer.create({
  type: 'key-points',
});

const summary1 = await summarizer.summarize(article1);
const summary2 = await summarizer.summarize(article2);
const summary3 = await summarizer.summarize(article3);

summarizer.destroy();
```

### 4. Use Streaming for Long Content

```typescript
// For better UX with long articles
if (content.length > 5000) {
  const stream = summarizer.summarizeStreaming(content);
  for await (const chunk of stream) {
    updateUI(chunk);
  }
} else {
  const summary = await summarizer.summarize(content);
  updateUI(summary);
}
```

### 5. Provide Context for Better Results

```typescript
const summarizer = await Summarizer.create({
  type: 'key-points',
  sharedContext: 'Technical articles for developers',
});

const summary = await summarizer.summarize(article, {
  context: 'This article is about React performance optimization',
});
```

---

## Troubleshooting

### Summarizer API Not Available

**Symptoms**: `typeof Summarizer === 'undefined'`

**Solutions**:

1. Check Chrome version (138+)
2. Enable flag: `chrome://flags/#summarizer-api`
3. Ensure sufficient storage (22GB free)
4. Restart Chrome completely

### Poor Summary Quality

**Symptoms**: Summary doesn't capture key points

**Solutions**:

1. Provide more context via `sharedContext` or `context`
2. Try different summary types
3. Adjust length setting
4. Ensure input text is well-structured

### Slow Summarization

**Symptoms**: Takes too long to summarize

**Solutions**:

1. Use streaming for better UX
2. Show loading indicators
3. Check system resources
4. Consider shorter length setting

---

## Important Notes

### Browser Support

- Chrome 138+ stable
- Not available in Web Workers
- Requires user activation for session creation
- Desktop only (Windows 10+, macOS 13+, Linux, ChromeOS)

### Sequential Processing

Summarizations are processed sequentially. For best performance:

- Batch similar summarizations together
- Add loading indicators
- Consider using streaming for long texts

---

## System Requirements

- **Chrome**: Version 138+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free space
- **GPU**: >4GB VRAM OR CPU: 16GB RAM + 4 cores
- **Network**: Unmetered connection for model download

## Chrome Flags

Enable in `chrome://flags`:

- `#summarizer-api` → **Enabled**
- `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Then restart Chrome completely.

---

## Resources

- [Official Summarizer API Documentation](https://developer.chrome.com/docs/ai/summarizer-api)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Gemini Nano Model Information](https://deepmind.google/technologies/gemini/nano/)

## Related APIs

- **Writer API**: For generating new content
- **Rewriter API**: For improving existing text
- **Prompt API**: For general-purpose AI interactions

---

**Last Updated**: October 30, 2025
**API Version**: Chrome 138+
**Status**: Origin Trial
