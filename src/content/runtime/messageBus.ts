/**
 * Content Script Message Bus - Re-exports from shared utils
 * Maintained for backward compatibility
 */

export {
  sendMessageToBackground,
  startAIStream,
  type AIStreamHandlers,
} from '../../utils/messageBus';
