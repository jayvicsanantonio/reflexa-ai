# Writer API Quick Reference

## One-Liner

Generate new content with tone and length control using Chrome's built-in Writer API.

## Basic Usage

```typescript
// Feature detection
if ('Writer' in self) {
  // Writer API is supported
}

// Check availability
const available = await Writer.availability();

// Create session
const writer = await Writer.create({
  tone: 'neutral',
  format: 'markdown',
  length: 'medium',
});

// Generate text
const result = await writer.write('Write about mindfulness');

// Clean up
writer.destroy();
```

## Configuration Options

### Tone

| Value     | Description                    |
| --------- | ------------------------------ |
| `formal`  | Professional, structured style |
| `neutral` | Balanced, standard style       |
| `casual`  | Conversational, relaxed style  |

### Format

| Value        | Description                  |
| ------------ | ---------------------------- |
| `markdown`   | Markdown formatting (default |
| `plain-text` | Plain text, no formatting    |

### Length

| Value    | Approximate Words |
| -------- | ----------------- |
| `short`  | 50-100            |
| `medium` | 100-200           |
| `long`   | 200-300           |

## Reflexa AI Tone Mapping

| Reflexa Tone   | Writer API Tone |
| -------------- | --------------- |
| `calm`         | `neutral`       |
| `professional` | `formal`        |
| `casual`       | `casual`        |

## Common Patterns

### With Context

```typescript
const writer = await Writer.create({
  sharedContext: 'Writing reflective journal entries',
  tone: 'neutral',
});

const entry = await writer.write('Reflect on today', {
  context: 'User read an article about mindfulness',
});
```

### Streaming

```typescript
const stream = writer.writeStreaming('Write a story', {
  context: 'About a developer learning AI',
});

for await (const chunk of stream) {
  updateUI(chunk);
}
```

### Multiple Generations

```typescript
const writer = await Writer.create({ tone: 'casual' });

const post1 = await writer.write('Topic 1');
const post2 = await writer.write('Topic 2');
const post3 = await writer.write('Topic 3');

writer.destroy();
```

### With Timeout

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const writer = await Writer.create({
  tone: 'neutral',
  signal: controller.signal,
});

const result = await writer.write('Write something', {
  signal: controller.signal,
});
```

## WriterManager (Reflexa AI)

```typescript
import { WriterManager } from './background/writerManager';

const manager = new WriterManager();

// Check availability
await manager.checkAvailability();

// Generate with Reflexa options
const draft = await manager.generate(
  'Write about reading benefits',
  {
    tone: 'calm', // Maps to 'neutral'
    length: 'medium',
  },
  'Context about the article'
);

// Streaming
await manager.generateStreaming(
  'Write motivational message',
  { tone: 'professional', length: 'short' },
  undefined,
  (chunk) => console.log(chunk)
);

// Clean up
manager.destroy();
```

## Error Handling

```typescript
try {
  const writer = await Writer.create({ tone: 'neutral' });
  const result = await writer.write('Write something');
  writer.destroy();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled');
  } else if (error.message.includes('unavailable')) {
    console.log('Writer API not available');
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

- `#writer-api-for-gemini-nano`
- `#optimization-guide-on-device-model`

## System Requirements

- **Chrome**: 137+
- **OS**: Windows 10/11, macOS 13+, Linux, ChromeOS
- **Storage**: 22GB free
- **GPU**: >4GB VRAM OR
- **CPU**: 16GB RAM + 4 cores

## Troubleshooting

| Issue                  | Solution                                  |
| ---------------------- | ----------------------------------------- |
| API not available      | Check Chrome version, enable flags        |
| Slow generation        | Use shorter length, reduce context        |
| Inconsistent output    | Add more specific prompts, use context    |
| Session creation fails | Check language codes, verify requirements |

## Best Practices

1. ✅ Check availability before use
2. ✅ Reuse sessions for same configuration
3. ✅ Use shared context for related tasks
4. ✅ Clean up with `destroy()` when done
5. ✅ Handle timeouts gracefully
6. ✅ Use streaming for long content

## Resources

- [Full Guide](./WRITER_API_GUIDE.md)
- [Official Docs](https://developer.chrome.com/docs/ai/writer-api)
- [API Reference](../API_REFERENCE.md#writermanager)

---

**Quick Tip**: The Writer API is perfect for generating first drafts, creative content, and reflective writing. For improving existing text, use the Rewriter API instead.
