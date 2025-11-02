/**
 * Reflections List Component
 * List of recent reflections with empty state
 */

import React from 'react';
import type { Reflection } from '../../../../types';
import { ReflectionItem } from './ReflectionItem';

interface ReflectionsListProps {
  reflections: Reflection[] | null;
  onDelete: (id: string) => void;
}

export const ReflectionsList: React.FC<ReflectionsListProps> = ({
  reflections,
  onDelete,
}) => {
  if (reflections === null) {
    return <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>;
  }

  if (reflections.length === 0) {
    return (
      <div
        style={{
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 16,
          padding: 24,
          background: '#ffffff',
          textAlign: 'center',
        }}
      >
        <img
          src={chrome.runtime.getURL('icons/reflexa.png')}
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: 999, marginBottom: 8, opacity: 0.9 }}
        />
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          No reflections yet
        </div>
        <div style={{ color: '#475569', fontSize: 13, marginBottom: 8 }}>
          Start reading an article. When the lotus appears, click
          <span style={{ fontWeight: 700 }}> Reflect</span>.
        </div>
        <div style={{ color: '#64748b', fontSize: 12 }}>
          Tip: You can adjust the dwell threshold in Settings (default 10s).
        </div>
      </div>
    );
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {reflections.slice(0, 5).map((r) => (
        <ReflectionItem key={r.id} reflection={r} onDelete={onDelete} />
      ))}
    </ul>
  );
};
