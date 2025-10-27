import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { createRoot } from 'react-dom/client';

import { ReflectionCard } from './ReflectionCard';
import { StreakCounter } from './StreakCounter';
import { CalmStats } from './CalmStats';
import type {
  Reflection,
  StreakData,
  CalmStats as CalmStatsType,
} from '../types';
import { STORAGE_KEYS, PRIVACY_NOTICE } from '../constants';
import { formatISODate } from '../utils';
import './styles.css';

/**
 * Dashboard Popup Application
 * Main interface for viewing reflection history, stats, and exporting data
 */
export const App: React.FC = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    current: 0,
    lastReflectionDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [isExporting, setIsExporting] = useState(false);

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

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load reflections, streak, and first launch flag
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.REFLECTIONS,
          STORAGE_KEYS.STREAK,
          STORAGE_KEYS.FIRST_LAUNCH,
        ]);

        // Set reflections (sorted by date, most recent first)
        const loadedReflections = (result[STORAGE_KEYS.REFLECTIONS] ??
          []) as Reflection[];
        const sortedReflections = loadedReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);

        // Set streak data
        if (result[STORAGE_KEYS.STREAK]) {
          setStreakData(result[STORAGE_KEYS.STREAK] as StreakData);
        }

        // Check if first launch
        if (!result[STORAGE_KEYS.FIRST_LAUNCH]) {
          setShowPrivacyNotice(true);
          // Mark as launched
          await chrome.storage.local.set({
            [STORAGE_KEYS.FIRST_LAUNCH]: true,
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  // Listen for storage changes to update data in real-time
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return;

      // Update reflections if changed
      if (changes[STORAGE_KEYS.REFLECTIONS]?.newValue) {
        const newReflections = changes[STORAGE_KEYS.REFLECTIONS]
          .newValue as Reflection[];
        const sortedReflections = newReflections.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setReflections(sortedReflections);
      }

      // Update streak if changed
      if (changes[STORAGE_KEYS.STREAK]?.newValue) {
        setStreakData(changes[STORAGE_KEYS.STREAK].newValue as StreakData);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Handle reflection deletion
  const handleDelete = useCallback((id: string) => {
    void (async () => {
      try {
        // Get current reflections
        const result = await chrome.storage.local.get(STORAGE_KEYS.REFLECTIONS);
        const currentReflections = (result[STORAGE_KEYS.REFLECTIONS] ??
          []) as Reflection[];

        // Filter out deleted reflection
        const updatedReflections = currentReflections.filter(
          (r) => r.id !== id
        );

        // Save updated reflections
        await chrome.storage.local.set({
          [STORAGE_KEYS.REFLECTIONS]: updatedReflections,
        });

        // Recalculate streak
        if (updatedReflections.length > 0) {
          const dates = updatedReflections.map((r) =>
            formatISODate(r.createdAt)
          );
          const uniqueDates = [...new Set(dates)].sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
          );

          // Calculate streak
          const today = formatISODate(Date.now());
          const yesterday = formatISODate(Date.now() - 24 * 60 * 60 * 1000);

          let streak = 0;
          if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            streak = 1;
            let currentDate = new Date(uniqueDates[0]);

            for (let i = 1; i < uniqueDates.length; i++) {
              const prevDate = new Date(uniqueDates[i]);
              const dayDiff = Math.floor(
                (currentDate.getTime() - prevDate.getTime()) /
                  (24 * 60 * 60 * 1000)
              );

              if (dayDiff === 1) {
                streak++;
                currentDate = prevDate;
              } else if (dayDiff > 1) {
                break;
              }
            }
          }

          await chrome.storage.local.set({
            [STORAGE_KEYS.STREAK]: {
              current: streak,
              lastReflectionDate: uniqueDates[0],
            },
          });
        } else {
          // No reflections left, reset streak
          await chrome.storage.local.set({
            [STORAGE_KEYS.STREAK]: {
              current: 0,
              lastReflectionDate: '',
            },
          });
        }

        // Update local state
        setReflections(
          updatedReflections.sort((a, b) => b.createdAt - a.createdAt)
        );
      } catch (error) {
        console.error('Failed to delete reflection:', error);
      }
    })();
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    try {
      setIsExporting(true);

      // Generate export data
      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        exportData = JSON.stringify(reflections, null, 2);
        filename = `reflexa-reflections-${formatISODate(Date.now())}.json`;
        mimeType = 'application/json';
      } else {
        // Generate Markdown
        let markdown = '# Reflexa AI - Reflections Export\n\n';
        markdown += `Exported on: ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}\n`;
        markdown += `Total Reflections: ${reflections.length}\n\n`;
        markdown += '---\n\n';

        for (const reflection of reflections) {
          markdown += `## ${reflection.title}\n\n`;
          markdown += `**URL:** ${reflection.url}\n`;
          markdown += `**Date:** ${new Date(
            reflection.createdAt
          ).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}\n\n`;

          if (reflection.summary && reflection.summary.length > 0) {
            markdown += '### Summary\n\n';
            const labels = ['Insight', 'Surprise', 'Apply'];
            reflection.summary.forEach((bullet, index) => {
              markdown += `- **${labels[index] ?? 'Point'}:** ${bullet}\n`;
            });
            markdown += '\n';
          }

          if (reflection.reflection && reflection.reflection.length > 0) {
            markdown += '### Reflections\n\n';
            reflection.reflection.forEach((text, index) => {
              markdown += `${index + 1}. ${text}\n\n`;
            });
          }

          if (reflection.proofreadVersion) {
            markdown += '### Proofread Version\n\n';
            markdown += `${reflection.proofreadVersion}\n\n`;
          }

          if (reflection.tags && reflection.tags.length > 0) {
            markdown += `**Tags:** ${reflection.tags.join(', ')}\n\n`;
          }

          markdown += '---\n\n';
        }

        exportData = markdown;
        filename = `reflexa-reflections-${formatISODate(Date.now())}.md`;
        mimeType = 'text/markdown';
      }

      // Create blob and download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Close modal
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export reflections:', error);
    } finally {
      setIsExporting(false);
    }
  }, [reflections, exportFormat]);

  const handleStreakIncrease = useCallback(() => {
    console.log('Streak increased! 🎉');
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
        setShowPrivacyNotice(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reflections.length]);

  // Focus trap refs for modals
  const privacyModalRef = useRef<HTMLDivElement>(null);
  const exportModalRef = useRef<HTMLDivElement>(null);

  // Focus trap for privacy modal
  useEffect(() => {
    if (!showPrivacyNotice || !privacyModalRef.current) return;

    const modal = privacyModalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [showPrivacyNotice]);

  // Focus trap for export modal
  useEffect(() => {
    if (!showExportModal || !exportModalRef.current) return;

    const modal = exportModalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [showExportModal]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-calm-50 flex h-[600px] w-96 items-center justify-center">
        <div className="text-center">
          <div className="bg-zen-500 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-calm-600 text-sm">Loading your reflections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-calm-50 relative h-[600px] w-96 overflow-hidden">
      {/* Header */}
      <header className="border-calm-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="text-zen-600 h-8 w-8"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C12 2 9 6 9 10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10C15 6 12 2 12 2Z" />
              <path d="M12 13C12 13 8 14 6 17C4.89 18.66 5.45 20.89 7.11 22C8.77 23.11 11 22.55 12.11 20.89C13 19.5 13 17 12 13Z" />
              <path d="M12 13C12 13 16 14 18 17C19.11 18.66 18.55 20.89 16.89 22C15.23 23.11 13 22.55 11.89 20.89C11 19.5 11 17 12 13Z" />
            </svg>
            <h1 className="font-display text-calm-900 text-xl font-bold">
              Reflexa AI
            </h1>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="text-calm-600 hover:bg-calm-100 hover:text-calm-900 focus-visible:outline-zen-500 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Export reflections"
            disabled={reflections.length === 0}
          >
            Export
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="h-[calc(600px-64px)] overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Streak Counter */}
          <StreakCounter
            streak={streakData}
            onStreakIncrease={handleStreakIncrease}
          />

          {/* Calm Stats */}
          <CalmStats stats={calmStats} />

          {/* Reflection List */}
          {reflections.length > 0 ? (
            <div className="space-y-4">
              <h2 className="font-display text-calm-900 text-lg font-semibold">
                Your Reflections
              </h2>
              {reflections.map((reflection) => (
                <ReflectionCard
                  key={reflection.id}
                  reflection={reflection}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="border-calm-200 rounded-lg border bg-white p-8 text-center">
              <svg
                className="text-calm-300 mx-auto mb-4 h-16 w-16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C12 2 9 6 9 10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10C15 6 12 2 12 2Z" />
                <path d="M12 13C12 13 8 14 6 17C4.89 18.66 5.45 20.89 7.11 22C8.77 23.11 11 22.55 12.11 20.89C13 19.5 13 17 12 13Z" />
                <path d="M12 13C12 13 16 14 18 17C19.11 18.66 18.55 20.89 16.89 22C15.23 23.11 13 22.55 11.89 20.89C11 19.5 11 17 12 13Z" />
              </svg>
              <h3 className="font-display text-calm-900 mb-2 text-lg font-semibold">
                No reflections yet
              </h3>
              <p className="text-calm-600 mb-4 text-sm">
                Start reading an article and let Reflexa guide you into mindful
                reflection.
              </p>
              <p className="text-calm-500 font-serif text-xs italic">
                Your journey begins with a single pause.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice Modal */}
      {showPrivacyNotice && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-notice-title"
        >
          <div
            ref={privacyModalRef}
            className="mx-6 max-w-sm rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="bg-zen-100 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <svg
                  className="text-zen-600 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2
                  id="privacy-notice-title"
                  className="font-display text-calm-900 mb-2 text-lg font-semibold"
                >
                  Your Privacy Matters
                </h2>
                <p className="text-calm-700 mb-4 text-sm leading-relaxed">
                  {PRIVACY_NOTICE}
                </p>
                <p className="text-calm-600 text-xs">
                  All processing happens on your device. No data is ever sent to
                  external servers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="from-zen-500 to-zen-600 hover:from-zen-600 hover:to-zen-700 focus-visible:outline-zen-500 w-full rounded-lg bg-linear-to-r px-4 py-2.5 text-sm font-semibold text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
        >
          <div
            ref={exportModalRef}
            className="mx-6 max-w-sm rounded-xl bg-white p-6 shadow-xl"
          >
            <h2
              id="export-modal-title"
              className="font-display text-calm-900 mb-4 text-lg font-semibold"
            >
              Export Reflections
            </h2>
            <p className="text-calm-600 mb-4 text-sm">
              Choose a format to export your {reflections.length} reflection
              {reflections.length !== 1 ? 's' : ''}.
            </p>

            {/* Format selection */}
            <div className="mb-6 space-y-3">
              <label className="border-calm-200 hover:border-zen-400 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                <input
                  type="radio"
                  name="export-format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'json')}
                  className="text-zen-600 focus:ring-zen-500 h-4 w-4"
                />
                <div className="flex-1">
                  <div className="text-calm-900 text-sm font-medium">JSON</div>
                  <div className="text-calm-500 text-xs">
                    Machine-readable format with all metadata
                  </div>
                </div>
              </label>

              <label className="border-calm-200 hover:border-zen-400 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors">
                <input
                  type="radio"
                  name="export-format"
                  value="markdown"
                  checked={exportFormat === 'markdown'}
                  onChange={(e) =>
                    setExportFormat(e.target.value as 'markdown')
                  }
                  className="text-zen-600 focus:ring-zen-500 h-4 w-4"
                />
                <div className="flex-1">
                  <div className="text-calm-900 text-sm font-medium">
                    Markdown
                  </div>
                  <div className="text-calm-500 text-xs">
                    Human-readable format for notes apps
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="text-calm-600 hover:bg-calm-100 focus-visible:outline-zen-500 flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="from-zen-500 to-zen-600 hover:from-zen-600 hover:to-zen-700 focus-visible:outline-zen-500 flex-1 rounded-lg bg-linear-to-r px-4 py-2.5 text-sm font-semibold text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
