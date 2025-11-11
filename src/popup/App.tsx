import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

import { ReflectionCard } from './ReflectionCard';
import { VirtualList } from './VirtualList';
import { StreakCounter } from './StreakCounter';
import { CalmStats } from './CalmStats';
import { ExportModal } from './ExportModal';
import { PopupHero } from './components/PopupHero';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import type { CalmStats as CalmStatsType } from '../types';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import { useReflections } from './hooks/useReflections';
import { useStreak } from './hooks/useStreak';
import { usePrivacyNotice } from './hooks/usePrivacyNotice';
import './styles.css';
import { ErrorBoundary } from '../utils/ErrorBoundary';
import { devLog } from '../utils/logger';

/**
 * Dashboard Popup Application
 * Main interface for viewing reflection history, stats, and exporting data
 */
export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  // Custom hooks for data management
  const { reflections, deleteReflection } = useReflections();
  const { streakData } = useStreak();
  const { showPrivacyNotice, dismissPrivacyNotice } = usePrivacyNotice();
  const [showExportModal, setShowExportModal] = useState(false);

  // Calculate calm stats from reflections
  const calmStats = useMemo<CalmStatsType>(() => {
    if (reflections.length === 0) {
      return {
        totalReflections: 0,
        averagePerDay: 0,
        totalReadingTime: 0,
        totalReflectionTime: 0,
        reflectionRatio: 0,
      };
    }

    // Calculate days since first reflection
    const firstReflection = reflections[reflections.length - 1];
    const daysSinceFirst = Math.max(
      1,
      Math.ceil(
        (Date.now() - firstReflection.createdAt) / (1000 * 60 * 60 * 24)
      )
    );

    // Estimate reading time (assume 200 words per minute, 5 min average per article)
    const totalReadingTime = reflections.length * 5 * 60; // 5 minutes per article in seconds

    // Estimate reflection time (assume 3 minutes per reflection)
    const totalReflectionTime = reflections.length * 3 * 60; // 3 minutes per reflection in seconds

    return {
      totalReflections: reflections.length,
      averagePerDay: reflections.length / daysSinceFirst,
      totalReadingTime,
      totalReflectionTime,
      reflectionRatio:
        totalReflectionTime / (totalReadingTime + totalReflectionTime),
    };
  }, [reflections]);

  // Handle reflection deletion (delegated to hook)
  const handleDelete = useCallback(
    (id: string) => {
      void deleteReflection(id);
    },
    [deleteReflection]
  );

  const handleStreakIncrease = useCallback(() => {
    devLog('Streak increased! 🎉');
  }, []);

  // Handle reflect button click
  const handleReflectClick = useCallback(() => {
    // Close popup immediately for better UX
    window.close();

    // Send message to start reflection (fire and forget)
    chrome.runtime
      .sendMessage({
        type: 'startReflectInActiveTab',
      })
      .catch(() => {
        // Popup is already closed, nothing to do
      });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+E to open export modal
      if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (reflections.length > 0) {
          setShowExportModal(true);
        }
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowExportModal(false);
        dismissPrivacyNotice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reflections.length, dismissPrivacyNotice]);

  // Always render the minimalist hero popup
  return (
    <>
      <PopupHero onReflectClick={handleReflectClick} />
      <PrivacyNoticeModal
        isOpen={showPrivacyNotice}
        onClose={dismissPrivacyNotice}
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
