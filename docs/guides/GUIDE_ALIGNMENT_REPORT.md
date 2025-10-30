# Guide Alignment Report: Chrome AI APIs

**Date**: October 30, 2025
**Status**: ⚠️ **Guides Need Updates**

## Executive Summary

The user guides in `/docs/guides` are **partially aligned** with the Chrome AI API documentation in `/docs/development/chrome-apis`. While they mention all 7 APIs conceptually, they are missing critical technical setup details and testing procedures.

## Comparison Results

### 1. USER_GUIDE.md

**Status**: ⚠️ Partially Aligned (60% complete)

#### ✅ What's Correct

- Mentions all 7 Chrome Built-in AI APIs
- Describes features powered by each API
- Explains fallback behavior
- Lists API capabilities

#### ❌ What's Missing

1. **Incomplete Chrome Flags Setup**
   - Current: Shows 7 flags in first-time setup
   - Missing: Individual API flags (writer-api, rewriter-api, etc.)
   - Should have: All 8 required flags clearly listed

2. **Missing Technical Details**
   - No mention of global API objects (`Writer`, `Rewriter`, etc.)
   - No explanation of API availability checking
   - No details about API capability detection

3. **Incomplete Flag Instructions**
   - Current flags shown:
     - ✅ `#optimization-guide-on-device-model`
     - ✅ `#prompt-api-for-gemini-nano`
     - ✅ `#summarization-api-for-gemini-nano`
     - ✅ `#writer-api-for-gemini-nano`
     - ✅ `#rewriter-api-for-gemini-nano`
     - ✅ `#language-detection-api`
     - ✅ `#translation-api`
   - Format inconsistency: Some use `-for-gemini-nano`, some don't

### 2. TESTING_GUIDE.md

**Status**: ❌ Not Aligned (30% complete)

#### ✅ What's Correct

- Basic Chrome setup instructions
- General testing methodology
- Extension loading process

#### ❌ What's Missing

1. **Severely Incomplete Chrome Flags**
   - Current: Only 2 flags mentioned
     - `#optimization-guide-on-device-model`
     - `#prompt-api-for-gemini-nano`
   - Missing: 6 additional API flags
     - `#writer-api` (or `#writer-api-for-gemini-nano`)
     - `#rewriter-api` (or `#rewriter-api-for-gemini-nano`)
     - `#proofreader-api` (or `#proofreader-api-for-gemini-nano`)
     - `#summarization-api-for-gemini-nano`
     - `#translator-api` (or `#translation-api`)
     - `#language-detection-api` (or `#language-detector-api`)

2. **Missing API-Specific Tests**
   - No test scenarios for Writer API
   - No test scenarios for Rewriter API
   - No test scenarios for Proofreader API
   - No test scenarios for Translator API
   - No test scenarios for Language Detector API
   - No test scenarios for Summarizer API

3. **Missing Verification Steps**
   - No console commands to verify each API
   - No capability detection testing
   - No API availability checking

## Detailed Gap Analysis

### Chrome Flags Discrepancy

According to `/docs/development/chrome-apis/API_ACCESS_PATTERNS_SUMMARY.md`, the required flags are:

```
Required Chrome Flags:
- #optimization-guide-on-device-model → Enabled BypassPerfRequirement
- #writer-api → Enabled
- #rewriter-api → Enabled
- #proofreader-api → Enabled
- #summarizer-api → Enabled
- #prompt-api-for-gemini-nano → Enabled
- #translator-api → Enabled
- #language-detector-api → Enabled
```

**USER_GUIDE.md** shows 7 flags with inconsistent naming.
**TESTING_GUIDE.md** shows only 2 flags.

### API Access Pattern Discrepancy

According to the Chrome API documentation, all APIs are accessed via **global objects**:

```typescript
// Correct access patterns
const writer = await Writer.create();
const rewriter = await Rewriter.create();
const proofreader = await Proofreader.create();
const summarizer = await Summarizer.create();
const session = await LanguageModel.create();
const translator = await Translator.create();
const detector = await LanguageDetector.create();
```

**Neither guide** explains this technical detail to users/testers.

## Recommended Updates

### Priority 1: TESTING_GUIDE.md (Critical)

**Section to Update**: "Step 1: Enable Gemini Nano in Chrome"

**Add Missing Flags**:

```markdown
3. **Enable Writer API**:
   - Navigate to: `chrome://flags/#writer-api`
   - Set to: **"Enabled"**

4. **Enable Rewriter API**:
   - Navigate to: `chrome://flags/#rewriter-api`
   - Set to: **"Enabled"**

5. **Enable Proofreader API**:
   - Navigate to: `chrome://flags/#proofreader-api`
   - Set to: **"Enabled"**

6. **Enable Summarizer API**:
   - Navigate to: `chrome://flags/#summarization-api-for-gemini-nano`
   - Set to: **"Enabled"**

7. **Enable Translator API**:
   - Navigate to: `chrome://flags/#translator-api`
   - Set to: **"Enabled"**

8. **Enable Language Detector API**:
   - Navigate to: `chrome://flags/#language-detection-api`
   - Set to: **"Enabled"**
```

**Add API Verification Section**:

````markdown
6. **Verify All APIs are Available**:
   - Open DevTools (F12) on any page
   - Go to the Console tab
   - Test each API:

   ```javascript
   // Check API availability
   console.log('Writer:', typeof Writer);
   console.log('Rewriter:', typeof Rewriter);
   console.log('Proofreader:', typeof Proofreader);
   console.log('Summarizer:', typeof Summarizer);
   console.log('LanguageModel:', typeof LanguageModel);
   console.log('Translator:', typeof Translator);
   console.log('LanguageDetector:', typeof LanguageDetector);
   ```
````

- All should return: `"function"`
- If any return `"undefined"`, that API is not available

```

```

### Priority 2: USER_GUIDE.md (Important)

**Section to Update**: "First-Time Setup" → Step 1

**Standardize Flag Names**:
Use consistent flag names matching Chrome's actual implementation:

```markdown
1. **Enable Chrome AI APIs** (required for AI features):

   a. **Base AI Model**:
   - Go to `chrome://flags/#optimization-guide-on-device-model`
   - Set to "Enabled BypassPerfRequirement"

   b. **Core APIs**:
   - `chrome://flags/#prompt-api-for-gemini-nano` → "Enabled"
   - `chrome://flags/#summarization-api-for-gemini-nano` → "Enabled"

   c. **Writing Assistance APIs**:
   - `chrome://flags/#writer-api` → "Enabled"
   - `chrome://flags/#rewriter-api` → "Enabled"
   - `chrome://flags/#proofreader-api` → "Enabled"

   d. **Translation APIs**:
   - `chrome://flags/#translator-api` → "Enabled"
   - `chrome://flags/#language-detection-api` → "Enabled"

   **Restart Chrome** for changes to take effect
```

**Add Technical Note**:

```markdown
> **Technical Note**: All Chrome AI APIs are accessed via global objects
> (Writer, Rewriter, Proofreader, etc.). The extension automatically detects
> which APIs are available and enables corresponding features.
```

### Priority 3: Add New Test Scenarios to TESTING_GUIDE.md

**Add After Test 6 (AI Summary Generation)**:

```markdown
### Test 7: Writer API - Draft Generation

**Purpose**: Verify Writer API generates reflection drafts.

**Steps**:

1. Enable Writer API in settings (if available)
2. Enter Reflect Mode
3. Click "Generate Draft" button (if available)
4. Wait for AI to generate draft

**Expected Results**:

- ✅ Draft appears within 4 seconds
- ✅ Draft is relevant to the summary
- ✅ Draft follows selected tone (casual/neutral/formal)
- ✅ Draft length matches setting (short/medium/long)

### Test 8: Rewriter API - Tone Adjustment

**Purpose**: Verify Rewriter API adjusts tone correctly.

**Steps**:

1. Enter Reflect Mode
2. Type a reflection
3. Click tone preset chips (Calm, Concise, Empathetic, Academic)
4. Review rewritten version

**Expected Results**:

- ✅ Rewritten version appears within 3 seconds
- ✅ Tone matches selected preset
- ✅ Meaning is preserved
- ✅ Side-by-side preview shows both versions
- ✅ Accept/Discard buttons work

### Test 9: Proofreader API - Grammar Checking

**Purpose**: Verify Proofreader API fixes grammar.

**Steps**:

1. Enable proofreading in settings
2. Enter Reflect Mode
3. Type text with intentional errors
4. Click "Proofread" button

**Expected Results**:

- ✅ Proofread version appears within 3 seconds
- ✅ Grammar errors are fixed
- ✅ Diff view shows changes with color coding
- ✅ Original meaning preserved
- ✅ Accept/Discard individual corrections

### Test 10: Translator API - Translation

**Purpose**: Verify Translator API translates content.

**Steps**:

1. Navigate to a non-English article (or English article)
2. Enter Reflect Mode
3. Select target language from dropdown
4. Click "Translate" button

**Expected Results**:

- ✅ Translation appears within 4 seconds
- ✅ Formatting preserved (bullets, etc.)
- ✅ Translation is accurate
- ✅ Can translate summary and reflections

### Test 11: Language Detector API - Language Detection

**Purpose**: Verify Language Detector API identifies languages.

**Steps**:

1. Navigate to a non-English article
2. Enter Reflect Mode
3. Check language pill in header

**Expected Results**:

- ✅ Language pill shows detected language
- ✅ Language name is correct
- ✅ Confidence score is displayed (if available)
- ✅ Auto-detection happens automatically
```

## Summary of Required Changes

### TESTING_GUIDE.md

- [ ] Add 6 missing Chrome flags to Step 1
- [ ] Add API verification console commands
- [ ] Add Test 7: Writer API
- [ ] Add Test 8: Rewriter API
- [ ] Add Test 9: Proofreader API
- [ ] Add Test 10: Translator API
- [ ] Add Test 11: Language Detector API
- [ ] Update existing Test 6 to mention Summarizer API explicitly
- [ ] Renumber subsequent tests (current Test 7 becomes Test 12, etc.)

### USER_GUIDE.md

- [ ] Standardize Chrome flag names in First-Time Setup
- [ ] Group flags by category (Base, Core, Writing, Translation)
- [ ] Add technical note about global API objects
- [ ] Verify all 8 flags are listed correctly
- [ ] Add troubleshooting section for missing APIs

## Alignment Score

| Guide            | Current | Target   | Priority |
| ---------------- | ------- | -------- | -------- |
| USER_GUIDE.md    | 60%     | 100%     | High     |
| TESTING_GUIDE.md | 30%     | 100%     | Critical |
| **Overall**      | **45%** | **100%** | **High** |

## References

- Chrome API Documentation: `/docs/development/chrome-apis/`
- API Access Patterns: `/docs/development/chrome-apis/API_ACCESS_PATTERNS_SUMMARY.md`
- Integration Status: `/docs/development/chrome-apis/ALL_APIS_INTEGRATION_STATUS.md`
- Chrome AI APIs Overview: `/docs/development/chrome-apis/CHROME_AI_APIS.md`

---

**Report Generated**: October 30, 2025
**Next Action**: Update guides based on recommendations above
