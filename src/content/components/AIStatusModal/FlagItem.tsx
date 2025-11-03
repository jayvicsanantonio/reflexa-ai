/**
 * Flag Item Component
 * Displays a Chrome flag with copy button
 */

import React from 'react';

interface FlagItemProps {
  flagId: string;
  flagUrl: string;
  description?: string;
  copiedKey: string | null;
  onCopy: (flagUrl: string) => void;
}

export const FlagItem: React.FC<FlagItemProps> = ({
  flagId,
  flagUrl,
  description,
  copiedKey,
  onCopy,
}) => {
  return (
    <li style={{ marginBottom: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          background: '#f8fafc',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 10,
          width: '100%',
          paddingRight: 8,
        }}
      >
        <code
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 12,
            background: '#f1f5f9',
            color: '#0f172a',
            border: '1px solid rgba(15, 23, 42, 0.12)',
            padding: '4px 6px',
            borderRadius: 6,
          }}
        >
          {flagId}
        </code>
        {description && (
          <span style={{ color: '#475569', fontSize: 12 }}>{description}</span>
        )}
        <button
          type="button"
          style={{
            padding: '6px 10px',
            border: '1px solid rgba(15, 23, 42, 0.15)',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: 8,
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
          onClick={() => onCopy(flagUrl)}
          aria-label={`Copy ${flagId} flag URL`}
        >
          {copiedKey === flagUrl ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </li>
  );
};
