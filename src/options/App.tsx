import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Settings, AICapabilities } from '../types';
import { DEFAULT_SETTINGS, TIMING } from '../constants';
import { SettingsSection } from './components/SettingsSection';
import { Slider } from './components/Slider';
import { Toggle } from './components/Toggle';
import { RadioGroup, type RadioOption } from './components/RadioGroup';
import { SaveIndicator } from './components/SaveIndicator';
import { Dropdown, type DropdownOption } from './components/Dropdown';
import { useKeyboardNavigation } from '../utils/useKeyboardNavigation';
import './styles.css';

export const App: React.FC = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [checkingCapabilities, setCheckingCapabilities] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings and capabilities on mount
  useEffect(() => {
    void loadSettings();
    void loadCapabilities();
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

  const loadCapabilities = async () => {
    try {
      const response: unknown = await chrome.runtime.sendMessage({
        type: 'getCapabilities',
      });

      if (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        response.success &&
        'data' in response
      ) {
        setCapabilities(response.data as AICapabilities);
      }
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    }
  };

  const refreshCapabilities = useCallback(
    async (experimentalMode?: boolean) => {
      setCheckingCapabilities(true);
      try {
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'getCapabilities',
          payload: {
            refresh: true,
            experimentalMode: experimentalMode ?? settings.experimentalMode,
          },
        });

        if (
          response &&
          typeof response === 'object' &&
          'success' in response &&
          response.success &&
          'data' in response
        ) {
          setCapabilities(response.data as AICapabilities);
        }
      } catch (error) {
        console.error('Failed to refresh capabilities:', error);
      } finally {
        setCheckingCapabilities(false);
      }
    },
    [settings.experimentalMode]
  );

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

  // Summary format options
  const summaryFormatOptions: DropdownOption[] = [
    {
      value: 'bullets',
      label: 'Bullets',
      description: '3 concise bullet points',
    },
    {
      value: 'paragraph',
      label: 'Paragraph',
      description: 'Single flowing paragraph',
    },
    {
      value: 'headline-bullets',
      label: 'Headline + Bullets',
      description: 'Headline with bullet points',
    },
  ];

  // Translation language options
  const translationLanguageOptions: DropdownOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'ar', label: 'Arabic' },
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
            <Dropdown
              label="Default Summary Format"
              options={summaryFormatOptions}
              value={settings.defaultSummaryFormat}
              onChange={(value) =>
                updateSetting(
                  'defaultSummaryFormat',
                  value as 'bullets' | 'paragraph' | 'headline-bullets'
                )
              }
              description="Choose how article summaries are displayed by default"
            />

            <Toggle
              label="Enable Proofreading"
              checked={settings.enableProofreading}
              onChange={(checked) =>
                updateSetting('enableProofreading', checked)
              }
              description="Show a proofread button to improve your reflection text with AI"
            />

            <Toggle
              label="Enable Translation"
              checked={settings.enableTranslation}
              onChange={(checked) =>
                updateSetting('enableTranslation', checked)
              }
              description="Allow translating summaries and reflections to other languages"
            />

            {settings.enableTranslation && (
              <>
                <Dropdown
                  label="Preferred Translation Language"
                  options={translationLanguageOptions}
                  value={settings.preferredTranslationLanguage}
                  onChange={(value) =>
                    updateSetting('preferredTranslationLanguage', value)
                  }
                  description="Default language for translations"
                />

                <Toggle
                  label="Auto-Detect Language"
                  checked={settings.autoDetectLanguage}
                  onChange={(checked) =>
                    updateSetting('autoDetectLanguage', checked)
                  }
                  description="Automatically detect the language of webpage content"
                />
              </>
            )}
          </SettingsSection>

          {/* AI Status */}
          <SettingsSection
            title="AI Status"
            description="Current availability of Chrome Built-in AI APIs"
          >
            {capabilities ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { key: 'summarizer', label: 'Summarizer API' },
                    { key: 'writer', label: 'Writer API' },
                    { key: 'rewriter', label: 'Rewriter API' },
                    { key: 'proofreader', label: 'Proofreader API' },
                    { key: 'languageDetector', label: 'Language Detector API' },
                    { key: 'translator', label: 'Translator API' },
                    { key: 'prompt', label: 'Prompt API' },
                  ].map(({ key, label }) => {
                    const isAvailable =
                      capabilities[key as keyof AICapabilities];
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 rounded-lg border p-3 ${
                          isAvailable
                            ? 'border-green-200 bg-green-50'
                            : 'border-calm-200 bg-calm-50'
                        }`}
                      >
                        {isAvailable ? (
                          <svg
                            className="h-5 w-5 shrink-0 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="text-calm-400 h-5 w-5 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isAvailable ? 'text-green-900' : 'text-calm-600'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => void refreshCapabilities()}
                  disabled={checkingCapabilities}
                  className="bg-accent-500 hover:bg-accent-600 focus:ring-accent-500 mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkingCapabilities ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Checking...
                    </span>
                  ) : (
                    'Check Again'
                  )}
                </button>
              </>
            ) : (
              <div className="text-calm-600 text-center text-sm">
                Loading AI status...
              </div>
            )}
          </SettingsSection>

          {/* Developer Settings */}
          <SettingsSection
            title="Developer Settings"
            description="Advanced options for testing experimental features"
          >
            <Toggle
              label="Experimental Mode"
              checked={settings.experimentalMode}
              onChange={async (checked) => {
                updateSetting('experimentalMode', checked);
                // Refresh AI capabilities when experimental mode is toggled
                // Pass the new experimental mode value to ensure immediate refresh
                await refreshCapabilities(checked);
              }}
              description="Enable experimental AI features as they become available in Chrome"
            />

            {settings.experimentalMode && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-2">
                  <svg
                    className="h-5 w-5 shrink-0 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">
                      Experimental Features Warning
                    </h4>
                    <p className="mt-1 text-sm text-amber-700">
                      Experimental features may be unstable or change without
                      notice. Use at your own risk. These features are designed
                      for testing and development purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
