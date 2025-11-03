/**
 * Core APIs Section Component
 */

import React from 'react';

export const CoreAPIsSection: React.FC = () => (
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
      2. Core APIs
    </h3>
    <ul
      style={{
        margin: 0,
        paddingLeft: 18,
        color: 'var(--color-calm-200)',
        fontSize: 14,
      }}
    >
      <li>
        <code>chrome://flags/#prompt-api-for-gemini-nano</code>{' '}
        <span>(Enabled)</span>
      </li>
      <li>
        <code>chrome://flags/#summarization-api-for-gemini-nano</code>{' '}
        <span>(Enabled)</span>
      </li>
    </ul>
  </section>
);
