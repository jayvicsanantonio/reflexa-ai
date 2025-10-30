import React, { useState } from 'react';
import type { AICapabilities, UsageStats } from '../types';

interface AIStatusPanelProps {
  capabilities: AICapabilities;
  usageStats: UsageStats;
  experimentalMode: boolean;
  performanceStats?: PerformanceStats;
}

interface PerformanceStats {
  averageResponseTime: number;
  slowestOperation: {
    operationType: string;
    apiUsed: string;
    duration: number;
    timestamp: number;
  } | null;
  fastestOperation: {
    operationType: string;
    apiUsed: string;
    duration: number;
    timestamp: number;
  } | null;
  totalOperations: number;
  slowOperationsCount: number;
  operationsByType: Record<
    string,
    {
      count: number;
      averageDuration: number;
    }
  >;
  operationsByAPI: Record<
    string,
    {
      count: number;
      averageDuration: number;
    }
  >;
}

/**
 * AIStatusPanel Component
 * Displays the status of all Chrome AI APIs with usage statistics
 * Shows availability indicators and experimental mode badge
 */
const AIStatusPanelComponent: React.FC<AIStatusPanelProps> = ({
  capabilities,
  usageStats,
  experimentalMode,
  performanceStats,
}) => {
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Calculate total AI operations
  const totalOperations =
    usageStats.summarizations +
    usageStats.drafts +
    usageStats.rewrites +
    usageStats.proofreads +
    usageStats.translations +
    usageStats.languageDetections;

  // Format session duration
  const sessionDuration = Date.now() - usageStats.sessionStart;
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  // API status data
  const apiStatuses = [
    {
      name: 'Summarizer',
      key: 'summarizer' as keyof AICapabilities,
      icon: (
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      ),
    },
    {
      name: 'Writer',
      key: 'writer' as keyof AICapabilities,
      icon: (
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      ),
    },
    {
      name: 'Rewriter',
      key: 'rewriter' as keyof AICapabilities,
      icon: (
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      ),
    },
    {
      name: 'Proofreader',
      key: 'proofreader' as keyof AICapabilities,
      icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      name: 'Language Detector',
      key: 'languageDetector' as keyof AICapabilities,
      icon: (
        <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      ),
    },
    {
      name: 'Translator',
      key: 'translator' as keyof AICapabilities,
      icon: (
        <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      ),
    },
    {
      name: 'Prompt API',
      key: 'prompt' as keyof AICapabilities,
      icon: (
        <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
    },
  ];

  return (
    <div
      className="border-calm-200 shadow-soft rounded-xl border bg-white p-6"
      role="region"
      aria-label="AI Status Panel"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-zen-100 flex h-10 w-10 items-center justify-center rounded-full">
            <svg
              className="text-zen-600 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-calm-900 text-lg font-semibold">
              AI Status
            </h2>
            <p className="text-calm-500 text-xs">Chrome Built-in AI APIs</p>
          </div>
        </div>

        {/* Setup Info Button */}
        <button
          onClick={() => setShowSetupModal(true)}
          className="text-calm-600 hover:bg-calm-100 hover:text-calm-900 focus-visible:outline-zen-500 rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="View setup instructions"
          title="View setup instructions"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </div>

      {/* Setup Instructions Modal */}
      {showSetupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSetupModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-calm-200 sticky top-0 flex items-center justify-between border-b bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="bg-zen-100 flex h-10 w-10 items-center justify-center rounded-full">
                  <svg
                    className="text-zen-600 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-calm-900 text-lg font-semibold">
                    Enable Chrome AI APIs
                  </h2>
                  <p className="text-calm-500 text-xs">
                    One-time setup required
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-calm-400 hover:text-calm-600 rounded-md p-1 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-6">
              {/* Introduction */}
              <div className="bg-zen-50 border-zen-200 rounded-lg border p-4">
                <p className="text-calm-700 text-sm leading-relaxed">
                  All Reflexa AI features are powered by Chrome's Built-in AI
                  APIs (Gemini Nano). You need to enable these flags once to
                  unlock all features.
                </p>
              </div>

              {/* Base AI Model */}
              <div>
                <h3 className="text-calm-900 mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-zen-600 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                    1
                  </span>
                  Base AI Model (Required)
                </h3>
                <div className="bg-calm-50 rounded-lg p-4">
                  <p className="text-calm-600 mb-2 text-xs">
                    Navigate to this Chrome flag:
                  </p>
                  <code className="bg-calm-100 text-calm-900 border-calm-200 block rounded border p-2 text-xs">
                    chrome://flags/#optimization-guide-on-device-model
                  </code>
                  <p className="text-calm-600 mt-2 text-xs">
                    Set to:{' '}
                    <span className="text-calm-900 font-semibold">
                      "Enabled BypassPerfRequirement"
                    </span>
                  </p>
                </div>
              </div>

              {/* Core APIs */}
              <div>
                <h3 className="text-calm-900 mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-zen-600 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                    2
                  </span>
                  Core APIs
                </h3>
                <div className="space-y-2">
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#prompt-api-for-gemini-nano
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#summarization-api-for-gemini-nano
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Writing Assistance APIs */}
              <div>
                <h3 className="text-calm-900 mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-zen-600 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                    3
                  </span>
                  Writing Assistance APIs
                </h3>
                <div className="space-y-2">
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#writer-api
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#rewriter-api
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#proofreader-api
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Translation APIs */}
              <div>
                <h3 className="text-calm-900 mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-zen-600 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
                    4
                  </span>
                  Translation APIs
                </h3>
                <div className="space-y-2">
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#translator-api
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                  <div className="bg-calm-50 rounded-lg p-3">
                    <code className="text-calm-900 block text-xs">
                      chrome://flags/#language-detection-api
                    </code>
                    <p className="text-calm-600 mt-1 text-xs">
                      Set to: <span className="font-semibold">"Enabled"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Final Step */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-amber-900">
                      Important: Restart Chrome
                    </p>
                    <p className="text-xs leading-relaxed text-amber-800">
                      After enabling all flags, you must completely restart
                      Chrome for the changes to take effect. Close all Chrome
                      windows and reopen the browser.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-calm-200 sticky bottom-0 border-t bg-white p-6">
              <button
                onClick={() => setShowSetupModal(false)}
                className="bg-zen-600 hover:bg-zen-700 focus-visible:outline-zen-500 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experimental Mode Badge */}
      {experimentalMode && (
        <div
          className="bg-zen-50 border-zen-200 mb-4 flex items-center gap-2 rounded-lg border p-3"
          role="status"
          aria-label="Experimental mode enabled"
        >
          <svg
            className="text-zen-600 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-calm-900 text-sm font-medium">
              Experimental Mode Active
            </p>
            <p className="text-calm-600 text-xs">
              Using beta AI features and capabilities
            </p>
          </div>
        </div>
      )}

      {/* API Status Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {apiStatuses.map((api) => {
          const isAvailable = capabilities[api.key];
          return (
            <div
              key={api.key}
              className={`border-calm-200 rounded-lg border p-3 transition-colors ${
                isAvailable ? 'bg-zen-50/50' : 'bg-calm-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isAvailable ? 'bg-zen-100' : 'bg-calm-200'
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${
                      isAvailable ? 'text-zen-600' : 'text-calm-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {api.icon}
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-calm-900 truncate text-sm font-medium">
                    {api.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {isAvailable ? (
                      <>
                        <svg
                          className="text-zen-600 h-3 w-3 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="text-zen-600 text-xs font-medium">
                          Available
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="text-calm-400 h-3 w-3 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        <span className="text-calm-500 text-xs">
                          Unavailable
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Statistics */}
      <div className="border-calm-200 mb-4 rounded-lg border p-4">
        <h3 className="text-calm-900 mb-3 text-sm font-semibold">
          Session Statistics
        </h3>

        {/* Total Operations */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-calm-600 text-sm">Total AI Operations</span>
          <span className="font-display text-zen-600 text-lg font-bold">
            {totalOperations}
          </span>
        </div>

        {/* Individual Counters */}
        <div className="space-y-2">
          {usageStats.summarizations > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-calm-600 text-xs">Summarizations</span>
              <span className="text-calm-900 font-mono text-xs font-medium">
                {usageStats.summarizations}
              </span>
            </div>
          )}
          {usageStats.drafts > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-calm-600 text-xs">Drafts</span>
              <span className="text-calm-900 font-mono text-xs font-medium">
                {usageStats.drafts}
              </span>
            </div>
          )}
          {usageStats.rewrites > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-calm-600 text-xs">Rewrites</span>
              <span className="text-calm-900 font-mono text-xs font-medium">
                {usageStats.rewrites}
              </span>
            </div>
          )}
          {usageStats.proofreads > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-calm-600 text-xs">Proofreads</span>
              <span className="text-calm-900 font-mono text-xs font-medium">
                {usageStats.proofreads}
              </span>
            </div>
          )}
          {usageStats.translations > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-calm-600 text-xs">Translations</span>
              <span className="text-calm-900 font-mono text-xs font-medium">
                {usageStats.translations}
              </span>
            </div>
          )}
          {usageStats.languageDetections > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-calm-600 text-xs">Language Detections</span>
              <span className="text-calm-900 font-mono text-xs font-medium">
                {usageStats.languageDetections}
              </span>
            </div>
          )}
        </div>

        {/* Session Duration */}
        <div className="border-calm-200 mt-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-calm-600 text-xs">Session Duration</span>
            <span className="text-calm-900 font-mono text-xs font-medium">
              {formatDuration(sessionDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceStats && performanceStats.totalOperations > 0 && (
        <div className="border-calm-200 mb-4 rounded-lg border p-4">
          <h3 className="text-calm-900 mb-3 text-sm font-semibold">
            Performance Metrics
          </h3>

          {/* Average Response Time */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-calm-600 text-sm">Average Response Time</span>
            <span className="font-display text-zen-600 text-lg font-bold">
              {(performanceStats.averageResponseTime / 1000).toFixed(2)}s
            </span>
          </div>

          {/* Slow Operations Warning */}
          {performanceStats.slowOperationsCount > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
              <svg
                className="h-4 w-4 shrink-0 text-amber-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-xs text-amber-900">
                {performanceStats.slowOperationsCount} slow operation
                {performanceStats.slowOperationsCount > 1 ? 's' : ''} detected
                (&gt;5s)
              </span>
            </div>
          )}

          {/* Operation Type Breakdown */}
          {Object.keys(performanceStats.operationsByType).length > 0 && (
            <div className="space-y-2">
              <p className="text-calm-600 text-xs font-medium">
                Average by Operation
              </p>
              {Object.entries(performanceStats.operationsByType).map(
                ([type, data]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-calm-600 text-xs capitalize">
                      {type}
                    </span>
                    <span className="text-calm-900 font-mono text-xs font-medium">
                      {(data.averageDuration / 1000).toFixed(2)}s
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* API Performance Breakdown */}
          {Object.keys(performanceStats.operationsByAPI).length > 0 && (
            <div className="border-calm-200 mt-3 space-y-2 border-t pt-3">
              <p className="text-calm-600 text-xs font-medium">
                Average by API
              </p>
              {Object.entries(performanceStats.operationsByAPI).map(
                ([api, data]) => (
                  <div key={api} className="flex items-center justify-between">
                    <span className="text-calm-600 text-xs capitalize">
                      {api}
                    </span>
                    <span className="text-calm-900 font-mono text-xs font-medium">
                      {(data.averageDuration / 1000).toFixed(2)}s
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Message */}
      <div className="bg-calm-50 border-calm-200 rounded-lg border p-3">
        <p className="text-calm-600 text-xs leading-relaxed">
          All AI processing happens locally on your device using Gemini Nano. No
          data is sent to external servers.
        </p>
      </div>
    </div>
  );
};

// Memoized export with custom comparison for optimal performance
export const AIStatusPanel = React.memo(
  AIStatusPanelComponent,
  (prevProps, nextProps) => {
    // Only re-render if capabilities, usage stats, performance stats, or experimental mode changed
    return (
      prevProps.capabilities.summarizer === nextProps.capabilities.summarizer &&
      prevProps.capabilities.writer === nextProps.capabilities.writer &&
      prevProps.capabilities.rewriter === nextProps.capabilities.rewriter &&
      prevProps.capabilities.proofreader ===
        nextProps.capabilities.proofreader &&
      prevProps.capabilities.languageDetector ===
        nextProps.capabilities.languageDetector &&
      prevProps.capabilities.translator === nextProps.capabilities.translator &&
      prevProps.capabilities.prompt === nextProps.capabilities.prompt &&
      prevProps.capabilities.experimental ===
        nextProps.capabilities.experimental &&
      prevProps.usageStats.summarizations ===
        nextProps.usageStats.summarizations &&
      prevProps.usageStats.drafts === nextProps.usageStats.drafts &&
      prevProps.usageStats.rewrites === nextProps.usageStats.rewrites &&
      prevProps.usageStats.proofreads === nextProps.usageStats.proofreads &&
      prevProps.usageStats.translations === nextProps.usageStats.translations &&
      prevProps.usageStats.languageDetections ===
        nextProps.usageStats.languageDetections &&
      prevProps.experimentalMode === nextProps.experimentalMode &&
      prevProps.performanceStats?.totalOperations ===
        nextProps.performanceStats?.totalOperations &&
      prevProps.performanceStats?.averageResponseTime ===
        nextProps.performanceStats?.averageResponseTime
    );
  }
);
