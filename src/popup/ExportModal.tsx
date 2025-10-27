import React, { useEffect, useRef, useState } from 'react';
import type { Reflection } from '../types';
import { formatISODate } from '../utils';

interface ExportModalProps {
  reflections: Reflection[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Validates reflection data before export
 * Ensures all required fields are present and valid
 */
const validateReflections = (
  reflections: Reflection[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(reflections)) {
    errors.push('Reflections data is not an array');
    return { valid: false, errors };
  }

  if (reflections.length === 0) {
    errors.push('No reflections to export');
    return { valid: false, errors };
  }

  reflections.forEach((reflection, index) => {
    if (!reflection.id) {
      errors.push(`Reflection ${index + 1}: Missing ID`);
    }
    if (!reflection.title) {
      errors.push(`Reflection ${index + 1}: Missing title`);
    }
    if (!reflection.url) {
      errors.push(`Reflection ${index + 1}: Missing URL`);
    }
    if (!reflection.createdAt || typeof reflection.createdAt !== 'number') {
      errors.push(`Reflection ${index + 1}: Invalid creation date`);
    }
    if (!Array.isArray(reflection.summary)) {
      errors.push(`Reflection ${index + 1}: Invalid summary format`);
    }
    if (!Array.isArray(reflection.reflection)) {
      errors.push(`Reflection ${index + 1}: Invalid reflection format`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * ExportModal Component
 * Modal for selecting export format and downloading reflections
 */
export const ExportModal: React.FC<ExportModalProps> = ({
  reflections,
  isOpen,
  onClose,
}) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle export with validation and progress tracking
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setValidationError(null);

      // Step 1: Validate data (10% progress)
      const validation = validateReflections(reflections);
      if (!validation.valid) {
        setValidationError(validation.errors.join('; '));
        console.error('Validation errors:', validation.errors);
        return;
      }
      setExportProgress(10);

      // Step 2: Generate export data
      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        // JSON export (simple, fast)
        exportData = JSON.stringify(reflections, null, 2);
        filename = `reflexa-reflections-${formatISODate(Date.now())}.json`;
        mimeType = 'application/json';
        setExportProgress(80);
      } else {
        // Markdown export with progress tracking for large datasets
        let markdown = '# Reflexa AI - Reflections Export\n\n';
        markdown += `Exported on: ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}\n`;
        markdown += `Total Reflections: ${reflections.length}\n\n`;
        markdown += '---\n\n';

        // Process reflections with progress updates
        const totalReflections = reflections.length;
        const progressPerReflection = 70 / totalReflections; // 70% of progress for processing

        for (let i = 0; i < totalReflections; i++) {
          const reflection = reflections[i];

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

          // Update progress (only for large datasets to avoid UI thrashing)
          if (totalReflections > 50 && i % 10 === 0) {
            setExportProgress(10 + Math.round((i + 1) * progressPerReflection));
            // Allow UI to update for large datasets
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        exportData = markdown;
        filename = `reflexa-reflections-${formatISODate(Date.now())}.md`;
        mimeType = 'text/markdown';
        setExportProgress(80);
      }

      // Step 3: Create blob and download (20% progress)
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setExportProgress(90);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportProgress(100);

      // Small delay to show 100% before closing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to export reflections:', error);
      setValidationError(
        error instanceof Error
          ? `Export failed: ${error.message}`
          : 'Export failed: Unknown error'
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Handle overlay click to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Focus trap for modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
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

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Export Error</p>
                <p className="mt-1 text-xs text-red-700">{validationError}</p>
              </div>
            </div>
          </div>
        )}

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
              disabled={isExporting}
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
              onChange={(e) => setExportFormat(e.target.value as 'markdown')}
              className="text-zen-600 focus:ring-zen-500 h-4 w-4"
              disabled={isExporting}
            />
            <div className="flex-1">
              <div className="text-calm-900 text-sm font-medium">Markdown</div>
              <div className="text-calm-500 text-xs">
                Human-readable format for notes apps
              </div>
            </div>
          </label>
        </div>

        {/* Progress Bar (shown during export for large datasets) */}
        {isExporting && exportProgress > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-calm-700 text-xs font-medium">
                Exporting...
              </span>
              <span className="text-calm-700 text-xs font-medium">
                {exportProgress}%
              </span>
            </div>
            <div className="bg-calm-200 h-2 w-full overflow-hidden rounded-full">
              <div
                className="from-zen-500 to-zen-600 h-2 rounded-full bg-linear-to-r transition-all duration-300 ease-out"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
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
  );
};
