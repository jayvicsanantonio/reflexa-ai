/**
 * Header Component
 * Header with title and subtitle showing correction count
 */

import React from 'react';

interface HeaderProps {
  correctionCount: number;
}

export const Header: React.FC<HeaderProps> = ({ correctionCount }) => (
  <div className="flex flex-col gap-1 text-center">
    <h3 className="font-display m-0 text-lg font-semibold tracking-tight text-(--color-zen-100)">
      Proofreading Results
    </h3>
    <p className="m-0 text-[13px] text-(--color-calm-400)">
      {correctionCount === 0
        ? 'No corrections needed'
        : `${correctionCount} ${correctionCount === 1 ? 'correction' : 'corrections'} suggested`}
    </p>
  </div>
);
