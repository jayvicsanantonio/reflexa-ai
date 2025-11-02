/**
 * Workflows module exports
 */
export {
  initiateReflectionFlow,
  setErrorModalHandler,
} from './reflectionWorkflow';
export {
  showReflectModeOverlay,
  hideReflectModeOverlay,
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
