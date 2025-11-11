/**
 * Content script entry point
 * Initializes the extension's content script functionality including:
 * - Dwell tracking and reflection prompts
 * - UI overlays and modals
 * - Message handling for background communication
 * - Cleanup on page unload
 */

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
  setRenderOverlayHandler,
  setRenderOverlayForReflection,
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
import { devLog } from '../utils/logger';

devLog('Content script initialized');

/**
 * Handle dwell threshold reached event
 * Shows the lotus nudge to prompt user for reflection
 */
const handleDwellThresholdReached = (): void => {
  devLog('Dwell threshold reached!');
  showLotusNudgeSetup({
    onNudgeClick: () => handleNudgeClick(initiateReflectionFlow),
    onDashboard: showDashboardModal,
    onHelp: showHelpModal,
    onSettings: showSettingsModal,
  });
};

/**
 * Error modal handlers
 */
const hideErrorModal = (): void => {
  uiManager.hideErrorModal();
};

const showErrorModal = createShowErrorModal(hideErrorModal);
setErrorModalHandler(showErrorModal);

/**
 * Notification handlers
 */
const hideNotification = (): void => {
  uiManager.hideNotification();
};

const showNotification = createShowNotification(hideNotification);
setNotificationHandler(showNotification);

/**
 * Overlay renderer with format change handler
 * Creates a circular dependency that is resolved by the factory function
 */
const renderOverlay = createRenderOverlay((format: SummaryFormat) =>
  handleFormatChangeWorkflow(
    format,
    renderOverlay,
    showNotification,
    stopSummaryAnimation
  )
);

setRenderOverlayHandler(renderOverlay);
setRenderOverlayForReflection(renderOverlay);

/**
 * Cleanup on page unload
 * Ensures all event listeners and UI components are properly removed
 */
const handleBeforeUnload = (): void => {
  instanceManager.cleanup();
  uiManager.cleanup();
};

window.addEventListener('beforeunload', handleBeforeUnload);

/**
 * Initialize content script with all dependencies
 */
void initializeContentScript({
  onDwellThresholdReached: handleDwellThresholdReached,
});

/**
 * Set up message listener for background communication
 */
setupMessageListener({
  applyTranslationPreference,
  showNotification,
  renderOverlay,
  initiateReflectionFlow,
  showDashboardModal,
});
