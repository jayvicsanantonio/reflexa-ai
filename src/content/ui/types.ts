/**
 * Type definitions for UI Manager
 */

export interface ShadowContainerConfig {
  id: string;
  stylesheetPath?: string;
  inlineStyles?: string;
  containerStyles?: string;
}

export interface ErrorModalOptions {
  title: string;
  message: string;
  type: 'ai-unavailable' | 'ai-timeout' | 'content-truncated' | 'storage-full';
  onAction?: () => void;
  actionLabel?: string;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  duration?: number;
}
