import './styles.css';
import type { SummaryFormat } from '../types';
import { instanceManager } from './core';
import { uiManager, createShowErrorModal, createShowNotification } from './ui';
import {
  initiateReflectionFlow,
  setErrorModalHandler,
  setNotificationHandler,
  applyTranslationPreference,
  stopSummaryAnimation,
  handleFormatChange as handleFormatChangeWorkflow,
  createRenderOverlay,
} from './workflows';
import {
  setupMessageListener,
  initializeContentScript,
  showLotusNudge as showLotusNudgeSetup,
  handleNudgeClick,
  showHelpModal,
  showSettingsModal,
  showDashboardModal,
} from './setup';

// Import logger
import { devLog } from '../utils/logger';
devLog('Content script initialized');

// Language names map removed (no longer shown in UI)
// LOTUS_NUDGE_STYLES is now imported from './setup'

// Legacy code removed - all functionality has been migrated to workflows
// Note: renderOverlay will be created after showNotification is defined below

// Initialize and setup functions are now imported from './setup'
// Initialize content script with dependencies

// Setup functions are now imported from './setup'
// Create wrapper functions with proper dependencies
const handleDwellThresholdReached = () => {
  devLog('Dwell threshold reached!');
  showLotusNudgeSetup({
    onNudgeClick: () => handleNudgeClick(initiateReflectionFlow),
    onDashboard: showDashboardModal,
    onHelp: showHelpModal,
    onSettings: showSettingsModal,
  });
};

// Message listener and navigation listeners are now imported from './setup'

/**
 * Show error modal with specified configuration
 * @param title Modal title
 * @param message Error message
 * @param type Error type
 * @param onAction Optional action callback
 * @param actionLabel Optional action button label
 */

/**
 * Hide the error modal
 * Removes the component and cleans up the DOM
 */
const hideErrorModal = () => {
  uiManager.hideErrorModal();
};

/**
 * Show error modal - created with hide callback
 */
const showErrorModal = createShowErrorModal(hideErrorModal);

// Set error modal handler for workflows
setErrorModalHandler(showErrorModal);

/**
 * Hide the notification toast
 * Removes the component and cleans up the DOM
 */
const hideNotification = () => {
  uiManager.hideNotification();
};

/**
 * Show notification - created with hide callback
 */
const showNotification = createShowNotification(hideNotification);

// Set notification handler for reflection actions
setNotificationHandler(showNotification);

// Create renderOverlay function with handleFormatChange as dependency
// The factory function will bind the callbacks properly
const renderOverlay = createRenderOverlay((format: SummaryFormat) =>
  handleFormatChangeWorkflow(
    format,
    renderOverlay,
    showNotification,
    stopSummaryAnimation
  )
);

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
  instanceManager.cleanup();
  uiManager.cleanup();
});

// Modal functions are now imported from './setup'
// Initialize the content script with dependencies
void initializeContentScript({
  onDwellThresholdReached: handleDwellThresholdReached,
});

// Set up message listener with dependencies
setupMessageListener({
  applyTranslationPreference,
  showNotification,
  renderOverlay,
  initiateReflectionFlow,
  showDashboardModal,
});
