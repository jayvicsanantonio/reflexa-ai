/**
 * Workflows module exports
 */
export {
  initiateReflectionFlow,
  setErrorModalHandler,
  setRenderOverlayForReflection,
} from './reflectionWorkflow';
export {
  showReflectModeOverlay,
  hideReflectModeOverlay,
  setRenderOverlayHandler,
} from './overlayWorkflow';
export {
  extractAndValidateContent,
  extractAndStoreContent,
} from './contentExtraction';
export {
  applyTranslationPreference,
  shouldAutoTranslate,
  handleAutoTranslate,
} from './translationPreferences';
export {
  parseSummaryBuffer,
  stopSummaryAnimation,
  startSummaryAnimation,
  stepSummaryAnimation,
  summarizeWithStreaming,
} from './summarizationStreaming';
export { getDefaultSettings, createRenderOverlay } from './overlayRendering';
export {
  handleProofread,
  handleTranslate,
  handleTranslateToEnglish,
  handleRewrite,
  handleFormatChange,
} from './aiOperations';
export {
  handleSaveReflection,
  handleCancelReflection,
  setErrorModalHandler as setReflectionActionsErrorModalHandler,
  setNotificationHandler,
} from './reflectionActions';
export type { ReflectionWorkflowDependencies } from './types';
