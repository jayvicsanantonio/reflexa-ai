import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS, TIMING } from '../constants';
import { SettingsSection } from './components/SettingsSection';
import { Slider } from './components/Slider';
import { Toggle } from './components/Toggle';
import { RadioGroup, type RadioOption } from './components/RadioGroup';
import { SaveIndicator } from './components/SaveIndicator';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import './styles.css';

export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'getSettings',
      });

      if (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        response.success &&
        'data' in response
      ) {
        setSettings(response.data as Settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced auto-save function
  const debouncedSave = useCallback((updatedSettings: Settings) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await chrome.runtime.sendMessage({
          type: 'updateSettings',
          payload: updatedSettings,
        });

        // Show save indicator
        setShowSaveIndicator(true);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }, TIMING.SETTINGS_DEBOUNCE);
  }, []);

  // Update a specific setting
  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      debouncedSave(updatedSettings);
    },
    [settings, debouncedSave]
  );

  // Reset to defaults
  const handleReset = async () => {
    if (
      !confirm(
        'Are you sure you want to reset all settings to their default values?'
      )
    ) {
      return;
    }

    try {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'resetSettings',
      });

      if (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        response.success &&
        'data' in response
      ) {
        setSettings(response.data as Settings);
        setShowSaveIndicator(true);
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  // Privacy mode options
  const privacyOptions: RadioOption[] = [
    {
      value: 'local',
      label: 'Local Storage Only',
      description: 'Reflections stay on this device only. Most private option.',
    },
    {
      value: 'sync',
      label: 'Sync Across Devices',
      description:
        'Reflections sync across your Chrome browsers using Chrome Sync.',
    },
  ];

  if (loading) {
    return (
      <div className="bg-calm-50 flex min-h-screen items-center justify-center">
        <div className="text-calm-600 text-center">
          <div className="border-accent-500 mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-calm-50 min-h-screen p-8">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-calm-900 mb-2 text-3xl font-bold">
            Reflexa AI Settings
          </h1>
          <p className="text-calm-600 text-sm">
            Customize your reflection experience to match your preferences
          </p>
        </header>

        {/* Settings Sections */}
        <main
          id="main-content"
          className="space-y-6"
          role="main"
          aria-label="Extension settings"
        >
          {/* Behavior Settings */}
          <SettingsSection
            title="Behavior"
            description="Control when and how Reflexa prompts you to reflect"
          >
            <Slider
              label="Dwell Threshold"
              value={settings.dwellThreshold}
              min={TIMING.DWELL_MIN}
              max={TIMING.DWELL_MAX}
              step={10}
              unit=" seconds"
              description="How long you need to read before seeing the reflection prompt"
              onChange={(value) => updateSetting('dwellThreshold', value)}
            />
          </SettingsSection>

          {/* Accessibility Settings */}
          <SettingsSection
            title="Accessibility"
            description="Adjust visual and audio preferences for comfort"
          >
            <Toggle
              label="Enable Sound"
              checked={settings.enableSound}
              onChange={(checked) => updateSetting('enableSound', checked)}
              description="Play calming audio during reflection sessions"
            />

            <Toggle
              label="Reduce Motion"
              checked={settings.reduceMotion}
              onChange={(checked) => updateSetting('reduceMotion', checked)}
              description="Disable animations like the breathing orb for reduced motion"
            />
          </SettingsSection>

          {/* AI Features */}
          <SettingsSection
            title="AI Features"
            description="Optional AI-powered enhancements"
          >
            <Toggle
              label="Enable Proofreading"
              checked={settings.proofreadEnabled}
              onChange={(checked) => updateSetting('proofreadEnabled', checked)}
              description="Show a proofread button to improve your reflection text with AI"
            />
          </SettingsSection>

          {/* Privacy Settings */}
          <SettingsSection
            title="Privacy"
            description="Control where your reflections are stored"
          >
            <RadioGroup
              label="Storage Mode"
              options={privacyOptions}
              value={settings.privacyMode}
              onChange={(value) =>
                updateSetting('privacyMode', value as 'local' | 'sync')
              }
              description="All AI processing happens locally on your device regardless of this setting"
            />
          </SettingsSection>
        </main>

        {/* Footer Actions */}
        <footer className="border-calm-200 mt-8 flex items-center justify-between border-t pt-6">
          <button
            onClick={handleReset}
            className="text-calm-600 hover:text-calm-900 focus:ring-accent-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            Reset to Defaults
          </button>

          <p className="text-calm-500 text-xs">
            Changes are saved automatically
          </p>
        </footer>

        {/* Privacy Notice */}
        <div className="bg-accent-50 border-accent-200 mt-6 rounded-lg border p-4">
          <div className="flex gap-3">
            <svg
              className="text-accent-500 h-5 w-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <h3 className="text-calm-900 text-sm font-semibold">
                Your Privacy Matters
              </h3>
              <p className="text-calm-600 mt-1 text-sm">
                All AI processing happens locally on your device using Chrome's
                built-in Gemini Nano. Your reflections and reading data never
                leave your computer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Indicator */}
      <SaveIndicator show={showSaveIndicator} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
