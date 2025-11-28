/**
 * UIManager Unit Tests and Property-Based Tests
 * Tests for the UIManager class covering modal lifecycle management
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';

// Mock the logger to prevent console output during tests
vi.mock('../../utils/logger', () => ({
  devLog: vi.fn(),
  devWarn: vi.fn(),
  devError: vi.fn(),
}));

// Mock chrome.runtime.getURL
const mockGetURL = vi.fn(
  (path: string) => `chrome-extension://test-id/${path}`
);
vi.stubGlobal('chrome', {
  runtime: {
    getURL: mockGetURL,
  },
});

// Import after mocks are set up
import { contentState } from '../state';

// We need to create a testable version of UIManager since the original is a singleton
// Re-create the UIManager class for testing purposes
import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import type { ShadowContainerConfig } from './types';

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

/**
 * Testable UIManager class - mirrors the production implementation
 */
class TestableUIManager {
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

  showModal(
    type: ModalType,
    component: ReactNode,
    overrideConfig?: Partial<ModalConfig>
  ): void {
    const { get, set } = this.getStateAccessors(type);
    const state = get();

    if (state.isVisible) {
      return;
    }

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
  }

  hideModal(type: ModalType): void {
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
  }

  // Public API methods
  showNudge(component: ReactNode, inlineStyles: string): void {
    this.showModal('nudge', component, { inlineStyles });
  }

  hideNudge(): void {
    this.hideModal('nudge');
  }

  showOverlay(component: ReactNode): void {
    this.showModal('overlay', component);
  }

  hideOverlay(): void {
    this.hideModal('overlay');
  }

  showHelpModal(component: ReactNode): void {
    this.showModal('helpModal', component);
  }

  hideHelpModal(): void {
    this.hideModal('helpModal');
  }

  showSettingsModal(component: ReactNode): void {
    this.showModal('settingsModal', component);
  }

  hideSettingsModal(): void {
    this.hideModal('settingsModal');
  }

  showDashboardModal(component: ReactNode): void {
    this.showModal('dashboardModal', component);
  }

  hideDashboardModal(): void {
    this.hideModal('dashboardModal');
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

// Test component factory
const createTestComponent = (text = 'Test Content'): ReactNode => {
  return React.createElement('div', { 'data-testid': 'test-component' }, text);
};

// Modal type arbitrary for property tests
const modalTypeArb = fc.constantFrom<ModalType>(
  'nudge',
  'overlay',
  'errorModal',
  'notification',
  'helpModal',
  'settingsModal',
  'dashboardModal'
);

// Unique modal types arbitrary (for testing multiple modals)
const uniqueModalTypesArb = fc.uniqueArray(modalTypeArb, {
  minLength: 1,
  maxLength: 7,
});

describe('UIManager', () => {
  let uiManager: TestableUIManager;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Reset content state
    contentState.resetUIState();
    // Create fresh UIManager instance
    uiManager = new TestableUIManager();
    // Reset mock
    mockGetURL.mockClear();
  });

  afterEach(() => {
    // Clean up any remaining modals
    uiManager.cleanup();
    document.body.innerHTML = '';
  });

  describe('Unit Tests', () => {
    describe('showModal - creates shadow DOM container', () => {
      it('should create a shadow DOM container when showing overlay modal', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);

        const container = document.getElementById('reflexa-overlay-container');
        expect(container).not.toBeNull();
        expect(container?.shadowRoot).not.toBeNull();
      });

      it('should create a shadow DOM container when showing help modal', () => {
        const component = createTestComponent();

        uiManager.showHelpModal(component);

        const container = document.getElementById(
          'reflexa-ai-status-container'
        );
        expect(container).not.toBeNull();
        expect(container?.shadowRoot).not.toBeNull();
      });

      it('should render React component inside shadow DOM', () => {
        const component = createTestComponent('Hello World');

        uiManager.showOverlay(component);

        const container = document.getElementById('reflexa-overlay-container');
        const shadowRoot = container?.shadowRoot;
        expect(shadowRoot).not.toBeNull();
        // The root element should exist in shadow DOM
        const rootElement = shadowRoot?.querySelector('div');
        expect(rootElement).not.toBeNull();
      });

      it('should update content state when modal is shown', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);

        const state = contentState.getOverlayState();
        expect(state.isVisible).toBe(true);
        expect(state.container).not.toBeNull();
        expect(state.root).not.toBeNull();
      });
    });

    describe('duplicate modal prevention', () => {
      it('should not create duplicate container when modal is already visible', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);
        const firstContainer = document.getElementById(
          'reflexa-overlay-container'
        );

        uiManager.showOverlay(createTestComponent('Second'));
        const containers = document.querySelectorAll(
          '#reflexa-overlay-container'
        );

        expect(containers.length).toBe(1);
        expect(document.getElementById('reflexa-overlay-container')).toBe(
          firstContainer
        );
      });

      it('should not call createRoot twice for same modal type', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);
        const state1 = contentState.getOverlayState();
        const root1 = state1.root;

        uiManager.showOverlay(createTestComponent('Second'));
        const state2 = contentState.getOverlayState();

        expect(state2.root).toBe(root1);
      });
    });

    describe('hideModal - removes container from DOM', () => {
      it('should remove container from DOM when hiding modal', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);
        expect(
          document.getElementById('reflexa-overlay-container')
        ).not.toBeNull();

        uiManager.hideOverlay();
        expect(document.getElementById('reflexa-overlay-container')).toBeNull();
      });

      it('should update content state when modal is hidden', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);
        uiManager.hideOverlay();

        const state = contentState.getOverlayState();
        expect(state.isVisible).toBe(false);
        expect(state.container).toBeNull();
        expect(state.root).toBeNull();
      });

      it('should do nothing when hiding already hidden modal', () => {
        // Should not throw
        expect(() => uiManager.hideOverlay()).not.toThrow();

        const state = contentState.getOverlayState();
        expect(state.isVisible).toBe(false);
      });
    });

    describe('cleanup - hides all modals', () => {
      it('should hide all visible modals when cleanup is called', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);
        uiManager.showHelpModal(component);
        uiManager.showSettingsModal(component);

        expect(
          document.getElementById('reflexa-overlay-container')
        ).not.toBeNull();
        expect(
          document.getElementById('reflexa-ai-status-container')
        ).not.toBeNull();
        expect(
          document.getElementById('reflexa-settings-container')
        ).not.toBeNull();

        uiManager.cleanup();

        expect(document.getElementById('reflexa-overlay-container')).toBeNull();
        expect(
          document.getElementById('reflexa-ai-status-container')
        ).toBeNull();
        expect(
          document.getElementById('reflexa-settings-container')
        ).toBeNull();
      });

      it('should reset all modal states when cleanup is called', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);
        uiManager.showHelpModal(component);

        uiManager.cleanup();

        expect(contentState.getOverlayState().isVisible).toBe(false);
        expect(contentState.getHelpModalState().isVisible).toBe(false);
      });
    });

    describe('stylesheet injection', () => {
      it('should inject stylesheet link when stylesheetPath is provided', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);

        const container = document.getElementById('reflexa-overlay-container');
        const shadowRoot = container?.shadowRoot;
        const linkElement = shadowRoot?.querySelector('link');

        expect(linkElement).not.toBeNull();
        expect(linkElement?.rel).toBe('stylesheet');
        expect(linkElement?.href).toContain('src/content/styles.css');
      });

      it('should call chrome.runtime.getURL for stylesheet path', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);

        expect(mockGetURL).toHaveBeenCalledWith('src/content/styles.css');
      });

      it('should inject inline styles when inlineStyles is provided', () => {
        const component = createTestComponent();
        const inlineStyles = '.test { color: red; }';

        uiManager.showNudge(component, inlineStyles);

        const container = document.getElementById('reflexa-nudge-container');
        const shadowRoot = container?.shadowRoot;
        const styleElement = shadowRoot?.querySelector('style');

        expect(styleElement).not.toBeNull();
        expect(styleElement?.textContent).toBe(inlineStyles);
      });
    });

    describe('container styles', () => {
      it('should apply container styles for overlay modal', () => {
        const component = createTestComponent();

        uiManager.showOverlay(component);

        const container = document.getElementById('reflexa-overlay-container');
        expect(container?.style.cssText).toContain('position: fixed');
        expect(container?.style.cssText).toContain('z-index: 2147483647');
      });
    });
  });
});

describe('Property-Based Tests', () => {
  /**
   * **Feature: next-phase-improvements, Property 9: Modal show creates shadow DOM and renders component**
   * **Validates: Requirements 2.1**
   *
   * For any modal type and React component, when showModal is called,
   * a shadow DOM container should be created in the document body and
   * the component should be rendered within it.
   */
  it('Property 9: Modal show creates shadow DOM and renders component', () => {
    fc.assert(
      fc.property(modalTypeArb, (modalType) => {
        // Reset state for each property test iteration
        contentState.resetUIState();
        document.body.innerHTML = '';
        const manager = new TestableUIManager();
        const component = createTestComponent(`Content for ${modalType}`);

        // Get the expected container ID for this modal type
        const expectedId = MODAL_CONFIGS[modalType].id;

        // Show the modal
        manager.showModal(modalType, component);

        // Verify shadow DOM container was created
        const container = document.getElementById(expectedId);
        expect(container).not.toBeNull();
        expect(container?.shadowRoot).not.toBeNull();

        // Verify the root element exists in shadow DOM
        const rootElement = container?.shadowRoot?.querySelector('div');
        expect(rootElement).not.toBeNull();

        // Verify state was updated
        const stateAccessors: Record<ModalType, () => { isVisible: boolean }> =
          {
            nudge: () => contentState.getNudgeState(),
            overlay: () => contentState.getOverlayState(),
            errorModal: () => contentState.getErrorModalState(),
            notification: () => contentState.getNotificationState(),
            helpModal: () => contentState.getHelpModalState(),
            settingsModal: () => contentState.getSettingsModalState(),
            dashboardModal: () => contentState.getDashboardModalState(),
          };
        expect(stateAccessors[modalType]().isVisible).toBe(true);

        // Cleanup
        manager.cleanup();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: next-phase-improvements, Property 10: Duplicate modal prevention (Idempotence)**
   * **Validates: Requirements 2.2**
   *
   * For any modal type that is already visible, calling showModal again
   * should not create additional containers - the container count should remain the same.
   */
  it('Property 10: Duplicate modal prevention (Idempotence)', () => {
    fc.assert(
      fc.property(modalTypeArb, (modalType) => {
        // Reset state for each property test iteration
        contentState.resetUIState();
        document.body.innerHTML = '';
        const manager = new TestableUIManager();
        const component1 = createTestComponent('First');
        const component2 = createTestComponent('Second');

        const expectedId = MODAL_CONFIGS[modalType].id;

        // Show modal first time
        manager.showModal(modalType, component1);
        const containerCountBefore = document.querySelectorAll(
          `#${expectedId}`
        ).length;
        const containerBefore = document.getElementById(expectedId);

        // Show modal second time (should be idempotent)
        manager.showModal(modalType, component2);
        const containerCountAfter = document.querySelectorAll(
          `#${expectedId}`
        ).length;
        const containerAfter = document.getElementById(expectedId);

        // Container count should remain the same
        expect(containerCountAfter).toBe(containerCountBefore);
        expect(containerCountAfter).toBe(1);

        // Should be the same container instance
        expect(containerAfter).toBe(containerBefore);

        // Cleanup
        manager.cleanup();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: next-phase-improvements, Property 11: Modal hide removes container from DOM**
   * **Validates: Requirements 2.3**
   *
   * For any visible modal, when hideModal is called, the container should
   * be removed from the document body and the React root should be unmounted.
   */
  it('Property 11: Modal hide removes container from DOM', () => {
    fc.assert(
      fc.property(modalTypeArb, (modalType) => {
        // Reset state for each property test iteration
        contentState.resetUIState();
        document.body.innerHTML = '';
        const manager = new TestableUIManager();
        const component = createTestComponent(`Content for ${modalType}`);

        const expectedId = MODAL_CONFIGS[modalType].id;

        // Show modal
        manager.showModal(modalType, component);
        expect(document.getElementById(expectedId)).not.toBeNull();

        // Hide modal
        manager.hideModal(modalType);

        // Container should be removed from DOM
        expect(document.getElementById(expectedId)).toBeNull();

        // State should be updated
        const stateAccessors: Record<
          ModalType,
          () => {
            isVisible: boolean;
            container: HTMLDivElement | null;
            root: ReturnType<typeof createRoot> | null;
          }
        > = {
          nudge: () => contentState.getNudgeState(),
          overlay: () => contentState.getOverlayState(),
          errorModal: () => contentState.getErrorModalState(),
          notification: () => contentState.getNotificationState(),
          helpModal: () => contentState.getHelpModalState(),
          settingsModal: () => contentState.getSettingsModalState(),
          dashboardModal: () => contentState.getDashboardModalState(),
        };
        const state = stateAccessors[modalType]();
        expect(state.isVisible).toBe(false);
        expect(state.container).toBeNull();
        expect(state.root).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: next-phase-improvements, Property 12: Cleanup hides all modals**
   * **Validates: Requirements 2.4**
   *
   * For any set of visible modals, when cleanup is called, all modal
   * containers should be removed from the DOM.
   */
  it('Property 12: Cleanup hides all modals', () => {
    fc.assert(
      fc.property(uniqueModalTypesArb, (modalTypes) => {
        // Reset state for each property test iteration
        contentState.resetUIState();
        document.body.innerHTML = '';
        const manager = new TestableUIManager();

        // Show all modals in the set
        for (const modalType of modalTypes) {
          const component = createTestComponent(`Content for ${modalType}`);
          manager.showModal(modalType, component);
        }

        // Verify all modals are visible
        for (const modalType of modalTypes) {
          const expectedId = MODAL_CONFIGS[modalType].id;
          expect(document.getElementById(expectedId)).not.toBeNull();
        }

        // Call cleanup
        manager.cleanup();

        // All containers should be removed
        for (const modalType of modalTypes) {
          const expectedId = MODAL_CONFIGS[modalType].id;
          expect(document.getElementById(expectedId)).toBeNull();
        }

        // All states should be reset
        const allStates = [
          contentState.getNudgeState(),
          contentState.getOverlayState(),
          contentState.getErrorModalState(),
          contentState.getNotificationState(),
          contentState.getHelpModalState(),
          contentState.getSettingsModalState(),
          contentState.getDashboardModalState(),
        ];

        for (const state of allStates) {
          expect(state.isVisible).toBe(false);
          expect(state.container).toBeNull();
          expect(state.root).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});
