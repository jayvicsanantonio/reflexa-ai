# Requirements Document

## Introduction

Reflexa AI is a wellness-centered Chrome Extension that transforms everyday reading into calm, reflective micro-sessions. The system helps users absorb more, stress less, and remember what matters through guided reflection, AI-powered summarization, and focus tracking — all powered by Chrome's Gemini Nano AI running locally on the user's device. The extension detects when users have been reading for a sustained period, gently invites them to reflect, generates actionable summaries, and stores reflections in a calming "Reflect Mode" interface with a Zen-inspired aesthetic.

## Glossary

- **Reflexa_System**: The complete Chrome Extension including all components (content script, background service worker, popup dashboard, and options page)
- **Gemini_Nano**: Chrome's built-in AI model that runs locally on the user's device for on-device inference
- **Reflect_Mode**: The full-screen overlay interface with breathing orb animation where users engage with summaries and write reflections
- **Content_Script**: The JavaScript code injected into web pages that monitors user behavior and injects the Reflect Mode UI
- **Background_Service_Worker**: The persistent background process that orchestrates AI calls, manages storage, and coordinates between components
- **Dwell_Time**: The duration in seconds that a user remains focused on a webpage before being prompted to reflect
- **Reflection**: A user-generated response to AI-generated prompts, stored with the page summary and metadata
- **Dashboard**: The popup interface accessible via the extension icon showing reflection history, streaks, and statistics
- **Breathing_Orb**: The animated circular visual element that expands and contracts in a 7-second cycle to promote calm focus
- **Three_Bullet_Summary**: The AI-generated summary format consisting of exactly three points: Insight, Surprise, and Apply

## Requirements

### Requirement 1

**User Story:** As a student, I want the extension to detect when I've been reading an article for a while, so that I can be gently reminded to reflect on what I've learned without interrupting my flow.

#### Acceptance Criteria

1. WHEN the user has been actively viewing a webpage for at least the configured dwell threshold seconds, THE Content_Script SHALL display a floating lotus icon nudge on the page.
2. WHILE the user is on a webpage, THE Content_Script SHALL track the user's dwell time by monitoring page visibility and user interaction events.
3. THE Content_Script SHALL extract the main readable content from the DOM by identifying article text and excluding navigation, advertisements, and sidebar elements.
4. WHERE the user has configured a custom dwell threshold in settings, THE Reflexa_System SHALL use that threshold value instead of the default value.
5. IF the user navigates away from the page before reaching the dwell threshold, THEN THE Content_Script SHALL reset the dwell timer to zero.

### Requirement 2

**User Story:** As a professional, I want to see a calming overlay with an AI-generated summary when I choose to reflect, so that I can quickly capture the key insights without feeling overwhelmed.

#### Acceptance Criteria

1. WHEN the user clicks the lotus icon nudge, THE Content_Script SHALL inject the Reflect_Mode overlay into the current page.
2. THE Reflect_Mode SHALL display a Breathing_Orb that animates with a 7-second expansion and contraction cycle.
3. WHEN Reflect_Mode activates, THE Background_Service_Worker SHALL send the extracted page content to Gemini_Nano for summarization.
4. THE Gemini_Nano summarization SHALL generate a Three_Bullet_Summary with each bullet containing no more than 20 words.
5. THE Reflect_Mode SHALL display the Three_Bullet_Summary with labels "Insight", "Surprise", and "Apply" within 4 seconds of activation.

### Requirement 3

**User Story:** As a mindfulness seeker, I want the reflection experience to include calming audio and smooth animations, so that the process feels meditative and restorative rather than like another productivity tool.

#### Acceptance Criteria

1. WHEN Reflect_Mode activates, THE Reflexa_System SHALL play a gentle entry chime sound lasting less than 1 second at 30% volume.
2. WHILE Reflect_Mode is active, THE Reflexa_System SHALL play an 8-second ambient hum audio loop at 30% volume.
3. THE Reflect_Mode overlay SHALL fade in over 1 second using ease-in-out easing.
4. WHERE the user has enabled the "Reduce Motion" setting, THE Reflexa_System SHALL disable the Breathing_Orb animation and gradient drift effects.
5. WHERE the user has disabled sound in settings, THE Reflexa_System SHALL not play any audio during Reflect_Mode.

### Requirement 4

**User Story:** As a researcher, I want the AI to ask me thoughtful reflection questions based on the content, so that I can deepen my understanding and make the knowledge actionable.

#### Acceptance Criteria

1. WHEN the Three_Bullet_Summary is displayed, THE Background_Service_Worker SHALL request Gemini_Nano to generate exactly 2 reflection questions.
2. THE Gemini_Nano reflection questions SHALL be concise and action-oriented with each question containing no more than 15 words.
3. THE Reflect_Mode SHALL display the 2 reflection questions below the Three_Bullet_Summary.
4. THE Reflect_Mode SHALL provide text input areas for the user to type answers to each reflection question.
5. THE Reflexa_System SHALL store the user's reflection answers along with the summary and page metadata when the user saves the reflection.

### Requirement 5

**User Story:** As a privacy-conscious user, I want all AI processing to happen locally on my device, so that my reading habits and reflections never leave my computer.

#### Acceptance Criteria

1. THE Background_Service_Worker SHALL use only the chrome.aiOriginTrial API for all AI inference operations.
2. THE Reflexa_System SHALL not make any network requests to external servers for AI processing.
3. THE Reflexa_System SHALL store all reflection data using chrome.storage.local by default.
4. WHERE the user explicitly enables sync in settings, THE Reflexa_System SHALL use chrome.storage.sync for reflection data.
5. THE Dashboard SHALL display a privacy notice stating "Your reflections never leave your device" on first launch.

### Requirement 6

**User Story:** As a user with accessibility needs, I want to control motion and sound settings, so that the extension works comfortably for my sensory preferences.

#### Acceptance Criteria

1. THE Reflexa_System SHALL provide a settings toggle for "Reduce Motion" that disables all continuous animations.
2. THE Reflexa_System SHALL provide a settings toggle for "Enable Sound" that controls all audio playback.
3. WHEN the browser's prefers-reduced-motion setting is enabled, THE Reflexa_System SHALL automatically disable continuous animations.
4. THE Reflexa_System SHALL maintain color contrast ratios of at least 4.5:1 for all text elements to meet WCAG AA standards.
5. THE Reflexa_System SHALL support full keyboard navigation with Tab, Enter, and Escape keys across all interactive elements.

### Requirement 7

**User Story:** As a returning user, I want to view my past reflections in a dashboard, so that I can review what I've learned and track my reflection habits over time.

#### Acceptance Criteria

1. WHEN the user clicks the extension icon, THE Reflexa_System SHALL display the Dashboard popup.
2. THE Dashboard SHALL display a list of past reflections sorted by creation date with the most recent first.
3. THE Dashboard SHALL display each reflection with the page title, URL, creation date, summary bullets, and user's reflection text.
4. THE Dashboard SHALL calculate and display the user's current reflection streak as the number of consecutive days with at least one reflection.
5. THE Dashboard SHALL provide a visual representation of the user's reading versus reflection time ratio.

### Requirement 8

**User Story:** As a user, I want to optionally proofread my reflection text using AI, so that I can improve the clarity of my thoughts before saving.

#### Acceptance Criteria

1. WHERE the user has enabled proofreading in settings, THE Reflect_Mode SHALL display a "Proofread" button below the reflection text input.
2. WHEN the user clicks the "Proofread" button, THE Background_Service_Worker SHALL send the reflection text to Gemini_Nano for grammar and clarity improvements.
3. THE Gemini_Nano proofreading SHALL preserve the user's original tone and voice while making no more than 2 edits per sentence.
4. THE Reflect_Mode SHALL display the proofread version alongside the original text for user comparison.
5. THE Reflexa_System SHALL store both the original and proofread versions when the user saves the reflection.

### Requirement 9

**User Story:** As a user, I want to export my reflections to external formats, so that I can integrate them with my personal knowledge management tools.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an "Export" button that allows users to download their reflection data.
2. WHEN the user clicks "Export", THE Reflexa_System SHALL generate a file containing all reflections in either Markdown or JSON format based on user selection.
3. THE exported Markdown file SHALL format each reflection with the page title as a heading, followed by the summary bullets and reflection text.
4. THE exported JSON file SHALL include all reflection metadata including id, url, title, createdAt timestamp, summary array, and reflection array.
5. THE Reflexa_System SHALL trigger a browser download of the exported file with a filename including the current date.

### Requirement 10

**User Story:** As a user, I want the extension to handle errors gracefully, so that I can still use manual reflection features even when AI is unavailable.

#### Acceptance Criteria

1. IF Gemini_Nano is unavailable on the user's system, THEN THE Reflexa_System SHALL display a modal message stating "Local AI disabled — manual reflection available."
2. WHEN Gemini_Nano is unavailable, THE Reflect_Mode SHALL still display with empty summary fields that the user can manually fill in.
3. IF the AI summarization request times out after 4 seconds, THEN THE Background_Service_Worker SHALL retry the request once before falling back to manual mode.
4. IF the extracted page content exceeds 3000 tokens, THEN THE Background_Service_Worker SHALL truncate the content and display a notification to the user.
5. IF chrome.storage reaches capacity, THEN THE Reflexa_System SHALL prompt the user to export older reflections before saving new ones.

### Requirement 11

**User Story:** As a user, I want the extension to perform smoothly without slowing down my browsing, so that the reflection experience feels seamless and responsive.

#### Acceptance Criteria

1. THE Reflect_Mode overlay SHALL render and display within 300 milliseconds of user activation.
2. THE Breathing_Orb animation SHALL maintain 60 frames per second throughout the entire animation cycle.
3. THE Reflexa_System SHALL consume no more than 150 megabytes of memory during normal operation.
4. THE Background_Service_Worker SHALL complete AI summarization requests within 4 seconds for content under 3000 tokens.
5. THE Content_Script SHALL inject the Reflect_Mode UI without causing visible layout shifts or reflows on the host page.

### Requirement 12

**User Story:** As a user, I want to customize when the reflection nudge appears, so that I can adjust the timing to match my reading pace.

#### Acceptance Criteria

1. THE Reflexa_System SHALL provide a settings option for "Dwell Threshold" with a range from 30 to 300 seconds.
2. THE settings page SHALL display the current dwell threshold value in seconds with a slider control.
3. WHEN the user adjusts the dwell threshold setting, THE Background_Service_Worker SHALL save the new value to chrome.storage.local immediately.
4. THE Content_Script SHALL retrieve the current dwell threshold setting when initializing on each page.
5. THE Content_Script SHALL use the retrieved dwell threshold value to determine when to display the lotus icon nudge.
