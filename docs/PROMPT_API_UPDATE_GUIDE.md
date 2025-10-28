# Prompt API Update Guide

## Overview

This document analyzes the official Chrome Prompt API documentation and compares it with Reflexa AI's current implementation. It provides actionable recommendations for updating the codebase to align with the latest API features and best practices.

**Documentation Source**: https://developer.chrome.com/docs/ai/prompt-api
**Last Updated**: September 21, 2025
**Current Implementation**: Reflexa AI Chrome Extension v1.0

---

## Table of Contents

1. [Key Findings](#key-findings)
2. [New Features Available](#new-features-available)
3. [Current Implementation Analysis](#current-implementation-analysis)
4. [Recommended Updates](#recommended-updates)
5. [Implementation Examples](#implementation-examples)
6. [Migration Checklist](#migration-checklist)

---

## Key Findings

### ✅ What We're Already Doing Right

1. **Correct API Access**: Using global `ai` object properly
2. **Availability Checking**: Calling `availability()` before use
3. **Session Management**: 5-minute TTL with recreation
4. **Timeout Handling**: 4-second timeout with retry logic
5. **Download Monitoring**: Tracking model download progress
6. **Cleanup**: Properly calling `destroy()` on sessions
7. **Streaming Support**: Implementing `promptStreaming()`

### ⚠️ Missing Features We Should Add

1. **Multimodal Capabilities**: Image and audio input support
2. **Expected Input/Output Configuration**: Language and modality specification
3. **Message Appending**: `append()` method for contextual prompts
4. **Response Constraints**: JSON Schema for structured output
5. **Response Prefix**: Constraining responses with prefixes
6. **Session Cloning**: Already implemented but could be used more
7. **Input Usage Tracking**: `inputUsage` and `inputQuota` properties
8. **Abort Signal on Clone**: Already supported but not documented

### ❌ Deprecated/Incorrect Patterns

1. **Origin Trial Permissions**: Should be removed from manifest
2. **System Prompt Approach**: Already fixed to use `initialPrompts`

---

## New Features Available

### 1. Multimodal Capabilities (Origin Trial)

**Status**: Available in origin trial for web and Chrome Extensions (not yet in Stable)

**What it enables**:

- Accept image input for summarization
- Accept audio input for transcription
- Describe images for alt text generation
- Transcribe audio messages

**API Usage**:

```typescript
const session = await LanguageModel.create({
  expectedInputs: [
    {
      type: 'text',
      languages: ['en'], // system prompt language
    },
    {
      type: 'image', // accept images
    },
    {
      type: 'audio', // accept audio
    },
  ],
  expectedOutputs: [
    {
      type: 'text',
      languages: ['en'],
    },
  ],
});

// Prompt with image
const result = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Describe this image' },
      { type: 'image', value: imageFile },
    ],
  },
]);
```

**Recommendation**:

- **Priority**: Medium (wait for Stable release)
- **Use Case**: Allow users to reflect on images/videos they encounter
- **Implementation**: Add image/audio upload to Reflect Mode overlay

---

### 2. Expected Input/Output Configuration

**Status**: Available now

**What it enables**:

- Specify expected input languages (system prompt + user prompt)
- Specify expected output languages
- Declare expected modalities
- Get early validation errors

**API Usage**:

```typescript
const session = await LanguageModel.create({
  expectedInputs: [
    {
      type: 'text',
      languages: ['en', 'ja'], // English system, Japanese user input
    },
  ],
  expectedOutputs: [
    {
      type: 'text',
      languages: ['ja'], // Japanese output
    },
  ],
});
```

**Recommendation**:

- **Priority**: High
- **Use Case**: Better error handling and validation
- **Implementation**: Add to `initializeModel()` method

---

### 3. Message Appending with `append()`

**Status**: Available now

**What it enables**:

- Pre-populate session with context before user prompt
- Send predetermined prompts in advance
- Give model a head start on processing
- Add context after session creation

**API Usage**:

```typescript
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You are a skilled analyst.' }],
  expectedInputs: [{ type: 'image' }],
});

// Append context as images are uploaded
fileUpload.onchange = async () => {
  await session.append([
    {
      role: 'user',
      content: [
        { type: 'text', value: `Here's one image. Notes: ${notes}` },
        { type: 'image', value: fileUpload.files[0] },
      ],
    },
  ]);
};

// Later, prompt with question
const result = await session.prompt('What patterns do you see?');
```

**Recommendation**:

- **Priority**: Medium
- **Use Case**: Build context incrementally as user scrolls
- **Implementation**: Append article sections as user reads

---

### 4. Response Constraints (JSON Schema)

**Status**: Available now

**What it enables**:

- Structured output with JSON Schema
- Guarantee response format
- Type-safe parsing
- Reduce parsing errors

**API Usage**:

```typescript
const schema = {
  type: 'object',
  properties: {
    insight: { type: 'string' },
    surprise: { type: 'string' },
    apply: { type: 'string' },
  },
  required: ['insight', 'surprise', 'apply'],
};

const result = await session.prompt(`Summarize this article: ${content}`, {
  responseConstraint: schema,
});

const summary = JSON.parse(result);
// { insight: "...", surprise: "...", apply: "..." }
```

**Recommendation**:

- **Priority**: High
- **Use Case**: Eliminate parsing errors in summary/reflection generation
- **Implementation**: Replace regex parsing with JSON Schema

---

### 5. Response Prefix

**Status**: Available now

**What it enables**:

- Constrain response format
- Guide model to specific output
- Ensure consistent formatting

**API Usage**:

````typescript
const result = await session.prompt([
  {
    role: 'user',
    content: 'Create a TOML character sheet for a gnome barbarian',
  },
  {
    role: 'assistant',
    content: '```toml\n',
    prefix: true, // This is a prefix, not a full response
  },
]);
// Model will continue from "```toml\n"
````

**Recommendation**:

- **Priority**: Low
- **Use Case**: Ensure markdown formatting in responses
- **Implementation**: Use for code examples or structured formats

---

### 6. Input Usage Tracking

**Status**: Available now

**What it enables**:

- Monitor token usage
- Prevent context window overflow
- Warn users before hitting limits
- Optimize prompt length

**API Usage**:

```typescript
console.log(`${session.inputUsage}/${session.inputQuota}`);

// Check before prompting
if (session.inputUsage > session.inputQuota * 0.9) {
  console.warn('Context window nearly full');
  // Clone session to reset context
  session = await session.clone();
}
```

**Recommendation**:

- **Priority**: High
- **Use Case**: Prevent errors from context overflow
- **Implementation**: Add usage tracking to AIManager

---

### 7. Permission Policy for iframes

**Status**: Available now

**What it enables**:

- Allow cross-origin iframes to use Prompt API
- Delegate AI access to embedded content

**API Usage**:

```html
<iframe src="https://cross-origin.example.com/" allow="language-model"></iframe>
```

**Recommendation**:

- **Priority**: Low (not applicable to extension)
- **Use Case**: N/A for Chrome Extension
- **Implementation**: None needed

---

## Current Implementation Analysis

### AIManager Class Review

#### ✅ Strengths

1. **Robust Error Handling**: Timeout, retry, and fallback logic
2. **Session Management**: TTL-based recreation
3. **Validation**: Response parsing with fallbacks
4. **Streaming Support**: AsyncGenerator implementation
5. **Type Safety**: Comprehensive TypeScript types

#### ⚠️ Areas for Improvement

1. **No Input/Output Configuration**: Missing `expectedInputs`/`expectedOutputs`
2. **No Usage Tracking**: Not monitoring `inputUsage`/`inputQuota`
3. **Fragile Parsing**: Regex-based instead of JSON Schema
4. **No Append Support**: Can't build context incrementally
5. **Limited Language Support**: Only English prompts
6. **No Multimodal Support**: Text-only

---

## Recommended Updates

### Priority 1: High Impact, Low Effort

#### 1.1 Add JSON Schema for Structured Output

**Current Code**:

```typescript
// Fragile regex parsing
private parseSummaryResponse(response: string): string[] {
  const lines = response.split('\n').filter(line => line.trim());
  const insightMatch = lines.find(line =>
    line.toLowerCase().includes('insight:')
  );
  // ... more regex parsing
}
```

**Updated Code**:

```typescript
async summarize(content: string): Promise<string[]> {
  const schema = {
    type: 'object',
    properties: {
      insight: {
        type: 'string',
        maxLength: 150 // ~20 words
      },
      surprise: {
        type: 'string',
        maxLength: 150
      },
      apply: {
        type: 'string',
        maxLength: 150
      }
    },
    required: ['insight', 'surprise', 'apply']
  };

  const prompt = `Summarize the following article into exactly 3 bullets:

Article:
${processedContent}

Respond with a JSON object with keys: insight, surprise, apply`;

  const result = await this.callWithTimeout(prompt, 1, {
    responseConstraint: schema
  });

  if (!result) return [];

  try {
    const parsed = JSON.parse(result);
    return [
      parsed.insight,
      parsed.surprise,
      parsed.apply
    ];
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    return this.fallbackParseSummary(result);
  }
}
```

**Benefits**:

- Eliminates parsing errors
- Guaranteed response format
- Type-safe output
- Simpler code

---

#### 1.2 Add Input Usage Tracking

**New Code**:

```typescript
class AIManager {
  // Add to class
  private readonly USAGE_WARNING_THRESHOLD = 0.8; // 80%

  /**
   * Check if session is near context limit
   */
  private checkUsage(): boolean {
    if (!this.model) return false;

    const usage = this.model.inputUsage;
    const quota = this.model.inputQuota;
    const percentUsed = usage / quota;

    if (percentUsed > this.USAGE_WARNING_THRESHOLD) {
      console.warn(
        `Context window ${(percentUsed * 100).toFixed(1)}% full ` +
          `(${usage}/${quota} tokens)`
      );
      return true;
    }

    return false;
  }

  /**
   * Ensure model is initialized and has capacity
   */
  private async ensureModel(): Promise<boolean> {
    // ... existing code ...

    // Check usage and clone if needed
    if (this.checkUsage()) {
      console.log('Context window nearly full, cloning session...');
      const cloned = await this.model.clone();
      this.model.destroy();
      this.model = cloned;
      this.modelCreatedAt = Date.now();
    }

    return true;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): { usage: number; quota: number; percent: number } | null {
    if (!this.model) return null;

    const usage = this.model.inputUsage;
    const quota = this.model.inputQuota;

    return {
      usage,
      quota,
      percent: (usage / quota) * 100,
    };
  }
}
```

**Benefits**:

- Prevents context overflow errors
- Automatic session cloning when needed
- Usage visibility for debugging

---

#### 1.3 Add Expected Input/Output Configuration

**Updated Code**:

```typescript
private async initializeModel(systemPrompt?: string): Promise<boolean> {
  try {
    if (typeof LanguageModel === 'undefined') {
      return false;
    }

    const params = await LanguageModel.params();

    const options: Parameters<AILanguageModelFactory['create']>[0] = {
      temperature: params.defaultTemperature,
      topK: params.defaultTopK,
      // ✅ Add expected inputs/outputs
      expectedInputs: [
        {
          type: 'text',
          languages: ['en'] // System and user prompts in English
        }
      ],
      expectedOutputs: [
        {
          type: 'text',
          languages: ['en'] // Responses in English
        }
      ]
    };

    if (systemPrompt) {
      options.initialPrompts = [
        { role: 'system', content: systemPrompt }
      ];
    }

    options.monitor = (m: AIDownloadProgressMonitor) => {
      m.addEventListener('downloadprogress', (e) => {
        console.log(
          `AI model download progress: ${(e.loaded * 100).toFixed(1)}%`
        );
      });
    };

    this.model = await LanguageModel.create(options);
    this.modelCreatedAt = Date.now();
    return true;
  } catch (error) {
    // Handle NotSupportedError for unsupported languages/modalities
    if (error instanceof DOMException && error.name === 'NotSupportedError') {
      console.error('Unsupported input/output configuration:', error);
    } else {
      console.error('Error initializing AI model:', error);
    }
    return false;
  }
}
```

**Benefits**:

- Early validation of language support
- Better error messages
- Future-proof for multilingual support

---

### Priority 2: Medium Impact, Medium Effort

#### 2.1 Add `append()` Method for Incremental Context

**New Code**:

```typescript
class AIManager {
  /**
   * Append context to current session
   * Useful for building context incrementally
   */
  async appendContext(
    content: string,
    role: 'user' | 'assistant' = 'user'
  ): Promise<boolean> {
    try {
      if (!this.model) {
        const initialized = await this.ensureModel();
        if (!initialized) return false;
      }

      await this.model.append([
        {
          role,
          content,
        },
      ]);

      return true;
    } catch (error) {
      console.error('Error appending context:', error);
      return false;
    }
  }

  /**
   * Append multiple messages to session
   */
  async appendMessages(
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>
  ): Promise<boolean> {
    try {
      if (!this.model) {
        const initialized = await this.ensureModel();
        if (!initialized) return false;
      }

      await this.model.append(messages);
      return true;
    } catch (error) {
      console.error('Error appending messages:', error);
      return false;
    }
  }
}
```

**Use Case**:

```typescript
// In content script, as user scrolls
const aiManager = new AIManager();

// Append article sections as user reads
dwellTracker.onScroll(async (section) => {
  await aiManager.appendContext(
    `User read section: ${section.title}\n${section.text}`
  );
});

// When threshold reached, model already has context
dwellTracker.onThresholdReached(async () => {
  // Prompt is faster because context is pre-loaded
  const summary = await aiManager.summarize('Summarize what I read');
});
```

**Benefits**:

- Faster response times
- Better context awareness
- Incremental processing

---

#### 2.2 Update Type Definitions

**Add to `aiManager.ts`**:

```typescript
interface AILanguageModel {
  prompt(
    input: string | PromptMessage[],
    options?: PromptOptions
  ): Promise<string>;
  promptStreaming(input: string | PromptMessage[]): ReadableStream;
  destroy(): void;
  clone(options?: { signal?: AbortSignal }): Promise<AILanguageModel>;
  append(messages: PromptMessage[]): Promise<void>; // ✅ Add
  readonly inputUsage: number; // ✅ Add
  readonly inputQuota: number; // ✅ Add
}

interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MultimodalContent[];
  prefix?: boolean; // ✅ Add for response prefixing
}

interface MultimodalContent {
  type: 'text' | 'image' | 'audio';
  value: string | File | Blob;
}

interface PromptOptions {
  signal?: AbortSignal;
  responseConstraint?: JSONSchema; // ✅ Add
  omitResponseConstraintInput?: boolean; // ✅ Add
}

interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

interface ExpectedInput {
  type: 'text' | 'image' | 'audio';
  languages?: string[]; // 'en', 'ja', 'es'
}

interface ExpectedOutput {
  type: 'text';
  languages?: string[];
}

interface AILanguageModelFactory {
  create(options?: {
    temperature?: number;
    topK?: number;
    initialPrompts?: PromptMessage[];
    signal?: AbortSignal;
    monitor?: (monitor: AIDownloadProgressMonitor) => void;
    expectedInputs?: ExpectedInput[]; // ✅ Add
    expectedOutputs?: ExpectedOutput[]; // ✅ Add
  }): Promise<AILanguageModel>;

  availability(): Promise<
    'available' | 'downloadable' | 'downloading' | 'unavailable'
  >;

  params(): Promise<{
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }>;
}
```

---

### Priority 3: Low Impact, High Effort

#### 3.1 Add Multimodal Support (Future)

**Wait for**: Stable release (currently in origin trial)

**Implementation Plan**:

1. Add image upload to Reflect Mode overlay
2. Update `expectedInputs` to include `{ type: 'image' }`
3. Modify prompts to accept multimodal content
4. Update UI to show image previews

**Example**:

```typescript
async summarizeWithImage(
  text: string,
  image: File
): Promise<string[]> {
  const schema = {
    type: 'object',
    properties: {
      insight: { type: 'string' },
      surprise: { type: 'string' },
      apply: { type: 'string' }
    },
    required: ['insight', 'surprise', 'apply']
  };

  const result = await this.model!.prompt(
    [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            value: `Summarize this article and image:\n\n${text}`
          },
          {
            type: 'image',
            value: image
          }
        ]
      }
    ],
    { responseConstraint: schema }
  );

  const parsed = JSON.parse(result);
  return [parsed.insight, parsed.surprise, parsed.apply];
}
```

---

## Implementation Examples

### Example 1: Structured Summary with JSON Schema

**Before**:

```typescript
const summary = await aiManager.summarize(content);
// Returns: ["Insight: ...", "Surprise: ...", "Apply: ..."]
// Requires regex parsing, prone to errors
```

**After**:

```typescript
const summary = await aiManager.summarize(content);
// Returns: ["...", "...", "..."]
// Guaranteed format, no parsing errors
```

---

### Example 2: Usage Tracking

**New Feature**:

```typescript
// In Reflect Mode overlay
const stats = aiManager.getUsageStats();
if (stats && stats.percent > 80) {
  showWarning('AI context nearly full. Summary may be less accurate.');
}
```

---

### Example 3: Incremental Context Building

**New Feature**:

```typescript
// As user scrolls through article
let sectionsRead = 0;

dwellTracker.onScroll(async (section) => {
  sectionsRead++;

  if (sectionsRead % 3 === 0) {
    // Every 3 sections, append to AI context
    await aiManager.appendContext(
      `Section ${sectionsRead}: ${section.title}\n${section.summary}`
    );
  }
});

// When threshold reached, AI already has context
dwellTracker.onThresholdReached(async () => {
  // This will be faster because context is pre-loaded
  const summary = await aiManager.summarize('Summarize the article');
});
```

---

## Migration Checklist

### Phase 1: Critical Updates (Week 1)

- [ ] Update type definitions with new interfaces
- [ ] Add `expectedInputs` and `expectedOutputs` to session creation
- [ ] Implement JSON Schema for summary generation
- [ ] Implement JSON Schema for reflection prompts
- [ ] Add input usage tracking (`inputUsage`/`inputQuota`)
- [ ] Add automatic session cloning on high usage
- [ ] Update error handling for `NotSupportedError`
- [ ] Test all AI features with new implementation
- [ ] Update API_REFERENCE.md with new methods

### Phase 2: Enhancement Updates (Week 2)

- [ ] Implement `append()` method wrapper
- [ ] Add `appendContext()` helper method
- [ ] Add `appendMessages()` helper method
- [ ] Implement incremental context building in content script
- [ ] Add usage stats display in Reflect Mode overlay
- [ ] Update ARCHITECTURE.md with new patterns
- [ ] Add examples to documentation

### Phase 3: Future Features (Month 2+)

- [ ] Monitor multimodal API for Stable release
- [ ] Design image upload UI for Reflect Mode
- [ ] Implement image input support
- [ ] Add audio transcription support
- [ ] Update prompts for multimodal content
- [ ] Add multilingual support (Japanese, Spanish)
- [ ] Test with different language configurations

---

## Testing Strategy

### Unit Tests

```typescript
describe('AIManager with JSON Schema', () => {
  it('should return structured summary', async () => {
    const aiManager = new AIManager();
    const summary = await aiManager.summarize('Test content');

    expect(summary).toHaveLength(3);
    expect(summary[0]).not.toContain('Insight:');
    expect(summary[1]).not.toContain('Surprise:');
    expect(summary[2]).not.toContain('Apply:');
  });

  it('should track input usage', async () => {
    const aiManager = new AIManager();
    await aiManager.summarize('Test content');

    const stats = aiManager.getUsageStats();
    expect(stats).not.toBeNull();
    expect(stats!.usage).toBeGreaterThan(0);
    expect(stats!.quota).toBeGreaterThan(0);
  });

  it('should append context', async () => {
    const aiManager = new AIManager();
    const success = await aiManager.appendContext('Additional context');

    expect(success).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('AIManager Integration', () => {
  it('should handle full reflection flow', async () => {
    const aiManager = new AIManager();

    // Check availability
    const available = await aiManager.checkAvailability();
    expect(available).toBe(true);

    // Generate summary
    const summary = await aiManager.summarize(longArticle);
    expect(summary).toHaveLength(3);

    // Check usage
    const stats = aiManager.getUsageStats();
    expect(stats!.percent).toBeLessThan(50);

    // Generate prompts
    const prompts = await aiManager.generateReflectionPrompts(summary);
    expect(prompts).toHaveLength(2);

    // Cleanup
    aiManager.destroy();
  });
});
```

---

## Performance Considerations

### JSON Schema Impact

**Pros**:

- Eliminates parsing overhead
- Reduces error handling code
- Faster response processing

**Cons**:

- Schema uses some input quota
- Slightly larger prompt size

**Mitigation**:

- Use `omitResponseConstraintInput: true` for simple schemas
- Monitor usage with new tracking features

### Usage Tracking Impact

**Overhead**: Negligible (reading properties)

**Benefits**:

- Prevents context overflow errors
- Enables proactive session management
- Better user experience

---

## Security & Privacy

### No Changes Required

All updates maintain existing privacy guarantees:

- ✅ Local AI processing only
- ✅ No external API calls
- ✅ No data leaves device
- ✅ User data stays in Chrome profile

### New Considerations

**JSON Schema**:

- Schemas are sent to model (uses input quota)
- No privacy impact (processed locally)

**Multimodal (Future)**:

- Images/audio processed locally
- No upload to external servers
- Same privacy guarantees

---

## Conclusion

The Chrome Prompt API has evolved significantly, and Reflexa AI can benefit from several new features:

**High Priority**:

1. JSON Schema for structured output (eliminates parsing errors)
2. Input usage tracking (prevents context overflow)
3. Expected input/output configuration (better validation)

**Medium Priority**: 4. `append()` method for incremental context 5. Updated type definitions

**Low Priority**: 6. Multimodal support (wait for Stable) 7. Multilingual support

**Estimated Effort**:

- Phase 1 (Critical): 2-3 days
- Phase 2 (Enhancement): 2-3 days
- Phase 3 (Future): 1-2 weeks

**Expected Benefits**:

- More reliable AI responses
- Better error handling
- Faster response times
- Future-proof architecture

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize updates** based on user impact
3. **Create GitHub issues** for each update
4. **Implement Phase 1** (critical updates)
5. **Test thoroughly** with real content
6. **Deploy to users** with release notes
7. **Monitor feedback** and iterate

---

## References

- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/prompt-api)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in-apis)
- [Structured Output Guide](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api)
- [Session Management Best Practices](https://developer.chrome.com/docs/ai/session-management)
- [Prompt API GitHub](https://github.com/webmachinelearning/prompt-api)

---

**Document Version**: 1.0
**Created**: January 27, 2025
**Author**: Kiro AI Assistant
**Status**: Ready for Review
