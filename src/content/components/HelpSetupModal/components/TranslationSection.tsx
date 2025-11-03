/**
 * Translation & Language Section Component
 */

import React from 'react';

export const TranslationSection: React.FC = () => (
  <section style={{ padding: '12px 0' }}>
    <h3
      style={{
        color: 'var(--color-zen-100)',
        fontWeight: 600,
        margin: '0 0 6px 0',
        fontSize: 14,
      }}
    >
      4. Translation & Language
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
        <code>chrome://flags/#translator-api</code> → Enabled
      </li>
      <li>
        <code>chrome://flags/#language-detection-api</code> → Enabled
      </li>
    </ul>
  </section>
);
