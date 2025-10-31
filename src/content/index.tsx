import './styles.css';
import { createRoot } from 'react-dom/client';
import { DwellTracker } from './features/dwellTracking';
import { ContentExtractor } from './features/contentExtraction/contentExtractor';
import { LotusNudge, ErrorModal, Notification } from './components';
import { MeditationFlowOverlay } from './components/MeditationFlowOverlay';
import { AudioManager } from '../utils/audioManager';
import { performanceMonitor } from '../utils/performanceMonitor';
import type {
  Message,
  Settings,
  AIResponse,
  Reflection,
  ExtractedContent,
  SummaryFormat,
  LanguageDetection,
  AICapabilities,
  TonePreset,
  ProofreadResult,
  VoiceInputMetadata,
} from '../types';
import { generateUUID } from '../utils';
import { ERROR_MESSAGES } from '../constants';

console.log('Reflexa AI content script initialized');

// Global instances
let dwellTracker: DwellTracker | null = null;
let contentExtractor: ContentExtractor | null = null;
let audioManager: AudioManager | null = null;
let currentSettings: Settings | null = null;

// Nudge UI state
let nudgeContainer: HTMLDivElement | null = null;
let nudgeRoot: ReturnType<typeof createRoot> | null = null;
let isNudgeVisible = false;
let isNudgeLoading = false;

// Overlay UI state
let overlayContainer: HTMLDivElement | null = null;
let overlayRoot: ReturnType<typeof createRoot> | null = null;
let isOverlayVisible = false;

// Error modal UI state
let errorModalContainer: HTMLDivElement | null = null;
let errorModalRoot: ReturnType<typeof createRoot> | null = null;
let isErrorModalVisible = false;

// Notification UI state
let notificationContainer: HTMLDivElement | null = null;
let notificationRoot: ReturnType<typeof createRoot> | null = null;
let isNotificationVisible = false;

// Current reflection data
let currentExtractedContent: ExtractedContent | null = null;
let currentSummary: string[] = [];
let currentPrompts: string[] = [];
let currentSummaryFormat: SummaryFormat = 'bullets';
let isLoadingSummary = false;

// Language detection state
let currentLanguageDetection: LanguageDetection | null = null;
let isTranslating = false;
// Persistent target language for current overlay session. When set, all
// subsequent AI-generated outputs should appear in this language.
// Default target language for formatting/rewrites
let selectedTargetLanguage: string | null = 'en';
// Remember the original detected language for reliable translations after
// user changes target language.
let originalDetectedLanguage: string | null = null;

// Rewrite state
const isRewritingArray: boolean[] = [false, false];

// Ambient audio state
let isAmbientMuted = false;

// AI capabilities
let aiCapabilities: AICapabilities | null = null;

// AI availability status
let aiAvailable: boolean | null = null;

// AI Status modal UI state (replaces Help)
let helpModalContainer: HTMLDivElement | null = null;
let helpModalRoot: ReturnType<typeof createRoot> | null = null;
let isHelpModalVisible = false;

// Settings modal UI state
let settingsModalContainer: HTMLDivElement | null = null;
let settingsModalRoot: ReturnType<typeof createRoot> | null = null;
let isSettingsModalVisible = false;
// Dashboard modal UI state (content overlay)
let dashboardModalContainer: HTMLDivElement | null = null;
let dashboardModalRoot: ReturnType<typeof createRoot> | null = null;
let isDashboardModalVisible = false;

// Language names map removed (no longer shown in UI)

// Lotus nudge styles constant for better maintainability
const LOTUS_NUDGE_STYLES = `
  /* Keyframe animations */
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes pulseGentle {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  /* Base component styles */
  .reflexa-nudge-wrapper {
    position: fixed;
    z-index: 999999;
  }

  .reflexa-nudge-wrapper--bottom-right { bottom: 32px; right: 32px; }
  .reflexa-nudge-wrapper--bottom-left { bottom: 32px; left: 32px; }
  .reflexa-nudge-wrapper--top-right { top: 32px; right: 32px; }
  .reflexa-nudge-wrapper--top-left { top: 32px; left: 32px; }

  /* Expand wrapper hit area to include the vertical quick-actions column */
  .reflexa-nudge-wrapper--bottom-left,
  .reflexa-nudge-wrapper--bottom-right {
    padding-top: 160px; /* height to cover 3 x 44px + gaps */
  }
  .reflexa-nudge-wrapper--top-left,
  .reflexa-nudge-wrapper--top-right {
    padding-bottom: 160px;
  }

  .reflexa-lotus-nudge {
    position: relative; /* positioned by wrapper */
    width: 64px;
    height: 64px;
    background: linear-gradient(
      135deg,
      var(--color-zen-500, #0ea5e9) 0%,
      var(--color-zen-600, #0284c7) 100%
    );
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 999999;
    transition: transform 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, border-radius 0.2s ease;
    padding: 0 16px;
    /* Apply animations */
    animation:
      fadeIn 0.1s ease-in-out,
      pulseGentle 2s ease-in-out infinite;
  }

  /* Quick circular actions (hidden by default) */
  .reflexa-nudge-quick {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
  }

  .reflexa-nudge-wrapper--bottom-left .reflexa-nudge-quick { left: 0; bottom: 80px; }
  .reflexa-nudge-wrapper--bottom-right .reflexa-nudge-quick { right: 0; bottom: 80px; }
  .reflexa-nudge-wrapper--top-left .reflexa-nudge-quick { left: 0; top: 80px; }
  .reflexa-nudge-wrapper--top-right .reflexa-nudge-quick { right: 0; top: 80px; }

  .reflexa-nudge-wrapper[data-open="true"] .reflexa-nudge-quick,
  .reflexa-nudge-wrapper:hover .reflexa-nudge-quick,
  .reflexa-nudge-wrapper:focus-within .reflexa-nudge-quick {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .reflexa-nudge-quick__btn {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: none;
    background: var(--color-lotus-100, #eef2ff);
    color: var(--color-lotus-600, #4f46e5);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.18);
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .reflexa-nudge-quick__btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(79,70,229,.24); }
  .reflexa-nudge-quick__btn:active { transform: none; }
  .reflexa-nudge-quick__btn:focus-visible { outline: 3px solid rgba(79,70,229,.55); outline-offset: 3px; }

  /* Tooltips for quick actions */
  .reflexa-nudge-quick__btn {
    position: relative;
  }
  .reflexa-nudge-quick__tooltip {
    position: absolute;
    left: 52px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--color-calm-900, #0f172a);
    color: #fff;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    box-shadow: 0 8px 20px rgba(0,0,0,.25);
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s ease;
  }
  .reflexa-nudge-quick__btn:hover .reflexa-nudge-quick__tooltip,
  .reflexa-nudge-quick__btn:focus .reflexa-nudge-quick__tooltip { opacity: 1; }

  /* Position variants */
  .reflexa-lotus-nudge--bottom-right {}
  .reflexa-lotus-nudge--bottom-left {}
  .reflexa-lotus-nudge--top-right {}
  .reflexa-lotus-nudge--top-left {}

  /* Hover state */
  .reflexa-lotus-nudge:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
  }

  /* Expand into pill when open (hover/focus) */
  .reflexa-nudge-wrapper[data-open="true"] .reflexa-lotus-nudge,
  .reflexa-nudge-wrapper:hover .reflexa-lotus-nudge,
  .reflexa-nudge-wrapper:focus-within .reflexa-lotus-nudge {
    width: 220px;
    border-radius: 999px;
    justify-content: flex-start;
    gap: 10px;
  }

  .reflexa-lotus-nudge__label {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: .02em;
    opacity: 0;
    width: 0;
    margin-left: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity .18s ease, width .18s ease, margin-left .18s ease;
  }
  .reflexa-nudge-wrapper[data-open="true"] .reflexa-lotus-nudge__label,
  .reflexa-nudge-wrapper:hover .reflexa-lotus-nudge__label,
  .reflexa-nudge-wrapper:focus-within .reflexa-lotus-nudge__label {
    opacity: 1;
    width: auto;
    margin-left: 8px;
  }

  /* Active state */
  .reflexa-lotus-nudge:active {
    transform: scale(0.95);
  }

  /* Focus state */
  .reflexa-lotus-nudge:focus-visible {
    outline: 3px solid #0ea5e9;
    outline-offset: 4px;
  }

  /* Loading state */
  .reflexa-lotus-nudge--loading {
    cursor: wait;
    pointer-events: none;
    opacity: 0.7;
  }

  .reflexa-lotus-nudge--loading::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .reflexa-lotus-nudge {
      animation: fadeIn 0.3s ease-in-out;
    }
    .reflexa-nudge-quick { transition: none; }
  }
`;

/**
 * Initiate the complete reflection flow
 * Extracts content, requests AI processing, and shows overlay
 */
const initiateReflectionFlow = async () => {
  try {
    console.log('Starting reflection flow...');

    // Show loading state
    setNudgeLoadingState(true);

    // Check AI availability first if not already checked
    if (aiAvailable === null) {
      const aiCheckResponse = await sendMessageToBackground<boolean>({
        type: 'checkAI',
      });

      if (aiCheckResponse.success) {
        aiAvailable = aiCheckResponse.data;
        console.log('AI availability:', aiAvailable);
        if (!aiAvailable) {
          console.log(
            '💡 To enable AI: Check background service worker logs for instructions'
          );
        }
      } else {
        aiAvailable = false;
        console.error('AI check failed:', aiCheckResponse.error);
      }
    }

    // Get AI capabilities
    if (aiCapabilities === null) {
      const capabilitiesResponse =
        await sendMessageToBackground<AICapabilities>({
          type: 'getCapabilities',
        });

      if (capabilitiesResponse.success) {
        aiCapabilities = capabilitiesResponse.data;
        console.log('AI capabilities:', aiCapabilities);
      } else {
        console.error(
          'Failed to get capabilities:',
          capabilitiesResponse.error
        );
      }
    }

    // Extract content from the page
    contentExtractor ??= new ContentExtractor();

    currentExtractedContent = contentExtractor.extractMainContent();
    console.log(
      `Extracted ${currentExtractedContent.wordCount} words from page`
    );

    // Check if content exceeds token limit
    const { exceeds, tokens } = contentExtractor.checkTokenLimit(
      currentExtractedContent
    );
    if (exceeds) {
      console.warn(
        `Content exceeds token limit (${tokens} tokens), will be truncated`
      );
      currentExtractedContent = contentExtractor.getTruncatedContent(
        currentExtractedContent
      );

      // Show notification about truncation
      showNotification(
        'Long Article Detected',
        ERROR_MESSAGES.CONTENT_TOO_LARGE,
        'warning'
      );
    }

    // If AI is unavailable, show modal and proceed with manual mode
    if (!aiAvailable) {
      console.warn('AI unavailable, showing manual mode modal');
      showErrorModal(
        'AI Unavailable',
        ERROR_MESSAGES.AI_UNAVAILABLE,
        'ai-unavailable',
        () => {
          hideErrorModal();
          // Proceed with manual mode
          currentSummary = ['', '', ''];
          currentPrompts = [
            'What did you find most interesting?',
            'How might you apply this?',
          ];
          void showReflectModeOverlay();
        },
        'Continue with Manual Mode'
      );
      return;
    }

    // Show the Reflect Mode overlay immediately with loading state
    isLoadingSummary = true;
    currentSummary = [];
    currentPrompts = [
      'What did you find most interesting?',
      'How might you apply this?',
    ];
    void showReflectModeOverlay();

    // Request AI summarization AND language detection in parallel
    // This happens during the breathing phase (Step 0)
    console.log('Requesting AI summarization and language detection...');

    // Use default format from settings or fallback to bullets
    const defaultFormat = currentSettings?.defaultSummaryFormat ?? 'bullets';
    currentSummaryFormat = defaultFormat;

    const [summaryResponse, languageResponse] = await Promise.all([
      sendMessageToBackground<string[]>({
        type: 'summarize',
        payload: {
          content: currentExtractedContent.text,
          format: defaultFormat,
        },
      }),
      sendMessageToBackground<LanguageDetection>({
        type: 'detectLanguage',
        payload: {
          text: currentExtractedContent.text.substring(0, 500),
          pageUrl: currentExtractedContent.url,
        },
      }),
    ]);

    if (!summaryResponse.success) {
      console.error('Summarization failed:', summaryResponse.error);
      isLoadingSummary = false;

      // Check if it's a timeout error
      if (summaryResponse.error.includes('timeout')) {
        // Update overlay with error state
        currentSummary = ['', '', ''];
        void showReflectModeOverlay();
        return;
      }

      // Fall back to manual mode with empty summary
      currentSummary = ['', '', ''];
      void showReflectModeOverlay();
      return;
    }

    currentSummary = summaryResponse.data;
    console.log('Summary received:', currentSummary);

    // Handle language detection
    if (languageResponse.success) {
      currentLanguageDetection = languageResponse.data;
      // Capture original language once per session
      originalDetectedLanguage ??= currentLanguageDetection.detectedLanguage;
      console.log('Language detected:', currentLanguageDetection);

      // Auto-translate if needed (during breathing phase)
      if (shouldAutoTranslate(currentLanguageDetection, currentSettings)) {
        console.log('Auto-translating during breathing phase...');
        await handleAutoTranslate(currentLanguageDetection);
      }
    } else {
      console.warn('Language detection failed:', languageResponse.error);
      currentLanguageDetection = null;
    }

    isLoadingSummary = false;

    // Re-render overlay with summary loaded
    if (overlayRoot && overlayContainer) {
      const soundEnabled = Boolean(
        currentSettings?.enableSound && audioManager
      );
      const translationEnabled = Boolean(currentSettings?.enableTranslation);
      overlayRoot.render(
        <MeditationFlowOverlay
          summary={currentSummary}
          prompts={currentPrompts}
          onSave={handleSaveReflection}
          onCancel={handleCancelReflection}
          settings={currentSettings ?? getDefaultSettings()}
          onFormatChange={handleFormatChange}
          currentFormat={currentSummaryFormat}
          isLoadingSummary={false}
          languageDetection={currentLanguageDetection ?? undefined}
          onTranslateToEnglish={
            translationEnabled ? handleTranslateToEnglish : undefined
          }
          onTranslate={translationEnabled ? handleTranslate : undefined}
          isTranslating={translationEnabled ? isTranslating : false}
          onProofread={handleProofread}
          ambientMuted={soundEnabled ? isAmbientMuted : undefined}
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  if (!audioManager) return;
                  if (mute) {
                    await audioManager.stopAmbientLoopGracefully(400);
                    isAmbientMuted = true;
                  } else {
                    await audioManager.playAmbientLoopGracefully(400);
                    isAmbientMuted = false;
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }

    // Request AI reflection prompts
    console.log('Requesting reflection prompts...');
    const promptsResponse = await sendMessageToBackground<string[]>({
      type: 'reflect',
      payload: currentSummary,
    });

    if (!promptsResponse.success) {
      console.error('Reflection prompts failed:', promptsResponse.error);
      // Use default prompts
      currentPrompts = [
        'What did you find most interesting?',
        'How might you apply this?',
      ];
    } else {
      currentPrompts = promptsResponse.data;
      console.log('Prompts received:', currentPrompts);
    }

    // Update the overlay with prompts
    void showReflectModeOverlay();
  } catch (error) {
    console.error('Error in reflection flow:', error);
    // Show overlay with manual mode
    currentSummary = ['', '', ''];
    currentPrompts = [
      'What did you find most interesting?',
      'How might you apply this?',
    ];
    void showReflectModeOverlay();
  } finally {
    // Hide loading state
    setNudgeLoadingState(false);
  }
};

/**
 * Determine if content should be auto-translated
 */
const shouldAutoTranslate = (
  detection: LanguageDetection,
  settings: Settings | null
): boolean => {
  if (!settings?.enableTranslation) return false;
  if (!detection) return false;

  const userLang = navigator.language.split('-')[0];

  // Don't translate if already in user's language
  if (detection.detectedLanguage === userLang) return false;

  // Don't translate if already in preferred language
  if (detection.detectedLanguage === settings.preferredTranslationLanguage) {
    return false;
  }

  // Only auto-translate if confidence is very high (90%+)
  const threshold = 0.9;
  if (detection.confidence < threshold) return false;

  return true;
};

/**
 * Auto-translate content during breathing phase
 */
const handleAutoTranslate = async (detection: LanguageDetection) => {
  try {
    const targetLang =
      currentSettings?.preferredTranslationLanguage ??
      navigator.language.split('-')[0];

    // Check cache first
    const cacheKey = `translation:${currentExtractedContent?.url}:${detection.detectedLanguage}:${targetLang}`;
    const cached = await chrome.storage.local.get(cacheKey);

    if (cached[cacheKey]) {
      const cachedData = cached[cacheKey] as {
        summary: string[];
        timestamp: number;
      };
      const age = Date.now() - cachedData.timestamp;

      // Use cache if less than 24 hours old
      if (age < 24 * 60 * 60 * 1000) {
        console.log('Using cached translation');
        currentSummary = cachedData.summary;
        return;
      }
    }

    // Translate each bullet
    const translatedSummary: string[] = [];
    for (const bullet of currentSummary) {
      const response = await sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: bullet,
          source: detection.detectedLanguage,
          target: targetLang,
        },
      });

      if (response.success) {
        translatedSummary.push(response.data);
      } else {
        translatedSummary.push(bullet); // Keep original on error
      }
    }

    // Update summary
    currentSummary = translatedSummary;

    // Cache result
    await chrome.storage.local.set({
      [cacheKey]: {
        summary: translatedSummary,
        timestamp: Date.now(),
      },
    });

    console.log('Auto-translation complete');
  } catch (error) {
    console.error('Auto-translation failed:', error);
    // Keep original summary on error
  }
};

/**
 * Send a message to the background worker and wait for response
 * @param message Message to send
 * @returns Promise resolving to typed response
 */
const sendMessageToBackground = <T,>(
  message: Message
): Promise<AIResponse<T>> => {
  return new Promise((resolve) => {
    chrome.runtime
      .sendMessage(message)
      .then((response: unknown) => {
        resolve(response as AIResponse<T>);
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        });
      });
  });
};

/**
 * Helper function to render the overlay with current state
 * Used for initial render and re-renders when state changes
 */
const renderOverlay = () => {
  if (!overlayRoot || !overlayContainer) return;

  const handleToggleAmbient = async (mute: boolean) => {
    if (!audioManager) return;
    if (mute) {
      await audioManager.stopAmbientLoopGracefully(400);
      isAmbientMuted = true;
    } else {
      await audioManager.playAmbientLoopGracefully(400);
      isAmbientMuted = false;
    }
    // Re-render overlay to update mute button state
    renderOverlay();
  };

  const soundEnabled = Boolean(currentSettings?.enableSound && audioManager);
  const translationEnabled = Boolean(currentSettings?.enableTranslation);

  overlayRoot.render(
    <MeditationFlowOverlay
      summary={currentSummary}
      prompts={currentPrompts}
      onSave={handleSaveReflection}
      onCancel={handleCancelReflection}
      settings={currentSettings ?? getDefaultSettings()}
      onFormatChange={handleFormatChange}
      currentFormat={currentSummaryFormat}
      isLoadingSummary={isLoadingSummary}
      languageDetection={currentLanguageDetection ?? undefined}
      onTranslateToEnglish={
        translationEnabled ? handleTranslateToEnglish : undefined
      }
      onTranslate={translationEnabled ? handleTranslate : undefined}
      isTranslating={translationEnabled ? isTranslating : false}
      onProofread={handleProofread}
      ambientMuted={soundEnabled ? isAmbientMuted : undefined}
      onToggleAmbient={soundEnabled ? handleToggleAmbient : undefined}
    />
  );
};

/**
 * Show the Reflect Mode overlay
 * Creates shadow DOM and renders the overlay component
 * Optimized to minimize layout shifts and track render time
 */
const showReflectModeOverlay = async () => {
  if (isOverlayVisible) {
    console.log('Overlay already visible');
    return;
  }

  // Start performance measurement
  performanceMonitor.startMeasure('overlay-render');

  console.log('Showing Reflect Mode overlay...');

  // Load current settings
  currentSettings ??= await (async () => {
    const settingsResponse = await sendMessageToBackground<Settings>({
      type: 'getSettings',
    });
    return settingsResponse.success ? settingsResponse.data : null;
  })();

  // Initialize audio manager if sound is enabled
  if (currentSettings?.enableSound && !audioManager) {
    audioManager = new AudioManager(currentSettings);
  }

  // Play entry chime and ambient loop if enabled
  if (currentSettings?.enableSound && audioManager) {
    void audioManager.playEntryChime();
    void audioManager.playAmbientLoop();
  }

  // Create container for shadow DOM with optimized positioning
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'reflexa-overlay-container';
  // Set position and dimensions before appending to minimize layout shift
  overlayContainer.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647;';
  document.body.appendChild(overlayContainer);

  // Create shadow root for style isolation
  const shadowRoot = overlayContainer.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  // We need to link the stylesheet since shadow DOM requires explicit style injection
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  const cssUrl = chrome.runtime.getURL('src/content/styles.css');
  // Validate URL before setting href
  if (cssUrl && !cssUrl.includes('invalid')) {
    linkElement.href = cssUrl;
    shadowRoot.appendChild(linkElement);
  } else {
    console.warn('Invalid CSS URL, skipping stylesheet injection');
  }

  // Create root element for React
  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  // Render the ReflectModeOverlay component
  overlayRoot = createRoot(rootElement);

  // Use the helper function for initial render
  renderOverlay();

  isOverlayVisible = true;

  // End performance measurement
  performanceMonitor.endMeasure('overlay-render');

  // Start frame rate monitoring if animations are enabled
  if (!currentSettings?.reduceMotion) {
    performanceMonitor.startFrameRateMonitoring();
  }

  // Log memory usage
  performanceMonitor.logMemoryUsage();

  console.log('Reflect Mode overlay displayed');
};

/**
 * Get default settings as fallback
 * @returns Default Settings object
 */
const getDefaultSettings = (): Settings => ({
  dwellThreshold: 10,
  enableSound: true,
  reduceMotion: false,
  proofreadEnabled: false,
  privacyMode: 'local',
  useNativeSummarizer: false,
  useNativeProofreader: false,
  translationEnabled: false,
  targetLanguage: 'en',
  defaultSummaryFormat: 'bullets',
  enableProofreading: false,
  enableTranslation: true,
  preferredTranslationLanguage: 'en',
  experimentalMode: false,
  autoDetectLanguage: true,
  voiceAutoStopDelay: 10000,
});

/**
 * Handle save reflection action
 * Sends reflection data to background worker for storage
 */
const handleSaveReflection = async (
  reflections: string[],
  voiceMetadata?: VoiceInputMetadata[],
  originalReflections?: (string | null)[]
) => {
  console.log('Saving reflection...');

  try {
    // Stop ambient audio if playing
    if (audioManager) {
      audioManager.stopAmbientLoop();
    }

    // Determine if any reflection was proofread
    // If originalReflections has non-null values, it means proofreading was applied
    const hasProofreadVersion = originalReflections?.some(
      (orig) => orig !== null
    );

    // Build the final reflection array
    // Use original versions where available, otherwise use current reflections
    const finalReflections = reflections.map((reflection, index) => {
      const original = originalReflections?.[index];
      return original ?? reflection;
    });

    // Create reflection object
    const reflection: Reflection = {
      id: generateUUID(),
      url: currentExtractedContent?.url ?? window.location.href,
      title: currentExtractedContent?.title ?? document.title,
      createdAt: Date.now(),
      summary: currentSummary,
      reflection: finalReflections,
      proofreadVersion: hasProofreadVersion
        ? reflections.join('\n\n')
        : undefined,
      voiceMetadata,
    };

    // Send to background worker for storage
    const saveResponse = await sendMessageToBackground<void>({
      type: 'save',
      payload: reflection,
    });

    if (!saveResponse.success) {
      console.error('Failed to save reflection:', saveResponse.error);

      // Check if it's a storage full error
      if (saveResponse.error.includes('Storage full')) {
        // Hide overlay first
        hideReflectModeOverlay();

        // Show storage full modal with export option
        showErrorModal(
          'Storage Full',
          ERROR_MESSAGES.STORAGE_FULL,
          'storage-full',
          () => {
            hideErrorModal();
            // Open popup to export reflections
            void chrome.runtime.sendMessage({ type: 'openPopup' });
          },
          'Export Reflections'
        );
        return;
      }

      // Show generic error notification
      showNotification(
        'Save Failed',
        saveResponse.error || ERROR_MESSAGES.GENERIC_ERROR,
        'error'
      );
    } else {
      console.log('Reflection saved successfully');

      // Play completion bell if enabled (before hiding overlay)
      if (currentSettings?.enableSound && audioManager) {
        void audioManager.playCompletionBell();
      }
    }

    // Wait a brief moment for the completion bell to start playing
    // before hiding the overlay (bell continues playing after overlay closes)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clean up and hide overlay
    hideReflectModeOverlay();
    resetReflectionState();
  } catch (error) {
    console.error('Error saving reflection:', error);

    // Show error notification
    showNotification(
      'Save Failed',
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      'error'
    );

    // Still hide overlay even if save failed
    hideReflectModeOverlay();
    resetReflectionState();
  }
};

/**
 * Handle cancel reflection action
 * Closes overlay without saving and shows the nudge again
 */
const handleCancelReflection = () => {
  console.log('Reflection cancelled');

  // Stop ambient audio if playing
  if (audioManager) {
    audioManager.stopAmbientLoop();
  }

  // Clean up and hide overlay
  hideReflectModeOverlay();
  resetReflectionState();

  // Show the lotus nudge again so user can retry
  showLotusNudge();
};

/**
 * Handle proofread request
 * Sends text to background worker for AI proofreading
 */
const handleProofread = async (
  text: string,
  index: number
): Promise<ProofreadResult> => {
  console.log(`Proofreading reflection ${index}...`);

  try {
    const proofreadResponse = await sendMessageToBackground<ProofreadResult>({
      type: 'proofread',
      payload: text,
    });

    if (proofreadResponse.success) {
      console.log('Proofread completed');
      let result = proofreadResponse.data;

      // Ensure proofread output is in selected target language, if any
      if (selectedTargetLanguage && result.correctedText) {
        try {
          const detect = await sendMessageToBackground<LanguageDetection>({
            type: 'detectLanguage',
            payload: {
              text: result.correctedText.substring(0, 500),
              pageUrl: currentExtractedContent?.url ?? location.href,
            },
          });
          const sourceLang = detect.success
            ? detect.data.detectedLanguage
            : (originalDetectedLanguage ?? 'en');
          if (sourceLang !== selectedTargetLanguage) {
            const tr = await sendMessageToBackground<string>({
              type: 'translate',
              payload: {
                text: result.correctedText,
                source: sourceLang,
                target: selectedTargetLanguage,
              },
            });
            if (tr.success) {
              result = { ...result, correctedText: tr.data };
            }
          }
        } catch (e) {
          console.warn('Proofread translation skipped due to error:', e);
        }
      }

      return result;
    } else {
      console.error('Proofread failed:', proofreadResponse.error);
      throw new Error(proofreadResponse.error);
    }
  } catch (error) {
    console.error('Error proofreading:', error);
    throw error;
  }
};

/**
 * Handle translate request
 * Translates summary and prompts to target language
 */
const handleTranslate = async (targetLanguage: string) => {
  if (!currentLanguageDetection || !currentExtractedContent) {
    return;
  }

  console.log(`Translating to ${targetLanguage}...`);
  isTranslating = true;
  selectedTargetLanguage = targetLanguage;

  // Re-render with loading state
  if (overlayRoot && overlayContainer) {
    const soundEnabled = Boolean(currentSettings?.enableSound && audioManager);
    overlayRoot.render(
      <MeditationFlowOverlay
        summary={currentSummary}
        prompts={currentPrompts}
        onSave={handleSaveReflection}
        onCancel={handleCancelReflection}
        settings={currentSettings ?? getDefaultSettings()}
        onProofread={handleProofread}
        onFormatChange={handleFormatChange}
        currentFormat={currentSummaryFormat}
        isLoadingSummary={false}
        languageDetection={currentLanguageDetection}
        onTranslateToEnglish={handleTranslateToEnglish}
        onTranslate={handleTranslate}
        isTranslating={true}
        onRewrite={handleRewrite}
        isRewriting={isRewritingArray}
        proofreaderAvailable={aiCapabilities?.proofreader ?? false}
        ambientMuted={soundEnabled ? isAmbientMuted : undefined}
        onToggleAmbient={
          soundEnabled
            ? async (mute) => {
                if (!audioManager) return;
                if (mute) {
                  await audioManager.stopAmbientLoopGracefully(400);
                  isAmbientMuted = true;
                } else {
                  await audioManager.playAmbientLoopGracefully(400);
                  isAmbientMuted = false;
                }
                renderOverlay();
              }
            : undefined
        }
      />
    );
  }

  try {
    // Translate summary
    const translatedSummary: string[] = [];
    for (const bullet of currentSummary) {
      const translateResponse = await sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: bullet,
          source:
            originalDetectedLanguage ??
            currentLanguageDetection.detectedLanguage,
          target: targetLanguage,
        },
      });

      if (translateResponse.success) {
        translatedSummary.push(translateResponse.data);
      } else {
        console.error('Translation failed:', translateResponse.error);
        translatedSummary.push(bullet); // Keep original on error
      }
    }

    currentSummary = translatedSummary;

    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
    };

    showNotification(
      'Translation Complete',
      `Content translated to ${languageNames[targetLanguage] || targetLanguage}`,
      'info'
    );
  } catch (error) {
    console.error('Error translating:', error);
    showNotification(
      'Translation Failed',
      'Could not translate content',
      'error'
    );
  } finally {
    isTranslating = false;

    // Re-render overlay with translated content
    if (overlayRoot && overlayContainer) {
      const soundEnabled = Boolean(
        currentSettings?.enableSound && audioManager
      );
      overlayRoot.render(
        <MeditationFlowOverlay
          summary={currentSummary}
          prompts={currentPrompts}
          onSave={handleSaveReflection}
          onCancel={handleCancelReflection}
          settings={currentSettings ?? getDefaultSettings()}
          onProofread={handleProofread}
          onFormatChange={handleFormatChange}
          currentFormat={currentSummaryFormat}
          isLoadingSummary={false}
          languageDetection={currentLanguageDetection}
          onTranslateToEnglish={handleTranslateToEnglish}
          onTranslate={handleTranslate}
          isTranslating={false}
          onRewrite={handleRewrite}
          isRewriting={isRewritingArray}
          proofreaderAvailable={aiCapabilities?.proofreader ?? false}
          ambientMuted={soundEnabled ? isAmbientMuted : undefined}
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  if (!audioManager) return;
                  if (mute) {
                    await audioManager.stopAmbientLoopGracefully(400);
                    isAmbientMuted = true;
                  } else {
                    await audioManager.playAmbientLoopGracefully(400);
                    isAmbientMuted = false;
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }
  }
};

/**
 * Handle translate to English request
 * Translates summary and prompts to English
 */
const handleTranslateToEnglish = async () => {
  if (!currentLanguageDetection || !currentExtractedContent) {
    return;
  }

  console.log('Translating to English...');

  try {
    // Translate summary
    const translatedSummary: string[] = [];
    for (const bullet of currentSummary) {
      const translateResponse = await sendMessageToBackground<string>({
        type: 'translate',
        payload: {
          text: bullet,
          source: currentLanguageDetection.detectedLanguage,
          target: 'en',
        },
      });

      if (translateResponse.success) {
        translatedSummary.push(translateResponse.data);
      } else {
        console.error('Translation failed:', translateResponse.error);
        translatedSummary.push(bullet); // Keep original on error
      }
    }

    currentSummary = translatedSummary;

    // Update language detection to English
    currentLanguageDetection = {
      detectedLanguage: 'en',
      confidence: 1.0,
      languageName: 'English',
    };

    // Re-render overlay with translated content
    if (overlayRoot && overlayContainer) {
      const soundEnabled = Boolean(
        currentSettings?.enableSound && audioManager
      );
      overlayRoot.render(
        <MeditationFlowOverlay
          summary={currentSummary}
          prompts={currentPrompts}
          onSave={handleSaveReflection}
          onCancel={handleCancelReflection}
          settings={currentSettings ?? getDefaultSettings()}
          onProofread={handleProofread}
          onFormatChange={handleFormatChange}
          currentFormat={currentSummaryFormat}
          isLoadingSummary={false}
          languageDetection={currentLanguageDetection}
          onTranslateToEnglish={handleTranslateToEnglish}
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
          onRewrite={handleRewrite}
          isRewriting={isRewritingArray}
          proofreaderAvailable={aiCapabilities?.proofreader ?? false}
          ambientMuted={soundEnabled ? isAmbientMuted : undefined}
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  if (!audioManager) return;
                  if (mute) {
                    await audioManager.stopAmbientLoopGracefully(400);
                    isAmbientMuted = true;
                  } else {
                    await audioManager.playAmbientLoopGracefully(400);
                    isAmbientMuted = false;
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }

    showNotification(
      'Translation Complete',
      'Content translated to English',
      'info'
    );
  } catch (error) {
    console.error('Error translating to English:', error);
    showNotification(
      'Translation Failed',
      'Could not translate content to English',
      'error'
    );
  }
};

/**
 * Handle rewrite request
 * Rewrites text with selected tone preset
 */
const handleRewrite = async (
  text: string,
  tone: TonePreset,
  index: number
): Promise<{ original: string; rewritten: string }> => {
  console.log(`Rewriting reflection ${index} with tone: ${tone}...`);

  isRewritingArray[index] = true;

  try {
    const rewriteResponse = await sendMessageToBackground<{
      original: string;
      rewritten: string;
    }>({
      type: 'rewrite',
      payload: {
        text,
        tone,
      },
    });

    if (rewriteResponse.success) {
      console.log('Rewrite completed');
      const { original, rewritten: rw } = rewriteResponse.data;
      let rewritten = rw;

      // Ensure output language matches selected target language, if any
      if (selectedTargetLanguage) {
        try {
          // Detect language of rewritten text to avoid unnecessary translation
          const detect = await sendMessageToBackground<LanguageDetection>({
            type: 'detectLanguage',
            payload: {
              text: rewritten.substring(0, 500),
              pageUrl: currentExtractedContent?.url ?? location.href,
            },
          });
          const sourceLang = detect.success
            ? detect.data.detectedLanguage
            : (originalDetectedLanguage ?? 'en');
          if (sourceLang !== selectedTargetLanguage) {
            const tr = await sendMessageToBackground<string>({
              type: 'translate',
              payload: {
                text: rewritten,
                source: sourceLang,
                target: selectedTargetLanguage,
              },
            });
            if (tr.success) rewritten = tr.data;
          }
        } catch (e) {
          console.warn('Rewrite translation skipped due to error:', e);
        }
      }

      return { original, rewritten };
    } else {
      console.error('Rewrite failed:', rewriteResponse.error);
      throw new Error(rewriteResponse.error);
    }
  } catch (error) {
    console.error('Error rewriting:', error);
    throw error;
  } finally {
    isRewritingArray[index] = false;
  }
};

/**
 * Handle summary format change
 * Re-requests summary with new format from background worker
 */
const handleFormatChange = async (format: SummaryFormat) => {
  if (!currentExtractedContent || isLoadingSummary) {
    return;
  }

  console.log(`Changing summary format to: ${format}`);
  currentSummaryFormat = format;
  isLoadingSummary = true;

  // Re-render overlay with loading state
  if (overlayRoot && overlayContainer) {
    const soundEnabled = Boolean(currentSettings?.enableSound && audioManager);
    const translationEnabled = Boolean(currentSettings?.enableTranslation);
    overlayRoot.render(
      <MeditationFlowOverlay
        summary={currentSummary}
        prompts={currentPrompts}
        onSave={handleSaveReflection}
        onCancel={handleCancelReflection}
        settings={currentSettings ?? getDefaultSettings()}
        onFormatChange={handleFormatChange}
        currentFormat={currentSummaryFormat}
        isLoadingSummary={true}
        languageDetection={currentLanguageDetection ?? undefined}
        onTranslateToEnglish={
          translationEnabled ? handleTranslateToEnglish : undefined
        }
        onTranslate={translationEnabled ? handleTranslate : undefined}
        isTranslating={translationEnabled ? isTranslating : false}
        onProofread={handleProofread}
        ambientMuted={soundEnabled ? isAmbientMuted : undefined}
        onToggleAmbient={
          soundEnabled
            ? async (mute) => {
                if (!audioManager) return;
                if (mute) {
                  await audioManager.stopAmbientLoopGracefully(400);
                  isAmbientMuted = true;
                } else {
                  await audioManager.playAmbientLoopGracefully(400);
                  isAmbientMuted = false;
                }
                renderOverlay();
              }
            : undefined
        }
      />
    );
  }

  try {
    // Request new summary with selected format
    const summaryResponse = await sendMessageToBackground<string[]>({
      type: 'summarize',
      payload: {
        content: currentExtractedContent.text,
        format: format,
      },
    });

    if (summaryResponse.success) {
      let newSummary = summaryResponse.data;
      // If the user selected a target language, translate the freshly
      // generated summary to that language.
      if (selectedTargetLanguage) {
        const translated: string[] = [];
        for (const item of newSummary) {
          const tr = await sendMessageToBackground<string>({
            type: 'translate',
            payload: {
              text: item,
              source: originalDetectedLanguage ?? 'en',
              target: selectedTargetLanguage,
            },
          });
          translated.push(tr.success ? tr.data : item);
        }
        newSummary = translated;
      }
      currentSummary = newSummary;
      console.log('Summary updated with new format:', currentSummary);
    } else {
      console.error('Failed to update summary format:', summaryResponse.error);
      // Keep existing summary on error
      showNotification(
        'Format Change Failed',
        'Could not update summary format. Using previous format.',
        'error'
      );
    }
  } catch (error) {
    console.error('Error changing format:', error);
    showNotification(
      'Format Change Failed',
      'An error occurred while changing format.',
      'error'
    );
  } finally {
    isLoadingSummary = false;

    // Re-render overlay with updated summary
    if (overlayRoot && overlayContainer) {
      const soundEnabled = Boolean(
        currentSettings?.enableSound && audioManager
      );
      const translationEnabled = Boolean(currentSettings?.enableTranslation);
      overlayRoot.render(
        <MeditationFlowOverlay
          summary={currentSummary}
          prompts={currentPrompts}
          onSave={handleSaveReflection}
          onCancel={handleCancelReflection}
          settings={currentSettings ?? getDefaultSettings()}
          onFormatChange={handleFormatChange}
          currentFormat={currentSummaryFormat}
          isLoadingSummary={false}
          languageDetection={currentLanguageDetection ?? undefined}
          onTranslateToEnglish={
            translationEnabled ? handleTranslateToEnglish : undefined
          }
          onTranslate={translationEnabled ? handleTranslate : undefined}
          isTranslating={translationEnabled ? isTranslating : false}
          onProofread={handleProofread}
          ambientMuted={soundEnabled ? isAmbientMuted : undefined}
          onToggleAmbient={
            soundEnabled
              ? async (mute) => {
                  if (!audioManager) return;
                  if (mute) {
                    await audioManager.stopAmbientLoopGracefully(400);
                    isAmbientMuted = true;
                  } else {
                    await audioManager.playAmbientLoopGracefully(400);
                    isAmbientMuted = false;
                  }
                  renderOverlay();
                }
              : undefined
          }
        />
      );
    }
  }
};

/**
 * Hide the Reflect Mode overlay
 * Removes the component and cleans up the DOM
 */
const hideReflectModeOverlay = () => {
  if (!isOverlayVisible) {
    return;
  }

  // Stop ambient audio if playing
  if (audioManager) {
    audioManager.stopAmbientLoop();
  }

  // Stop frame rate monitoring if active
  performanceMonitor.stopFrameRateMonitoring();

  // Unmount React component
  if (overlayRoot) {
    overlayRoot.unmount();
    overlayRoot = null;
  }

  // Remove container from DOM
  if (overlayContainer?.parentNode) {
    overlayContainer.parentNode.removeChild(overlayContainer);
    overlayContainer = null;
  }

  isOverlayVisible = false;
  console.log('Reflect Mode overlay hidden');
};

/**
 * Reset reflection state after save or cancel
 * Clears current data and resets dwell tracker
 */
const resetReflectionState = () => {
  currentExtractedContent = null;
  currentSummary = [];
  currentPrompts = [];
  currentSummaryFormat = 'bullets';
  isLoadingSummary = false;

  // Reset dwell tracker to start tracking again
  if (dwellTracker) {
    dwellTracker.reset();
  }

  console.log('Reflection state reset');
};

/**
 * Initialize the content script
 * Sets up dwell tracking and prepares for UI injection
 */
const initializeContentScript = async () => {
  console.log('Content script ready');

  try {
    // Load settings from background worker
    const settings = await getSettings();
    currentSettings = settings;

    // Initialize content extractor
    contentExtractor = new ContentExtractor();

    // Initialize dwell tracker with threshold from settings
    dwellTracker = new DwellTracker(settings.dwellThreshold);

    // Register callback for when threshold is reached
    dwellTracker.onThresholdReached(() => {
      handleDwellThresholdReached();
    });

    // Start tracking dwell time
    dwellTracker.startTracking();

    // Listen for page navigation to reset tracker
    setupNavigationListeners();

    // Set up message listener for background worker responses
    setupMessageListener();

    console.log(
      `Dwell tracking started with threshold: ${settings.dwellThreshold}s`
    );
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
};

/**
 * Get settings from background worker
 * @returns Settings object
 */
const getSettings = async (): Promise<Settings> => {
  const message: Message = {
    type: 'getSettings',
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const response = await chrome.runtime.sendMessage(message);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (response.success) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return response.data as Settings;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error('Failed to load settings:', response.error);
    // Return default settings as fallback
    return {
      dwellThreshold: 30,
      enableSound: true,
      reduceMotion: false,
      proofreadEnabled: false,
      privacyMode: 'local',
      useNativeSummarizer: false,
      useNativeProofreader: false,
      translationEnabled: false,
      targetLanguage: 'en',
      defaultSummaryFormat: 'bullets',
      enableProofreading: false,
      enableTranslation: false,
      preferredTranslationLanguage: 'en',
      experimentalMode: false,
      autoDetectLanguage: true,
    };
  }
};

/**
 * Set loading state for the lotus nudge
 * @param loading Whether the nudge is in loading state
 */
const setNudgeLoadingState = (loading: boolean) => {
  isNudgeLoading = loading;

  if (!nudgeContainer) return;

  const shadowRoot = nudgeContainer.shadowRoot;
  if (!shadowRoot) return;

  const nudgeElement = shadowRoot.querySelector('.reflexa-lotus-nudge');
  if (!nudgeElement) return;

  if (loading) {
    nudgeElement.classList.add('reflexa-lotus-nudge--loading');
    nudgeElement.setAttribute('aria-label', 'Processing content...');
    nudgeElement.setAttribute('aria-busy', 'true');
  } else {
    nudgeElement.classList.remove('reflexa-lotus-nudge--loading');
    nudgeElement.setAttribute('aria-label', 'Start reflection');
    nudgeElement.setAttribute('aria-busy', 'false');
  }
};

/**
 * Handle when dwell threshold is reached
 * Shows the lotus nudge icon to invite reflection
 */
const handleDwellThresholdReached = () => {
  console.log('Dwell threshold reached!');
  showLotusNudge();
};

/**
 * Show the lotus nudge icon
 * Creates a shadow DOM container and renders the React component
 */
const showLotusNudge = () => {
  if (isNudgeVisible) {
    console.log('Nudge already visible');
    return;
  }

  // Ensure document.body is available
  if (!document.body) {
    console.error('document.body not available yet, retrying...');
    setTimeout(showLotusNudge, 100);
    return;
  }

  // Create container for shadow DOM
  nudgeContainer = document.createElement('div');
  nudgeContainer.id = 'reflexa-nudge-container';
  document.body.appendChild(nudgeContainer);

  // Create shadow root for style isolation
  const shadowRoot = nudgeContainer.attachShadow({ mode: 'open' });

  // Create style element and inject our styles
  const styleElement = document.createElement('style');
  styleElement.textContent = LOTUS_NUDGE_STYLES;
  shadowRoot.appendChild(styleElement);

  // Create root element for React
  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  // Render the LotusNudge component
  nudgeRoot = createRoot(rootElement);
  nudgeRoot.render(
    <LotusNudge
      visible={true}
      onClick={handleNudgeClick}
      position="bottom-left"
      quickActionsCount={3}
      onDashboard={() => {
        void showDashboardModal();
      }}
      onHelp={() => {
        void showHelpModal();
      }}
      onSettings={() => {
        void showSettingsModal();
      }}
      onAnimationComplete={() => {
        console.log('Lotus nudge fade-in animation completed');
      }}
    />
  );

  isNudgeVisible = true;
  console.log('Lotus nudge displayed');
};

/**
 * Handle click on lotus nudge icon
 * Initiates the complete reflection flow
 */
const handleNudgeClick = async () => {
  console.log('Lotus nudge clicked - initiating reflection');

  // Prevent multiple clicks while loading
  if (isNudgeLoading) {
    console.log('Already processing, ignoring click');
    return;
  }

  // Start the reflection flow (loading state managed inside)
  await initiateReflectionFlow();

  // Hide the nudge after processing completes
  hideLotusNudge();
};

/**
 * Hide the lotus nudge icon
 * Removes the component and cleans up the DOM
 */
const hideLotusNudge = () => {
  if (!isNudgeVisible) {
    return;
  }

  // Unmount React component
  if (nudgeRoot) {
    nudgeRoot.unmount();
    nudgeRoot = null;
  }

  // Remove container from DOM
  if (nudgeContainer?.parentNode) {
    nudgeContainer.parentNode.removeChild(nudgeContainer);
    nudgeContainer = null;
  }

  isNudgeVisible = false;
  console.log('Lotus nudge hidden');
};

/** Show AI Status modal in the center of the page */
const showHelpModal = async () => {
  if (isHelpModalVisible) return;
  helpModalContainer = document.createElement('div');
  helpModalContainer.id = 'reflexa-ai-status-container';
  document.body.appendChild(helpModalContainer);

  const shadowRoot = helpModalContainer.attachShadow({ mode: 'open' });
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  const cssUrl = chrome.runtime.getURL('src/content/styles.css');
  if (cssUrl && !cssUrl.includes('invalid')) {
    linkElement.href = cssUrl;
    shadowRoot.appendChild(linkElement);
  }

  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  helpModalRoot = createRoot(rootElement);
  const { AIStatusModal } = await import('./components/AIStatusModal');
  helpModalRoot.render(<AIStatusModal onClose={hideHelpModal} />);

  isHelpModalVisible = true;
};

/** Hide AI Status modal */
const hideHelpModal = () => {
  if (!isHelpModalVisible) return;
  if (helpModalRoot) {
    helpModalRoot.unmount();
    helpModalRoot = null;
  }
  if (helpModalContainer?.parentNode) {
    helpModalContainer.parentNode.removeChild(helpModalContainer);
    helpModalContainer = null;
  }
  isHelpModalVisible = false;
};

/**
 * Show Quick Settings modal in the center of the page
 */
const showSettingsModal = async () => {
  if (isSettingsModalVisible) return;
  settingsModalContainer = document.createElement('div');
  settingsModalContainer.id = 'reflexa-settings-container';
  document.body.appendChild(settingsModalContainer);

  const shadowRoot = settingsModalContainer.attachShadow({ mode: 'open' });
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  const cssUrl = chrome.runtime.getURL('src/content/styles.css');
  if (cssUrl && !cssUrl.includes('invalid')) {
    linkElement.href = cssUrl;
    shadowRoot.appendChild(linkElement);
  }

  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  settingsModalRoot = createRoot(rootElement);
  const { QuickSettingsModal } = await import(
    './components/QuickSettingsModal'
  );
  settingsModalRoot.render(<QuickSettingsModal onClose={hideSettingsModal} />);

  isSettingsModalVisible = true;
};

/** Hide Quick Settings modal */
const hideSettingsModal = () => {
  if (!isSettingsModalVisible) return;
  if (settingsModalRoot) {
    settingsModalRoot.unmount();
    settingsModalRoot = null;
  }
  if (settingsModalContainer?.parentNode) {
    settingsModalContainer.parentNode.removeChild(settingsModalContainer);
    settingsModalContainer = null;
  }
  isSettingsModalVisible = false;
};

/**
 * Set up message listener for background worker responses
 * Handles any messages sent from the background worker
 */
const setupMessageListener = () => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      try {
        if (message && typeof message === 'object' && 'type' in message) {
          const { type } = message as { type: string };
          if (type === 'settingsUpdated') {
            const updated = (message as { data?: unknown }).data as
              | Settings
              | undefined;
            if (updated) {
              console.log('Applying live settings update:', updated);
              currentSettings = updated;
              // Toast for user feedback
              try {
                showNotification('Settings updated', '', 'info');
              } catch {
                // no-op
              }
              // Live-update dwell tracker so changes take effect immediately
              if (dwellTracker) {
                dwellTracker.setDwellThreshold(updated.dwellThreshold);
                // Reset to apply new threshold from now
                dwellTracker.reset();
              }
              // Live-update audio behavior
              if (audioManager) {
                audioManager.updateSettings(updated);
              } else if (updated.enableSound) {
                audioManager = new AudioManager(updated);
              }
              if (isOverlayVisible && audioManager) {
                if (updated.enableSound) {
                  void audioManager.playAmbientLoopGracefully(300);
                } else {
                  void audioManager.stopAmbientLoopGracefully(300);
                }
              }

              // If overlay is mounted, re-render via unified renderer to reflect toggles consistently
              if (isOverlayVisible && overlayRoot && overlayContainer) {
                renderOverlay();
              }
            }
          } else if (type === 'openDashboard') {
            void showDashboardModal();
            sendResponse({ success: true });
            return true;
          } else if (type === 'startReflection') {
            // Mirror lotus click behavior
            void (async () => {
              try {
                await initiateReflectionFlow();
                sendResponse({ success: true });
              } catch {
                sendResponse({ success: false });
              }
            })();
            return true;
          }
        }
      } catch (e) {
        console.warn('Error handling incoming message in content script:', e);
      }

      sendResponse({ success: true });
      return true;
    }
  );
};

/**
 * Set up listeners for page navigation
 * Resets the dwell tracker when navigating to a new page
 */
const setupNavigationListeners = () => {
  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    if (dwellTracker) {
      dwellTracker.reset();
      console.log('Dwell tracker reset due to navigation');
    }
  });

  // Listen for pushState/replaceState (SPA navigation)
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    if (dwellTracker) {
      dwellTracker.reset();
      console.log('Dwell tracker reset due to pushState');
    }
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    if (dwellTracker) {
      dwellTracker.reset();
      console.log('Dwell tracker reset due to replaceState');
    }
  };
};

/**
 * Show error modal with specified configuration
 * @param title Modal title
 * @param message Error message
 * @param type Error type
 * @param onAction Optional action callback
 * @param actionLabel Optional action button label
 */
const showErrorModal = (
  title: string,
  message: string,
  type: 'ai-unavailable' | 'ai-timeout' | 'content-truncated' | 'storage-full',
  onAction?: () => void,
  actionLabel?: string
) => {
  if (isErrorModalVisible) {
    console.log('Error modal already visible');
    return;
  }

  console.log('Showing error modal:', type);

  // Create container for shadow DOM
  errorModalContainer = document.createElement('div');
  errorModalContainer.id = 'reflexa-error-modal-container';
  document.body.appendChild(errorModalContainer);

  // Create shadow root for style isolation
  const shadowRoot = errorModalContainer.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  const cssUrl = chrome.runtime.getURL('src/content/styles.css');
  // Validate URL before setting href
  if (cssUrl && !cssUrl.includes('invalid')) {
    linkElement.href = cssUrl;
    shadowRoot.appendChild(linkElement);
  } else {
    console.warn('Invalid CSS URL, skipping stylesheet injection');
  }

  // Create root element for React
  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  // Render the ErrorModal component
  errorModalRoot = createRoot(rootElement);
  errorModalRoot.render(
    <ErrorModal
      title={title}
      message={message}
      type={type}
      onClose={hideErrorModal}
      onAction={onAction}
      actionLabel={actionLabel}
    />
  );

  isErrorModalVisible = true;
  console.log('Error modal displayed');
};

/**
 * Hide the error modal
 * Removes the component and cleans up the DOM
 */
const hideErrorModal = () => {
  if (!isErrorModalVisible) {
    return;
  }

  // Unmount React component
  if (errorModalRoot) {
    errorModalRoot.unmount();
    errorModalRoot = null;
  }

  // Remove container from DOM
  if (errorModalContainer?.parentNode) {
    errorModalContainer.parentNode.removeChild(errorModalContainer);
    errorModalContainer = null;
  }

  isErrorModalVisible = false;
  console.log('Error modal hidden');
};

/**
 * Show notification toast
 * @param title Notification title
 * @param message Notification message
 * @param type Notification type
 * @param duration Optional duration in milliseconds
 */
const showNotification = (
  title: string,
  message: string,
  type: 'warning' | 'error' | 'info',
  duration = 5000
) => {
  // Hide existing notification if visible
  if (isNotificationVisible) {
    hideNotification();
  }

  console.log('Showing notification:', type, title);

  // Create container for shadow DOM
  notificationContainer = document.createElement('div');
  notificationContainer.id = 'reflexa-notification-container';
  document.body.appendChild(notificationContainer);

  // Create shadow root for style isolation
  const shadowRoot = notificationContainer.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  const cssUrl = chrome.runtime.getURL('src/content/styles.css');
  // Validate URL before setting href
  if (cssUrl && !cssUrl.includes('invalid')) {
    linkElement.href = cssUrl;
    shadowRoot.appendChild(linkElement);
  } else {
    console.warn('Invalid CSS URL, skipping stylesheet injection');
  }

  // Create root element for React
  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  // Render the Notification component
  notificationRoot = createRoot(rootElement);
  notificationRoot.render(
    <Notification
      title={title}
      message={message}
      type={type}
      duration={duration}
      onClose={hideNotification}
    />
  );

  isNotificationVisible = true;
  console.log('Notification displayed');
};

/**
 * Hide the notification toast
 * Removes the component and cleans up the DOM
 */
const hideNotification = () => {
  if (!isNotificationVisible) {
    return;
  }

  // Unmount React component
  if (notificationRoot) {
    notificationRoot.unmount();
    notificationRoot = null;
  }

  // Remove container from DOM
  if (notificationContainer?.parentNode) {
    notificationContainer.parentNode.removeChild(notificationContainer);
    notificationContainer = null;
  }

  isNotificationVisible = false;
  console.log('Notification hidden');
};

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
  if (dwellTracker) {
    dwellTracker.destroy();
  }
  if (audioManager) {
    audioManager.stopAmbientLoop();
  }
  hideLotusNudge();
  hideReflectModeOverlay();
  hideErrorModal();
  hideNotification();
});

// Initialize the content script
void initializeContentScript();

/** Show Dashboard modal */
async function showDashboardModal() {
  if (isDashboardModalVisible) return;
  dashboardModalContainer = document.createElement('div');
  dashboardModalContainer.id = 'reflexa-dashboard-modal-container';
  document.body.appendChild(dashboardModalContainer);

  const shadowRoot = dashboardModalContainer.attachShadow({ mode: 'open' });
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('src/content/styles.css');
  shadowRoot.appendChild(link);
  const root = document.createElement('div');
  shadowRoot.appendChild(root);
  dashboardModalRoot = createRoot(root);
  const { DashboardModal } = await import('./components/DashboardModal');
  dashboardModalRoot.render(<DashboardModal onClose={hideDashboardModal} />);
  isDashboardModalVisible = true;
}

function hideDashboardModal() {
  if (!isDashboardModalVisible) return;
  if (dashboardModalRoot) {
    dashboardModalRoot.unmount();
    dashboardModalRoot = null;
  }
  if (dashboardModalContainer?.parentNode) {
    dashboardModalContainer.parentNode.removeChild(dashboardModalContainer);
    dashboardModalContainer = null;
  }
  isDashboardModalVisible = false;
}
