/**
 * UI State Helper Functions
 * Provides convenient helper functions for common UI state operations
 */

import { contentState } from '../state';
import { uiManager } from './uiManager';
import { ErrorModal } from '../components';
import { Notification } from '../components';

/**
 * Set nudge loading state
 * Updates the nudge component to show/hide loading indicator
 */
export function setNudgeLoadingState(loading: boolean): void {
  const nudgeState = contentState.getNudgeState();
  if (!nudgeState.isVisible || !nudgeState.container) {
    return;
  }

  // Update state
  contentState.setNudgeState({
    ...nudgeState,
    isLoading: loading,
  });

  // Update DOM attributes for accessibility
  const shadowRoot = nudgeState.container.shadowRoot;
  if (!shadowRoot) return;

  const nudgeElement = shadowRoot.querySelector('.reflexa-lotus-nudge');
  if (!nudgeElement) return;

  if (loading) {
    nudgeElement.classList.add('reflexa-lotus-nudge--loading');
    nudgeElement.setAttribute('aria-label', 'Processing content...');
    nudgeElement.setAttribute('aria-busy', 'true');
  } else {
    nudgeElement.classList.remove('reflexa-lotus-nudge--loading');
    nudgeElement.setAttribute('aria-label', 'Start reflection');
    nudgeElement.setAttribute('aria-busy', 'false');
  }
}

/**
 * Factory function to create showErrorModal with hide callback
 * This allows the modal to close itself
 */
export function createShowErrorModal(hideErrorModal: () => void) {
  return function showErrorModal(
    title: string,
    message: string,
    type:
      | 'ai-unavailable'
      | 'ai-timeout'
      | 'content-truncated'
      | 'storage-full',
    onAction?: () => void,
    actionLabel?: string
  ): void {
    uiManager.showErrorModal(
      { title, message, type, onAction, actionLabel },
      <ErrorModal
        title={title}
        message={message}
        type={type}
        onClose={hideErrorModal}
        onAction={onAction}
        actionLabel={actionLabel}
      />
    );
  };
}

/**
 * Factory function to create showNotification with hide callback
 * This allows the notification to close itself
 */
export function createShowNotification(hideNotification: () => void) {
  return function showNotification(
    title: string,
    message: string,
    type: 'warning' | 'error' | 'info',
    duration = 5000
  ): void {
    uiManager.showNotification(
      { title, message, type, duration },
      <Notification
        title={title}
        message={message}
        type={type}
        duration={duration}
        onClose={hideNotification}
      />
    );
  };
}
