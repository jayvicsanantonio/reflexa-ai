/**
 * Header Component
 * Header with title and subtitle showing correction count
 */

import React from 'react';

interface HeaderProps {
  correctionCount: number;
}

export const Header: React.FC<HeaderProps> = ({ correctionCount }) => (
  <div className="reflexa-proofread-diff-view__header">
    <h3 className="reflexa-proofread-diff-view__title">Proofreading Results</h3>
    <p className="reflexa-proofread-diff-view__subtitle">
      {correctionCount === 0
        ? 'No corrections needed'
        : `${correctionCount} ${correctionCount === 1 ? 'correction' : 'corrections'} suggested`}
    </p>
  </div>
);
