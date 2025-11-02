/**
 * Reflection Item Component
 * Individual reflection item with delete button
 */

import React from 'react';
import type { Reflection } from '../../../../types';
import { IconDelete } from '../icons';

interface ReflectionItemProps {
  reflection: Reflection;
  onDelete: (id: string) => void;
}

export const ReflectionItem: React.FC<ReflectionItemProps> = ({
  reflection,
  onDelete,
}) => (
  <li
    style={{
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 12,
      padding: 12,
      background: '#ffffff',
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          color: '#0f172a',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 420,
        }}
        title={reflection.title}
      >
        {reflection.title || 'Untitled'}
      </div>
      <div style={{ color: '#64748b', fontSize: 12 }}>
        {new Date(reflection.createdAt).toLocaleString()}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(
            '[DashboardModal] Delete button clicked for:',
            reflection.id
          );
          void onDelete(reflection.id);
        }}
        title="Delete reflection"
        aria-label={`Delete reflection ${reflection.title || ''}`}
        style={{
          width: 32,
          height: 32,
          border: '1px solid rgba(15,23,42,0.15)',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        {IconDelete}
      </button>
    </div>
  </li>
);
