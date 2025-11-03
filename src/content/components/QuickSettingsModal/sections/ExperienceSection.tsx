/**
 * Experience Section Component
 * Settings for sound and motion preferences
 */

import React from 'react';
import type { Settings } from '../../../../types';
import { Row, Switch } from '../components';
import { IconSound, IconMotion } from '../icons';

interface ExperienceSectionProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => Promise<void>;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  settings,
  updateSetting,
}) => (
  <div className="py-1 pb-2">
    <div className="my-1.5 text-xs font-normal tracking-wider text-slate-600 uppercase">
      Experience
    </div>
    <Row
      title="Enable sound"
      desc="Play calming audio during reflection sessions"
      icon={IconSound}
      trailing={
        <Switch
          checked={settings.enableSound}
          onChange={(v) => void updateSetting('enableSound', v)}
          label="Enable sound"
        />
      }
    />
    <Row
      title="Reduce motion"
      desc="Disable animations like the breathing orb"
      icon={IconMotion}
      trailing={
        <Switch
          checked={settings.reduceMotion}
          onChange={(v) => void updateSetting('reduceMotion', v)}
          label="Reduce motion"
        />
      }
    />
  </div>
);
