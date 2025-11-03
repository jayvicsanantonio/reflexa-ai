/**
 * Content Script Setup Module
 * Centralizes all initialization and setup logic
 */
export {
  getSettings,
  setupNavigationListeners,
  setupMessageListener,
  initializeContentScript,
} from './contentScriptSetup';
export { showLotusNudge, hideLotusNudge, handleNudgeClick } from './nudgeSetup';
export {
  showHelpModal,
  hideHelpModal,
  showSettingsModal,
  hideSettingsModal,
  showDashboardModal,
  hideDashboardModal,
} from './modalSetup';
