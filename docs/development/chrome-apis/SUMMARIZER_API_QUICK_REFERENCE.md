# Summarizer API Quick Reference

## API Access Pattern

```typescript
// ✅ CORRECT - Summarizer is a global
if ('Summarizer' in self) {
  const availability = await Summarizer.availability();
  const summarizer = await Summarizer.create(options);
}

// ❌ WRONG - Not under ai namespace
if (ai?.summarizer) {
  const summarizer = await ai.summarizer.create(options);
}
```

## Type Values

```typescript
// ✅ CORRECT
type: 'tldr' | 'key-points' | 'teaser' | 'headline';

// ❌ WRONG
type: 'tl;dr'; // No semicolon!
```

## Create Options

```typescript
const summarizer = await Summarizer.create({
  sharedContext: 'This is a scientific article',
  type: 'key-points', // 'tldr' | 'key-points' | 'teaser' | 'headline'
  format: 'markdown', // 'markdown' | 'plain-text'
  length: 'medium', // 'short' | 'medium' | 'long'

  // Language support
  expectedInputLanguages: ['en', 'ja', 'es'],
  outputLanguage: 'es',
  expectedContextLanguages: ['en'],

  // Download progress
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },

  signal: abortController.signal,
});
```

## Summary Types & Lengths

| Type         | Purpose                | Short      | Medium      | Long        |
| ------------ | ---------------------- | ---------- | ----------- | ----------- |
| `tldr`       | Quick overview         | 1 sentence | 3 sentences | 5 sentences |
| `teaser`     | Most interesting parts | 1 sentence | 3 sentences | 5 sentences |
| `key-points` | Bulleted list          | 3 bullets  | 5 bullets   | 7 bullets   |
| `headline`   | Article headline       | 12 words   | 17 words    | 22 words    |

## Batch Summarization

```typescript
const summary = await summarizer.summarize(text, {
  context: 'This article is intended for a tech-savvy audience.',
});
```

## Streaming Summarization

```typescript
const stream = summarizer.summarizeStreaming(text, {
  context: 'This article is intended for junior developers.',
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

## Session Management

```typescript
// Destroy when done
summarizer.destroy();
```

## Browser Support

- Chrome 138+ stable
- Not available in Web Workers
- Requires user activation for session creation
- Desktop only (Windows 10+, macOS 13+, Linux, ChromeOS)

## Hardware Requirements

- Storage: 22 GB free space
- GPU: >4 GB VRAM OR
- CPU: 16 GB RAM + 4 cores
- Network: Unmetered connection for download
