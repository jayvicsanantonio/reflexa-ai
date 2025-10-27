import './styles.css';
import { createRoot } from 'react-dom/client';
import { DwellTracker } from './dwellTracker';
import { LotusNudge } from './LotusNudge';
import type { Message, Settings } from '../types';

console.log('Reflexa AI content script initialized');

// Global instances
let dwellTracker: DwellTracker | null = null;
let nudgeContainer: HTMLDivElement | null = null;
let nudgeRoot: ReturnType<typeof createRoot> | null = null;
let isNudgeVisible = false;

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

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .reflexa-lotus-nudge {
      animation: fadeIn 0.3s ease-in-out;
    }
  }
`;

/**
 * Initialize the content script
 * Sets up dwell tracking and prepares for UI injection
 */
const initializeContentScript = async () => {
  console.log('Content script ready');

  try {
    // Load settings from background worker
    const settings = await getSettings();

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
 * Sends message to background worker to initiate reflection
 */
const handleNudgeClick = () => {
  console.log('Lotus nudge clicked - initiating reflection');

  // Hide the nudge
  hideLotusNudge();

  // Send message to background worker to initiate reflection
  const message: Message = {
    type: 'summarize',
    payload: {
      url: window.location.href,
      title: document.title,
    },
  };

  chrome.runtime.sendMessage(message).catch((error) => {
    console.error('Failed to send reflection message:', error);
  });

  // TODO: Extract content and show Reflect Mode overlay (Task 13)
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
  hideLotusNudge();
});

// Initialize the content script
void initializeContentScript();
