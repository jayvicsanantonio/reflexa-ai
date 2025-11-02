/**
 * Modal Setup
 * Handles modal display and interactions
 */

import { uiManager } from '../ui';

/**
 * Show AI Status modal (help modal) in the center of the page
 */
export async function showHelpModal(): Promise<void> {
  const { AIStatusModal } = await import('../components/AIStatusModal');
  uiManager.showHelpModal(<AIStatusModal onClose={hideHelpModal} />);
}

/**
 * Hide AI Status modal
 */
export function hideHelpModal(): void {
  uiManager.hideHelpModal();
}

/**
 * Show Quick Settings modal in the center of the page
 */
export async function showSettingsModal(): Promise<void> {
  const { QuickSettingsModal } = await import(
    '../components/QuickSettingsModal'
  );
  uiManager.showSettingsModal(
    <QuickSettingsModal onClose={hideSettingsModal} />
  );
}

/**
 * Hide Quick Settings modal
 */
export function hideSettingsModal(): void {
  uiManager.hideSettingsModal();
}

/**
 * Show Dashboard modal
 */
export async function showDashboardModal(): Promise<void> {
  const { DashboardModal } = await import('../components/DashboardModal');
  uiManager.showDashboardModal(<DashboardModal onClose={hideDashboardModal} />);
}

/**
 * Hide Dashboard modal
 */
export function hideDashboardModal(): void {
  uiManager.hideDashboardModal();
}
