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
    <div className="flex flex-col gap-1 [&+*]:mt-4 [&+*]:border-t [&+*]:border-t-white/8 [&+*]:pt-4">
      <div className="px-2 pb-2 font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        Write
      </div>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/20 bg-white/8 px-3 py-2.5 text-left font-sans text-sm text-slate-200 transition-all duration-150 hover:border-sky-500/50 hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
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
        <div className="flex flex-1 items-center gap-2.5">
          <span className="flex h-4 w-4 items-center justify-center leading-none [&_svg]:h-4 [&_svg]:w-4">
            <SparklesIcon />
          </span>
          <div>
            <span className="block font-medium">
              {isGenerating ? 'Generating...' : 'Generate Draft'}
            </span>
            <span className="mt-0.5 block text-xs text-slate-200/70">
              AI-powered starting point
            </span>
          </div>
        </div>
        {isGenerating && (
          <span className="flex h-3.5 w-3.5 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:animate-[spin_1s_linear_infinite]">
            <LoadingIcon />
          </span>
        )}
      </button>
    </div>
  );
};
