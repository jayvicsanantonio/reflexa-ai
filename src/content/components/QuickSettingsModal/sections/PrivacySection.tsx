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
  <div className="py-1 pb-2">
    <div className="my-1.5 text-xs font-normal tracking-wider text-slate-600 uppercase">
      Privacy
    </div>
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
            className="cursor-pointer rounded-full border border-slate-900/15 bg-transparent px-3.5 py-2.5 font-sans text-sm font-bold transition-[transform,box-shadow,background] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            style={{
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
            className="cursor-pointer rounded-full border border-slate-900/15 bg-transparent px-3.5 py-2.5 font-sans text-sm font-bold transition-[transform,box-shadow,background] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            style={{
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
