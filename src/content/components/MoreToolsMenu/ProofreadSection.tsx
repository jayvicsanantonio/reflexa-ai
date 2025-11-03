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
    <div className="reflexa-more-tools__section">
      <div className="reflexa-more-tools__section-title">Polish</div>
      <button
        type="button"
        className="reflexa-more-tools__option"
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
        <div className="reflexa-more-tools__option-content">
          <span className="reflexa-more-tools__option-icon">
            <EditIcon />
          </span>
          <div>
            <span className="reflexa-more-tools__option-label">
              {isProofreading ? 'Proofreading...' : 'Proofread'}
            </span>
            <span className="reflexa-more-tools__option-description">
              Check grammar and spelling
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};
