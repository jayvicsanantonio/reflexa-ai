/**
 * Row Component
 * Settings row with icon, title, description, and trailing control
 */

import React from 'react';

interface RowProps {
  title: string;
  desc: React.ReactNode;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Row: React.FC<RowProps> = ({ title, desc, icon, trailing }) => (
  <div className="flex items-center justify-between gap-3 border-b border-b-white/6 py-3.5">
    <div className="flex items-center gap-2.5 text-left">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-700/18 bg-blue-500/12 text-blue-400"
        aria-hidden
      >
        {icon}
      </span>
      <span>
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-[13px] text-slate-600">{desc}</div>
      </span>
    </div>
    <div>{trailing}</div>
  </div>
);
