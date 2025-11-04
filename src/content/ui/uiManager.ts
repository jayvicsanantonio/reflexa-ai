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
  private async createShadowContainer(config: ShadowContainerConfig): Promise<{
    container: HTMLDivElement;
    shadowRoot: ShadowRoot;
    rootElement: HTMLDivElement;
  }> {
    const container = document.createElement('div');
    container.id = config.id;

    // Add basic inline styles to container to ensure visibility
    container.style.position = 'fixed';
    container.style.zIndex = '999999';

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
    } else if (config.stylesheetPaths && config.stylesheetPaths.length > 0) {
      // Load multiple stylesheets (e.g., Tailwind bundle + custom styles)
      for (const path of config.stylesheetPaths) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        const cssUrl = chrome.runtime.getURL(path);
        if (cssUrl && !cssUrl.includes('invalid')) {
          linkElement.href = cssUrl;
          shadowRoot.appendChild(linkElement);
        } else {
          devWarn(
            `Invalid CSS URL for ${config.id}: ${path}, skipping stylesheet injection`
          );
        }
      }
    } else if (config.stylesheetPath) {
      // For shadow DOM, we need to inject both Tailwind CSS (from content script bundle) and custom styles
      const extensionBaseUrl = chrome.runtime.getURL('');
      let tailwindInjected = false;

      devLog(`[Shadow DOM] Looking for Tailwind CSS bundle. Extension base URL: ${extensionBaseUrl}`);

      // Strategy: Find the CSS bundle that was injected by the content script
      // CRXJS injects CSS automatically, but we need to fetch it directly for shadow DOM
      try {
        // First, try to directly fetch the CSS bundle using known patterns
        // CRXJS typically generates CSS files with names like "style-{hash}.css"
        const possibleCssPaths = [
          'assets/style-CW4sS057.css', // Current known hash
          'assets/style.css',
          'assets/index.css',
        ];

        for (const cssPath of possibleCssPaths) {
          try {
            const cssUrl = chrome.runtime.getURL(cssPath);
            const response = await fetch(cssUrl);
            if (response.ok) {
              const cssText = await response.text();
              // Check if it contains Tailwind classes
              if (cssText.includes('.fixed') || cssText.includes('.z-') || cssText.length > 1000) {
                const styleElement = document.createElement('style');
                styleElement.textContent = cssText;
                shadowRoot.appendChild(styleElement);
                tailwindInjected = true;
                devLog(`[Shadow DOM] Successfully injected Tailwind CSS bundle (${cssText.length} chars) from ${cssUrl}`);
                break;
              }
            }
          } catch (e) {
            // Try next path
            continue;
          }
        }

        // If direct fetch failed, try to find CSS bundle via link elements (most reliable)
        if (!tailwindInjected) {
          const linkElements = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
          ) as HTMLLinkElement[];
          devLog(`[Shadow DOM] Found ${linkElements.length} link elements on page`);

          for (const link of linkElements) {
            const href = link.href;
            // Look for extension CSS bundles (may be in /assets/ or have style/ in name)
            if (
              href &&
              href.startsWith(extensionBaseUrl) &&
              (href.includes('/assets/') || href.includes('style') || href.endsWith('.css'))
            ) {
              devLog(`[Shadow DOM] Found potential CSS bundle: ${href}`);
              try {
                // Try to fetch and inject as inline style (works reliably in shadow DOM)
                const response = await fetch(href);
                if (response.ok) {
                  const cssText = await response.text();
                  // Check if it contains Tailwind classes (basic heuristic)
                  if (cssText.includes('.fixed') || cssText.includes('.z-') || cssText.length > 1000) {
                    const styleElement = document.createElement('style');
                    styleElement.textContent = cssText;
                    shadowRoot.appendChild(styleElement);
                    tailwindInjected = true;
                    devLog(`[Shadow DOM] Successfully injected Tailwind CSS bundle (${cssText.length} chars) from ${href}`);
                    break;
                  } else {
                    devLog(`[Shadow DOM] CSS bundle doesn't appear to contain Tailwind, skipping: ${href}`);
                  }
                }
              } catch (fetchError) {
                devLog(`[Shadow DOM] Could not fetch CSS from ${href}, trying next:`, fetchError);
                // Try link element as fallback
                try {
                  const linkElement = document.createElement('link');
                  linkElement.rel = 'stylesheet';
                  linkElement.href = href;
                  shadowRoot.appendChild(linkElement);
                  tailwindInjected = true;
                  devLog(`[Shadow DOM] Injected CSS via link element: ${href}`);
                  break;
                } catch (linkError) {
                  devLog(`[Shadow DOM] Link element also failed:`, linkError);
                }
              }
            }
          }
        }

        // If not found via link elements, try page stylesheets
        if (!tailwindInjected) {
          const pageStylesheets = Array.from(document.styleSheets);
          devLog(`[Shadow DOM] Checking ${pageStylesheets.length} page stylesheets`);

          for (const sheet of pageStylesheets) {
            try {
              const href = sheet.href;
              if (href && href.startsWith(extensionBaseUrl) && (href.includes('/assets/') || href.includes('style') || href.endsWith('.css'))) {
                devLog(`[Shadow DOM] Found extension stylesheet: ${href}`);
                try {
                  // Try to extract CSS rules (works for same-origin)
                  const styleElement = document.createElement('style');
                  let cssText = '';
                  const rules = Array.from(sheet.cssRules || sheet.rules || []);
                  for (const rule of rules) {
                    cssText += rule.cssText + '\n';
                  }
                  if (cssText && (cssText.includes('.fixed') || cssText.includes('.z-') || cssText.length > 1000)) {
                    styleElement.textContent = cssText;
                    shadowRoot.appendChild(styleElement);
                    tailwindInjected = true;
                    devLog(`[Shadow DOM] Injected Tailwind CSS from page stylesheet (${cssText.length} chars): ${href}`);
                    break;
                  }
                } catch (e) {
                  devLog(`[Shadow DOM] CORS error accessing stylesheet rules, trying fetch:`, e);
                  // Try fetch instead
                  try {
                    const response = await fetch(href);
                    if (response.ok) {
                      const cssText = await response.text();
                      if (cssText.includes('.fixed') || cssText.includes('.z-') || cssText.length > 1000) {
                        const styleElement = document.createElement('style');
                        styleElement.textContent = cssText;
                        shadowRoot.appendChild(styleElement);
                        tailwindInjected = true;
                        devLog(`[Shadow DOM] Successfully fetched and injected CSS from ${href}`);
                        break;
                      }
                    }
                  } catch (fetchError) {
                    devLog(`[Shadow DOM] Failed to fetch CSS:`, fetchError);
                  }
                }
              }
            } catch (e) {
              // Ignore errors for individual stylesheets
            }
          }
        }
      } catch (error) {
        devWarn('[Shadow DOM] Failed to find CSS bundle:', error);
      }

      if (!tailwindInjected) {
        devWarn('[Shadow DOM] Could not find Tailwind CSS bundle. Injecting minimal fallback styles.');
        // Inject minimal fallback styles to ensure component is visible
        const fallbackStyle = document.createElement('style');
        fallbackStyle.textContent = `
          * { box-sizing: border-box; }
          .fixed { position: fixed !important; }
          .z-\\[999999\\] { z-index: 999999 !important; }
          .bottom-8 { bottom: 2rem !important; }
          .left-8 { left: 2rem !important; }
          .right-8 { right: 2rem !important; }
          .top-8 { top: 2rem !important; }
          .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
          .duration-300 { transition-duration: 300ms; }
        `;
        shadowRoot.appendChild(fallbackStyle);
      }

      // Then inject the custom stylesheet
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      const cssUrl = chrome.runtime.getURL(config.stylesheetPath);
      if (cssUrl && !cssUrl.includes('invalid')) {
        linkElement.href = cssUrl;
        shadowRoot.appendChild(linkElement);
        devLog(`[Shadow DOM] Injected custom stylesheet: ${cssUrl}`);
      } else {
        devWarn(
          `[Shadow DOM] Invalid CSS URL for ${config.id}: ${config.stylesheetPath}, skipping stylesheet injection`
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

    // Detect if it's a stylesheet path (contains '/' and ends with '.css') or inline styles
    const isStylesheetPath =
      stylesOrPath.includes('/') && stylesOrPath.endsWith('.css');

    // Create shadow container asynchronously
    void this.createShadowContainer({
      id: 'reflexa-nudge-container',
      ...(isStylesheetPath
        ? { stylesheetPath: stylesOrPath }
        : { inlineStyles: stylesOrPath }),
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setNudgeState({
          container,
          root,
          isVisible: true,
          isLoading: false,
        });

        devLog('Lotus nudge displayed');
      })
      .catch((error) => {
        devError('Failed to show nudge:', error);
        devError('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Retry after a delay if document.body not ready
        if (error instanceof Error && error.message.includes('document.body')) {
          setTimeout(() => this.showNudge(component, stylesOrPath), 100);
        } else {
          // Even if CSS injection fails, try to render with minimal styles
          devLog('Attempting to render nudge with minimal fallback...');
          try {
            const container = document.createElement('div');
            container.id = 'reflexa-nudge-container';
            container.style.position = 'fixed';
            container.style.bottom = '2rem';
            container.style.left = '2rem';
            container.style.zIndex = '999999';
            document.body.appendChild(container);

            const shadowRoot = container.attachShadow({ mode: 'open' });
            const rootElement = document.createElement('div');
            shadowRoot.appendChild(rootElement);

            const root = createRoot(rootElement);
            root.render(component);

            contentState.setNudgeState({
              container,
              root,
              isVisible: true,
              isLoading: false,
            });

            devLog('Lotus nudge displayed with fallback');
          } catch (fallbackError) {
            devError('Fallback rendering also failed:', fallbackError);
          }
        }
      });
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

    void this.createShadowContainer({
      id: 'reflexa-overlay-container',
      stylesheetPath: 'src/content/styles.css',
      containerStyles:
        'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647;',
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setOverlayState({
          container,
          root,
          isVisible: true,
        });

        devLog('Overlay displayed');
      })
      .catch((error) => {
        devError('Failed to show overlay:', error);
      });
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

    void this.createShadowContainer({
      id: 'reflexa-error-modal-container',
      stylesheetPath: 'src/content/styles.css',
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setErrorModalState({
          container,
          root,
          isVisible: true,
        });

        devLog('Error modal displayed');
      })
      .catch((error) => {
        devError('Failed to show error modal:', error);
      });
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

    void this.createShadowContainer({
      id: 'reflexa-notification-container',
      stylesheetPath: 'src/content/styles.css',
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setNotificationState({
          container,
          root,
          isVisible: true,
        });

        devLog('Notification displayed');
      })
      .catch((error) => {
        devError('Failed to show notification:', error);
      });
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

    void this.createShadowContainer({
      id: 'reflexa-ai-status-container',
      stylesheetPath: 'src/content/styles.css',
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setHelpModalState({
          container,
          root,
          isVisible: true,
        });

        devLog('Help modal displayed');
      })
      .catch((error) => {
        devError('Failed to show help modal:', error);
      });
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

    void this.createShadowContainer({
      id: 'reflexa-settings-container',
      stylesheetPath: 'src/content/styles.css',
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setSettingsModalState({
          container,
          root,
          isVisible: true,
        });

        devLog('Settings modal displayed');
      })
      .catch((error) => {
        devError('Failed to show settings modal:', error);
      });
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

    void this.createShadowContainer({
      id: 'reflexa-dashboard-container',
      stylesheetPath: 'src/content/styles.css',
    })
      .then(({ container, rootElement }) => {
        const root = createRoot(rootElement);
        root.render(component);

        contentState.setDashboardModalState({
          container,
          root,
          isVisible: true,
        });

        devLog('Dashboard modal displayed');
      })
      .catch((error) => {
        devError('Failed to show dashboard modal:', error);
      });
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
