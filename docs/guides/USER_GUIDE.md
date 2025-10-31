# Reflexa AI User Guide

Welcome to Reflexa AI! This guide will help you get the most out of your reflective reading experience.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Using Reflexa AI](#using-reflexa-ai)
3. [Dashboard](#dashboard)
4. [Settings](#settings)
5. [Exporting Reflections](#exporting-reflections)
6. [Tips & Best Practices](#tips--best-practices)
7. [FAQ](#faq)

## Getting Started

### First-Time Setup

1. **Enable Chrome AI APIs** (required for AI features):

   All Reflexa AI features are powered by Chrome's Built-in AI APIs (Gemini Nano). You need to enable these flags once:

   **a. Base AI Model** (Required for all APIs):
   - Go to `chrome://flags/#optimization-guide-on-device-model`
   - Set to **"Enabled BypassPerfRequirement"**

   **b. Core APIs**:
   - `chrome://flags/#prompt-api-for-gemini-nano` → **"Enabled"**
   - `chrome://flags/#summarization-api-for-gemini-nano` → **"Enabled"**

   **c. Writing Assistance APIs**:
   - `chrome://flags/#writer-api` → **"Enabled"**
   - `chrome://flags/#rewriter-api` → **"Enabled"**
   - `chrome://flags/#proofreader-api` → **"Enabled"**

   **d. Translation APIs**:
   - `chrome://flags/#translator-api` → **"Enabled"**
   - `chrome://flags/#language-detection-api` → **"Enabled"**

   **Restart Chrome** completely for changes to take effect.

   > **Technical Note**: All Chrome AI APIs are accessed via global objects (Writer, Rewriter, Proofreader, Summarizer, LanguageModel, Translator, LanguageDetector). Reflexa AI automatically detects which APIs are available and enables corresponding features. If an API is unavailable, the extension gracefully falls back to alternatives or hides the feature.

2. **Install Reflexa AI**:
   - Download from Chrome Web Store or load unpacked extension
   - You'll see the Reflexa AI icon in your browser toolbar

3. **Verify APIs are Working** (Optional but Recommended):
   - Open DevTools (F12) on any page
   - Go to Console tab
   - Copy and paste this verification code:

   ```javascript
   // Verify all Chrome AI APIs
   const apis = {
     Writer: typeof Writer,
     Rewriter: typeof Rewriter,
     Proofreader: typeof Proofreader,
     Summarizer: typeof Summarizer,
     LanguageModel: typeof LanguageModel,
     Translator: typeof Translator,
     LanguageDetector: typeof LanguageDetector,
   };
   console.table(apis);
   ```

   - All should show `"function"` if properly enabled
   - If any show `"undefined"`, that API is not available

4. **Review Privacy Notice**:
   - On first launch, you'll see a privacy notice
   - All processing happens locally on your device powered by Gemini Nano
   - No data is sent to external servers

5. **Customize Settings** (optional):
   - Click the extension icon
   - Click the settings gear icon
   - Adjust AI features, dwell threshold, sound, and motion preferences

## Using Reflexa AI

### The Reflection Flow

#### Step 1: Read Naturally

- Browse to any article or blog post
- Start reading as you normally would
- Reflexa AI monitors your reading time in the background

#### Step 2: Dwell Detection

- After reading for 60 seconds (default), a **lotus icon** appears
- The icon gently pulses to catch your attention
- You can continue reading or click the icon when ready

#### Step 3: Reflect Mode Activates

When you click the lotus icon:

- The page dims with a calming gradient overlay
- A **breathing orb** appears, expanding and contracting in a 7-second cycle
- A gentle chime plays (if sound is enabled)
- Ambient background audio begins (if sound is enabled)

#### Step 4: Review AI Summary

The AI generates a summary in your chosen format:

**Bullets Format** (default):

- **Insight**: The main idea or key takeaway
- **Surprise**: Something unexpected or counterintuitive
- **Apply**: How to use this information practically

**Paragraph Format**:

- A concise paragraph (max 150 words) capturing the essence

**Headline + Bullets Format**:

- A 10-word headline followed by three key points

You can change the format using the dropdown in the Reflect Mode overlay. The AI uses Chrome's Summarizer API for optimal results, falling back to the Prompt API if needed.

#### Step 5: Answer Reflection Questions

Two thoughtful questions appear below the summary:

- Questions are action-oriented and encourage deeper thinking
- Type your responses in the text areas
- Text areas auto-expand as you type

#### Step 6: AI-Powered Writing Features

**Tone Adjustment** (if Rewriter API available):

- Click tone preset chips: Calm, Concise, Empathetic, or Academic
- AI rewrites your reflection in the selected tone
- Preview the rewritten version side-by-side
- Accept or discard the changes

**Proofreading** (if Proofreader API available and enabled):

- Click the "Proofread" button below your reflection
- AI fixes grammar and improves clarity while preserving your voice
- View a diff showing all changes with color coding
- Accept or discard individual corrections

**Translation** (if Translator API available):

- Automatically detects the language of the webpage
- Translate summaries and reflections to 10+ languages
- Preserves formatting including bullet points
- Works seamlessly with non-English content

#### Step 7: Save Your Reflection

- Click "Save" or press **Cmd/Ctrl + Enter**
- Your reflection is stored locally
- The overlay closes and you return to the article
- A completion bell plays (if sound is enabled)

### Keyboard Shortcuts

- **Tab**: Navigate between inputs
- **Enter**: Move to next input
- **Cmd/Ctrl + Enter**: Save reflection
- **Escape**: Cancel and close overlay

### AI Features Overview

Reflexa AI integrates all seven Chrome Built-in AI APIs for a powerful, privacy-first experience:

#### 1. Summarizer API

- Generates summaries in three formats: bullets, paragraph, or headline+bullets
- Optimized for quick comprehension
- Fallback to Prompt API if unavailable

#### 2. Writer API

- Creates first drafts for your reflections
- Adjusts tone (calm, professional, casual) and length
- Uses your summary as context for better results

#### 3. Rewriter API

- Adjusts tone with four presets: Calm, Concise, Empathetic, Academic
- Preserves meaning while changing style
- Side-by-side preview before accepting

#### 4. Proofreader API

- Fixes grammar and improves clarity
- Color-coded diff view shows all changes
- Preserves your voice and writing style

#### 5. Language Detector API

- Automatically identifies webpage language
- Supports 100+ languages
- Shows confidence score and language name

#### 6. Translator API

- Translates to 10+ languages (English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic)
- Preserves markdown formatting
- Works with summaries and reflections

#### 7. Prompt API

- Universal fallback for all operations
- Provides AI features even when specialized APIs unavailable
- Carefully crafted prompts mimic specialized API behavior

**Privacy Guarantee**: All AI processing happens locally on your device using Gemini Nano. Zero data leaves your browser.

## Dashboard

Access your reflection history by clicking the Reflexa AI icon in your toolbar.

### Reflection List

- **Sorted by date**: Most recent reflections appear first
- **Scroll through history**: Use mouse wheel or trackpad
- **Virtual scrolling**: Optimized for large collections

### Reflection Cards

Each card displays:

- **Page title**: Clickable link to original article
- **Date**: When you created the reflection
- **Summary bullets**: Your three-bullet summary with icons
- **Reflection text**: Your answers to the reflection questions
- **Actions**: Delete button (hover to reveal)

### Streak Counter

- **Current streak**: Number of consecutive days with at least one reflection
- **Flame icon**: Visual indicator of your streak
- **Last reflection**: Date of your most recent reflection
- **Motivation**: Encourages daily reflection habit

### Calm Stats

Visual representation of your reflection practice:

- **Total reflections**: Lifetime count
- **Average per day**: Reflection frequency
- **Reading vs reflection time**: Time ratio visualization
- **Progress indicators**: Visual bars showing your engagement

### AI Status Panel

Monitor which Chrome AI APIs are available and active:

- **API Availability**: Green checkmarks for available APIs, gray X for unavailable
- **Usage Statistics**: Counters for summarizations, drafts, rewrites, proofreads, translations
- **Session Info**: Current session start time and total operations
- **Experimental Mode Badge**: Shows when experimental features are enabled
- **Refresh Button**: Re-check API availability on demand

### Export Button

- Located in the dashboard header
- Click to open export modal
- Choose JSON or Markdown format
- Downloads immediately to your default folder

## Settings

Access settings by clicking the gear icon in the dashboard.

### Behavior Settings

#### Dwell Threshold

- **Range**: 0 to 60 seconds
- **Default**: 10 seconds
- **Purpose**: Controls when the lotus icon appears (0 = instant)
- **Tip**: Shorter for quick articles, longer for deep reading

**Recommended settings**:

- Quick news: 30-45 seconds
- Blog posts: 60-90 seconds
- Long-form articles: 120-180 seconds
- Academic papers: 180-300 seconds

### Accessibility Settings

#### Enable Sound

- **Default**: On
- **Controls**: Entry chime, ambient loop, completion bell
- **Volume**: Fixed at 30% for calm experience
- **Tip**: Disable in quiet environments or if you prefer silence

#### Reduce Motion

- **Default**: Off (respects browser setting)
- **Controls**: Breathing orb animation, gradient drift
- **Purpose**: Accessibility for motion sensitivity
- **Note**: Automatically enabled if browser's `prefers-reduced-motion` is set

#### Enable Proofreading

- **Default**: Off
- **Purpose**: AI-powered grammar and clarity improvements using Proofreader API
- **Note**: Adds a "Proofread" button in Reflect Mode
- **Tip**: Enable if you want to refine your reflections

### AI Settings

#### Default Summary Format

- **Options**: Bullets, Paragraph, Headline + Bullets
- **Default**: Bullets
- **Purpose**: Choose your preferred summary format
- **Note**: Can be changed per-reflection in Reflect Mode

#### Enable Translation

- **Default**: On (if Translator API available)
- **Purpose**: Enable/disable translation features
- **Note**: Shows language detection and translation options

#### Preferred Translation Language

- **Options**: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic
- **Default**: English
- **Purpose**: Default target language for translations

#### Auto-Detect Language

- **Default**: On (if Language Detector API available)
- **Purpose**: Automatically detect webpage language
- **Note**: Shows language pill in Reflect Mode header

#### Experimental Mode

- **Default**: Off
- **Purpose**: Enable experimental AI features and beta APIs
- **Warning**: May be unstable or change behavior
- **Note**: Refreshes capability detection when toggled

### Privacy Settings

#### Storage Mode

- **Local** (default): Stores reflections only on this device
- **Sync**: Syncs reflections across all your Chrome browsers
- **Note**: Both options keep data within Chrome's ecosystem
- **Tip**: Use sync if you read on multiple devices

### Reset to Defaults

- Click "Reset to Defaults" button at bottom of settings
- Restores all settings to original values
- Does not delete your reflections

## Exporting Reflections

### Why Export?

- **Backup**: Preserve your reflections outside the browser
- **Integration**: Import into note-taking apps (Obsidian, Notion, etc.)
- **Analysis**: Review patterns in your learning
- **Sharing**: Share insights with study groups or colleagues

### Export Formats

#### JSON Format

```json
[
  {
    "id": "uuid-here",
    "url": "https://example.com/article",
    "title": "Article Title",
    "createdAt": 1234567890,
    "summary": [
      "Insight: Main idea here",
      "Surprise: Unexpected finding",
      "Apply: Practical application"
    ],
    "reflection": ["Answer to first question", "Answer to second question"],
    "tags": ["optional", "tags"]
  }
]
```

**Best for**:

- Programmatic processing
- Importing into databases
- Data analysis with scripts

#### Markdown Format

```markdown
# Reflexa AI - Reflections Export

Exported on: January 1, 2025
Total Reflections: 42

---

## Article Title

**URL:** https://example.com/article
**Date:** January 1, 2025

### Summary

- **Insight:** Main idea here
- **Surprise:** Unexpected finding
- **Apply:** Practical application

### Reflections

1. Answer to first question

2. Answer to second question

---
```

**Best for**:

- Note-taking apps (Obsidian, Notion, Bear)
- Reading in text editors
- Printing or PDF conversion
- Human-readable archives

### Export Process

1. Click the Reflexa AI icon to open dashboard
2. Click the "Export" button in the header
3. Select your preferred format (JSON or Markdown)
4. Click "Download"
5. File saves to your default downloads folder
6. Filename includes current date: `reflexa-reflections-2025-01-01.md`

## Tips & Best Practices

### Maximizing Learning

1. **Reflect immediately**: Capture insights while they're fresh
2. **Be specific**: Detailed reflections are more valuable later
3. **Connect to experience**: Relate new information to what you know
4. **Action-oriented**: Focus on how you'll apply the knowledge
5. **Review regularly**: Revisit past reflections to reinforce learning

### Building a Habit

1. **Set a daily goal**: Aim for 1-3 reflections per day
2. **Track your streak**: Use the streak counter as motivation
3. **Adjust threshold**: Find the sweet spot for your reading pace
4. **Create rituals**: Reflect at the same time each day
5. **Export monthly**: Archive reflections for long-term review

### Optimizing Settings

1. **Start with defaults**: Use default settings for a week
2. **Adjust gradually**: Change one setting at a time
3. **Match your environment**: Enable/disable sound based on location
4. **Respect your needs**: Use reduced motion if animations distract
5. **Experiment**: Try different thresholds for different content types

### Content Selection

**Best content for reflection**:

- ✅ Long-form articles (1000+ words)
- ✅ Blog posts with actionable advice
- ✅ Research summaries and case studies
- ✅ Opinion pieces and essays
- ✅ Educational content and tutorials

**Less suitable content**:

- ❌ News headlines and short updates
- ❌ Social media feeds
- ❌ Video-heavy pages
- ❌ Image galleries
- ❌ Interactive web apps

## FAQ

### General Questions

**Q: Does Reflexa AI work offline?**
A: Yes! All AI processing happens locally on your device. You can reflect on articles even without an internet connection (as long as the article is loaded).

**Q: How much storage does it use?**
A: Each reflection is approximately 1-2 KB. Chrome's local storage limit is ~5MB, allowing for thousands of reflections.

**Q: Can I use it on mobile?**
A: Not currently. Reflexa AI is designed for desktop Chrome. Mobile support may come in future versions.

**Q: Does it work on all websites?**
A: It works on most article-based websites. Some sites with unusual layouts or heavy JavaScript may not extract content properly.

### Privacy & Security

**Q: Is my data private?**
A: Absolutely. All AI processing happens locally using Chrome's Gemini Nano. No data is sent to external servers.

**Q: Can others see my reflections?**
A: No. Reflections are stored in your Chrome profile's local storage, accessible only to you.

**Q: What happens if I enable sync?**
A: Reflections sync across your Chrome browsers using Chrome's sync infrastructure. Data remains within Google's ecosystem and is encrypted.

**Q: Can I delete my data?**
A: Yes. You can delete individual reflections from the dashboard or clear all data by uninstalling the extension.

### Technical Questions

**Q: Why isn't the lotus icon appearing?**
A: Check that:

- You've been reading for at least the dwell threshold (default 60s)
- You're actively interacting with the page (scrolling, moving mouse)
- The page has extractable text content
- The extension is enabled in `chrome://extensions/`

**Q: Why is AI unavailable?**
A: Ensure:

- Chrome flags are enabled (see Getting Started)
- Chrome is restarted after enabling flags
- You're using Chrome 127 or later
- Your device meets performance requirements
- Check AI Status panel in dashboard for specific API availability

**Q: What if AI times out?**
A: The extension will:

- Retry once automatically with extended timeout (8 seconds)
- Fall back to Prompt API for summarize/write/rewrite operations
- Fall back to manual mode for proofread/translate operations
- Allow you to enter summary and reflections manually

**Q: Can I customize the AI prompts?**
A: Not currently. Prompts are carefully designed based on learning science research. Custom prompts may be added in future versions.

**Q: Which Chrome AI APIs does Reflexa use?**
A: Reflexa integrates all seven Chrome Built-in AI APIs:

- Summarizer API for summaries
- Writer API for draft generation
- Rewriter API for tone adjustment
- Proofreader API for grammar checking
- Language Detector API for language identification
- Translator API for translations
- Prompt API as universal fallback

**Q: What happens if a specific API is unavailable?**
A: The extension uses intelligent fallback:

- Summarizer → Prompt API
- Writer → Prompt API
- Rewriter → Prompt API
- Proofreader → Feature hidden (no fallback)
- Translator → Feature hidden (no fallback)
- Language Detector → Feature hidden (no fallback)

**Q: How do I know which API is being used?**
A: Check the AI Status panel in the dashboard to see which APIs are available. The extension automatically uses the best available API for each operation.

**Q: Why are some AI features missing?**
A: Some features require specific Chrome AI APIs:

- Tone adjustment requires Rewriter API (`#rewriter-api`)
- Proofreading requires Proofreader API (`#proofreader-api`)
- Translation requires Translator API (`#translator-api`)
- Language detection requires Language Detector API (`#language-detection-api`)
- Draft generation requires Writer API (`#writer-api`)
- Summaries require Summarizer API (`#summarization-api-for-gemini-nano`)

If these APIs are unavailable, the features won't appear. Check that:

1. All Chrome flags are enabled (see First-Time Setup)
2. Chrome is restarted after enabling flags
3. You're using Chrome 127 or later
4. Your device meets performance requirements

**To verify which APIs are available**:

1. Open DevTools (F12) on any page
2. Go to Console tab
3. Type: `console.log('Writer:', typeof Writer, 'Rewriter:', typeof Rewriter, 'Proofreader:', typeof Proofreader)`
4. All should return `"function"` if available

**Q: Can I use Reflexa without any AI APIs?**
A: Yes! Reflexa works in manual mode where you write your own summaries and reflections. The extension still tracks your reading, manages reflections, and provides the calm reflection experience.

### Usage Questions

**Q: Can I edit saved reflections?**
A: Not currently. You can delete and recreate reflections if needed. Edit functionality may be added in future versions.

**Q: How do I backup my reflections?**
A: Use the Export feature to download your reflections in JSON or Markdown format. Store the file in a safe location.

**Q: Can I import reflections from another device?**
A: Not directly. Enable sync in settings to automatically sync across devices, or manually copy the export file.

**Q: What happens to my streak if I miss a day?**
A: Your streak resets to 0. Start fresh the next day! Streaks are meant to motivate, not stress you out.

### Troubleshooting

**Q: The overlay is stuck on screen**
A: Press Escape to close it. If that doesn't work, refresh the page.

**Q: Audio isn't playing**
A: Check that:

- Sound is enabled in settings
- Your device volume is up
- Browser isn't muted
- Audio files loaded correctly (check DevTools console)

**Q: Reflections aren't saving**
A: Check that:

- Storage isn't full (see dashboard for usage)
- Chrome has permission to store data
- You're clicking Save (not just closing the overlay)

**Q: Dashboard is slow with many reflections**
A: The dashboard uses virtual scrolling for performance. If it's still slow:

- Export and delete old reflections
- Clear browser cache
- Restart Chrome

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the console**: Open DevTools (F12) and look for error messages
2. **Search GitHub Issues**: Someone may have reported the same problem
3. **Create an issue**: Provide details about your setup and the problem
4. **Contact support**: Email support@reflexa-ai.com with details

## Feedback

We'd love to hear from you!

- 💡 **Feature requests**: Open a GitHub Discussion
- 🐛 **Bug reports**: Create a GitHub Issue
- ⭐ **Reviews**: Leave a review on the Chrome Web Store
- 📧 **General feedback**: Email feedback@reflexa-ai.com

Thank you for using Reflexa AI! Happy reflecting! 🌸
