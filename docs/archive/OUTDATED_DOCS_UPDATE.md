# Outdated Documentation Update Report

## Summary

After renaming `aiManager.ts` to `promptManager.ts` and integrating all 6 Gemini Nano APIs, several documentation files need to be updated.

## Files Requiring Updates

### 1. ✅ Already Updated (New Files)

- `docs/GEMINI_NANO_APIS_GUIDE.md` - Comprehensive guide for all 6 APIs
- `docs/examples/QUICK_START_NEW_APIS.md` - Quick start guide
- `docs/examples/INTEGRATION_EXAMPLE.md` - Full integration example
- `GEMINI_NANO_INTEGRATION_SUMMARY.md` - Integration summary
- `INTEGRATION_CHECKLIST.md` - Step-by-step checklist

### 2. ⚠️ Needs Major Updates

#### `docs/API_REFERENCE.md`

**Issues:**

- References `AIManager` instead of `PromptManager`
- Missing documentation for 5 new API managers:
  - ProofreaderManager
  - SummarizerManager
  - TranslatorManager
  - WriterManager
  - RewriterManager
- Missing UnifiedAIService documentation
- Examples use old `aiManager` variable name

**Recommendation:**

- Update all `AIManager` → `PromptManager`
- Add sections for each new API manager
- Add UnifiedAIService section
- Update code examples

#### `docs/API_CORRECTIONS_SUMMARY.md`

**Issues:**

- References `src/background/aiManager.ts` (old filename)

**Recommendation:**

- Update filename reference to `promptManager.ts`
- Add note about the rename

#### `docs/DOCUMENTATION_UPDATE_COMPLETE.md`

**Issues:**

- References `src/background/aiManager.ts` (old filename)

**Recommendation:**

- Update filename reference
- Add section about new API managers

#### `docs/PROMPT_API_UPDATE_GUIDE.md`

**Issues:**

- Extensive references to `AIManager` class
- All code examples use old naming
- Focuses only on Prompt API, doesn't mention other APIs

**Recommendation:**

- Update all `AIManager` → `PromptManager`
- Add note that this guide is specific to Prompt API
- Reference the new comprehensive guide for other APIs

### 3. ℹ️ Minor Updates Needed

#### `docs/ARCHITECTURE.md`

**Check needed:** May reference aiManager in architecture diagrams

#### `docs/TESTING_GUIDE.md`

**Check needed:** May have test examples using old naming

#### `docs/USER_GUIDE.md`

**Check needed:** User-facing docs should be mostly unaffected

### 4. ✅ No Updates Needed (Historical/Context)

- `docs/GEMINI_NANO_INTEGRATION_FIXES.md` - Historical record
- `docs/API_UPDATE_SUMMARY.md` - Historical record
- `docs/DESIGN_SYSTEM.md` - UI/UX focused
- `docs/ENGINEERING_REQUIREMENT_DOCUMENT.md` - Requirements doc
- `docs/MARKET_OPPORTUNITY.md` - Business doc
- `docs/PRODUCT_REQUIREMENT_DOCUMENT.md` - Product doc
- `docs/PROJECT_OVERVIEW.md` - High-level overview

## Priority Order

### High Priority (User-Facing)

1. **API_REFERENCE.md** - Developers will use this frequently
2. **ARCHITECTURE.md** - Important for understanding system design

### Medium Priority (Development)

3. **PROMPT_API_UPDATE_GUIDE.md** - Specific API guide
4. **TESTING_GUIDE.md** - Test examples

### Low Priority (Historical Context)

5. **API_CORRECTIONS_SUMMARY.md** - Historical record
6. **DOCUMENTATION_UPDATE_COMPLETE.md** - Historical record

## Recommended Actions

### Option 1: Comprehensive Update (Recommended)

Update all outdated references to maintain consistency and avoid confusion.

### Option 2: Deprecation Notice

Add deprecation notices to old docs and point to new comprehensive guides.

### Option 3: Archive Old Docs

Move outdated docs to `docs/archive/` and create fresh documentation.

## New Documentation Structure (Proposed)

```
docs/
├── README.md (Index of all docs)
├── api/
│   ├── prompt-api.md (PromptManager)
│   ├── proofreader-api.md (ProofreaderManager)
│   ├── summarizer-api.md (SummarizerManager)
│   ├── translator-api.md (TranslatorManager)
│   ├── writer-api.md (WriterManager)
│   ├── rewriter-api.md (RewriterManager)
│   └── unified-service.md (UnifiedAIService)
├── guides/
│   ├── quick-start.md
│   ├── integration-guide.md
│   └── migration-guide.md (aiManager → promptManager)
├── examples/
│   ├── basic-usage.md
│   ├── advanced-patterns.md
│   └── integration-example.md
└── archive/
    └── (old outdated docs)
```

## Next Steps

1. Decide on update strategy (comprehensive, deprecation, or archive)
2. Update high-priority docs first
3. Create migration guide for developers
4. Add index/README to docs directory
5. Consider restructuring docs for better organization
