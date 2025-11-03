/**
 * Proofread Section Component
 * Displays the "Proofread" button for reflection screen
 */

import React from 'react';
import { EditIcon } from './icons';
import { devLog } from '../../../utils/logger';

interface ProofreadSectionProps {
  onProofread: (index: number) => void;
  proofreadDisabled: boolean;
  isProofreading: boolean;
  hasReflectionContent: boolean;
  activeReflectionIndex: number;
  onClose: () => void;
}

export const ProofreadSection: React.FC<ProofreadSectionProps> = ({
  onProofread,
  proofreadDisabled,
  isProofreading,
  hasReflectionContent,
  activeReflectionIndex,
  onClose,
}) => {
  const handleProofreadClick = () => {
    if (onProofread && !proofreadDisabled && !isProofreading) {
      onProofread(activeReflectionIndex);
    }
  };

  return (
    <div className="flex flex-col gap-1 [&+*]:mt-4 [&+*]:border-t [&+*]:border-t-white/8 [&+*]:pt-4">
      <div className="px-2 pb-2 font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        Polish
      </div>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/20 bg-white/8 px-3 py-2.5 text-left font-sans text-sm text-slate-200 transition-all duration-150 hover:border-sky-500/50 hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        onClick={(e) => {
          e.stopPropagation();
          devLog('[MoreToolsMenu] Proofread clicked');
          handleProofreadClick();
          onClose();
        }}
        disabled={proofreadDisabled || isProofreading || !hasReflectionContent}
        role="menuitem"
        data-testid="proofread-option"
      >
        <div className="flex flex-1 items-center gap-2.5">
          <span className="flex h-4 w-4 items-center justify-center leading-none [&_svg]:h-4 [&_svg]:w-4">
            <EditIcon />
          </span>
          <div>
            <span className="block font-medium">
              {isProofreading ? 'Proofreading...' : 'Proofread'}
            </span>
            <span className="mt-0.5 block text-xs text-slate-200/70">
              Check grammar and spelling
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};
