/**
 * Central export for all message handlers
 */

// AI handlers
export {
  handleSummarize,
  handleReflect,
  handleProofread,
  handleWrite,
  handleRewrite,
  handleTranslate,
  handleCanTranslate,
  handleCheckTranslationAvailability,
  handleDetectLanguage,
} from './ai/aiHandlers';

// Streaming handlers
export {
  handleSummarizeStreamRequest,
  handleWriterStreamRequest,
  safePostStreamMessage,
} from './streaming/streamHandlers';

// Storage handlers
export {
  handleSave,
  handleLoad,
  handleGetStreak,
  handleDeleteReflection,
  handleExportReflections,
} from './storage/storageHandlers';

// Settings handlers
export {
  handleGetSettings,
  handleUpdateSettings,
  handleResetSettings,
} from './settings/settingsHandlers';

// Utility handlers
export {
  handleCheckAI,
  handleCheckAllAI,
  handleGetCapabilities,
  handleGetUsageStats,
  handleGetPerformanceStats,
  handleOpenDashboardInActiveTab,
  handleStartReflectInActiveTab,
  resetAIAvailability,
} from './utils/utilityHandlers';

// Shared utilities (for internal use)
export { settingsManager, ensureAIAvailable } from './utils/shared';
