/**
 * Action Buttons Component
 * Accept and Discard buttons
 */

import React from 'react';

interface ActionButtonsProps {
  onAccept: () => void;
  onDiscard: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAccept,
  onDiscard,
}) => (
  <div className="reflexa-proofread-diff-view__actions">
    <button
      type="button"
      className="reflexa-proofread-diff-view__button reflexa-proofread-diff-view__button--discard"
      onClick={onDiscard}
      data-testid="discard-button"
      aria-label="Keep original text"
    >
      <span className="reflexa-proofread-diff-view__button-icon">✕</span>
      <span className="reflexa-proofread-diff-view__button-label">
        Keep Original
      </span>
    </button>
    <button
      type="button"
      className="reflexa-proofread-diff-view__button reflexa-proofread-diff-view__button--accept"
      onClick={onAccept}
      data-testid="accept-button"
      aria-label="Apply corrections"
    >
      <span className="reflexa-proofread-diff-view__button-icon">✓</span>
      <span className="reflexa-proofread-diff-view__button-label">
        Apply Corrections
      </span>
    </button>
  </div>
);
