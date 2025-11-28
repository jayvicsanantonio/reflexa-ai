/**
 * UI Manager for content script
 * Centralizes lifecycle management of all UI components
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

type ModalType =
  | 'nudge'
  | 'overlay'
  | 'errorModal'
  | 'notification'
  | 'helpModal'
  | 'settingsModal'
  | 'dashboardModal';

interface ModalConfig {
  id: string;
  stylesheetPath?: string;
  containerStyles?: string;
  inlineStyles?: string;
}

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

class UIManager {
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

  // Public API - Nudge
  showNudge(component: ReactNode, inlineStyles: string): void {
    this.showModal('nudge', component, { inlineStyles });
  }

  hideNudge(): void {
    this.hideModal('nudge');
  }

  // Public API - Overlay
  showOverlay(component: ReactNode): void {
    this.showModal('overlay', component);
  }

  hideOverlay(): void {
    this.hideModal('overlay');
  }

  // Public API - Error Modal
  showErrorModal(options: ErrorModalOptions, component: ReactNode): void {
    devLog('Showing error modal:', options.type);
    this.showModal('errorModal', component);
  }

  hideErrorModal(): void {
    this.hideModal('errorModal');
  }

  // Public API - Notification
  showNotification(options: NotificationOptions, component: ReactNode): void {
    if (contentState.getNotificationState().isVisible) {
      this.hideNotification();
    }
    devLog('Showing notification:', options.type, options.title);
    this.showModal('notification', component);
  }

  hideNotification(): void {
    this.hideModal('notification');
  }

  // Public API - Help Modal
  showHelpModal(component: ReactNode): void {
    this.showModal('helpModal', component);
  }

  hideHelpModal(): void {
    this.hideModal('helpModal');
  }

  // Public API - Settings Modal
  showSettingsModal(component: ReactNode): void {
    this.showModal('settingsModal', component);
  }

  hideSettingsModal(): void {
    this.hideModal('settingsModal');
  }

  // Public API - Dashboard Modal
  showDashboardModal(component: ReactNode): void {
    this.showModal('dashboardModal', component);
  }

  hideDashboardModal(): void {
    this.hideModal('dashboardModal');
  }

  // Utility methods
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

export const uiManager = new UIManager();
