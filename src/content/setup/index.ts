/**
 * Content Script Setup Module
 * Centralizes all initialization and setup logic
 */
export {
  setupMessageListener,
  initializeContentScript,
} from './contentScriptSetup';
export { showLotusNudge, handleNudgeClick } from './nudgeSetup';
export {
  showHelpModal,
  showSettingsModal,
  showDashboardModal,
} from './modalSetup';
