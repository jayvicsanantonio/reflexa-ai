/**
 * Voice Section Component
 * Settings for voice input features
 */

import React from 'react';
import type { Settings } from '../../../../types';
import { COMMON_LANGUAGES } from '../../../../constants';
import { Row, Switch, Select, Range, InfoHint } from '../components';
import { IconMic, IconTranslate, IconSound } from '../icons';

interface VoiceSectionProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => Promise<void>;
}

export const VoiceSection: React.FC<VoiceSectionProps> = ({
  settings,
  updateSetting,
}) => (
  <div className="py-1 pb-2">
    <div className="my-1.5 text-xs font-normal tracking-wider text-slate-600 uppercase">
      Voice
    </div>
    <Row
      title="Enable voice input"
      desc="Dictate reflections instead of typing"
      icon={IconMic}
      trailing={
        <Switch
          checked={Boolean(settings.voiceInputEnabled)}
          onChange={(v) => void updateSetting('voiceInputEnabled', v)}
          label="Enable voice input"
        />
      }
    />
    <Row
      title="Voice language"
      desc={
        <>
          Language used for speech recognition
          {!settings.voiceInputEnabled && (
            <InfoHint message="Enable Voice input to use" />
          )}
        </>
      }
      icon={IconTranslate}
      trailing={
        <Select
          label="Voice language"
          value={settings.voiceLanguage ?? ''}
          onChange={(v) => void updateSetting('voiceLanguage', v || undefined)}
          disabled={!settings.voiceInputEnabled}
          options={[{ value: '', label: 'Auto' }].concat(
            COMMON_LANGUAGES.map((l) => ({
              value: l.code,
              label: l.name,
            }))
          )}
        />
      }
    />
    <Row
      title="Auto-stop delay"
      desc={
        <>
          How long to wait after silence
          {!settings.voiceInputEnabled && (
            <InfoHint message="Enable Voice input to use" />
          )}
        </>
      }
      icon={IconSound}
      trailing={
        <Range
          label="Voice auto-stop delay"
          min={0}
          max={60}
          step={10}
          value={Math.round((settings.voiceAutoStopDelay ?? 10000) / 1000)}
          unit="s"
          disabled={!settings.voiceInputEnabled}
          onChange={(v) => void updateSetting('voiceAutoStopDelay', v * 1000)}
        />
      }
    />
  </div>
);
