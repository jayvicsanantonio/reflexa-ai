/**
 * Type definitions for UI Manager
 */

import type { createRoot } from 'react-dom/client';

export interface ShadowContainerConfig {
  id: string;
  stylesheetPath?: string;
  stylesheetPaths?: string[];
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

export interface UIManagerState {
  containers: Map<string, HTMLDivElement>;
  roots: Map<string, ReturnType<typeof createRoot>>;
  visibility: Map<string, boolean>;
}
