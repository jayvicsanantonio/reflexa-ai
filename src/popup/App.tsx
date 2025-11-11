import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';

import { ExportModal } from './ExportModal';
import { PopupHero } from './components/PopupHero';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import { useModal } from '../utils/hooks';
import { useReflections } from './hooks/useReflections';
import { useFirstLaunch } from './hooks/useFirstLaunch';
import './styles.css';
import { ErrorBoundary } from '../utils/ErrorBoundary';

/**
 * Dashboard Popup Application
 * Main interface for viewing reflection history, stats, and exporting data
 */
export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  // Use custom hooks for data management
  const { reflections } = useReflections();
  const [isFirstLaunch, markAsLaunched] = useFirstLaunch();
  const [showExportModal, openExportModal, closeExportModal] = useModal();

  // Handle privacy notice close
  const handlePrivacyClose = useCallback(async () => {
    await markAsLaunched();
  }, [markAsLaunched]);

  // Handle export shortcut (Cmd/Ctrl+E)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (reflections.length > 0) {
          openExportModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reflections.length, openExportModal]);

  // Always render the minimalist hero popup
  return (
    <>
      <PopupHero />
      <PrivacyNoticeModal isOpen={isFirstLaunch} onClose={handlePrivacyClose} />
      <ExportModal
        reflections={reflections}
        isOpen={showExportModal}
        onClose={closeExportModal}
      />
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
