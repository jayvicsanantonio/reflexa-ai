/**
 * Modal Setup
 * Handles modal display and interactions
 */

import { uiManager } from '../ui';
import { AIStatusModal } from '../components/AIStatusModal';
import { QuickSettingsModal } from '../components/QuickSettingsModal';
import { DashboardModal } from '../components/DashboardModal';

/**
 * Show AI Status modal (help modal) in the center of the page
 */
export function showHelpModal(): Promise<void> {
  uiManager.showHelpModal(<AIStatusModal onClose={hideHelpModal} />);
  return Promise.resolve();
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
export function showSettingsModal(): Promise<void> {
  uiManager.showSettingsModal(
    <QuickSettingsModal onClose={hideSettingsModal} />
  );
  return Promise.resolve();
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
export function showDashboardModal(): Promise<void> {
  uiManager.showDashboardModal(<DashboardModal onClose={hideDashboardModal} />);
  return Promise.resolve();
}

/**
 * Hide Dashboard modal
 */
export function hideDashboardModal(): void {
  uiManager.hideDashboardModal();
}
