import './styles.css';
import { DwellTracker } from './dwellTracker';
import type { Message, Settings } from '../types';

console.log('Reflexa AI content script initialized');

// Global instances
let dwellTracker: DwellTracker | null = null;

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
 * This will trigger the nudge display in a later task
 */
const handleDwellThresholdReached = () => {
  console.log('Dwell threshold reached!');
  // TODO: Show lotus nudge icon (Task 9)
  // For now, just log the event
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
});

// Initialize the content script
void initializeContentScript();
