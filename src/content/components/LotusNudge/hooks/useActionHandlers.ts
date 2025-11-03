/**
 * useActionHandlers Hook
 * Handlers for opening settings, dashboard, and help
 */

import { useCallback } from 'react';

interface HandlersOptions {
  onSettings?: () => void;
  onDashboard?: () => void;
  onHelp?: () => void;
}

export const useActionHandlers = ({
  onSettings,
  onDashboard,
  onHelp,
}: HandlersOptions) => {
  const openSettings = useCallback(() => {
    if (onSettings) {
      onSettings();
      return;
    }
    try {
      void chrome.runtime.openOptionsPage();
    } catch {
      // Fallback if openOptionsPage is not available
      void chrome.runtime.sendMessage({ type: 'openOptions' });
    }
  }, [onSettings]);

  const openDashboard = useCallback(() => {
    if (onDashboard) {
      onDashboard();
      return;
    }
    try {
      // Fallback: ask background to open in active tab
      void chrome.runtime.sendMessage({ type: 'openDashboardInActiveTab' });
    } catch {
      // no-op
    }
  }, [onDashboard]);

  const openHelp = useCallback(() => {
    if (onHelp) onHelp();
    else openSettings();
  }, [onHelp, openSettings]);

  return { openSettings, openDashboard, openHelp };
};
