/**
 * Generate Draft Section Component
 * Displays the "Generate Draft" button for reflection screen when no content
 */

import React, { useState } from 'react';
import type { AIResponse } from '../../../types';
import { SparklesIcon, LoadingIcon } from './icons';
import { devLog, devError } from '../../../utils/logger';

interface GenerateDraftSectionProps {
  onGenerateDraft: (draft: string) => void;
  generateDraftDisabled: boolean;
  summary: string[];
  onClose: () => void;
}

export const GenerateDraftSection: React.FC<GenerateDraftSectionProps> = ({
  onGenerateDraft,
  generateDraftDisabled,
  summary,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDraft = async () => {
    if (onGenerateDraft && !generateDraftDisabled && !isGenerating) {
      setIsGenerating(true);
      try {
        // Use the Chrome AI Writer API to generate a draft
        const summaryText = summary.join('\n');
        const prompt = `Based on this summary:\n${summaryText}\n\nWrite a brief reflection about what you found most interesting.`;

        devLog('[MoreToolsMenu] Calling Writer API with prompt:', prompt);

        // Call Writer API via background service worker
        const response: AIResponse<string> = await chrome.runtime.sendMessage({
          type: 'write',
          payload: {
            prompt,
            options: {
              tone: 'neutral', // Maps to 'calm' in WriterOptions
              format: 'plain-text',
              length: 'short', // 50-100 words
            },
          },
        });

        devLog('[MoreToolsMenu] Writer API response:', response);

        if (response.success) {
          const draft = response.data;
          devLog('[MoreToolsMenu] Generated draft:', draft);
          // Pass the generated draft to parent
          onGenerateDraft(draft);
        } else {
          devError('[MoreToolsMenu] Draft generation failed:', response.error);
        }
      } catch (error) {
        devError('[MoreToolsMenu] Failed to generate draft:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="reflexa-more-tools__section">
      <div className="reflexa-more-tools__section-title">Write</div>
      <button
        type="button"
        className="reflexa-more-tools__option"
        onClick={(e) => {
          e.stopPropagation();
          devLog('[MoreToolsMenu] Generate draft clicked');
          void handleGenerateDraft();
          onClose();
        }}
        disabled={generateDraftDisabled || isGenerating}
        role="menuitem"
        data-testid="generate-draft-option"
      >
        <div className="reflexa-more-tools__option-content">
          <span className="reflexa-more-tools__option-icon">
            <SparklesIcon />
          </span>
          <div>
            <span className="reflexa-more-tools__option-label">
              {isGenerating ? 'Generating...' : 'Generate Draft'}
            </span>
            <span className="reflexa-more-tools__option-description">
              AI-powered starting point
            </span>
          </div>
        </div>
        {isGenerating && (
          <span className="reflexa-more-tools__option-spinner">
            <LoadingIcon />
          </span>
        )}
      </button>
    </div>
  );
};
