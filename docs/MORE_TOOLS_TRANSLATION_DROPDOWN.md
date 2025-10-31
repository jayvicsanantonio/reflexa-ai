# More Tools Menu - Translation Dropdown Implementation

## Overview

Replaced the simple translate button with a comprehensive language dropdown that shows all supported languages for the Gemini Nano Translator API.

## Changes Made

### 1. Translation Dropdown

The translate button now opens a dropdown menu showing all available languages:

**Supported Languages:**

- English (English)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Portuguese (Português)
- Chinese (中文)
- Japanese (日本語)
- Korean (한국어)
- Arabic (العربية)

### 2. Language Selection Features

#### Current Language Indicator

- Shows "Current" badge for the currently detected language
- Disabled state prevents selecting the same language

#### Unsupported Languages

- Languages that aren't available show "Unavailable" badge
- Grayed out and disabled
- Prevents user from selecting unavailable options

#### Visual Feedback

- Each language shows both English name and native name
- Hover effects for available languages
- Clear visual distinction between available, current, and unavailable languages

### 3. Component Updates

#### MoreToolsMenu.tsx

```typescript
interface MoreToolsMenuProps {
  // ... other props
  onTranslateSummary?: (targetLanguage: string) => void; // Now accepts language code
  currentLanguage?: string; // Current detected language
  unsupportedLanguages?: string[]; // Array of unavailable language codes
}
```

**New Features:**

- Language options array with code, name, and native name
- Dropdown state management
- Language selection handler
- Automatic dropdown close after selection

#### MeditationFlowOverlay.tsx

```typescript
<MoreToolsMenu
  // ... other props
  onTranslateSummary={_onTranslate} // Passes the translate function directly
  currentLanguage={languageDetection?.detectedLanguage}
  unsupportedLanguages={[]} // Can be populated based on API availability
/>
```

### 4. CSS Styling

**New Classes:**

- `.reflexa-more-tools__language-dropdown` - Dropdown container
- `.reflexa-more-tools__language-dropdown-title` - "Select Language" header
- `.reflexa-more-tools__language-option` - Individual language button
- `.reflexa-more-tools__language-option--current` - Current language style
- `.reflexa-more-tools__language-option--disabled` - Unavailable language style
- `.reflexa-more-tools__language-name` - English name
- `.reflexa-more-tools__language-native` - Native name
- `.reflexa-more-tools__language-badge` - Status badges (Current/Unavailable)

**Design Features:**

- Rounded corners (8px) for language options
- Smooth hover transitions
- Scrollable dropdown (max-height: 300px)
- Custom scrollbar styling
- Proper z-index layering

### 5. User Experience Flow

1. User clicks "Translate" tile in More Tools menu
2. Language dropdown appears below the tile
3. User sees all available languages with:
   - Current language marked and disabled
   - Unavailable languages grayed out
   - Available languages highlighted on hover
4. User selects a target language
5. Translation begins automatically
6. Dropdown closes
7. More Tools menu closes

### 6. Integration with Chrome AI APIs

The component is designed to work with:

- **Language Detector API**: Provides `currentLanguage`
- **Translator API**: Receives selected `targetLanguage` code
- **API Availability Check**: Can populate `unsupportedLanguages` array

Example integration:

```typescript
// Check which languages are supported
const unsupported = [];
for (const lang of languageOptions) {
  const canTranslate = await translatorManager.canTranslate(
    currentLanguage,
    lang.code
  );
  if (!canTranslate) {
    unsupported.push(lang.code);
  }
}

// Pass to component
<MoreToolsMenu
  onTranslateSummary={(targetLang) => handleTranslate(targetLang)}
  currentLanguage={detectedLang}
  unsupportedLanguages={unsupported}
/>
```

## Testing

### Updated Test

```typescript
it('should call onTranslateSummary when translate language is selected', () => {
  const onTranslateSummary = vi.fn();
  render(
    <MoreToolsMenu
      currentScreen="summary"
      onTranslateSummary={onTranslateSummary}
      currentLanguage="en"
    />
  );

  // Open More Tools
  const trigger = screen.getByTestId('more-tools-trigger');
  fireEvent.click(trigger);

  // Open language dropdown
  const translateOption = screen.getByTestId('translate-summary-option');
  fireEvent.click(translateOption);

  // Select Spanish
  const spanishOption = screen.getByText('Spanish');
  fireEvent.click(spanishOption);

  // Verify callback with language code
  expect(onTranslateSummary).toHaveBeenCalledWith('es');
});
```

### Test Results

- ✅ All 21 tests pass
- ✅ Build completes successfully
- ✅ No diagnostic errors

## Benefits

1. **Better UX**: Users can see all available languages at once
2. **Clear Feedback**: Visual indicators for current and unavailable languages
3. **Bilingual Display**: Shows both English and native names for clarity
4. **Prevents Errors**: Disables invalid selections (current language, unavailable languages)
5. **Scalable**: Easy to add more languages or update availability
6. **Accessible**: Proper ARIA attributes and keyboard navigation support

## Future Enhancements

Potential improvements:

1. Add language search/filter for long lists
2. Show language flags (optional)
3. Remember recently used languages
4. Group languages by region
5. Show translation direction (e.g., "English → Spanish")
6. Add keyboard shortcuts for common languages
