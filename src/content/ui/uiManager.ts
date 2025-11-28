/**
 * UI Manager for Content Script
 *
 * A centralized manager for content script UI components that handles modal lifecycle
 * using shadow DOM. This ensures style isolation from the host page and provides
 * a consistent API for showing/hiding various modal types.
 *
 * The UIManager uses shadow DOM to encapsulate modal styles, preventing conflicts
 * with the host page's CSS. Each modal type has its own container and React root,
 * allowing independent lifecycle management.
 *
 * @example
 * ```typescript
 * import { uiManager } from './uiManager';
 *
 * // Show a settings modal
 * uiManager.showSettingsModal(<SettingsComponent onClose={() => uiManager.hideSettingsModal()} />);
 *
 * // Show an overlay with custom component
 * uiManager.showOverlay(<MeditationOverlay />);
 *
 * // Clean up all modals when done
 * uiManager.cleanup();
 * ```
 *
 * @module content/ui/uiManager
 */

import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import { contentState } from '../state';
import { devLog, devWarn, devError } from '../../utils/logger';
import type {
  ShadowContainerConfig,
  ErrorModalOptions,
  NotificationOptions,
} from './types';

/**
 * Supported modal types in the application.
 * Each type has its own container ID and configuration.
 */
type ModalType =
  | 'nudge'
  | 'overlay'
  | 'errorModal'
  | 'notification'
  | 'helpModal'
  | 'settingsModal'
  | 'dashboardModal';

/**
 * Configuration for a modal container.
 */
interface ModalConfig {
  /** Unique DOM ID for the modal container */
  id: string;
  /** Path to the stylesheet to inject into shadow DOM */
  stylesheetPath?: string;
  /** Inline CSS styles for the container element */
  containerStyles?: string;
  /** Inline CSS styles to inject into shadow DOM */
  inlineStyles?: string;
}

/** Default configurations for each modal type */
const MODAL_CONFIGS: Record<ModalType, ModalConfig> = {
  nudge: { id: 'reflexa-nudge-container' },
  overlay: {
    id: 'reflexa-overlay-container',
    stylesheetPath: 'src/content/styles.css',
    containerStyles:
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647;',
  },
  errorModal: {
    id: 'reflexa-error-modal-container',
    stylesheetPath: 'src/content/styles.css',
  },
  notification: {
    id: 'reflexa-notification-container',
    stylesheetPath: 'src/content/styles.css',
  },
  helpModal: {
    id: 'reflexa-ai-status-container',
    stylesheetPath: 'src/content/styles.css',
  },
  settingsModal: {
    id: 'reflexa-settings-container',
    stylesheetPath: 'src/content/styles.css',
  },
  dashboardModal: {
    id: 'reflexa-dashboard-container',
    stylesheetPath: 'src/content/styles.css',
  },
};

/**
 * Centralized UI Manager for content script components.
 *
 * Manages the lifecycle of all modal UI components using shadow DOM for
 * style isolation. Provides a consistent API for showing, hiding, and
 * cleaning up modals.
 *
 * @example
 * ```typescript
 * // The uiManager is exported as a singleton
 * import { uiManager } from './uiManager';
 *
 * // Show different modal types
 * uiManager.showHelpModal(<HelpContent />);
 * uiManager.showSettingsModal(<SettingsPanel />);
 * uiManager.showDashboardModal(<Dashboard />);
 *
 * // Hide specific modals
 * uiManager.hideHelpModal();
 *
 * // Clean up everything
 * uiManager.cleanup();
 * ```
 */
class UIManager {
  /**
   * Creates a shadow DOM container for a modal.
   *
   * @param config - Configuration for the shadow container
   * @returns Object containing the container, shadow root, and root element for React
   * @throws Error if document.body is not available
   * @private
   */
  private createShadowContainer(config: ShadowContainerConfig): {
    container: HTMLDivElement;
    shadowRoot: ShadowRoot;
    rootElement: HTMLDivElement;
  } {
    const container = document.createElement('div');
    container.id = config.id;

    if (config.containerStyles) {
      container.style.cssText = config.containerStyles;
    }

    if (!document.body) {
      throw new Error('document.body not available');
    }

    document.body.appendChild(container);
    const shadowRoot = container.attachShadow({ mode: 'open' });

    if (config.inlineStyles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = config.inlineStyles;
      shadowRoot.appendChild(styleElement);
    } else if (config.stylesheetPath) {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      const cssUrl = chrome.runtime.getURL(config.stylesheetPath);
      if (cssUrl && !cssUrl.includes('invalid')) {
        linkElement.href = cssUrl;
        shadowRoot.appendChild(linkElement);
      } else {
        devWarn(
          `Invalid CSS URL for ${config.id}, skipping stylesheet injection`
        );
      }
    }

    const rootElement = document.createElement('div');
    shadowRoot.appendChild(rootElement);

    return { container, shadowRoot, rootElement };
  }

  /**
   * Gets the state accessors for a specific modal type.
   *
   * @param type - The modal type
   * @returns Object with get and set functions for the modal state
   * @private
   */
  private getStateAccessors(type: ModalType) {
    const accessors = {
      nudge: {
        get: () => contentState.getNudgeState(),
        set: contentState.setNudgeState.bind(contentState),
      },
      overlay: {
        get: () => contentState.getOverlayState(),
        set: contentState.setOverlayState.bind(contentState),
      },
      errorModal: {
        get: () => contentState.getErrorModalState(),
        set: contentState.setErrorModalState.bind(contentState),
      },
      notification: {
        get: () => contentState.getNotificationState(),
        set: contentState.setNotificationState.bind(contentState),
      },
      helpModal: {
        get: () => contentState.getHelpModalState(),
        set: contentState.setHelpModalState.bind(contentState),
      },
      settingsModal: {
        get: () => contentState.getSettingsModalState(),
        set: contentState.setSettingsModalState.bind(contentState),
      },
      dashboardModal: {
        get: () => contentState.getDashboardModalState(),
        set: contentState.setDashboardModalState.bind(contentState),
      },
    };
    return accessors[type];
  }

  /**
   * Shows a modal of the specified type.
   *
   * Creates a shadow DOM container, renders the React component, and updates state.
   * If the modal is already visible, this method does nothing (idempotent).
   *
   * @param type - The type of modal to show
   * @param component - The React component to render
   * @param overrideConfig - Optional configuration overrides
   * @private
   */
  private showModal(
    type: ModalType,
    component: ReactNode,
    overrideConfig?: Partial<ModalConfig>
  ): void {
    const { get, set } = this.getStateAccessors(type);
    const state = get();

    if (state.isVisible) {
      devLog(`${type} already visible`);
      return;
    }

    try {
      const config = { ...MODAL_CONFIGS[type], ...overrideConfig };
      const { container, rootElement } = this.createShadowContainer(config);

      const root = createRoot(rootElement);
      root.render(component);

      set({
        container,
        root,
        isVisible: true,
        ...(type === 'nudge' ? { isLoading: false } : {}),
      });
      devLog(`${type} displayed`);
    } catch (error) {
      devError(`Failed to show ${type}:`, error);
      if (error instanceof Error && error.message.includes('document.body')) {
        setTimeout(() => this.showModal(type, component, overrideConfig), 100);
      }
    }
  }

  /**
   * Hides a modal of the specified type.
   *
   * Unmounts the React component, removes the container from DOM, and updates state.
   * If the modal is not visible, this method does nothing.
   *
   * @param type - The type of modal to hide
   * @private
   */
  private hideModal(type: ModalType): void {
    const { get, set } = this.getStateAccessors(type);
    const state = get();

    if (!state.isVisible) return;

    if (state.root) {
      state.root.unmount();
    }

    if (state.container?.parentNode) {
      state.container.parentNode.removeChild(state.container);
    }

    set({
      container: null,
      root: null,
      isVisible: false,
      ...(type === 'nudge' ? { isLoading: false } : {}),
    });
    devLog(`${type} hidden`);
  }

  // ============================================================================
  // Public API - Nudge
  // ============================================================================

  /**
   * Shows the nudge component (lotus button).
   *
   * The nudge is a small floating button that appears on the page to provide
   * quick access to Reflexa features.
   *
   * @param component - The React component to render as the nudge
   * @param inlineStyles - CSS styles to apply to the nudge container
   *
   * @example
   * ```typescript
   * uiManager.showNudge(
   *   <LotusNudge onClick={handleClick} />,
   *   'position: fixed; bottom: 20px; right: 20px;'
   * );
   * ```
   */
  showNudge(component: ReactNode, inlineStyles: string): void {
    this.showModal('nudge', component, { inlineStyles });
  }

  /**
   * Hides the nudge component.
   *
   * @example
   * ```typescript
   * uiManager.hideNudge();
   * ```
   */
  hideNudge(): void {
    this.hideModal('nudge');
  }

  // ============================================================================
  // Public API - Overlay
  // ============================================================================

  /**
   * Shows the full-screen overlay (meditation flow).
   *
   * The overlay covers the entire viewport and is used for immersive experiences
   * like the meditation flow.
   *
   * @param component - The React component to render in the overlay
   *
   * @example
   * ```typescript
   * uiManager.showOverlay(
   *   <MeditationFlowOverlay
   *     onClose={() => uiManager.hideOverlay()}
   *     settings={settings}
   *   />
   * );
   * ```
   */
  showOverlay(component: ReactNode): void {
    this.showModal('overlay', component);
  }

  /**
   * Hides the full-screen overlay.
   *
   * @example
   * ```typescript
   * uiManager.hideOverlay();
   * ```
   */
  hideOverlay(): void {
    this.hideModal('overlay');
  }

  // ============================================================================
  // Public API - Error Modal
  // ============================================================================

  /**
   * Shows an error modal with the specified options.
   *
   * @param options - Configuration options for the error modal
   * @param component - The React component to render as the error modal
   *
   * @example
   * ```typescript
   * uiManager.showErrorModal(
   *   { type: 'ai-unavailable', message: 'AI features are not available' },
   *   <ErrorModal onClose={() => uiManager.hideErrorModal()} />
   * );
   * ```
   */
  showErrorModal(options: ErrorModalOptions, component: ReactNode): void {
    devLog('Showing error modal:', options.type);
    this.showModal('errorModal', component);
  }

  /**
   * Hides the error modal.
   *
   * @example
   * ```typescript
   * uiManager.hideErrorModal();
   * ```
   */
  hideErrorModal(): void {
    this.hideModal('errorModal');
  }

  // ============================================================================
  // Public API - Notification
  // ============================================================================

  /**
   * Shows a notification toast.
   *
   * If a notification is already visible, it will be hidden first before
   * showing the new notification.
   *
   * @param options - Configuration options for the notification
   * @param component - The React component to render as the notification
   *
   * @example
   * ```typescript
   * uiManager.showNotification(
   *   { type: 'success', title: 'Saved!', duration: 3000 },
   *   <Notification onClose={() => uiManager.hideNotification()} />
   * );
   * ```
   */
  showNotification(options: NotificationOptions, component: ReactNode): void {
    if (contentState.getNotificationState().isVisible) {
      this.hideNotification();
    }
    devLog('Showing notification:', options.type, options.title);
    this.showModal('notification', component);
  }

  /**
   * Hides the notification toast.
   *
   * @example
   * ```typescript
   * uiManager.hideNotification();
   * ```
   */
  hideNotification(): void {
    this.hideModal('notification');
  }

  // ============================================================================
  // Public API - Help Modal
  // ============================================================================

  /**
   * Shows the help/AI status modal.
   *
   * Displays information about AI feature availability and setup instructions.
   *
   * @param component - The React component to render as the help modal
   *
   * @example
   * ```typescript
   * uiManager.showHelpModal(
   *   <HelpSetupModal
   *     capabilities={aiCapabilities}
   *     onClose={() => uiManager.hideHelpModal()}
   *   />
   * );
   * ```
   */
  showHelpModal(component: ReactNode): void {
    this.showModal('helpModal', component);
  }

  /**
   * Hides the help/AI status modal.
   *
   * @example
   * ```typescript
   * uiManager.hideHelpModal();
   * ```
   */
  hideHelpModal(): void {
    this.hideModal('helpModal');
  }

  // ============================================================================
  // Public API - Settings Modal
  // ============================================================================

  /**
   * Shows the quick settings modal.
   *
   * Displays user-configurable settings for the extension.
   *
   * @param component - The React component to render as the settings modal
   *
   * @example
   * ```typescript
   * uiManager.showSettingsModal(
   *   <QuickSettingsModal
   *     settings={currentSettings}
   *     onSave={handleSave}
   *     onClose={() => uiManager.hideSettingsModal()}
   *   />
   * );
   * ```
   */
  showSettingsModal(component: ReactNode): void {
    this.showModal('settingsModal', component);
  }

  /**
   * Hides the quick settings modal.
   *
   * @example
   * ```typescript
   * uiManager.hideSettingsModal();
   * ```
   */
  hideSettingsModal(): void {
    this.hideModal('settingsModal');
  }

  // ============================================================================
  // Public API - Dashboard Modal
  // ============================================================================

  /**
   * Shows the dashboard modal.
   *
   * Displays user statistics, reflection history, and streak information.
   *
   * @param component - The React component to render as the dashboard modal
   *
   * @example
   * ```typescript
   * uiManager.showDashboardModal(
   *   <DashboardModal
   *     stats={userStats}
   *     onClose={() => uiManager.hideDashboardModal()}
   *   />
   * );
   * ```
   */
  showDashboardModal(component: ReactNode): void {
    this.showModal('dashboardModal', component);
  }

  /**
   * Hides the dashboard modal.
   *
   * @example
   * ```typescript
   * uiManager.hideDashboardModal();
   * ```
   */
  hideDashboardModal(): void {
    this.hideModal('dashboardModal');
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Gets the overlay's React root and container if visible.
   *
   * Useful for re-rendering the overlay with updated props without
   * recreating the container.
   *
   * @returns Object with root and container if overlay is visible, null otherwise
   *
   * @example
   * ```typescript
   * const overlayRoot = uiManager.getOverlayRoot();
   * if (overlayRoot) {
   *   overlayRoot.root.render(<UpdatedOverlay />);
   * }
   * ```
   */
  getOverlayRoot(): {
    root: ReturnType<typeof createRoot>;
    container: HTMLDivElement;
  } | null {
    const state = contentState.getOverlayState();
    if (state.isVisible && state.root && state.container) {
      return { root: state.root, container: state.container };
    }
    return null;
  }

  /**
   * Cleans up all visible modals.
   *
   * Hides all modal types and removes their containers from the DOM.
   * Should be called when the content script is being unloaded or
   * when a full reset is needed.
   *
   * @example
   * ```typescript
   * // Clean up when navigating away
   * window.addEventListener('beforeunload', () => {
   *   uiManager.cleanup();
   * });
   * ```
   */
  cleanup(): void {
    (
      [
        'nudge',
        'overlay',
        'errorModal',
        'notification',
        'helpModal',
        'settingsModal',
        'dashboardModal',
      ] as ModalType[]
    ).forEach((type) => this.hideModal(type));
  }
}

/**
 * Singleton instance of the UIManager.
 *
 * Use this exported instance throughout the content script to manage UI components.
 *
 * @example
 * ```typescript
 * import { uiManager } from './uiManager';
 *
 * // Show a modal
 * uiManager.showSettingsModal(<Settings />);
 *
 * // Hide it later
 * uiManager.hideSettingsModal();
 * ```
 */
export const uiManager = new UIManager();
