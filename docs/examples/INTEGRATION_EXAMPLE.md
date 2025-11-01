# Integration Example: Adding New APIs to Existing Code

This example shows how to integrate the new Gemini Nano APIs into your existing Reflexa AI codebase.

## Step 1: Update Background Service Worker

**File: `src/background/index.ts`**

```typescript
// Add this import at the top
import { handleMessage } from './messageHandlers';
import { unifiedAI } from './unifiedAIService';

// Replace your existing message listener with this:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error('[Background] Error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

  return true; // Required for async response
});

// Clean up on extension unload
chrome.runtime.onSuspend.addListener(() => {
  console.log('[Background] Cleaning up AI services...');
  unifiedAI.destroyAll();
});
```

## Step 2: Enhance Reflection Input Component

**File: `src/content/ReflectModeOverlay.tsx`** (or wherever your reflection input is)

```tsx
import React, { useState } from 'react';
import { proofread, rewrite, getWritingSuggestions } from '../utils/aiClient';

interface WritingSuggestion {
  type: string;
  text: string;
}

export function ReflectionInput() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-proofread on blur (optional)
  const handleBlur = async () => {
    if (!input.trim()) return;

    const corrected = await proofread(input);
    if (corrected !== input) {
      // Optionally show a subtle indicator that text was corrected
      console.log('Text corrected:', corrected);
    }
  };

  // Show writing suggestions
  const handleImprove = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const results = await getWritingSuggestions(input);

      const suggestionList: WritingSuggestion[] = [];

      if (results.proofread !== input) {
        suggestionList.push({ type: 'Proofread', text: results.proofread });
      }
      if (results.formal !== input) {
        suggestionList.push({ type: 'More Formal', text: results.formal });
      }
      if (results.casual !== input) {
        suggestionList.push({ type: 'More Casual', text: results.casual });
      }
      if (results.shorter !== input) {
        suggestionList.push({ type: 'Shorter', text: results.shorter });
      }

      setSuggestions(suggestionList);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reflection-input">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write your reflection..."
        className="reflection-textarea"
      />

      <div className="input-actions">
        <button
          onClick={handleImprove}
          disabled={!input.trim() || isLoading}
          className="improve-button"
        >
          {isLoading ? '✨ Analyzing...' : '✨ Improve Writing'}
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h4>Writing Suggestions</h4>
          {suggestions.map((suggestion, i) => (
            <div key={i} className="suggestion-card">
              <div className="suggestion-header">
                <strong>{suggestion.type}</strong>
              </div>
              <p className="suggestion-text">{suggestion.text}</p>
              <button
                onClick={() => {
                  setInput(suggestion.text);
                  setShowSuggestions(false);
                }}
                className="use-suggestion-button"
              >
                Use This
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowSuggestions(false)}
            className="close-suggestions-button"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
```

## Step 3: Add Translation to Summary Display

**File: `src/content/ReflectModeOverlay.tsx`** (summary section)

```tsx
import React, { useState, useEffect } from 'react';
import { translateSummary } from '../utils/aiClient';
import { COMMON_LANGUAGES } from '../constants';

interface SummaryDisplayProps {
  summary: string[];
}

export function SummaryDisplay({ summary }: SummaryDisplayProps) {
  const [translated, setTranslated] = useState<string[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Load settings
    chrome.storage.local.get(['settings'], (result) => {
      setSettings(result.settings);
    });
  }, []);

  const handleTranslate = async () => {
    if (!settings?.targetLanguage) return;

    setIsTranslating(true);
    try {
      const result = await translateSummary(summary, settings.targetLanguage);
      setTranslated(result);
      setShowTranslation(true);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const displaySummary = showTranslation ? translated : summary;
  const targetLang = COMMON_LANGUAGES.find(
    (lang) => lang.code === settings?.targetLanguage
  );

  return (
    <div className="summary-display">
      <div className="summary-header">
        <h3>Summary</h3>
        {settings?.translationEnabled && (
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="translate-button"
          >
            {isTranslating
              ? '🌐 Translating...'
              : `🌐 ${showTranslation ? 'Show Original' : `Translate to ${targetLang?.name}`}`}
          </button>
        )}
      </div>

      <div className="summary-bullets">
        {displaySummary.map((bullet, i) => {
          const label = i === 0 ? 'Insight' : i === 1 ? 'Surprise' : 'Apply';
          return (
            <div key={i} className="summary-bullet">
              <span className="bullet-label">{label}:</span>
              <span className="bullet-text">{bullet}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Step 4: Add Settings UI

**File: `src/options/App.tsx`** (or your settings page)

```tsx
import React, { useState, useEffect } from 'react';
import { COMMON_LANGUAGES } from '../constants';
import { checkAllAIAvailability } from '../utils/aiClient';
import type { Settings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiAvailability, setApiAvailability] = useState<any>(null);

  useEffect(() => {
    // Load settings
    chrome.storage.local.get(['settings'], (result) => {
      setSettings(result.settings);
    });

    // Check API availability
    checkAllAIAvailability().then(setApiAvailability);
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    chrome.storage.local.set({ settings: newSettings });
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="settings-page">
      <h1>Reflexa AI Settings</h1>

      {/* Existing settings... */}

      <section className="settings-section">
        <h2>AI Features</h2>

        {/* API Status */}
        <div className="api-status">
          <h3>Available AI APIs:</h3>
          {apiAvailability && (
            <ul>
              <li>💭 Prompt API: {apiAvailability.prompt ? '✅' : '❌'}</li>
              <li>📄 Summarizer: {apiAvailability.summarizer ? '✅' : '❌'}</li>
              <li>✏️ Writer: {apiAvailability.writer ? '✅' : '❌'}</li>
              <li>🖊️ Rewriter: {apiAvailability.rewriter ? '✅' : '❌'}</li>
              <li>
                🔤 Proofreader: {apiAvailability.proofreader ? '✅' : '❌'}
              </li>
              <li>🌐 Translator: {apiAvailability.translator ? '✅' : '❌'}</li>
              <li>
                🔍 Language Detector:{' '}
                {apiAvailability.languageDetector ? '✅' : '❌'}
              </li>
            </ul>
          )}
        </div>

        {/* Proofreader Settings */}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.useNativeProofreader}
              onChange={(e) =>
                updateSettings({ useNativeProofreader: e.target.checked })
              }
              disabled={!apiAvailability?.proofreader}
            />
            Use Native Proofreader API
            {!apiAvailability?.proofreader && (
              <span className="disabled-note"> (Not available)</span>
            )}
          </label>
          <p className="setting-description">
            More accurate grammar and spelling corrections
          </p>
        </div>

        {/* Summarizer Settings */}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.useNativeSummarizer}
              onChange={(e) =>
                updateSettings({ useNativeSummarizer: e.target.checked })
              }
              disabled={!apiAvailability?.summarizer}
            />
            Use Native Summarizer API
            {!apiAvailability?.summarizer && (
              <span className="disabled-note"> (Not available)</span>
            )}
          </label>
          <p className="setting-description">
            Specialized summarization with multiple formats
          </p>
        </div>

        {/* Translation Settings */}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.translationEnabled}
              onChange={(e) =>
                updateSettings({ translationEnabled: e.target.checked })
              }
              disabled={!apiAvailability?.translator}
            />
            Enable Translation
            {!apiAvailability?.translator && (
              <span className="disabled-note"> (Not available)</span>
            )}
          </label>
          <p className="setting-description">
            Translate summaries and reflections to your language
          </p>
        </div>

        {settings.translationEnabled && (
          <div className="setting-item">
            <label>
              Target Language:
              <select
                value={settings.targetLanguage}
                onChange={(e) =>
                  updateSettings({ targetLanguage: e.target.value })
                }
              >
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
```

## Step 5: Add CSS Styles

**File: `src/styles/ai-features.css`** (create new file)

```css
/* Writing Suggestions Panel */
.suggestions-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.suggestions-panel h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.suggestion-card {
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.suggestion-header {
  margin-bottom: 8px;
}

.suggestion-header strong {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-text {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #212529;
}

.use-suggestion-button {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.use-suggestion-button:hover {
  background: #0056b3;
}

.close-suggestions-button {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.improve-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}

.improve-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.improve-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Translation Button */
.translate-button {
  padding: 6px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.translate-button:hover:not(:disabled) {
  background: #218838;
}

.translate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* API Status */
.api-status {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 24px;
}

.api-status h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.api-status ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.api-status li {
  padding: 4px 0;
  font-size: 13px;
  font-family: monospace;
}

/* Settings */
.setting-item {
  margin-bottom: 20px;
}

.setting-description {
  margin: 4px 0 0 24px;
  font-size: 12px;
  color: #6c757d;
}

.disabled-note {
  font-size: 11px;
  color: #dc3545;
  margin-left: 8px;
}
```

## Step 6: Test the Integration

Create a test script to verify everything works:

**File: `test-ai-apis.ts`** (run in extension console)

```typescript
import {
  checkAllAIAvailability,
  proofread,
  translate,
  rewrite,
  write,
  getWritingSuggestions,
} from './utils/aiClient';

async function testAllAPIs() {
  console.log('🧪 Testing Gemini Nano APIs...\n');

  // 1. Check availability
  console.log('1️⃣ Checking API availability...');
  const availability = await checkAllAIAvailability();
  console.log('Availability:', availability);
  console.log('');

  // 2. Test Proofreader
  if (availability.proofreader) {
    console.log('2️⃣ Testing Proofreader API...');
    const result = await proofread('This is a test sentance with erors.');
    console.log('Original: "This is a test sentance with erors."');
    console.log('Proofread:', result);
    console.log('');
  }

  // 3. Test Translator
  if (availability.translator) {
    console.log('3️⃣ Testing Translator API...');
    const result = await translate('Hello, how are you?', 'en', 'es');
    console.log('Original: "Hello, how are you?"');
    console.log('Translated (en→es):', result);
    console.log('');
  }

  // 4. Test Rewriter
  if (availability.rewriter) {
    console.log('4️⃣ Testing Rewriter API...');
    const formal = await rewrite('This is pretty cool!', {
      tone: 'more-formal',
    });
    console.log('Original: "This is pretty cool!"');
    console.log('Formal:', formal);
    console.log('');
  }

  // 5. Test Writer
  if (availability.writer) {
    console.log('5️⃣ Testing Writer API...');
    const result = await write(
      'Write a short motivational quote about reflection',
      {
        tone: 'casual',
        length: 'short',
      }
    );
    console.log('Prompt: "Write a short motivational quote about reflection"');
    console.log('Generated:', result);
    console.log('');
  }

  // 6. Test Writing Suggestions
  console.log('6️⃣ Testing Writing Suggestions...');
  const suggestions = await getWritingSuggestions('This article is good.');
  console.log('Original: "This article is good."');
  console.log('Suggestions:', suggestions);

  console.log('\n✅ All tests complete!');
}

// Run tests
testAllAPIs().catch(console.error);
```

## Summary

You now have:

1. ✅ All 6 Gemini Nano APIs integrated
2. ✅ Message handlers for background communication
3. ✅ Frontend utilities for easy API calls
4. ✅ UI components for writing suggestions
5. ✅ Translation support for summaries
6. ✅ Settings page with API controls
7. ✅ Styling for new features
8. ✅ Test script to verify everything works

The integration maintains your existing Prompt API functionality while adding powerful new features that enhance the user experience!
