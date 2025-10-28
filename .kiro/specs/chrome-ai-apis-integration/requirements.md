# Requirements Document

## Introduction

This feature enhances Reflexa AI to fully integrate all seven Chrome Built-in AI APIs (Prompt API, Summarizer API, Writer API, Rewriter API, Proofreader API, Language Detector API, and Translator API) as recommended in the Google Chrome AI Challenge 2025. The integration creates a unified, intelligent reading companion that leverages on-device AI capabilities to provide multilingual support, tone adjustment, grammar polishing, and intelligent content generation while maintaining complete privacy through local processing powered by Gemini Nano.

## Glossary

- **Chrome_AI_APIs**: The collection of seven built-in AI APIs provided by Chrome for on-device inference
- **Summarizer_API**: Chrome API that generates concise summaries in various formats (bullets, paragraph, headline)
- **Prompt_API**: Chrome API for general-purpose AI prompting and reasoning tasks
- **Writer_API**: Chrome API that generates first drafts based on topic, tone, and length parameters
- **Rewriter_API**: Chrome API that adjusts tone and style of existing text
- **Proofreader_API**: Chrome API that fixes grammar and improves text clarity
- **Language_Detector_API**: Chrome API that identifies the language of text content
- **Translator_API**: Chrome API that translates text between languages
- **Unified_AI_Service**: The orchestration layer that manages all Chrome AI API interactions
- **Tone_Preset**: A predefined style option (Calm, Concise, Empathetic, Academic) for text rewriting
- **Capability_Gating**: Runtime checks to determine which AI APIs are available in the user's browser
- **Gemini_Nano**: Chrome's on-device AI model that powers all Chrome AI APIs

## Requirements

### Requirement 1

**User Story:** As a user, I want the system to automatically detect which Chrome AI APIs are available on my browser, so that I can use the latest AI features when they become available without manual configuration.

#### Acceptance Criteria

1. WHEN the Background_Service_Worker initializes, THE Unified_AI_Service SHALL check for the availability of all seven Chrome_AI_APIs.
2. THE Unified_AI_Service SHALL store capability flags for each API (summarizer, writer, rewriter, proofreader, languageDetector, translator, prompt).
3. THE Unified_AI_Service SHALL use the Prompt_API as a fallback WHEN other specialized APIs are unavailable.
4. WHERE an API is unavailable, THE Unified_AI_Service SHALL log the unavailability to the console for debugging.
5. THE Unified_AI_Service SHALL expose a capabilities object that components can query before requesting AI operations.

### Requirement 2

**User Story:** As a user, I want to choose different summary formats (bullets, paragraph, or headline with bullets), so that I can get summaries in the format that best suits my reading style.

#### Acceptance Criteria

1. THE Reflect_Mode overlay SHALL display a dropdown menu with three summary format options: "Bullets", "Paragraph", and "Headline + Bullets".
2. WHEN the user selects a summary format, THE Unified_AI_Service SHALL call the Summarizer_API with the selected format parameter.
3. THE Summarizer_API SHALL generate summaries with a maximum length of 150 words for paragraph format.
4. THE Summarizer_API SHALL generate exactly three bullet points for bullets format with each bullet containing no more than 20 words.
5. THE Summarizer_API SHALL generate one headline (maximum 10 words) followed by three bullet points for headline + bullets format.

### Requirement 3

**User Story:** As a user, I want the system to automatically draft a reflective paragraph for me, so that I have a starting point for my reflection without staring at a blank text box.

#### Acceptance Criteria

1. WHEN the Reflect_Mode overlay displays the summary, THE Unified_AI_Service SHALL call the Writer_API to generate a first draft reflection.
2. THE Writer_API SHALL use the summary as the topic parameter with tone set to "calm" and length set to "short".
3. THE Writer_API SHALL generate a reflection draft containing 50 to 100 words.
4. THE Reflect_Mode SHALL display a "Start Reflection" button that inserts the generated draft into the reflection text area.
5. THE Reflect_Mode SHALL allow the user to edit the generated draft before saving.

### Requirement 4

**User Story:** As a user, I want to adjust the tone of my reflection using preset options, so that I can match the style to my intended audience or purpose.

#### Acceptance Criteria

1. THE Reflect_Mode SHALL display four Tone_Preset chips labeled "Calm", "Concise", "Empathetic", and "Academic".
2. WHEN the user clicks a Tone_Preset chip, THE Unified_AI_Service SHALL call the Rewriter_API with the selected style parameter.
3. THE Rewriter_API SHALL rewrite the reflection text while preserving the original meaning and key points.
4. THE Reflect_Mode SHALL display the rewritten version in a preview area alongside the original text.
5. THE Reflect_Mode SHALL provide "Accept" and "Discard" buttons to apply or reject the rewritten version.

### Requirement 5

**User Story:** As a user, I want to proofread my reflection for grammar and clarity issues, so that my saved reflections are polished and professional.

#### Acceptance Criteria

1. WHERE the Proofreader_API is available, THE Reflect_Mode SHALL display a "Proofread" button below the reflection text area.
2. WHEN the user clicks the "Proofread" button, THE Unified_AI_Service SHALL call the Proofreader_API with mode set to "grammar_clarity".
3. THE Proofreader_API SHALL return the corrected text with grammar fixes and clarity improvements.
4. THE Reflect_Mode SHALL display an inline diff view showing changes between original and proofread versions.
5. THE Unified_AI_Service SHALL store both the original and proofread versions when the user saves the reflection.

### Requirement 6

**User Story:** As a multilingual user, I want the system to automatically detect the language of the webpage, so that I can receive appropriate language-specific features.

#### Acceptance Criteria

1. WHEN the Content_Script extracts page content, THE Unified_AI_Service SHALL call the Language_Detector_API to identify the content language.
2. THE Language_Detector_API SHALL return an ISO 639-1 language code (e.g., "en", "es", "fr").
3. THE Reflect_Mode SHALL display a language pill in the header showing the detected language name.
4. WHERE the detected language is not English, THE Reflect_Mode SHALL display a "Translate to English" button.
5. THE Unified_AI_Service SHALL store the detected language code with the reflection metadata.

### Requirement 7

**User Story:** As a multilingual user, I want to translate summaries and reflections into other languages, so that I can work in my preferred language regardless of the source content language.

#### Acceptance Criteria

1. WHERE the Translator_API is available, THE Reflect_Mode SHALL display a "Translate" dropdown menu with common language options.
2. THE Translate dropdown SHALL include at least 10 languages: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, and Arabic.
3. WHEN the user selects a target language, THE Unified_AI_Service SHALL call the Translator_API to translate the summary and reflection prompts.
4. THE Translator_API SHALL preserve formatting including bullet points and line breaks in the translated text.
5. THE Reflect_Mode SHALL display the translated content while maintaining the original content in storage.

### Requirement 8

**User Story:** As a user, I want a seamless experience that automatically uses the best available AI API for each task, so that I get optimal results without needing to understand the technical details.

#### Acceptance Criteria

1. THE Unified_AI_Service SHALL use the Summarizer_API for summary generation WHEN available, otherwise fall back to Prompt_API.
2. THE Unified_AI_Service SHALL use the Writer_API for draft generation WHEN available, otherwise fall back to Prompt_API.
3. THE Unified_AI_Service SHALL use the Rewriter_API for tone adjustment WHEN available, otherwise fall back to Prompt_API.
4. THE Unified_AI_Service SHALL use the Proofreader_API for grammar checking WHEN available, otherwise hide the proofread feature.
5. THE Unified_AI_Service SHALL use the Language_Detector_API and Translator_API for multilingual features WHEN available, otherwise hide translation features.

### Requirement 9

**User Story:** As a developer, I want a unified service interface for all AI operations, so that I can easily add new AI features without duplicating capability checks and error handling.

#### Acceptance Criteria

1. THE Unified_AI_Service SHALL provide a single interface with methods for summarize, generateDraft, rewrite, proofread, detectLanguage, and translate operations.
2. THE Unified_AI_Service SHALL handle capability gating internally for each method without requiring callers to check availability.
3. THE Unified_AI_Service SHALL implement consistent error handling and timeout logic across all AI API calls.
4. THE Unified_AI_Service SHALL return standardized response objects with success status, data, and error information.
5. THE Unified_AI_Service SHALL log all AI operations with timing metrics for performance monitoring.

### Requirement 10

**User Story:** As a user, I want to enable experimental AI features through a developer mode toggle, so that I can try new capabilities as they become available in Chrome.

#### Acceptance Criteria

1. THE Settings page SHALL provide a "Developer Mode" toggle that enables experimental AI features.
2. WHERE Developer Mode is enabled, THE Unified_AI_Service SHALL attempt to use experimental API features such as multimodal Prompt_API.
3. THE Settings page SHALL display a warning message that experimental features may be unstable.
4. WHERE an experimental feature fails, THE Unified_AI_Service SHALL fall back to stable API versions without disrupting the user experience.
5. THE Dashboard SHALL display a badge indicating when experimental features are active.

### Requirement 11

**User Story:** As a user, I want visual indicators showing which AI features are active, so that I understand what capabilities are being used in my current session.

#### Acceptance Criteria

1. THE Reflect_Mode SHALL display small icons next to features indicating which AI API is powering them.
2. THE Dashboard SHALL include an "AI Status" section showing which Chrome_AI_APIs are currently available.
3. WHERE an AI API becomes unavailable during a session, THE Unified_AI_Service SHALL display a notification to the user.
4. THE Settings page SHALL display the current status of each Chrome_AI_API with green (available) or gray (unavailable) indicators.
5. THE Reflect_Mode SHALL display a tooltip on hover explaining what each AI feature does.

### Requirement 12

**User Story:** As a user, I want the system to handle API rate limits and quotas gracefully, so that I can continue using the extension even when AI resources are temporarily constrained.

#### Acceptance Criteria

1. IF an AI API call fails due to rate limiting, THEN THE Unified_AI_Service SHALL queue the request for retry after 2 seconds.
2. THE Unified_AI_Service SHALL implement exponential backoff with a maximum of 3 retry attempts for rate-limited requests.
3. IF all retry attempts fail, THEN THE Unified_AI_Service SHALL display a user-friendly message: "AI temporarily busy. Please try again in a moment."
4. THE Unified_AI_Service SHALL track API usage counts per session and display them in the Dashboard AI Status section.
5. WHERE API quotas are approaching limits, THE Unified_AI_Service SHALL display a warning notification to the user.
