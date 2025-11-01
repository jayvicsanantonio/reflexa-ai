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

### Chrome AI APIs Documentation

For comprehensive documentation on all Chrome Built-in AI APIs, see:

- [Chrome AI APIs Documentation](../development/chrome-apis/README.md) - Main documentation hub
- [Documentation Index](../development/chrome-apis/INDEX.md) - Complete index of all API docs
- [All APIs Integration Status](../development/chrome-apis/ALL_APIS_INTEGRATION_STATUS.md) - Current status

### Individual API Quick References

- [Writer API Quick Reference](../development/chrome-apis/WRITER_API_QUICK_REFERENCE.md)
- [Rewriter API Quick Reference](../development/chrome-apis/REWRITER_API_QUICK_REFERENCE.md)
- [Proofreader API Corrections](../development/chrome-apis/PROOFREADER_API_CORRECTIONS.md)
- [Summarizer API Quick Reference](../development/chrome-apis/SUMMARIZER_API_QUICK_REFERENCE.md)
- [Translator API Quick Reference](../development/chrome-apis/TRANSLATOR_API_QUICK_REFERENCE.md)
- [Language Detector API Quick Reference](../development/chrome-apis/LANGUAGE_DETECTOR_API_QUICK_REFERENCE.md)
- [Prompt API Quick Reference](../development/chrome-apis/PROMPT_API_QUICK_REFERENCE.md)

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

A: See the [Chrome AI APIs Documentation](../development/chrome-apis/README.md) for comprehensive documentation on all available APIs.

## Support

For questions or issues:

- Check the [Chrome AI APIs Documentation](../development/chrome-apis/README.md)
- Review the [Documentation Index](../development/chrome-apis/INDEX.md)
- See individual API quick references in `docs/development/chrome-apis/`
