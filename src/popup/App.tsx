import React from 'react';
import { createRoot } from 'react-dom/client';

import { HeroSection } from './components';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import './styles.css';
import { ErrorBoundary } from '../utils/ErrorBoundary';

/**
 * Dashboard Popup Application
 * Main interface for viewing reflection history, stats, and exporting data
 *
 * Currently renders the minimalist hero popup for toolbar interaction.
 * The full dashboard view with reflections, stats, and export functionality
 * is available through the DashboardModal in the content script.
 */
export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  // Render the minimalist hero popup
  return <HeroSection />;
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
