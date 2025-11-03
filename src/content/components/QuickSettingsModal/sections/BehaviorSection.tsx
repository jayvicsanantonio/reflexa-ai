/**
 * Behavior Section Component
 * Settings for dwell threshold behavior
 */

import React from 'react';
import type { Settings } from '../../../../types';
import { TIMING } from '../../../../constants';
import { Row, Range } from '../components';
import { IconClock } from '../icons';

interface BehaviorSectionProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => Promise<void>;
}

export const BehaviorSection: React.FC<BehaviorSectionProps> = ({
  settings,
  updateSetting,
}) => (
  <div className="py-1 pb-2">
    <div className="my-1.5 text-xs font-normal tracking-wider text-slate-600 uppercase">
      Behavior
    </div>
    <Row
      title="Dwell threshold"
      desc="How long to read before seeing the nudge"
      icon={IconClock}
      trailing={
        <Range
          label="Dwell threshold"
          min={TIMING.DWELL_MIN}
          max={TIMING.DWELL_MAX}
          step={10}
          value={settings.dwellThreshold}
          unit="s"
          onChange={(v) => void updateSetting('dwellThreshold', v)}
        />
      }
    />
  </div>
);
