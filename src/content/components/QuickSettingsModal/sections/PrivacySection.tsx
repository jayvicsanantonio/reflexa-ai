/**
 * Privacy Section Component
 * Settings for privacy and storage preferences
 */

import React from 'react';
import type { Settings } from '../../../../types';
import { Row } from '../components';
import { IconDatabase } from '../icons';

interface PrivacySectionProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => Promise<void>;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  settings,
  updateSetting,
}) => (
  <div className="reflexa-settings-section">
    <div className="reflexa-settings-section__title">Privacy</div>
    <Row
      title="Storage mode"
      desc="Where reflections are stored"
      icon={IconDatabase}
      trailing={
        <div
          role="group"
          aria-label="Storage mode"
          style={{ display: 'inline-flex', gap: 6 }}
        >
          <button
            type="button"
            aria-pressed={settings.privacyMode === 'local'}
            onClick={() => void updateSetting('privacyMode', 'local')}
            className="reflexa-btn reflexa-btn--ghost"
            style={{
              border: '1px solid rgba(15,23,42,0.15)',
              color: '#0f172a',
              background:
                settings.privacyMode === 'local' ? '#e2e8f0' : '#ffffff',
            }}
          >
            Local
          </button>
          <button
            type="button"
            aria-pressed={settings.privacyMode === 'sync'}
            onClick={() => void updateSetting('privacyMode', 'sync')}
            className="reflexa-btn reflexa-btn--ghost"
            style={{
              border: '1px solid rgba(15,23,42,0.15)',
              color: '#0f172a',
              background:
                settings.privacyMode === 'sync' ? '#e2e8f0' : '#ffffff',
            }}
          >
            Sync
          </button>
        </div>
      }
    />
  </div>
);
