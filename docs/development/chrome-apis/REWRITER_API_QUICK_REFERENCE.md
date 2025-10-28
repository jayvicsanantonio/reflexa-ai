# Rewriter API Quick Reference

## One-Liner

Revise and restructure existing text with tone and length control using Chrome's built-in Rewriter API.

## Basic Usage

```typescript
// Feature detection
if ('Rewriter' in self) {
  // Rewriter API is supported
}

// Check availability
const available = await Rewriter.availability();

// Create session
const rewriter = await Rewriter.create({
  tone: 'more-formal',
  format: 'plain-text',
  length: 'as-is',
});

// Rewrite text
const result = await rewriter.rewrite('hey whats up');

// Clean up
rewriter.destroy();
```

## Configuration Options

### Tone

| Value         | Description                           |
| ------------- | ------------------------------------- |
| `as-is`       | Keep original tone (default)          |
| `more-formal` | Make more professional and structured |
| `more-casual` | Make more conversational and relaxed  |

### Format

| Value        | Description                    |
| ------------ | ------------------------------ |
| `as-is`      | Keep original format (default) |
| `markdown`   | Output as markdown             |
| `plain-text` | Output as plain text           |

### Length

| Value     | Description                       |
| --------- | --------------------------------- |
| `as-is`   | Keep original length (default)    |
| `shorter` | Condense while preserving meaning |
| `longer`  | Expand with more detail           |

## Reflexa AI Tone Mapping

| Reflexa Tone | Rewriter API Configuration         |
| ------------ | ---------------------------------- |
| `calm`       | `tone: 'as-is'`                    |
| `concise`    | `tone: 'as-is', length: 'shorter'` |
| `empathetic` | `tone: 'more-casual'`              |
| `academic`   | `tone: 'more-formal'`              |

## Common Patterns

### With Context

```typescript
const rewriter = await Rewriter.create({
  sharedContext: 'Rewriting customer feedback',
  tone: 'more-casual',
});

const result = await rewriter.rewrite('This product is subpar', {
  context: 'Make it constructive and friendly',
});
```

### Streaming

```typescript
const stream = rewriter.rewriteStreaming('Long text to rewrite', {
  context: 'Make it more professional',
});

for await (const chunk of stream) {
  updateUI(chunk);
}
```

### Multiple Rewrites

```typescript
const rewriter = await Rewriter.create({ tone: 'more-formal' });

const text1 = await rewriter.rewrite('hey thanks!');
const text2 = await rewriter.rewrite('no problem dude');
const text3 = await rewriter.rewrite('catch ya later');

rewriter.destroy();
```

### Make Text Shorter

```typescript
const rewriter = await Rewriter.create({
  tone: 'as-is',
  length: 'shorter',
});

const condensed = await rewriter.rewrite(
  'This is a very long paragraph with lots of details...'
);
```

### Make Text More Formal

```typescript
const rewriter = await Rewriter.create({
  tone: 'more-formal',
});

const formal = await rewriter.rewrite('hey can u help me with this thing?');
// Result: "Could you please assist me with this matter?"
```

### With Timeout

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const rewriter = await Rewriter.create({
  tone: 'more-casual',
  signal: controller.signal,
});

const result = await rewriter.rewrite('Text', {
  signal: controller.signal,
});
```

## RewriterManager (Reflexa AI)

```typescript
import { RewriterManager } from './background/rewriterManager';

const manager = new RewriterManager();

// Check availability
await manager.checkAvailability();

// Rewrite with Reflexa options
const { original, rewritten } = await manager.rewrite(
  'This article was really cool',
  'academic', // Maps to 'more-formal'
  'Context about the article'
);

// Streaming
await manager.rewriteStreaming(
  'Long text to rewrite',
  'empathetic', // Maps to 'more-casual'
  'Context',
  (chunk) => console.log(chunk)
);

// Clean up
manager.destroy();
```

## Error Handling

```typescript
try {
  const rewriter = await Rewriter.create({ tone: 'more-formal' });
  const result = await rewriter.rewrite('Text to rewrite');
  rewriter.destroy();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled');
  } else if (error.message.includes('unavailable')) {
    console.log('Rewriter API not available');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Availability States

| State          | Meaning                              | Action                      |
| -------------- | ------------------------------------ | --------------------------- |
| `available`    | Ready to use immediately             | Create session              |
| `downloadable` | Model needs to be downloaded         | Inform user, trigger create |
| `downloading`  | Model is currently downloading       | Show progress, wait         |
| `unavailable`  | Not supported on this system/browser | Fall back to alternatives   |

## Chrome Flags

Enable in `chrome://flags`:

- `#rewriter-api-for-gemini-nano`
- `#optimization-guide-on-device-model`

## System Requirements

- **Chrome**: 137+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free
- **GPU**: >4GB VRAM OR
- **CPU**: 16GB RAM + 4 cores

## Troubleshooting

| Issue                  | Solution                                      |
| ---------------------- | --------------------------------------------- |
| API not available      | Check Chrome version, enable flags            |
| Slow rewriting         | Use shorter length, reduce context            |
| Tone not applied       | Add more specific context, try different tone |
| Session creation fails | Check language codes, verify requirements     |

## Best Practices

1. ✅ Check availability before use
2. ✅ Reuse sessions for same configuration
3. ✅ Use shared context for related tasks
4. ✅ Clean up with `destroy()` when done
5. ✅ Handle timeouts gracefully
6. ✅ Use streaming for long content

## Use Cases

- **Email refinement**: Make casual emails more professional
- **Content moderation**: Rewrite toxic comments constructively
- **Accessibility**: Simplify complex text
- **Tone adjustment**: Match text to audience expectations
- **Length optimization**: Condense or expand content

## Comparison with Writer API

| Aspect   | Writer API         | Rewriter API     |
| -------- | ------------------ | ---------------- |
| Purpose  | Create new content | Improve existing |
| Input    | Prompt/topic       | Existing text    |
| Output   | Generated text     | Revised text     |
| Use Case | Draft creation     | Text refinement  |

## Resources

- [Full Guide](./REWRITER_API_GUIDE.md)
- [Official Docs](https://developer.chrome.com/docs/ai/rewriter-api)
- [Integration Review](./REWRITER_API_INTEGRATION_REVIEW.md)

---

**Quick Tip**: The Rewriter API is perfect for improving existing text. For generating new content from scratch, use the Writer API instead.
