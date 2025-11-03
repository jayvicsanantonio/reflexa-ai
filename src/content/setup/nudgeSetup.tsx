/**
 * Nudge Setup
 * Handles lotus nudge display and interactions
 */

import { LotusNudge } from '../components';
import { contentState } from '../state';
import { uiManager } from '../ui';
import { devLog } from '../../utils/logger';

/**
 * Nudge now uses Tailwind CSS via stylesheet injection
 * Keyframes are defined in src/styles/animations.css
 */

/**
 * Show the lotus nudge icon
 * Creates a shadow DOM container and renders the React component
 */
export function showLotusNudge(dependencies: {
  onNudgeClick: () => Promise<void>;
  onDashboard: () => Promise<void>;
  onHelp: () => Promise<void>;
  onSettings: () => Promise<void>;
}): void {
  uiManager.showNudge(
    <LotusNudge
      visible={true}
      onClick={dependencies.onNudgeClick}
      position="bottom-left"
      quickActionsCount={3}
      onDashboard={dependencies.onDashboard}
      onHelp={dependencies.onHelp}
      onSettings={dependencies.onSettings}
      onAnimationComplete={() => {
        devLog('Lotus nudge fade-in animation completed');
      }}
    />,
    'src/content/styles.css' // Use stylesheet instead of inline styles for Tailwind support
  );
}

/**
 * Hide the lotus nudge icon
 * Removes the component and cleans up the DOM
 */
export function hideLotusNudge(): void {
  uiManager.hideNudge();
}

/**
 * Handle click on lotus nudge icon
 * Initiates the complete reflection flow
 */
export async function handleNudgeClick(
  initiateReflectionFlow: () => Promise<void>
): Promise<void> {
  devLog('Lotus nudge clicked - initiating reflection');

  // Prevent multiple clicks while loading
  if (contentState.getNudgeState().isLoading) {
    devLog('Already processing, ignoring click');
    return;
  }

  // Start the reflection flow (loading state managed inside)
  await initiateReflectionFlow();

  // Hide the nudge after processing completes
  hideLotusNudge();
}
