/**
 * AI Features Section Component
 * Settings for AI-powered features
 */

import React from 'react';
import type { Settings, AICapabilities } from '../../../../types';
import { COMMON_LANGUAGES } from '../../../../constants';
import { Row, Switch, Select, InfoHint } from '../components';
import { IconProofread, IconTranslate, IconList, IconBeaker } from '../icons';

interface AIFeaturesSectionProps {
  settings: Settings;
  capabilities: AICapabilities | null;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => Promise<void>;
}

export const AIFeaturesSection: React.FC<AIFeaturesSectionProps> = ({
  settings,
  capabilities,
  updateSetting,
}) => (
  <div className="py-1 pb-2">
    <div className="my-1.5 text-xs font-normal tracking-wider text-slate-600 uppercase">
      AI Features
    </div>
    <Row
      title="Enable proofreading"
      desc={
        <>
          Show an AI proofreading button in Reflect Mode
          {capabilities && !capabilities.proofreader && (
            <InfoHint message="Requires Proofreader API" />
          )}
        </>
      }
      icon={IconProofread}
      trailing={
        <Switch
          checked={settings.enableProofreading}
          onChange={(v) => void updateSetting('enableProofreading', v)}
          disabled={capabilities ? !capabilities.proofreader : false}
          label="Enable proofreading"
        />
      }
    />
    <Row
      title="Enable translation"
      desc={
        <>
          Allow translating summaries and reflections
          {capabilities && !capabilities.translator && (
            <InfoHint message="Requires Translator API" />
          )}
        </>
      }
      icon={IconTranslate}
      trailing={
        <Switch
          checked={settings.enableTranslation}
          onChange={(v) => void updateSetting('enableTranslation', v)}
          disabled={capabilities ? !capabilities.translator : false}
          label="Enable translation"
        />
      }
    />
    <Row
      title="Preferred language"
      desc={
        <>
          Default target for translations
          {!settings.enableTranslation && (
            <InfoHint message="Enable Translation to use" />
          )}
        </>
      }
      icon={IconTranslate}
      trailing={
        <Select
          label="Preferred translation language"
          value={settings.preferredTranslationLanguage}
          onChange={(v) =>
            void updateSetting('preferredTranslationLanguage', v)
          }
          disabled={!settings.enableTranslation}
          options={COMMON_LANGUAGES.map((l) => ({
            value: l.code,
            label: l.name,
          }))}
        />
      }
    />
    <Row
      title="Auto-detect language"
      desc={
        <>
          Detect web page language automatically
          {!settings.enableTranslation && (
            <InfoHint message="Enable Translation to use" />
          )}
        </>
      }
      icon={IconTranslate}
      trailing={
        <Switch
          checked={settings.autoDetectLanguage}
          onChange={(v) => void updateSetting('autoDetectLanguage', v)}
          disabled={!settings.enableTranslation}
          label="Auto-detect language"
        />
      }
    />
    <Row
      title="Summary format"
      desc="Default style for summaries"
      icon={IconList}
      trailing={
        <Select
          label="Default summary format"
          value={settings.defaultSummaryFormat}
          onChange={(v) =>
            void updateSetting(
              'defaultSummaryFormat',
              v as Settings['defaultSummaryFormat']
            )
          }
          options={[
            { value: 'bullets', label: 'Bullets' },
            { value: 'paragraph', label: 'Paragraph' },
            {
              value: 'headline-bullets',
              label: 'Headline + Bullets',
            },
          ]}
        />
      }
    />
    <Row
      title="Experimental mode"
      desc="Try beta AI features when available"
      icon={IconBeaker}
      trailing={
        <Switch
          checked={settings.experimentalMode}
          onChange={(v) => void updateSetting('experimentalMode', v)}
          label="Experimental mode"
        />
      }
    />
  </div>
);
