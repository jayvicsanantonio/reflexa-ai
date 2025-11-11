/**
 * Content Script Entry Point
 *
 * Responsibilities:
 * - Initialize UI managers and core components
 * - Setup event listeners and workflows
 * - Coordinate between content script features and background worker
 * - Handle cleanup and lifecycle events
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
 * Initialize UI handlers
 * Creates callbacks for showing/hiding modals and notifications
 */
function initializeUIHandlers() {
  const hideErrorModal = () => {
    uiManager.hideErrorModal();
  };

  const showErrorModal = createShowErrorModal(hideErrorModal);
  setErrorModalHandler(showErrorModal);

  const hideNotification = () => {
    uiManager.hideNotification();
  };

  const showNotification = createShowNotification(hideNotification);
  setNotificationHandler(showNotification);

  return { showErrorModal, showNotification };
}

/**
 * Initialize overlay rendering with format change handling
 * Creates the overlay render function with proper dependency injection
 */
function initializeOverlayRendering(
  showNotification: ReturnType<typeof createShowNotification>
) {
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

  return renderOverlay;
}

/**
 * Handle dwell threshold reached event
 * Shows lotus nudge with action callbacks
 */
function createDwellThresholdHandler() {
  return () => {
    devLog('Dwell threshold reached!');
    showLotusNudgeSetup({
      onNudgeClick: () => handleNudgeClick(initiateReflectionFlow),
      onDashboard: showDashboardModal,
      onHelp: showHelpModal,
      onSettings: showSettingsModal,
    });
  };
}

/**
 * Setup cleanup handlers for page unload
 * Ensures all resources are properly released
 */
function setupCleanupHandlers() {
  window.addEventListener('beforeunload', () => {
    instanceManager.cleanup();
    uiManager.cleanup();
  });
}

/**
 * Initialize all content script components
 * Runs in sequence to ensure proper dependency ordering
 */
function initializeContentScriptComponents() {
  // Initialize UI handlers
  const { showNotification } = initializeUIHandlers();

  // Initialize overlay rendering
  const renderOverlay = initializeOverlayRendering(showNotification);

  // Create dwell threshold handler
  const handleDwellThresholdReached = createDwellThresholdHandler();

  // Setup cleanup handlers
  setupCleanupHandlers();

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
}

// Run initialization
initializeContentScriptComponents();
