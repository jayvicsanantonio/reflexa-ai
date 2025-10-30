# Implementation Plan

## Phase 1: Core Infrastructure (COMPLETED ✅)

- [x] 1. Create core type definitions for Chrome AI APIs integration
  - Define TypeScript interfaces for AICapabilities, AIResponse, SummarizeOptions, WriterOptions, TonePreset, ProofreadResult, and TextChange
  - Create types for LanguageDetection, TranslateOptions, and extended Reflection model with AI metadata
  - Add extended Settings type with new AI-related configuration options
  - Define CapabilityCache interface for caching API availability
  - _Requirements: 1.5, 9.4, 9.5_
  - _Implementation: `src/types/index.ts`, `src/types/chrome-ai.d.ts`_

- [x] 2. Implement capability detection system
  - [x] 2.1 Create capability detection module that checks for all seven Chrome AI APIs
    - Write function to check global API objects (Writer, Rewriter, Proofreader, Summarizer, LanguageModel, Translator, LanguageDetector)
    - Implement caching mechanism with TTL for capability results
    - Create method to refresh capabilities on demand
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
    - _Implementation: `src/background/services/capabilities/capabilityDetector.ts`_

  - [x] 2.2 Build capabilities object that stores availability flags
    - Initialize AICapabilities object with boolean flags for each API
    - Add experimental mode flag for beta features
    - Implement getter method to expose capabilities to other components
    - _Requirements: 1.2, 1.5, 10.2_
    - _Implementation: `src/background/services/capabilities/capabilityDetector.ts`_

## Phase 2: AI Manager Modules (COMPLETED ✅)

- [x] 3. Build Summarizer Manager module
  - [x] 3.1 Implement SummarizerManager class with availability check
    - Create isAvailable() and checkAvailability() methods using global Summarizer object
    - Implement session creation with appropriate options (type, format, length)
    - Add session cleanup and lifecycle management
    - _Requirements: 2.1, 2.2, 8.1_
    - _Implementation: `src/background/services/ai/summarizerManager.ts`_

  - [x] 3.2 Create summarize method with format support
    - Implement bullets format (3 bullet points, max 20 words each)
    - Implement paragraph format (max 150 words)
    - Implement headline + bullets format (10-word headline + 3 bullets)
    - Parse API responses into standardized array format
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
    - _Implementation: `src/background/services/ai/summarizerManager.ts`_

  - [x] 3.3 Add error handling and timeout logic
    - Wrap API calls in Promise.race with 5-second timeout
    - Implement retry logic with 8-second extended timeout
    - Handle session errors gracefully
    - _Requirements: 8.1, 9.3_
    - _Implementation: `src/background/services/ai/summarizerManager.ts`_

- [x] 4. Build Writer Manager module
  - [x] 4.1 Implement WriterManager class with session management
    - Create isAvailable() and checkAvailability() methods using global Writer object
    - Implement createSession with WriterConfig (tone, format, length, sharedContext)
    - Add session cleanup on completion
    - _Requirements: 3.1, 8.2_
    - _Implementation: `src/background/services/ai/writerManager.ts`_

  - [x] 4.2 Create generate method for draft creation
    - Map tone parameters (calm→neutral, professional→formal, casual→casual)
    - Implement length control (short=50-100 words, medium=100-200, long=200-300)
    - Use summary as context for better draft generation
    - Format response as clean paragraph text
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
    - _Implementation: `src/background/services/ai/writerManager.ts`_

  - [x] 4.3 Add streaming support
    - Implement generateStreaming method with for await...of iteration
    - Update UI progressively as text generates via onChunk callback
    - _Requirements: 3.5_
    - _Implementation: `src/background/services/ai/writerManager.ts`_

- [x] 5. Build Rewriter Manager module
  - [x] 5.1 Implement RewriterManager class with tone mapping
    - Create isAvailable() and checkAvailability() methods using global Rewriter object
    - Map Reflexa tone presets to API parameters (calm→as-is, concise→shorter, empathetic→more-casual, academic→more-formal)
    - Implement session creation with RewriterConfig
    - _Requirements: 4.1, 4.2, 8.3_
    - _Implementation: `src/background/services/ai/rewriterManager.ts`_

  - [x] 5.2 Create rewrite method with style preservation
    - Implement rewriting while preserving paragraph structure
    - Maintain original meaning while adjusting tone
    - Return both original and rewritten versions for comparison
    - Add streaming support with rewriteStreaming method
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
    - _Implementation: `src/background/services/ai/rewriterManager.ts`_

- [x] 6. Build Proofreader Manager module
  - [x] 6.1 Implement ProofreaderManager class
    - Create isAvailable() and checkAvailability() methods using global Proofreader object
    - Implement session creation with expectedInputLanguages configuration
    - Add session lifecycle management
    - _Requirements: 5.1, 8.4_
    - _Implementation: `src/background/services/ai/proofreaderManager.ts`_

  - [x] 6.2 Create proofread method with change tracking
    - Call API and receive ProofreadResult with correction and corrections array
    - Parse response to extract corrected text
    - Transform corrections to include startIndex, endIndex, and original text
    - Return ProofreadResult with correctedText and corrections array
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
    - _Implementation: `src/background/services/ai/proofreaderManager.ts`_

- [x] 7. Build Language Detector Manager module
  - [x] 7.1 Implement LanguageDetectorManager class
    - Create isAvailable() and checkAvailability() methods using global LanguageDetector object
    - Implement detect method using first 500 characters for speed
    - Create singleton instance for reuse
    - _Requirements: 6.1, 8.5_
    - _Implementation: `src/background/services/ai/languageDetectorManager.ts`_

  - [x] 7.2 Add language code mapping and caching
    - Map ISO 639-1 codes to human-readable language names (100+ languages supported)
    - Implement per-page caching with 5-minute TTL to avoid redundant detection calls
    - Return LanguageDetection object with detectedLanguage, confidence, and languageName
    - Add cache cleanup methods (clearCache, clearCacheForPage, cleanupCache)
    - _Requirements: 6.2, 6.3, 6.5_
    - _Implementation: `src/background/services/ai/languageDetectorManager.ts`_

- [x] 8. Build Translator Manager module
  - [x] 8.1 Implement TranslatorManager class with language support
    - Create isAvailable() and checkAvailability() methods using global Translator object
    - Define supported languages array (en, es, fr, de, it, pt, zh, ja, ko, ar)
    - Implement canTranslate method to check language pair availability
    - Add session caching with 5-minute TTL
    - _Requirements: 7.1, 7.2, 8.5_
    - _Implementation: `src/background/services/ai/translatorManager.ts`_

  - [x] 8.2 Create translate method with formatting preservation
    - Implement session-based translation for better performance
    - Preserve markdown formatting including bullet points and line breaks
    - Detect markdown patterns and translate segments separately
    - Add session cleanup methods (cleanupSessions, destroy, destroySession)
    - _Requirements: 7.3, 7.4, 7.5_
    - _Implementation: `src/background/services/ai/translatorManager.ts`_

- [x] 9. Build Prompt Manager module
  - [x] 9.1 Implement PromptManager class as universal fallback
    - Create isAvailable() and checkAvailability() methods using global LanguageModel object
    - Implement session creation with system prompts, temperature, topK configuration
    - Add conversation context management
    - Implement streaming support with promptStreaming method
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
    - _Implementation: `src/background/services/ai/promptManager.ts`_

  - [x] 9.2 Create specialized prompts for each API fallback
    - Write summarization prompt that mimics Summarizer API behavior (all 3 formats)
    - Write draft generation prompt that mimics Writer API behavior
    - Write rewriting prompt that mimics Rewriter API behavior
    - Write proofreading prompt for grammar/clarity checking
    - Implement temperature control for creative vs factual tasks (0.3, 0.7, 0.9)
    - Add utility methods: generateReflectionPrompts, countTokens, cloneSession, getCapabilities
    - _Requirements: 8.1, 8.2, 8.3_
    - _Implementation: `src/background/services/ai/promptManager.ts`_

## Phase 3: Service Integration (IN PROGRESS 🔄)

- [x] 10. Implement Unified AI Service orchestration layer
  - [x] 10.1 Create AIService class with initialization
    - Implement initialize() method that runs capability detection
    - Instantiate all API manager modules (prompt, proofreader, summarizer, translator, writer, rewriter)
    - Expose getCapabilities() and refreshCapabilities() methods
    - Add checkAllAvailability() method for runtime checks
    - Add destroyAll() method for cleanup
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2_
    - _Implementation: `src/background/services/ai/aiService.ts`_
    - _Note: Individual managers handle their own operations; orchestration is lightweight_

  - [x] 10.2 Update background message handlers to use AI managers
    - Add message handlers for summarize, write, rewrite, proofread, detectLanguage, translate operations
    - Integrate with existing message handling infrastructure
    - Return standardized response objects with success/error status
    - Track performance metrics (duration, API used)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 9.3, 9.5_

  - [x] 10.3 Implement fallback logic in message handlers
    - Check API availability before calling specialized managers
    - Fall back to Prompt API for summarize, write, and rewrite operations when specialized APIs unavailable
    - Return appropriate errors for operations without fallbacks (proofread, translate, detectLanguage)
    - Log which API was used for each operation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.3_

  - [x] 10.4 Add rate limiting and quota handling
    - Implement exponential backoff for rate limit errors (2s, 4s, 8s)
    - Track API usage counts per session
    - Display warning when approaching quotas
    - Queue requests for retry after rate limit period
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Update background service worker message handlers
  - Add message handlers for new AI operations (write, rewrite, proofread, detectLanguage, translate)
  - Update existing summarize handler to support format options (bullets, paragraph, headline-bullets)
  - Add handler for capability queries (getCapabilities, checkAllAvailability)
  - Implement handler for AI usage statistics requests
  - Wire up handlers in `src/background/index.ts`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Create Summary Format Dropdown component
  - Build React component with three format options (Bullets, Paragraph, Headline + Bullets)
  - Add icons for each format type
  - Implement smooth transition animation when format changes
  - Add disabled state during AI processing
  - Wire up to send format selection to background worker
  - _Requirements: 2.1, 2.2_

- [x] 13. Create Tone Preset Chips component
  - Build React component with four tone chips (Calm, Concise, Empathetic, Academic)
  - Implement active state highlighting with accent color
  - Add hover effect with subtle scale animation
  - Show loading spinner while rewriting in progress
  - Wire up click handlers to trigger rewrite operation
  - _Requirements: 4.1, 4.2_

- [x] 14. Create Proofread Diff View component
  - [x] 14.1 Build side-by-side comparison layout
    - Create two-column layout for original and corrected text
    - Implement responsive design for smaller screens
    - Add smooth transition animations
    - _Requirements: 5.4_

  - [x] 14.2 Implement inline change highlighting
    - Highlight changed text with color coding (grammar=red, clarity=blue, spelling=orange)
    - Add tooltip on hover showing change type and explanation
    - Implement smooth highlighting animations
    - _Requirements: 5.3, 5.4_

  - [x] 14.3 Add Accept/Discard action buttons
    - Create Accept button that applies corrected text
    - Create Discard button that keeps original text
    - Implement smooth transition when accepting changes
    - Store both versions in reflection metadata
    - _Requirements: 5.4, 5.5_

- [x] 15. Create Language Pill component
  - Build small pill component for header display
  - Add globe icon with detected language name
  - Implement fade-in animation on language detection
  - Add tooltip showing confidence score
  - _Requirements: 6.3, 6.4_

- [x] 16. Create Translate Dropdown component
  - Build dropdown component with 10 language options
  - Add flag icons for each language
  - Show both English and native language names
  - Implement search/filter for quick language selection
  - Add loading indicator during translation
  - Gray out unsupported language pairs
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 17. Create Start Reflection button component
  - Build button that triggers draft generation
  - Show loading spinner while Writer API generates draft
  - Implement smooth insertion of generated text into reflection input
  - Add success animation when draft is inserted
  - _Requirements: 3.1, 3.4, 3.5_

- [x] 18. Update Reflect Mode overlay with new AI features
  - [x] 18.1 Add Summary Format Dropdown to overlay header
    - Position dropdown above summary display area
    - Wire up format changes to re-request summary
    - _Requirements: 2.1, 2.2_

  - [x] 18.2 Add Language Pill to overlay header
    - Display detected language automatically
    - Show "Translate to English" button for non-English content
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 18.3 Add Translate Dropdown to overlay
    - Position near summary or reflection text
    - Enable translation of both summary and prompts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 18.4 Add Start Reflection button below summary
    - Position between summary and reflection input
    - Generate draft using Writer API when clicked
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 18.5 Add Tone Preset Chips above reflection input
    - Position as horizontal row of chips
    - Show rewrite preview when tone is selected
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 18.6 Add Proofread button below reflection input
    - Show only when Proofreader API is available
    - Display diff view when clicked
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 19. Create AI Status Panel component for Dashboard
  - [x] 19.1 Build grid layout showing each API status
    - Display seven API cards with availability indicators
    - Use green checkmark for available, gray X for unavailable
    - Add refresh button to re-check capabilities
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 19.2 Add usage statistics display
    - Show counters for summarizations, drafts, rewrites, proofreads, translations
    - Display session start time
    - Calculate and show total AI operations
    - _Requirements: 11.2, 12.4, 12.5_

  - [x] 19.3 Add experimental mode badge
    - Display badge when experimental mode is enabled
    - Show tooltip explaining experimental features
    - _Requirements: 10.2, 10.5, 11.5_

- [x] 20. Update Settings page with new AI options
  - [x] 20.1 Add default summary format setting
    - Create dropdown for selecting default format (Bullets, Paragraph, Headline + Bullets)
    - Save preference to chrome.storage
    - _Requirements: 2.1_

  - [x] 20.2 Add proofreading toggle
    - Create toggle switch for enabling/disabling proofread feature
    - Show/hide proofread button in overlay based on setting
    - _Requirements: 5.1_

  - [x] 20.3 Add translation settings
    - Create toggle for enabling/disabling translation features
    - Add dropdown for preferred translation language
    - Add toggle for auto-detect language
    - _Requirements: 7.1, 7.2_

  - [x] 20.4 Add experimental mode toggle
    - Create toggle switch with warning message
    - Display explanation of experimental features
    - Refresh capabilities when toggled
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 20.5 Add AI Status section
    - Display current status of each Chrome AI API
    - Show green/gray indicators for availability
    - Add "Check Again" button to refresh status
    - _Requirements: 11.4_

- [x] 21. Update storage models for AI metadata
  - Extend Reflection type with new AI-related fields (summaryFormat, detectedLanguage, toneUsed, proofreadVersion, aiMetadata)
  - Update storage manager to handle new fields
  - Implement migration for existing reflections to add default AI metadata
  - _Requirements: 9.4, 9.5_

- [ ] 22. Implement error handling for AI operations
  - [x] 22.1 Add timeout handling with retry logic
    - Wrap all AI calls in Promise.race with 5-second timeout
    - Implement single retry with 8-second extended timeout
    - Fall back to Prompt API or manual mode after timeout
    - _Requirements: 9.3, 12.1, 12.2_

  - [x] 22.2 Add rate limiting error handling
    - Catch rate limit errors from API calls
    - Implement exponential backoff retry strategy
    - Display user-friendly message after max retries
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 22.3 Add session error handling
    - Catch session creation failures
    - Retry session creation once
    - Fall back to direct API calls without session
    - Implement automatic session cleanup on errors
    - _Requirements: 9.3_

  - [x] 22.4 Add translation unavailability handling
    - Check canTranslate before offering language options
    - Gray out unsupported language pairs in UI
    - Display tooltip explaining unavailability
    - _Requirements: 7.1, 7.2, 8.5_

- [x] 23. Add performance monitoring for AI operations
  - Implement timing metrics for each AI operation
  - Track API response times and store in AIResponse.duration
  - Log slow operations (>5s) to console for debugging
  - Display performance metrics in AI Status panel
  - _Requirements: 9.5, 11.2_

- [ ] 24. Update content script to trigger language detection
  - Call detectLanguage when content is extracted
  - Pass detected language to Reflect Mode overlay
  - Cache language detection result per page
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 25. Implement capability refresh mechanism
  - Add method to refresh capabilities on demand
  - Trigger refresh when experimental mode is toggled
  - Trigger refresh when user clicks "Check Again" in AI Status
  - Update UI components when capabilities change
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.3_

## Phase 4: Testing & Documentation (PENDING ⏳)

- [ ]* 26. Write unit tests for AI managers
  - Test capability detection for each API
  - Test fallback logic when APIs are unavailable
  - Test timeout and retry behavior
  - Test response parsing and formatting
  - Test session lifecycle management
  - Test error handling for each error type
  - _Requirements: 1.1, 1.2, 8.1, 8.2, 8.3, 8.4, 8.5, 9.3_

- [ ]* 27. Write integration tests for AI workflows
  - Test complete multilingual reflection flow (detect → translate → draft → rewrite → proofread)
  - Test summary format switching
  - Test tone adjustment workflow
  - Test proofreading with diff view acceptance
  - Test AI Status panel updates
  - Test settings persistence for new AI options
  - _Requirements: 2.1, 2.2, 4.1, 4.2, 5.1, 5.2, 6.1, 7.1, 11.1_

- [ ]* 28. Create API mock tests
  - Mock responses for each Chrome AI API
  - Simulate API unavailability scenarios
  - Test Prompt API fallback behavior
  - Verify prompt formatting for fallback operations
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 29. Perform performance testing for AI operations
  - Measure summarization time for various content lengths
  - Measure draft generation latency
  - Measure rewriting response time
  - Measure proofreading performance
  - Measure language detection speed
  - Measure translation time per 100 words
  - Verify all operations meet target metrics (<3s for most operations)
  - _Requirements: 9.5_

- [ ]* 30. Update documentation for Chrome AI APIs integration
  - Document new AI features in user guide
  - Add developer documentation for AI Service architecture
  - Document capability detection system
  - Add examples for each AI operation
  - Document fallback behavior and error handling
  - Update Chrome flags setup guide
  - _Requirements: 9.1, 9.2, 9.4_

---

## Summary

**Completed**: Tasks 1-10.1 (Core infrastructure and all AI manager modules)
**In Progress**: Tasks 10.2-25 (Service integration and UI components)
**Pending**: Tasks 26-30 (Testing and documentation - marked optional with *)

**Key Achievements**:
- ✅ All 7 Chrome AI API managers implemented with full functionality
- ✅ Capability detection system with caching
- ✅ Timeout/retry logic and error handling
- ✅ Session lifecycle management
- ✅ Streaming support for Writer, Rewriter, and Prompt APIs
- ✅ Markdown formatting preservation in Translator
- ✅ Comprehensive language support (100+ languages in Language Detector)
- ✅ Prompt API fallback implementations for all specialized APIs

**Next Steps**:
1. Wire up message handlers in background service worker
2. Create UI components for new AI features
3. Update Reflect Mode overlay with new capabilities
4. Add settings page controls for AI options
5. Test end-to-end workflows
