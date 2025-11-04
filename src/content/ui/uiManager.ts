/**
 * UI Manager for content script
 * Centralizes lifecycle management of all UI components (nudge, overlay, modals, notifications)
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
 * Manages lifecycle of all UI components in the content script
 * Handles shadow DOM creation, React root management, and component mounting/unmounting
 */
class UIManager {
  /**
   * Create a shadow DOM container with stylesheet or inline styles
   */
  private createShadowContainer(config: ShadowContainerConfig): {
    container: HTMLDivElement;
    shadowRoot: ShadowRoot;
    rootElement: HTMLDivElement;
  } {
    const container = document.createElement('div');
    container.id = config.id;

    // Apply container styles if provided
    if (config.containerStyles) {
      container.style.cssText = config.containerStyles;
    }

    // Ensure document.body is available
    if (!document.body) {
      throw new Error('document.body not available');
    }

    document.body.appendChild(container);

    // Create shadow root
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // CRITICAL: Inject font reset FIRST as inline style to prevent font leakage
    // This ensures fonts are set immediately, before stylesheet loads
    const fontResetStyle = document.createElement('style');
    fontResetStyle.textContent = `
      *,
      *::before,
      *::after,
      :host,
      :host * {
        font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
        font-style: normal !important;
      }
    `;
    shadowRoot.appendChild(fontResetStyle);

    // Inject styles
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

    // Create root element for React with inline font style as final fallback
    const rootElement = document.createElement('div');
    rootElement.style.fontFamily =
      "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
    rootElement.style.fontStyle = 'normal';
    rootElement.id = 'reflexa-root';
    shadowRoot.appendChild(rootElement);

    // Apply font reset to shadow root host element as well
    if (shadowRoot.host) {
      (shadowRoot.host as HTMLElement).style.fontFamily =
        "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
      (shadowRoot.host as HTMLElement).style.fontStyle = 'normal';
    }

    return { container, shadowRoot, rootElement };
  }

  /**
   * Show the lotus nudge icon
   * Accepts either inline styles string or stylesheet path
   */
  showNudge(component: ReactNode, stylesOrPath: string): void {
    const nudgeState = contentState.getNudgeState();
    if (nudgeState.isVisible) {
      devLog('Nudge already visible');
      return;
    }

    try {
      // Detect if it's a stylesheet path (contains '/' and ends with '.css') or inline styles
      const isStylesheetPath =
        stylesOrPath.includes('/') && stylesOrPath.endsWith('.css');

      const { container, rootElement } = this.createShadowContainer({
        id: 'reflexa-nudge-container',
        ...(isStylesheetPath
          ? { stylesheetPath: stylesOrPath }
          : { inlineStyles: stylesOrPath }),
      });

      const root = createRoot(rootElement);
      root.render(component);

      contentState.setNudgeState({
        container,
        root,
        isVisible: true,
        isLoading: false,
      });

      devLog('Lotus nudge displayed');
    } catch (error) {
      devError('Failed to show nudge:', error);
      // Retry after a delay if document.body not ready
      if (error instanceof Error && error.message.includes('document.body')) {
        setTimeout(() => this.showNudge(component, stylesOrPath), 100);
      }
    }
  }

  /**
   * Hide the lotus nudge icon
   */
  hideNudge(): void {
    const nudgeState = contentState.getNudgeState();
    if (!nudgeState.isVisible) {
      return;
    }

    if (nudgeState.root) {
      nudgeState.root.unmount();
    }

    if (nudgeState.container?.parentNode) {
      nudgeState.container.parentNode.removeChild(nudgeState.container);
    }

    contentState.setNudgeState({
      container: null,
      root: null,
      isVisible: false,
      isLoading: false,
    });

    devLog('Lotus nudge hidden');
  }

  /**
   * Show the reflection overlay
   */
  showOverlay(component: ReactNode): void {
    const overlayState = contentState.getOverlayState();
    if (overlayState.isVisible) {
      devLog('Overlay already visible');
      return;
    }

    const { container, rootElement } = this.createShadowContainer({
      id: 'reflexa-overlay-container',
      stylesheetPath: 'src/content/styles.css',
      containerStyles:
        'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647;',
    });

    const root = createRoot(rootElement);
    root.render(component);

    contentState.setOverlayState({
      container,
      root,
      isVisible: true,
    });

    devLog('Overlay displayed');
  }

  /**
   * Hide the reflection overlay
   */
  hideOverlay(): void {
    const overlayState = contentState.getOverlayState();
    if (!overlayState.isVisible) {
      return;
    }

    if (overlayState.root) {
      overlayState.root.unmount();
    }

    if (overlayState.container?.parentNode) {
      overlayState.container.parentNode.removeChild(overlayState.container);
    }

    contentState.setOverlayState({
      container: null,
      root: null,
      isVisible: false,
    });

    devLog('Overlay hidden');
  }

  /**
   * Show error modal
   */
  showErrorModal(options: ErrorModalOptions, component: ReactNode): void {
    const errorModalState = contentState.getErrorModalState();
    if (errorModalState.isVisible) {
      devLog('Error modal already visible');
      return;
    }

    devLog('Showing error modal:', options.type);

    const { container, rootElement } = this.createShadowContainer({
      id: 'reflexa-error-modal-container',
      stylesheetPath: 'src/content/styles.css',
    });

    const root = createRoot(rootElement);
    root.render(component);

    contentState.setErrorModalState({
      container,
      root,
      isVisible: true,
    });

    devLog('Error modal displayed');
  }

  /**
   * Hide error modal
   */
  hideErrorModal(): void {
    const errorModalState = contentState.getErrorModalState();
    if (!errorModalState.isVisible) {
      return;
    }

    if (errorModalState.root) {
      errorModalState.root.unmount();
    }

    if (errorModalState.container?.parentNode) {
      errorModalState.container.parentNode.removeChild(
        errorModalState.container
      );
    }

    contentState.setErrorModalState({
      container: null,
      root: null,
      isVisible: false,
    });

    devLog('Error modal hidden');
  }

  /**
   * Show notification toast
   */
  showNotification(options: NotificationOptions, component: ReactNode): void {
    // Hide existing notification if visible
    const notificationState = contentState.getNotificationState();
    if (notificationState.isVisible) {
      this.hideNotification();
    }

    devLog('Showing notification:', options.type, options.title);

    const { container, rootElement } = this.createShadowContainer({
      id: 'reflexa-notification-container',
      stylesheetPath: 'src/content/styles.css',
    });

    const root = createRoot(rootElement);
    root.render(component);

    contentState.setNotificationState({
      container,
      root,
      isVisible: true,
    });

    devLog('Notification displayed');
  }

  /**
   * Hide notification toast
   */
  hideNotification(): void {
    const notificationState = contentState.getNotificationState();
    if (!notificationState.isVisible) {
      return;
    }

    if (notificationState.root) {
      notificationState.root.unmount();
    }

    if (notificationState.container?.parentNode) {
      notificationState.container.parentNode.removeChild(
        notificationState.container
      );
    }

    contentState.setNotificationState({
      container: null,
      root: null,
      isVisible: false,
    });

    devLog('Notification hidden');
  }

  /**
   * Show help modal (AI Status)
   */
  showHelpModal(component: ReactNode): void {
    const helpModalState = contentState.getHelpModalState();
    if (helpModalState.isVisible) {
      return;
    }

    const { container, rootElement } = this.createShadowContainer({
      id: 'reflexa-ai-status-container',
      stylesheetPath: 'src/content/styles.css',
    });

    const root = createRoot(rootElement);
    root.render(component);

    contentState.setHelpModalState({
      container,
      root,
      isVisible: true,
    });

    devLog('Help modal displayed');
  }

  /**
   * Hide help modal
   */
  hideHelpModal(): void {
    const helpModalState = contentState.getHelpModalState();
    if (!helpModalState.isVisible) {
      return;
    }

    if (helpModalState.root) {
      helpModalState.root.unmount();
    }

    if (helpModalState.container?.parentNode) {
      helpModalState.container.parentNode.removeChild(helpModalState.container);
    }

    contentState.setHelpModalState({
      container: null,
      root: null,
      isVisible: false,
    });

    devLog('Help modal hidden');
  }

  /**
   * Show settings modal
   */
  showSettingsModal(component: ReactNode): void {
    const settingsModalState = contentState.getSettingsModalState();
    if (settingsModalState.isVisible) {
      return;
    }

    const { container, rootElement } = this.createShadowContainer({
      id: 'reflexa-settings-container',
      stylesheetPath: 'src/content/styles.css',
    });

    const root = createRoot(rootElement);
    root.render(component);

    contentState.setSettingsModalState({
      container,
      root,
      isVisible: true,
    });

    devLog('Settings modal displayed');
  }

  /**
   * Hide settings modal
   */
  hideSettingsModal(): void {
    const settingsModalState = contentState.getSettingsModalState();
    if (!settingsModalState.isVisible) {
      return;
    }

    if (settingsModalState.root) {
      settingsModalState.root.unmount();
    }

    if (settingsModalState.container?.parentNode) {
      settingsModalState.container.parentNode.removeChild(
        settingsModalState.container
      );
    }

    contentState.setSettingsModalState({
      container: null,
      root: null,
      isVisible: false,
    });

    devLog('Settings modal hidden');
  }

  /**
   * Show dashboard modal
   */
  showDashboardModal(component: ReactNode): void {
    const dashboardModalState = contentState.getDashboardModalState();
    if (dashboardModalState.isVisible) {
      return;
    }

    const { container, rootElement } = this.createShadowContainer({
      id: 'reflexa-dashboard-container',
      stylesheetPath: 'src/content/styles.css',
    });

    const root = createRoot(rootElement);
    root.render(component);

    contentState.setDashboardModalState({
      container,
      root,
      isVisible: true,
    });

    devLog('Dashboard modal displayed');
  }

  /**
   * Hide dashboard modal
   */
  hideDashboardModal(): void {
    const dashboardModalState = contentState.getDashboardModalState();
    if (!dashboardModalState.isVisible) {
      return;
    }

    if (dashboardModalState.root) {
      dashboardModalState.root.unmount();
    }

    if (dashboardModalState.container?.parentNode) {
      dashboardModalState.container.parentNode.removeChild(
        dashboardModalState.container
      );
    }

    contentState.setDashboardModalState({
      container: null,
      root: null,
      isVisible: false,
    });

    devLog('Dashboard modal hidden');
  }

  /**
   * Get overlay root for re-rendering
   */
  getOverlayRoot(): {
    root: ReturnType<typeof createRoot>;
    container: HTMLDivElement;
  } | null {
    const overlayState = contentState.getOverlayState();
    if (overlayState.isVisible && overlayState.root && overlayState.container) {
      return {
        root: overlayState.root,
        container: overlayState.container,
      };
    }
    return null;
  }

  /**
   * Cleanup all UI components
   */
  cleanup(): void {
    this.hideNudge();
    this.hideOverlay();
    this.hideErrorModal();
    this.hideNotification();
    this.hideHelpModal();
    this.hideSettingsModal();
    this.hideDashboardModal();
  }
}

/**
 * Singleton instance of the UI manager
 */
export const uiManager = new UIManager();
