import './styles.css';
import { createRoot } from 'react-dom/client';
import { DwellTracker } from './dwellTracker';
import { ContentExtractor } from './contentExtractor';
import { LotusNudge } from './LotusNudge';
import { ReflectModeOverlay } from './ReflectModeOverlay';
import { AudioManager } from '../utils/audioManager';
import type {
  Message,
  Settings,
  AIResponse,
  Reflection,
  ExtractedContent,
} from '../types';
import { generateUUID } from '../utils';

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

// Current reflection data
let currentExtractedContent: ExtractedContent | null = null;
let currentSummary: string[] = [];
let currentPrompts: string[] = [];

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
  .reflexa-lotus-nudge {
    position: fixed;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 999999;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    /* Apply animations */
    animation:
      fadeIn 1s ease-in-out,
      pulseGentle 2s ease-in-out infinite 1s;
  }

  /* Position variants */
  .reflexa-lotus-nudge--bottom-right {
    bottom: 32px;
    right: 32px;
  }

  .reflexa-lotus-nudge--bottom-left {
    bottom: 32px;
    left: 32px;
  }

  .reflexa-lotus-nudge--top-right {
    top: 32px;
    right: 32px;
  }

  .reflexa-lotus-nudge--top-left {
    top: 32px;
    left: 32px;
  }

  /* Hover state */
  .reflexa-lotus-nudge:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
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
    }

    // Request AI summarization
    console.log('Requesting AI summarization...');
    const summaryResponse = await sendMessageToBackground<string[]>({
      type: 'summarize',
      payload: currentExtractedContent.text,
    });

    if (!summaryResponse.success) {
      console.error('Summarization failed:', summaryResponse.error);
      // Fall back to manual mode with empty summary
      currentSummary = ['', '', ''];
      currentPrompts = [
        'What did you find most interesting?',
        'How might you apply this?',
      ];
      void showReflectModeOverlay();
      return;
    }

    currentSummary = summaryResponse.data;
    console.log('Summary received:', currentSummary);

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

    // Show the Reflect Mode overlay
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
        });
      });
  });
};

/**
 * Show the Reflect Mode overlay
 * Creates shadow DOM and renders the overlay component
 */
const showReflectModeOverlay = async () => {
  if (isOverlayVisible) {
    console.log('Overlay already visible');
    return;
  }

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
    audioManager = new AudioManager();
  }

  // Play entry chime if enabled
  if (currentSettings?.enableSound && audioManager) {
    void audioManager.playEntryChime();
    void audioManager.playAmbientLoop();
  }

  // Create container for shadow DOM
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'reflexa-overlay-container';
  document.body.appendChild(overlayContainer);

  // Create shadow root for style isolation
  const shadowRoot = overlayContainer.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  // We need to link the stylesheet since shadow DOM requires explicit style injection
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = chrome.runtime.getURL('src/content/styles.css');
  shadowRoot.appendChild(linkElement);

  // Create root element for React
  const rootElement = document.createElement('div');
  shadowRoot.appendChild(rootElement);

  // Render the ReflectModeOverlay component
  overlayRoot = createRoot(rootElement);
  overlayRoot.render(
    <ReflectModeOverlay
      summary={currentSummary}
      prompts={currentPrompts}
      onSave={handleSaveReflection}
      onCancel={handleCancelReflection}
      settings={currentSettings ?? getDefaultSettings()}
      onProofread={handleProofread}
    />
  );

  isOverlayVisible = true;
  console.log('Reflect Mode overlay displayed');
};

/**
 * Get default settings as fallback
 * @returns Default Settings object
 */
const getDefaultSettings = (): Settings => ({
  dwellThreshold: 60,
  enableSound: true,
  reduceMotion: false,
  proofreadEnabled: false,
  privacyMode: 'local',
});

/**
 * Handle save reflection action
 * Sends reflection data to background worker for storage
 */
const handleSaveReflection = async (reflections: string[]) => {
  console.log('Saving reflection...');

  try {
    // Stop ambient audio if playing
    if (audioManager) {
      audioManager.stopAmbientLoop();
    }

    // Create reflection object
    const reflection: Reflection = {
      id: generateUUID(),
      url: currentExtractedContent?.url ?? window.location.href,
      title: currentExtractedContent?.title ?? document.title,
      createdAt: Date.now(),
      summary: currentSummary,
      reflection: reflections,
    };

    // Send to background worker for storage
    const saveResponse = await sendMessageToBackground<void>({
      type: 'save',
      payload: reflection,
    });

    if (!saveResponse.success) {
      console.error('Failed to save reflection:', saveResponse.error);
      // TODO: Show error notification to user
    } else {
      console.log('Reflection saved successfully');

      // Play completion bell if enabled
      if (currentSettings?.enableSound && audioManager) {
        void audioManager.playCompletionBell();
      }
    }

    // Clean up and hide overlay
    hideReflectModeOverlay();
    resetReflectionState();
  } catch (error) {
    console.error('Error saving reflection:', error);
    // Still hide overlay even if save failed
    hideReflectModeOverlay();
    resetReflectionState();
  }
};

/**
 * Handle cancel reflection action
 * Closes overlay without saving
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
};

/**
 * Handle proofread request
 * Sends text to background worker for AI proofreading
 */
const handleProofread = async (text: string, index: number) => {
  console.log(`Proofreading reflection ${index}...`);

  try {
    const proofreadResponse = await sendMessageToBackground<string>({
      type: 'proofread',
      payload: text,
    });

    if (proofreadResponse.success) {
      console.log('Proofread completed');
      // The overlay component will handle updating the UI
      // For now, we just log success
      // In a more complete implementation, we'd update the reflection text
    } else {
      console.error('Proofread failed:', proofreadResponse.error);
    }
  } catch (error) {
    console.error('Error proofreading:', error);
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
      dwellThreshold: 60,
      enableSound: true,
      reduceMotion: false,
      proofreadEnabled: false,
      privacyMode: 'local',
    };
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
 * Show the lotus nudge icon
 * Creates a shadow DOM container and renders the React component
 */
const showLotusNudge = () => {
  if (isNudgeVisible) {
    console.log('Nudge already visible');
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
      position="bottom-right"
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

/**
 * Set up message listener for background worker responses
 * Handles any messages sent from the background worker
 */
const setupMessageListener = () => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      console.log('Content script received message:', message);

      // Handle different message types if needed
      // For now, we primarily use sendMessage with responses
      // This listener is here for future extensibility

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
});

// Initialize the content script
void initializeContentScript();
