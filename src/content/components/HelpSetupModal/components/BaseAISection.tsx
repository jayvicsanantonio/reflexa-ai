/**
 * Base AI Section Component
 */

import React from 'react';

export const BaseAISection: React.FC = () => (
  <section
    style={{
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <h3
      style={{
        color: 'var(--color-zen-100)',
        fontWeight: 600,
        margin: '0 0 6px 0',
        fontSize: 14,
      }}
    >
      1. Base AI Model (Required)
    </h3>
    <p
      style={{
        color: 'var(--color-calm-200)',
        fontSize: 14,
        margin: '0 0 6px 0',
      }}
    >
      Open this flag and set to <strong>Enabled BypassPerfRequirement</strong>
    </p>
    <code
      style={{
        display: 'block',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--color-zen-100)',
        borderRadius: 10,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      chrome://flags/#optimization-guide-on-device-model
    </code>
  </section>
);
