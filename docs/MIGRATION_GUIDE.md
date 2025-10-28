# Migration Guide: AIManager → PromptManager

## Overview

The `AIManager` class has been renamed to `PromptManager` to better reflect its specific purpose and distinguish it from other Gemini Nano API managers.

## What Changed

### File Rename

- **Old**: `src/background/aiManager.ts`
- **New**: `src/background/promptManager.ts`

### Class Rename

- **Old**: `AIManager`
- **New**: `PromptManager`

### Variable Naming Convention

- **Old**: `aiManager`
- **New**: `promptManager`

## Migration Steps

### 1. Update Imports

**Before:**

```typescript
import { AIManager } from './background/aiManager';
```

**After:**

```typescript
import { PromptManager } from './background/promptManager';
```

### 2. Update Variable Names

**Before:**

```typescript
const aiManager = new AIManager();
const available = await aiManager.checkAvailability();
const summary = await aiManager.summarize(content);
```

**After:**

```typescript
const promptManager = new PromptManager();
const available = await promptManager.checkAvailability();
const summary = await promptManager.summarize(content);
```

### 3. Use Unified Service (Recommended)

Instead of managing individual API instances, use the unified service:

```typescript
import { unifiedAI } from './background/unifiedAIService';

// Access Prompt API
const summary = await unifiedAI.prompt.summarize(content);
const questions = await unifiedAI.prompt.generateReflectionPrompts(summary);

// Access other APIs
const corrected = await unifiedAI.proofreader.proofread(text);
const translated = await unifiedAI.translator.translate(text, 'en', 'es');
```

## New Features

### Additional API Managers

Five new API managers are now available:

1. **ProofreaderManager** - Grammar and spelling corrections
2. **SummarizerManager** - Specialized summarization with multiple formats
3. **TranslatorManager** - Multilingual translation
4. **WriterManager** - Creative content generation
5. **RewriterManager** - Content improvement and restyling

### UnifiedAIService

A new unified service provides access to all APIs:

```typescript
import { unifiedAI } from './background/unifiedAIService';

// Check all APIs at once
const availability = await unifiedAI.checkAllAvailability();

// Use any API
await unifiedAI.prompt.summarize(content);
await unifiedAI.proofreader.proofread(text);
await unifiedAI.summarizer.summarize(content, { type: 'key-points' });
await unifiedAI.translator.translate(text, 'en', 'es');
await unifiedAI.writer.write(prompt, { tone: 'casual' });
await unifiedAI.rewriter.rewrite(text, { tone: 'more-formal' });

// Clean up all sessions
unifiedAI.destroyAll();
```

## Backward Compatibility

### Breaking Changes

- Direct imports of `AIManager` will fail
- File path `./background/aiManager` no longer exists

### No Functional Changes

- All methods remain the same
- Method signatures unchanged
- Behavior is identical

## Updated Documentation

### New Guides

- [Gemini Nano APIs Guide](./GEMINI_NANO_APIS_GUIDE.md) - Comprehensive guide for all 6 APIs
- [Quick Start Guide](./examples/QUICK_START_NEW_APIS.md) - Quick start examples
- [Integration Example](./examples/INTEGRATION_EXAMPLE.md) - Full integration example

### Updated Files

- API_REFERENCE.md - Updated with all new managers
- ARCHITECTURE.md - Updated architecture diagrams

### Outdated Files

The following files still reference `AIManager` and need updates:

- docs/PROMPT_API_UPDATE_GUIDE.md
- docs/API_CORRECTIONS_SUMMARY.md
- docs/DOCUMENTATION_UPDATE_COMPLETE.md

These are historical documents and can be referenced for context, but use the new guides for current development.

## Testing

All tests have been updated to use `PromptManager`:

```typescript
import { PromptManager } from '../background/promptManager';

const promptManager = new PromptManager();
await promptManager.checkAvailability();
```

## FAQ

### Q: Why was it renamed?

A: To distinguish the Prompt API manager from other specialized API managers (Proofreader, Summarizer, etc.) and provide clearer naming.

### Q: Do I need to update my code?

A: Yes, if you're directly importing `AIManager`. Update imports and variable names to use `PromptManager`.

### Q: What's the recommended approach?

A: Use the `UnifiedAIService` for new code. It provides a single interface to all APIs and handles initialization automatically.

### Q: Are there any functional changes?

A: No, the functionality is identical. Only the name changed.

### Q: What about the other APIs?

A: See the [Gemini Nano APIs Guide](./GEMINI_NANO_APIS_GUIDE.md) for comprehensive documentation on all available APIs.

## Support

For questions or issues:

- Check the [Gemini Nano APIs Guide](./GEMINI_NANO_APIS_GUIDE.md)
- Review [Integration Examples](./examples/INTEGRATION_EXAMPLE.md)
- See [Quick Start Guide](./examples/QUICK_START_NEW_APIS.md)
