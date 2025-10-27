import React from 'react';
import type { Reflection } from '../types';

interface ReflectionCardProps {
  reflection: Reflection;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

/**
 * ReflectionCard component displays an individual reflection with:
 * - Page title as heading with link to original URL
 * - Creation date in human-readable format
 * - Three-bullet summary with icons
 * - User's reflection text in serif font (Lora)
 * - Hover effect with shadow transition
 * - Optional delete button
 * - Loading state with skeleton UI
 * - Error handling for malformed data
 */
const ReflectionCardComponent: React.FC<ReflectionCardProps> = ({
  reflection,
  onDelete,
  isLoading = false,
}) => {
  // Loading state - skeleton UI
  if (isLoading) {
    return (
      <article
        className="border-calm-200 relative animate-pulse rounded-lg border bg-white p-6"
        aria-busy="true"
        aria-label="Loading reflection"
      >
        <div className="mb-4">
          <div className="bg-calm-200 mb-2 h-6 w-3/4 rounded"></div>
          <div className="bg-calm-200 h-4 w-1/4 rounded"></div>
        </div>
        <div className="mb-4 space-y-3">
          <div className="bg-calm-50 rounded-md p-3">
            <div className="bg-calm-200 h-4 rounded"></div>
          </div>
          <div className="bg-calm-50 rounded-md p-3">
            <div className="bg-calm-200 h-4 rounded"></div>
          </div>
          <div className="bg-calm-50 rounded-md p-3">
            <div className="bg-calm-200 h-4 rounded"></div>
          </div>
        </div>
        <div className="border-calm-200 space-y-2 border-t pt-4">
          <div className="bg-calm-200 h-4 rounded"></div>
          <div className="bg-calm-200 h-4 w-5/6 rounded"></div>
        </div>
      </article>
    );
  }

  // Error state - validate reflection data
  if (
    !reflection?.id ||
    !reflection?.title ||
    !reflection?.url ||
    !reflection?.createdAt
  ) {
    return (
      <article
        className="relative rounded-lg border border-red-200 bg-red-50 p-6"
        role="alert"
        aria-label="Error loading reflection"
      >
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-red-600"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="mb-1 text-sm font-semibold text-red-600">
              Unable to load reflection
            </p>
            <p className="text-xs text-red-500">
              The reflection data may be corrupted or incomplete. Please try
              refreshing the page.
            </p>
          </div>
        </div>
      </article>
    );
  }
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Today
    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }

    // Yesterday
    if (diffInDays === 1) {
      return 'Yesterday';
    }

    // Within last week
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    // Older - show full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const summaryLabels = ['Insight', 'Surprise', 'Apply'];
  const summaryIcons = ['💡', '✨', '🎯'];

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm('Delete this reflection?')) {
      onDelete(reflection.id);
    }
  };

  return (
    <article
      className="group border-calm-200 hover:shadow-medium relative rounded-lg border bg-white p-6 transition-all duration-200"
      aria-label={`Reflection on ${reflection.title}`}
    >
      {/* Header with title and date */}
      <header className="mb-4">
        <a
          href={reflection.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-calm-900 hover:text-zen-600 focus-visible:outline-zen-500 mb-2 block text-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {reflection.title}
        </a>
        <time
          dateTime={new Date(reflection.createdAt).toISOString()}
          className="text-calm-500 text-sm"
        >
          {formatDate(reflection.createdAt)}
        </time>
      </header>

      {/* Three-bullet summary */}
      {reflection.summary && reflection.summary.length > 0 && (
        <div className="mb-4 space-y-3">
          {reflection.summary.map((bullet, index) => (
            <div
              key={index}
              className="bg-calm-50 flex items-start gap-3 rounded-md p-3"
            >
              <span
                className="shrink-0 text-xl"
                role="img"
                aria-label={summaryLabels[index]}
              >
                {summaryIcons[index]}
              </span>
              <div className="flex-1">
                <div className="text-zen-600 mb-1 text-xs font-semibold tracking-wider uppercase">
                  {summaryLabels[index]}
                </div>
                <p className="text-calm-700 text-sm leading-relaxed">
                  {bullet}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User's reflection text */}
      {reflection.reflection && reflection.reflection.length > 0 && (
        <div className="border-calm-200 space-y-3 border-t pt-4">
          {reflection.reflection.map((text, index) => (
            <p
              key={index}
              className="text-calm-800 font-serif text-base leading-relaxed"
            >
              {text}
            </p>
          ))}
        </div>
      )}

      {/* Optional delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="text-calm-400 hover:bg-calm-100 hover:text-calm-600 focus-visible:outline-zen-500 absolute top-4 right-4 rounded-md p-2 opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Delete reflection"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}
    </article>
  );
};

// Memoized export with custom comparison for optimal performance
export const ReflectionCard = React.memo(
  ReflectionCardComponent,
  (prevProps, nextProps) => {
    // Only re-render if reflection data or callbacks changed
    return (
      prevProps.reflection.id === nextProps.reflection.id &&
      prevProps.reflection.createdAt === nextProps.reflection.createdAt &&
      prevProps.reflection.title === nextProps.reflection.title &&
      prevProps.reflection.summary === nextProps.reflection.summary &&
      prevProps.reflection.reflection === nextProps.reflection.reflection &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);
