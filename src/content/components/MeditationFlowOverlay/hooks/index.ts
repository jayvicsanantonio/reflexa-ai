/**
 * Barrel exports for MeditationFlowOverlay hooks
 */
export { useWriterStreaming } from './useWriterStreaming';
export type { UseWriterStreamingReturn } from './useWriterStreaming';

export { useRewritePreview } from './useRewritePreview';
export type {
  RewritePreviewState,
  UseRewritePreviewResult,
} from './useRewritePreview';

export { useProofreadResult } from './useProofreadResult';
export type {
  ProofreadResultState,
  UseProofreadResultResult,
} from './useProofreadResult';

export { useVoiceInputManager } from './useVoiceInputManager';
export type {
  VoiceInputManagerConfig,
  VoiceInputState,
  VoiceInputManagerResult,
} from './useVoiceInputManager';

export { useOverlayKeyboardShortcuts } from './useOverlayKeyboardShortcuts';
export type {
  OverlayKeyboardConfig,
  KeyboardShortcutResult,
} from './useOverlayKeyboardShortcuts';
