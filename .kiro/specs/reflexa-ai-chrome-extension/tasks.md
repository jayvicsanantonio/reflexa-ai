# Implementation Plan

- [x] 1. Set up project structure and build configuration

  - Initialize Node.js (v22) project with TypeScript (latest) and React (latest)
  - Configure Vite (latest) for Chrome extension build with multiple entry points (background, content, popup, options)
  - Set up Tailwind CSS (latest) with design system tokens from design document
  - Create manifest.json with Manifest V3 structure, permissions, and component declarations
  - Configure TypeScript with strict mode and Chrome extension types
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Implement core type definitions and utilities

  - Create TypeScript types for Reflection, Settings, ExtractedContent, and PageMetadata
  - Implement constants file with default settings, timing values, and AI prompts
  - Create utility functions for UUID generation, date formatting, and token estimation
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 3. Build storage manager module

  - Implement StorageManager class with methods for saving, loading, and deleting reflections
  - Create methods for getting all reflections sorted by date
  - Implement storage quota checking and error handling
  - Add export functionality for JSON and Markdown formats
  - Implement streak calculation logic based on reflection dates
  - _Requirements: 5.3, 5.4, 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.5_

- [x] 4. Build settings manager module

  - Implement SettingsManager class with methods for loading and saving settings
  - Create default settings object with dwell threshold, sound, motion, and privacy preferences
  - Implement settings validation to ensure values are within acceptable ranges
  - Add method to reset settings to defaults
  - _Requirements: 3.4, 3.5, 6.1, 6.2, 6.3, 8.1, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 5. Implement AI manager for Gemini Nano integration (use Context7 MCP to see Gemini Nano Documentation and Google Chrome Extension Documentation and Google Web API Documentation)

  - Create AIManager class that wraps chrome.aiOriginTrial API
  - Implement checkAvailability method to detect if Gemini Nano is available
  - Create summarize method that sends content with three-bullet prompt and parses response
  - Implement generateReflectionPrompts method that requests two action-oriented questions
  - Add proofread method for optional grammar and clarity improvements
  - Implement timeout handling with 4-second limit and retry logic
  - Add content truncation for inputs exceeding 3000 tokens
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 10.3, 10.4_

- [x] 6. Create background service worker

  - Set up service worker entry point with message listener
  - Implement message routing for different action types (summarize, reflect, proofread, save, load)
  - Initialize AIManager, StorageManager, and SettingsManager instances
  - Create handlers for each message type that call appropriate manager methods
  - Implement error handling and response formatting for all message handlers
  - Add AI availability check on service worker startup
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7. Implement content extraction logic

  - Create ContentExtractor class that analyzes DOM structure
  - Implement heuristics to identify main article content (article tags, content density, semantic HTML)
  - Add logic to exclude navigation, advertisements, sidebars, and footer elements
  - Extract page title from document.title or meta tags
  - Implement word count calculation for extracted content
  - Add token estimation to check if content exceeds 3000 token limit
  - _Requirements: 1.3, 2.2, 10.4_

- [x] 8. Build dwell time tracking system

  - Create DwellTracker class that monitors page visibility and user interaction
  - Implement timer that increments while page is visible and user is active
  - Use Page Visibility API to pause timer when tab is hidden
  - Add event listeners for user interactions (scroll, mouse move, keyboard) to detect activity
  - Implement callback system to notify when dwell threshold is reached
  - Add method to reset timer on page navigation
  - Load dwell threshold from settings on initialization
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 12.4, 12.5_

- [x] 9. Create lotus nudge icon component

  - Build React component for floating lotus icon
  - Implement fade-in animation when dwell threshold is reached
  - Position icon fixed on page with z-index to stay above content
  - Add click handler that sends message to background worker to initiate reflection
  - Implement pulse animation to draw attention
  - Add accessibility attributes (role, aria-label)
  - _Requirements: 1.1, 1.2_

- [x] 10. Build breathing orb animation component

  - Create React component for circular breathing orb
  - Implement CSS animation with 7-second cycle (3.5s expand, 3.5s contract)
  - Use radial gradient for visual depth
  - Add scale transform animation from 1.0 to 1.2
  - Implement opacity animation from 0.9 to 1.0
  - Respect prefers-reduced-motion and settings to disable animation
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 6.1, 6.3_

- [x] 11. Implement audio system

  - Create AudioManager class to handle sound playback
  - Load audio files (entry chime, ambient loop, completion bell)
  - Implement play methods with volume control at 30%
  - Add looping logic for ambient sound
  - Implement stop methods to halt playback
  - Check settings before playing any audio
  - _Requirements: 3.1, 3.2, 3.5, 6.2_

- [x] 12. Build Reflect Mode overlay component

  - Create full-screen overlay React component with gradient background
  - Implement backdrop blur effect
  - Add breathing orb component at top center
  - Display three-bullet summary with labels (Insight, Surprise, Apply)
  - Show two reflection prompts with text input areas
  - Implement auto-resize for text inputs as user types
  - Add optional proofread button when enabled in settings
  - Create save and cancel buttons with keyboard shortcuts (Cmd/Ctrl+Enter, Escape)
  - Implement fade-in animation on mount
  - Disable page scroll while overlay is active
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.3, 4.4, 8.1, 8.4, 11.1_

- [x] 13. Implement content script orchestration

  - Create content script entry point that initializes on page load
  - Instantiate DwellTracker and ContentExtractor
  - Set up message listener for background worker responses
  - Implement shadow DOM creation for UI injection
  - Create React root in shadow DOM
  - Implement flow: start dwell tracking → show nudge → extract content → request AI → render overlay
  - Handle user save action by sending reflection data to background worker
  - Clean up overlay and reset state after save or cancel
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.4, 4.5, 11.5_

- [x] 14. Create reflection card component for dashboard

  - Build React component to display individual reflection
  - Show page title as heading with link to original URL
  - Display creation date in human-readable format
  - Render three-bullet summary with icons
  - Show user's reflection text in serif font (Lora)
  - Add hover effect with shadow transition
  - Implement optional delete button
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Build streak counter component

  - Create React component to display current reflection streak
  - Calculate streak from reflection dates (consecutive days with at least one reflection)
  - Display streak number with flame or lotus icon
  - Add animation when streak increases
  - Show last reflection date
  - _Requirements: 7.4_

- [ ] 16. Implement calm stats visualization

  - Create React component for reading vs reflection time ratio
  - Calculate total reflections, average per day, and time metrics
  - Build visual bar chart or progress indicator
  - Display statistics in calm, minimal design
  - Use design system colors and spacing
  - _Requirements: 7.5_

- [ ] 17. Build dashboard popup interface

  - Create popup React application shell
  - Implement layout with header, reflection list, and stats sections
  - Load reflections from storage on mount
  - Render reflection cards in scrollable list
  - Display streak counter at top
  - Show calm stats visualization
  - Add export button in header
  - Implement virtual scrolling for large reflection lists
  - Add privacy notice on first launch
  - _Requirements: 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 18. Create export modal and functionality

  - Build modal component for export format selection
  - Add radio buttons for JSON and Markdown formats
  - Implement JSON export that includes all reflection metadata
  - Create Markdown export with formatted headings and lists
  - Generate filename with current date
  - Trigger browser download of exported file
  - Add close button and overlay click to dismiss
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 19. Build settings page interface

  - Create options page React application
  - Implement settings sections for behavior, accessibility, and privacy
  - Add slider component for dwell threshold (30-300 seconds)
  - Create toggle switches for enable sound, reduce motion, and proofread
  - Add radio buttons for privacy mode (local vs sync)
  - Implement auto-save with debouncing on setting changes
  - Show visual feedback when settings are saved
  - Add reset to defaults button
  - _Requirements: 3.4, 3.5, 6.1, 6.2, 6.3, 8.1, 12.1, 12.2, 12.3_

- [ ] 20. Implement accessibility features

  - Add keyboard navigation support (Tab, Enter, Escape) across all components
  - Implement focus management in overlay (auto-focus first input, trap focus)
  - Add ARIA labels and roles to all interactive elements
  - Ensure color contrast ratios meet WCAG AA standards (4.5:1)
  - Implement focus visible styles with accent color outline
  - Detect prefers-reduced-motion and disable animations accordingly
  - Test with keyboard-only navigation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 21. Implement error handling and fallback modes

  - Add AI availability check in background worker on startup
  - Display modal when Gemini Nano is unavailable with manual reflection option
  - Implement manual mode overlay with empty summary fields for user input
  - Add timeout handling for AI requests with retry logic
  - Implement content truncation notification for large articles
  - Create storage quota exceeded modal with export prompt
  - Add error logging to console for debugging
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 22. Optimize performance

  - Implement React.memo for reflection card components to prevent unnecessary re-renders
  - Add virtual scrolling to dashboard reflection list
  - Optimize shadow DOM injection to minimize layout shifts
  - Use CSS animations instead of JavaScript for breathing orb
  - Implement lazy loading for audio files
  - Add performance monitoring to track overlay render time
  - Optimize content extraction to limit DOM traversal
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 23. Add Tailwind configuration with design tokens

  - Configure Tailwind with custom colors from design system (Zen Spectrum palette)
  - Add custom font families (Inter, Noto Sans Display, Lora, JetBrains Mono)
  - Configure spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px)
  - Add custom shadow utilities (soft, medium, inner)
  - Configure border radius values
  - Add custom animation keyframes for breathing and fading
  - Enable JIT mode for optimal bundle size
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 11.1_

- [ ] 24. Create audio assets

  - Generate or source entry chime sound (<1 second, gentle tone)
  - Create ambient loop audio (8 seconds, calming hum)
  - Generate completion bell sound (0.8 seconds, positive tone)
  - Optimize audio files for size (use OGG or MP3 compression)
  - Place audio files in public/audio directory
  - _Requirements: 3.1, 3.2_

- [ ] 25. Design and create extension icons

  - Create lotus icon in multiple sizes (16x16, 32x32, 48x48, 128x128)
  - Design in Zen aesthetic with blue gradient colors
  - Export as PNG files
  - Place in public/icons directory
  - Reference in manifest.json
  - _Requirements: 1.1, 1.2_

- [ ] 26. Write unit tests for core logic

  - Test dwell time calculation and reset logic
  - Test content extraction heuristics with sample HTML
  - Test storage manager CRUD operations
  - Test settings validation and defaults
  - Test reflection data transformations
  - Test export format generation (JSON and Markdown)
  - Test streak calculation logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.4, 9.3, 9.4_

- [ ] 27. Create integration tests for user flows

  - Test complete reflection flow from dwell detection to save
  - Test overlay rendering and interaction
  - Test dashboard display and reflection loading
  - Test settings persistence across sessions
  - Test export functionality
  - Test AI fallback when unavailable
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 4.4, 4.5, 7.1, 7.2, 7.3, 9.1, 9.2, 10.1, 10.2_

- [ ] 28. Perform accessibility testing

  - Test keyboard navigation through all interfaces
  - Test with screen reader (NVDA or JAWS)
  - Verify color contrast ratios with analyzer tool
  - Test with prefers-reduced-motion enabled
  - Verify focus management in overlay
  - Run automated Axe accessibility scan
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 29. Conduct performance testing

  - Measure overlay render time with Performance API
  - Monitor animation frame rate during breathing orb cycle
  - Profile memory usage during typical session
  - Measure AI latency for various content lengths
  - Run Lighthouse audit on popup and options pages
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 30. Create build and packaging scripts

  - Add npm scripts for development build with watch mode
  - Create production build script with minification
  - Implement zip script to package extension for distribution
  - Add linting script with ESLint and Prettier
  - Create pre-commit hooks for code quality
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 31. Write documentation
  - Create README with installation and development instructions
  - Document architecture and component structure
  - Add inline code comments for complex logic
  - Create user guide for extension features
  - Document AI prompts and their rationale
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_
