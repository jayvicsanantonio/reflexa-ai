import React from 'react';
import { createRoot } from 'react-dom/client';

import { PopupHero } from './components/PopupHero';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import './styles.css';
import { ErrorBoundary } from '../utils/ErrorBoundary';

/**
 * Dashboard Popup Application
 * Main interface for viewing reflection history, stats, and exporting data
 */
export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  // Render the minimalist hero popup
  return <PopupHero />;
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
