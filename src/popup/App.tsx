import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';

import { PopupHero } from './components/PopupHero';
import { PopupDashboard } from './components/PopupDashboard';
import { useReflections } from './hooks/useReflections';
import { useStreak } from './hooks/useStreak';
import { useCalmStats } from './hooks/useCalmStats';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import './styles.css';
import { ErrorBoundary } from '../utils/ErrorBoundary';
import { devLog } from '../utils/logger';

/**
 * Dashboard Popup Application
 * Main interface for viewing reflection history, stats, and exporting data
 * 
 * Currently shows minimalist hero view. To show full dashboard, set showDashboard to true
 */
export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  // Custom hooks for data management
  const { reflections, deleteReflection } = useReflections();
  const { streakData } = useStreak();
  const calmStats = useCalmStats(reflections);

  const handleStreakIncrease = useCallback(() => {
    devLog('Streak increased! 🎉');
  }, []);

  // For now, always show the minimalist hero view
  // In the future, this could be controlled by a setting or URL parameter
  const showDashboard = false;

  if (showDashboard) {
    return (
      <PopupDashboard
        reflections={reflections}
        streakData={streakData}
        calmStats={calmStats}
        onDelete={deleteReflection}
        onStreakIncrease={handleStreakIncrease}
      />
    );
  }

  return <PopupHero />;
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
