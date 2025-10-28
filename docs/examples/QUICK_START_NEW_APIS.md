# Quick Start: Using New Gemini Nano APIs

This guide shows you how to quickly integrate the new Gemini Nano APIs into your Reflexa AI extension.

## Step 1: Update Background Service Worker

Update `src/background/index.ts` to use the new message handlers:

```typescript
import { handleMessage } from './messageHandlers';

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      sendResponse({
        success: false,
        error: error.message,
      });
    });

  // Return true to indicate async response
  return true;
});
```

## Step 2: Use AI Client in Your Components

### Example 1: Proofread User Reflection

```typescript
import { proofread } from '../utils/aiClient';

async function handleProofread() {
  const userText = reflectionInput.value;
  const corrected = await proofread(userText);

  if (corrected !== userText) {
    // Show the corrected version
    setProofreadVersion(corrected);
  }
}
```

### Example 2: Translate Summary

```typescript
import { translateSummary } from '../utils/aiClient';

async function handleTranslate() {
  const settings = await getSettings();

  if (settings.translationEnabled) {
    const translated = await translateSummary(summary, settings.targetLanguage);
    setTranslatedSummary(translated);
  }
}
```

### Example 3: Get Writing Suggestions

```typescript
import { getWritingSuggestions } from '../utils/aiClient';

async function showSuggestions() {
  const suggestions = await getWritingSuggestions(userInput);

  // Display all suggestions
  setSuggestions([
    { label: 'Proofread', text: suggestions.proofread },
    { label: 'More Formal', text: suggestions.formal },
    { label: 'More Casual', text: suggestions.casual },
    { label: 'Shorter', text: suggestions.shorter },
  ]);
}
```

### Example 4: Generate Alternative Questions

```typescript
import { generateAlternativeQuestions } from '../utils/aiClient';

async function showMoreQuestions() {
  const alternatives = await generateAlternativeQuestions(summary, 3);

  // User can choose from multiple sets of questions
  setQuestionOptions(alternatives);
}
```

## Step 3: Add UI Controls

### Settings Page - Translation Toggle

```tsx
import { COMMON_LANGUAGES } from '../constants';

function TranslationSettings() {
  const [settings, setSettings] = useState<Settings>();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings?.translationEnabled}
          onChange={(e) =>
            updateSettings({ translationEnabled: e.target.checked })
          }
        />
        Enable Translation
      </label>

      {settings?.translationEnabled && (
        <select
          value={settings.targetLanguage}
          onChange={(e) => updateSettings({ targetLanguage: e.target.value })}
        >
          {COMMON_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
```

### Reflection Input - Writing Assistant

```tsx
import { getWritingSuggestions } from '../utils/aiClient';

function ReflectionInput() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleImprove = async () => {
    const results = await getWritingSuggestions(input);
    setSuggestions([
      { type: 'Proofread', text: results.proofread },
      { type: 'More Formal', text: results.formal },
      { type: 'More Casual', text: results.casual },
      { type: 'Shorter', text: results.shorter },
    ]);
    setShowSuggestions(true);
  };

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Write your reflection..."
      />

      <button onClick={handleImprove}>✨ Improve Writing</button>

      {showSuggestions && (
        <div className="suggestions">
          {suggestions.map((suggestion, i) => (
            <div key={i} className="suggestion-card">
              <h4>{suggestion.type}</h4>
              <p>{suggestion.text}</p>
              <button
                onClick={() => {
                  setInput(suggestion.text);
                  setShowSuggestions(false);
                }}
              >
                Use This
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Summary Display - Translation Button

```tsx
import { translateSummary } from '../utils/aiClient';

function SummaryDisplay({ summary }: { summary: string[] }) {
  const [translated, setTranslated] = useState<string[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [settings, setSettings] = useState<Settings>();

  const handleTranslate = async () => {
    if (!settings?.targetLanguage) return;

    const result = await translateSummary(summary, settings.targetLanguage);
    setTranslated(result);
    setShowTranslation(true);
  };

  return (
    <div>
      <div className="summary">
        {(showTranslation ? translated : summary).map((bullet, i) => (
          <div key={i} className="bullet">
            {bullet}
          </div>
        ))}
      </div>

      {settings?.translationEnabled && (
        <button onClick={handleTranslate}>
          🌐 Translate to {settings.targetLanguage.toUpperCase()}
        </button>
      )}
    </div>
  );
}
```

## Step 4: Check API Availability

Add an API status indicator:

```tsx
import { checkAllAIAvailability } from '../utils/aiClient';

function APIStatus() {
  const [availability, setAvailability] = useState<any>(null);

  useEffect(() => {
    checkAllAIAvailability().then(setAvailability);
  }, []);

  if (!availability) return <div>Checking AI APIs...</div>;

  return (
    <div className="api-status">
      <h3>AI Features Available:</h3>
      <ul>
        <li>💭 Prompt API: {availability.prompt ? '✅' : '❌'}</li>
        <li>🔤 Proofreader: {availability.proofreader ? '✅' : '❌'}</li>
        <li>📄 Summarizer: {availability.summarizer ? '✅' : '❌'}</li>
        <li>🌐 Translator: {availability.translator ? '✅' : '❌'}</li>
        <li>✏️ Writer: {availability.writer ? '✅' : '❌'}</li>
        <li>🖊️ Rewriter: {availability.rewriter ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}
```

## Step 5: Enable Chrome Flags

Users need to enable additional flags for new APIs:

1. Open `chrome://flags`
2. Enable these flags:
   - `#prompt-api-for-gemini-nano` (already enabled)
   - `#optimization-guide-on-device-model` (already enabled)
   - `#proofreader-api-for-gemini-nano` (new)
   - `#summarizer-api-for-gemini-nano` (new)
   - `#translator-api-for-gemini-nano` (new)
   - `#writer-api-for-gemini-nano` (new)
   - `#rewriter-api-for-gemini-nano` (new)
3. Restart Chrome

**Note:** Flag names may vary. Check Chrome documentation for exact names.

## Step 6: Test Your Integration

Create a test page to verify all APIs work:

```typescript
async function testAllAPIs() {
  console.log('Testing Gemini Nano APIs...');

  // Check availability
  const availability = await checkAllAIAvailability();
  console.log('Availability:', availability);

  // Test Proofreader
  if (availability.proofreader) {
    const proofread = await proofread('This is a test sentance.');
    console.log('Proofread:', proofread);
  }

  // Test Translator
  if (availability.translator) {
    const translated = await translate('Hello world', 'en', 'es');
    console.log('Translated:', translated);
  }

  // Test Rewriter
  if (availability.rewriter) {
    const rewritten = await rewrite('This is cool', {
      tone: 'more-formal',
    });
    console.log('Rewritten:', rewritten);
  }

  // Test Writer
  if (availability.writer) {
    const written = await write('Write a motivational quote', {
      tone: 'casual',
      length: 'short',
    });
    console.log('Written:', written);
  }
}
```

## Common Patterns

### Pattern 1: Progressive Enhancement

```typescript
async function enhanceReflection(text: string) {
  let enhanced = text;

  // Step 1: Proofread
  enhanced = await proofread(enhanced);

  // Step 2: Translate if enabled
  const settings = await getSettings();
  if (settings.translationEnabled) {
    enhanced = await translate(enhanced, 'en', settings.targetLanguage);
  }

  return enhanced;
}
```

### Pattern 2: Fallback Strategy

```typescript
async function smartSummarize(content: string) {
  const settings = await getSettings();

  // Try native Summarizer API first
  if (settings.useNativeSummarizer) {
    const availability = await checkAllAIAvailability();
    if (availability.summarizer) {
      // Use Summarizer API
      return await summarizeWithNativeAPI(content);
    }
  }

  // Fallback to Prompt API
  return await summarize(content);
}
```

### Pattern 3: Parallel Processing

```typescript
async function generateMultipleOptions(text: string) {
  // Run all rewrites in parallel
  const [formal, casual, shorter, longer] = await Promise.all([
    rewrite(text, { tone: 'more-formal' }),
    rewrite(text, { tone: 'more-casual' }),
    rewrite(text, { length: 'shorter' }),
    rewrite(text, { length: 'longer' }),
  ]);

  return { formal, casual, shorter, longer };
}
```

## Next Steps

1. **Add feature flags** to gradually roll out new features
2. **Collect user feedback** on which APIs are most useful
3. **Monitor performance** and adjust timeouts if needed
4. **Add telemetry** to track API usage patterns
5. **Create user documentation** explaining new features

## Troubleshooting

### API not available

- Check Chrome version (127+)
- Verify flags are enabled
- Restart Chrome completely
- Check console for detailed error messages

### Slow responses

- Use streaming APIs for long content
- Implement caching for repeated requests
- Add loading indicators
- Set appropriate timeouts

### Translation not working

- Verify language codes are correct (ISO 639-1)
- Check if language pair is supported
- Some languages may require model download

## Resources

- [Full API Guide](../GEMINI_NANO_APIS_GUIDE.md)
- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/)
- [Message Handlers Source](../../src/background/messageHandlers.ts)
- [AI Client Utilities](../../src/utils/aiClient.ts)
