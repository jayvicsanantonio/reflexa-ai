/**
 * Nudge Setup
 * Handles lotus nudge display and interactions
 */

import { LotusNudge } from '../components';
import { contentState } from '../state';
import { uiManager } from '../ui';
import { devLog } from '../../utils/logger';

/**
 * Lotus nudge styles constant for better maintainability
 */
export const LOTUS_NUDGE_STYLES = `
  /* Keyframe animations */
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes pulseGentle {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  /* Base component styles */
  .reflexa-nudge-wrapper {
    position: fixed;
    z-index: 999999;
  }

  .reflexa-nudge-wrapper--bottom-right { bottom: 32px; right: 32px; }
  .reflexa-nudge-wrapper--bottom-left { bottom: 32px; left: 32px; }
  .reflexa-nudge-wrapper--top-right { top: 32px; right: 32px; }
  .reflexa-nudge-wrapper--top-left { top: 32px; left: 32px; }

  /* Expand wrapper hit area to include the vertical quick-actions column */
  .reflexa-nudge-wrapper--bottom-left,
  .reflexa-nudge-wrapper--bottom-right {
    padding-top: 160px; /* height to cover 3 x 44px + gaps */
  }
  .reflexa-nudge-wrapper--top-left,
  .reflexa-nudge-wrapper--top-right {
    padding-bottom: 160px;
  }

  .reflexa-lotus-nudge {
    position: relative; /* positioned by wrapper */
    width: 64px;
    height: 64px;
    background: linear-gradient(
      135deg,
      var(--color-zen-500, #0ea5e9) 0%,
      var(--color-zen-600, #0284c7) 100%
    );
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 999999;
    transition: transform 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, border-radius 0.2s ease;
    padding: 0 16px;
    /* Apply animations */
    animation:
      fadeIn 0.1s ease-in-out,
      pulseGentle 2s ease-in-out infinite;
  }

  /* Quick circular actions (hidden by default) */
  .reflexa-nudge-quick {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
  }

  .reflexa-nudge-wrapper--bottom-left .reflexa-nudge-quick { left: 0; bottom: 80px; }
  .reflexa-nudge-wrapper--bottom-right .reflexa-nudge-quick { right: 0; bottom: 80px; }
  .reflexa-nudge-wrapper--top-left .reflexa-nudge-quick { left: 0; top: 80px; }
  .reflexa-nudge-wrapper--top-right .reflexa-nudge-quick { right: 0; top: 80px; }

  .reflexa-nudge-wrapper[data-open="true"] .reflexa-nudge-quick,
  .reflexa-nudge-wrapper:hover .reflexa-nudge-quick,
  .reflexa-nudge-wrapper:focus-within .reflexa-nudge-quick {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .reflexa-nudge-quick__btn {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: none;
    background: var(--color-lotus-100, #eef2ff);
    color: var(--color-lotus-600, #4f46e5);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.18);
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .reflexa-nudge-quick__btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(79,70,229,.24); }
  .reflexa-nudge-quick__btn:active { transform: none; }
  .reflexa-nudge-quick__btn:focus-visible { outline: 3px solid rgba(79,70,229,.55); outline-offset: 3px; }

  /* Tooltips for quick actions */
  .reflexa-nudge-quick__btn {
    position: relative;
  }
  .reflexa-nudge-quick__tooltip {
    position: absolute;
    left: 52px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--color-calm-900, #0f172a);
    color: #fff;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    box-shadow: 0 8px 20px rgba(0,0,0,.25);
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s ease;
  }
  .reflexa-nudge-quick__btn:hover .reflexa-nudge-quick__tooltip,
  .reflexa-nudge-quick__btn:focus .reflexa-nudge-quick__tooltip { opacity: 1; }

  /* Position variants */
  .reflexa-lotus-nudge--bottom-right {}
  .reflexa-lotus-nudge--bottom-left {}
  .reflexa-lotus-nudge--top-right {}
  .reflexa-lotus-nudge--top-left {}

  /* Hover state */
  .reflexa-lotus-nudge:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
  }

  /* Expand into pill when open (hover/focus) */
  .reflexa-nudge-wrapper[data-open="true"] .reflexa-lotus-nudge,
  .reflexa-nudge-wrapper:hover .reflexa-lotus-nudge,
  .reflexa-nudge-wrapper:focus-within .reflexa-lotus-nudge {
    width: 220px;
    border-radius: 999px;
    justify-content: flex-start;
    gap: 10px;
  }

  .reflexa-lotus-nudge__label {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: .02em;
    opacity: 0;
    width: 0;
    margin-left: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity .18s ease, width .18s ease, margin-left .18s ease;
  }
  .reflexa-nudge-wrapper[data-open="true"] .reflexa-lotus-nudge__label,
  .reflexa-nudge-wrapper:hover .reflexa-lotus-nudge__label,
  .reflexa-nudge-wrapper:focus-within .reflexa-lotus-nudge__label {
    opacity: 1;
    width: auto;
    margin-left: 8px;
  }

  /* Active state */
  .reflexa-lotus-nudge:active {
    transform: scale(0.95);
  }

  /* Focus state */
  .reflexa-lotus-nudge:focus-visible {
    outline: 3px solid #0ea5e9;
    outline-offset: 4px;
  }

  /* Loading state */
  .reflexa-lotus-nudge--loading {
    cursor: wait;
    pointer-events: none;
    opacity: 0.7;
  }

  .reflexa-lotus-nudge--loading::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .reflexa-lotus-nudge {
      animation: fadeIn 0.3s ease-in-out;
    }
    .reflexa-nudge-quick { transition: none; }
  }
`;

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
    LOTUS_NUDGE_STYLES
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
