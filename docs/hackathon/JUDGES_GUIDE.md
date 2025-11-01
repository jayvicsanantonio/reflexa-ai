# Reflexa AI - Judge's Testing Guide

**For:** Google Chrome Built-in AI Challenge Judges
**Testing Time:** 10-15 minutes
**Date:** October 31, 2025

---

## 🎯 Quick Start

This guide will walk you through testing Reflexa AI from scratch. No prior setup required - just follow these steps.

---

## 📋 Prerequisites

### Required Software

- **Chrome Browser** (Version 127+)
- **Node.js** (Version 18+)
- **Git** (for cloning repository)

### Time Required

- **Setup**: 5-10 minutes (one-time)
- **Testing**: 10-15 minutes
- **Total**: 15-25 minutes

---

## 🚀 Step 1: Enable Chrome Built-in AI APIs

### 1.1 Enable Chrome Flags

Open each of these URLs in Chrome and set to **"Enabled"** or **"Enabled BypassPerfRequirement"**:

```
chrome://flags/#optimization-guide-on-device-model
→ Set to: "Enabled BypassPerfRequirement"

chrome://flags/#prompt-api-for-gemini-nano
→ Set to: "Enabled"

chrome://flags/#summarization-api-for-gemini-nano
→ Set to: "Enabled"

chrome://flags/#writer-api-for-gemini-nano
→ Set to: "Enabled"

chrome://flags/#rewriter-api-for-gemini-nano
→ Set to: "Enabled"

chrome://flags/#language-detection-api
→ Set to: "Enabled"

chrome://flags/#translation-api
→ Set to: "Enabled"
```

### 1.2 Restart Chrome

After enabling all flags, click **"Relaunch"** button at the bottom of the flags page.

### 1.3 Download Gemini Nano Model (Important!)

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run this command:

```javascript
await ai.languageModel.create();
```

4. Wait for model to download (may take 2-5 minutes)
5. You'll see "Model ready" when complete

**Note**: This is a one-time download. The model stays on your device.

---

## 🔧 Step 2: Install Reflexa AI Extension

### 2.1 Clone Repository

```bash
git clone https://github.com/[your-repo-url]/reflexa-ai.git
cd reflexa-ai
```

### 2.2 Install Dependencies

```bash
npm install
```

**Expected time**: 1-2 minutes

### 2.3 Build Extension

```bash
npm run build
```

**Expected output**: `dist/` folder created with extension files

### 2.4 Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"** button
4. Select the `dist/` folder from the cloned repository
5. Extension should now appear in your extensions list

**Verification**: You should see "Reflexa AI" with a lotus icon in your extensions.

---

## ⚙️ Step 3: Configure Extension Settings

### 3.1 Open Extension Settings

1. Click the Reflexa AI icon in your Chrome toolbar
2. Click the **Settings** icon (gear icon) in the popup
3. Or right-click extension icon → "Options"

### 3.2 Adjust Dwell Threshold (Important for Testing!)

**Default**: 10 seconds (tracks if you're actively reading)

**For faster testing**: Set to **0 seconds**

This will make the lotus icon appear immediately when you visit an article.

**How to change**:

1. In Settings, find "Dwell Threshold" slider
2. Drag to **0 seconds**
3. Settings auto-save

### 3.3 Optional Settings

- **Enable Sound**: Turn on for audio cues (ambient sound, voice stop cue)
- **Reduce Motion**: Disable animations if preferred
- **Experimental Mode**: Enable to access Writer/Rewriter features

---

## 📖 Step 4: Test the Extension

### 4.1 Find a Test Article

**Good test articles** (300-500 words):

- Medium articles about productivity, mindfulness, or learning
- Blog posts with clear structure
- News articles with distinct sections

**Recommended test article**:

```
https://medium.com/@example/article-about-productivity
```

Or use any article you prefer!

### 4.2 Trigger the Lotus Nudge

1. Navigate to your chosen article
2. Start reading (scroll, move cursor to show you're engaged)
3. **If dwell threshold = 0**: Lotus icon appears immediately
4. **If dwell threshold = 10s**: Wait 10 seconds while actively reading

**What you'll see**:

- A circular, pulsing lotus icon appears in the bottom-right corner
- Icon has a subtle animation (breathing effect)

### 4.3 Interact with Lotus Nudge

**Hover over the lotus icon**:

- Icon expands
- Shows "Reflect" text
- Reveals quick action buttons:
  - 🖥️ **Dashboard**: View reflection history
  - 🎯 **AI Status**: Check which AI APIs are available
  - ⚙️ **Settings**: Quick access to settings

**Click "Reflect" button**:

- Meditation Flow Overlay opens
- Full-screen calming interface appears

---

## 🧘 Step 5: Experience the Meditation Flow

### Step 0: Settle (Breathing Phase)

**What happens**:

- Breathing orb appears with 8-second cycles
- Meditative phrases rotate every 4 seconds:
  - "Crafting your insights..."
  - "Take a deep breath..."
  - "Let your mind settle..."
- Breath cues guide you: "Inhale..." → "Exhale..."

**Behind the scenes**:

- AI is processing the article
- Language detection running
- Summary being generated

**Duration**: 8-16 seconds (auto-advances when AI completes)

**What to test**:

- ✅ Breathing orb animates smoothly
- ✅ Phrases rotate every 4 seconds
- ✅ Auto-advances to Step 1 when ready

### Step 1: Summary (Review Insights)

**What you'll see**:

- 3-bullet AI-generated summary:
  - **Insight**: Main takeaway
  - **Surprise**: Unexpected finding
  - **Apply**: Practical application
- Language badge (top-right): Shows detected language
- Format options in "More Tools" menu (⋯ button)

**What to test**:

- ✅ Summary is relevant to article
- ✅ Language badge shows correct language
- ✅ Click "More Tools" → Try different formats:
  - Bullets (default)
  - Paragraph
  - Headline + Bullets
- ✅ If non-English article: Try translation

**Navigation**:

- Click **"Next →"** to proceed to reflection
- Or press **Enter** key

### Step 2: Reflect (First Question)

**What you'll see**:

- Reflection prompt: "What did you find most interesting?"
- Large textarea for your response
- Voice input button (🎤) in top-right of textarea
- "More Tools" menu with AI features

**What to test**:

#### A. Manual Typing

1. Type your reflection in the textarea
2. ✅ Text appears normally
3. ✅ Textarea expands as you type

#### B. Voice Input (Web Speech API)

1. Click the **🎤 microphone button**
2. Grant microphone permission if prompted
3. Speak your reflection
4. ✅ Interim transcription appears in real-time (lighter color)
5. ✅ Final transcription appends to text when you pause
6. ✅ Blue border appears around textarea while recording
7. **Try typing while recording**:
   - ✅ Voice input auto-pauses
   - ✅ Resumes after 2 seconds of no typing
8. Click **🎤 button** again to stop recording
9. ✅ Audio cue plays (if sound enabled)

#### C. AI Draft Generation (Writer API)

1. Clear the textarea (if you typed anything)
2. Click **"More Tools" (⋯)** button
3. Click **"Generate Draft"**
4. ✅ AI generates a contextual reflection
5. ✅ Text appears progressively (2 chars per 24ms)
6. ✅ Draft relates to the article summary
7. Edit the generated draft as desired

#### D. Tone Adjustment (Rewriter API)

1. Type or generate some text (>20 characters)
2. Click **"More Tools" (⋯)** button
3. Select a tone preset:
   - 🧘 **Calm**: Neutral, preserves structure
   - ✂️ **Concise**: Shorter, more succinct
   - 💙 **Empathetic**: Warmer, more casual
   - 🎓 **Academic**: Formal, scholarly
4. ✅ Rewrite preview appears below textarea
5. ✅ Shows original vs rewritten text
6. Click **"✓ Accept"** to apply or **"× Discard"** to cancel

#### E. Proofreading (Proofreader API)

1. Type some text with intentional errors
2. Click **"More Tools" (⋯)** button
3. Click **"Proofread"**
4. ✅ Corrected text appears in preview
5. ✅ Grammar and spelling fixes shown
6. Click **"✓ Accept"** to apply or **"× Discard"** to cancel

**Navigation**:

- Click **"Next →"** to proceed to second question
- Or press **Enter** key

### Step 3: Reflect (Second Question)

**What you'll see**:

- Reflection prompt: "How might you apply this?"
- Same features as Step 2:
  - Manual typing
  - Voice input
  - AI draft generation
  - Tone adjustment
  - Proofreading

**What to test**:

- ✅ All features work independently for second question
- ✅ Voice input for field 2 doesn't affect field 1
- ✅ Can use different tones for each reflection

**Navigation**:

- Click **"Save"** button to save your reflection
- Or press **Cmd/Ctrl + S**

### Saving Your Reflection

**What happens**:

- Reflection is saved locally (Chrome storage)
- Voice metadata is recorded (if you used voice input)
- Overlay closes
- You return to the article

**What to test**:

- ✅ Overlay closes smoothly
- ✅ No errors in console
- ✅ Article is still readable

---

## 📊 Step 6: View Reflection History

### 6.1 Open Dashboard

1. Click the Reflexa AI icon in Chrome toolbar
2. Dashboard popup opens

**What you'll see**:

- **Streak Counter**: Days with consecutive reflections
- **Statistics**:
  - Total reflections
  - Average per day
  - Reading vs reflection time ratio
- **Reflection List**: All saved reflections

### 6.2 Explore Reflection Card

Each reflection shows:

- **Page title** (clickable link back to article)
- **Date and time**
- **3-bullet summary**
- **Your reflection answers**
- **Delete button** (trash icon)

**What to test**:

- ✅ Your saved reflection appears
- ✅ Summary is correct
- ✅ Reflections are correct
- ✅ Click page title → Opens original article
- ✅ Click delete → Reflection is removed

### 6.3 Export Reflections

1. Click **"Export"** button in dashboard
2. Choose format:
   - **JSON**: Machine-readable format
   - **Markdown**: Human-readable format
3. File downloads automatically

**What to test**:

- ✅ Export creates valid file
- ✅ File contains your reflections
- ✅ Format is correct

---

## 🔍 Step 7: Check AI Status

### 7.1 Open AI Status Panel

1. Click Reflexa AI icon in toolbar
2. Click **"AI Status"** button (🎯 icon)
3. Or hover over lotus → Click AI Status

**What you'll see**:

- Status for all 7 Chrome Built-in AI APIs:
  - ✅ **Available**: Green checkmark
  - ⚠️ **Downloading**: Yellow warning
  - ❌ **Unavailable**: Red X

**Expected status** (if setup correct):

```
✅ Summarizer API: Available
✅ Writer API: Available
✅ Rewriter API: Available
✅ Proofreader API: Available
✅ Language Detector API: Available
✅ Translator API: Available
✅ Prompt API: Available
```

### 7.2 Test Fallback System (Optional)

**To test fallback**:

1. Disable one Chrome flag (e.g., Writer API)
2. Restart Chrome
3. Try to generate draft
4. ✅ Extension shows "Writer API unavailable"
5. ✅ Offers alternative: "Try Prompt API fallback"
6. ✅ Graceful degradation, no crashes

---

## 🎯 Step 8: Test Advanced Features

### 8.1 Keyboard Shortcuts

**During Meditation Flow**:

- **Arrow Right / Enter**: Next step
- **Arrow Left**: Previous step
- **Escape**: Close overlay
- **Cmd/Ctrl + G**: Generate draft (when textarea is empty)

**What to test**:

- ✅ All shortcuts work
- ✅ Focus management is correct
- ✅ No keyboard traps

### 8.2 Accessibility

**Screen Reader Testing** (if available):

- ✅ All buttons have ARIA labels
- ✅ Focus indicators are visible
- ✅ Tab order makes sense
- ✅ Announcements for state changes

**Keyboard Navigation**:

- ✅ Can navigate entire flow with keyboard only
- ✅ No mouse required
- ✅ Focus is always visible

**Reduce Motion**:

1. Enable "Reduce Motion" in settings
2. ✅ Breathing orb animation stops
3. ✅ Transitions are instant
4. ✅ No motion sickness triggers

### 8.3 Privacy Verification

**Check Network Activity**:

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Clear network log
4. Trigger reflection flow
5. Use all AI features
6. ✅ **Zero network requests** during AI operations
7. ✅ All processing is local

**Check Storage**:

1. Open Chrome DevTools (F12)
2. Go to **Application** → **Storage** → **Local Storage**
3. Find `chrome-extension://[extension-id]`
4. ✅ Only local data (reflections, settings)
5. ✅ No external tracking or analytics

---

## 🐛 Troubleshooting

### Issue: Lotus Icon Doesn't Appear

**Possible causes**:

1. Dwell threshold not reached (wait 10 seconds while actively reading)
2. Page doesn't have enough text content (try different article)
3. Extension not loaded properly (check `chrome://extensions/`)

**Solutions**:

- Set dwell threshold to 0 in settings
- Try a different article (Medium, blog post)
- Reload extension

### Issue: AI Features Show "Unavailable"

**Possible causes**:

1. Chrome flags not enabled
2. Gemini Nano model not downloaded
3. Chrome version too old

**Solutions**:

- Re-check all Chrome flags are enabled
- Run `await ai.languageModel.create()` in console
- Update Chrome to latest version

### Issue: Voice Input Doesn't Work

**Possible causes**:

1. Microphone permission not granted
2. Browser doesn't support Web Speech API
3. Microphone is being used by another app

**Solutions**:

- Grant microphone permission when prompted
- Check `chrome://settings/content/microphone`
- Close other apps using microphone

### Issue: Extension Crashes or Freezes

**Possible causes**:

1. Very long article (>5000 words)
2. Memory issue
3. Conflicting extension

**Solutions**:

- Try shorter article
- Restart Chrome
- Disable other extensions temporarily

---

## ✅ Testing Checklist

### Core Functionality

- [ ] Extension loads without errors
- [ ] Lotus icon appears after dwell threshold
- [ ] Hover shows quick actions (Dashboard, AI Status, Settings)
- [ ] Click "Reflect" opens Meditation Flow

### Meditation Flow

- [ ] Step 0: Breathing orb animates, phrases rotate
- [ ] Step 0: Auto-advances when AI completes
- [ ] Step 1: Summary is relevant and well-formatted
- [ ] Step 1: Language badge shows correct language
- [ ] Step 1: Format switching works (bullets, paragraph, headline)
- [ ] Step 2: Textarea accepts input
- [ ] Step 2: Voice input transcribes correctly
- [ ] Step 2: Typing pauses voice input
- [ ] Step 2: Generate draft creates contextual text
- [ ] Step 2: Tone adjustment shows preview
- [ ] Step 2: Proofreading shows corrections
- [ ] Step 3: All features work for second question
- [ ] Save button stores reflection

### Dashboard

- [ ] Reflection appears in history
- [ ] Streak counter updates
- [ ] Statistics are accurate
- [ ] Export creates valid file
- [ ] Delete removes reflection

### AI Integration

- [ ] All 7 APIs show as available
- [ ] Summarizer generates 3 bullets
- [ ] Writer generates contextual draft
- [ ] Rewriter adjusts tone correctly
- [ ] Proofreader fixes grammar
- [ ] Language Detector identifies language
- [ ] Translator translates summary
- [ ] Prompt API works as fallback

### Privacy & Performance

- [ ] Zero network requests during AI operations
- [ ] All data stored locally
- [ ] No external tracking
- [ ] Response time <100ms
- [ ] No memory leaks
- [ ] Works offline (after model download)

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Reduce motion disables animations
- [ ] Screen reader compatible (if tested)

---

## 📝 Evaluation Criteria

### Technical Excellence (40 points)

**Chrome AI Integration** (20 points):

- All 7 APIs implemented and functional
- Intelligent fallback system
- Proper error handling
- Session management

**Code Quality** (10 points):

- Clean architecture
- Type safety (TypeScript)
- Comprehensive tests
- Well-documented

**Performance** (10 points):

- Fast response times (<100ms)
- Efficient memory usage
- Optimized bundle size
- Smooth animations

### User Experience (30 points)

**Design** (15 points):

- Zen-inspired aesthetic
- Intuitive interface
- Smooth transitions
- Accessibility compliance

**Functionality** (15 points):

- Core features work reliably
- Voice input is seamless
- AI features are helpful
- Dashboard is useful

### Innovation (20 points)

**Uniqueness** (10 points):

- Novel approach to reading retention
- Meditation + AI combination
- Seamless workflow integration

**Impact** (10 points):

- Solves real problem
- Immediate value
- Scalable solution

### Privacy & Ethics (10 points)

**Privacy** (5 points):

- 100% local processing
- No data collection
- Transparent about data usage

**Ethics** (5 points):

- Promotes mindfulness
- Reduces digital burnout
- Accessible to all users

---

## 🎬 Demo Video

If you prefer to watch a video demo first:

**Video Link**: [Link to demo video]

**Duration**: 5 minutes

**Contents**:

- Quick setup guide
- Full feature walkthrough
- AI integration showcase
- Privacy verification

---

## 📞 Support & Questions

### Documentation

- **Full Documentation**: See `docs/` folder in repository
- **Technical Overview**: `docs/hackathon/TECHNICAL_OVERVIEW.md`
- **Architecture**: `docs/architecture/ARCHITECTURE.md`
- **API Integration**: `docs/hackathon/CHROME_AI_INTEGRATION.md`

### Contact

- **GitHub Issues**: [Repository URL]/issues
- **Email**: [your-email]
- **Discord**: [Discord invite] (if available)

### Common Questions

**Q: How long does setup take?**
A: 5-10 minutes for first-time setup, including model download.

**Q: Can I test without downloading Gemini Nano?**
A: No, the model is required for AI features. It's a one-time 1-2GB download.

**Q: Does this work on mobile?**
A: Not yet. Chrome extensions with Built-in AI APIs are desktop-only currently.

**Q: Can I use this on Firefox/Safari?**
A: No, Chrome Built-in AI APIs are Chrome-exclusive.

**Q: Is my data sent to any servers?**
A: No. All processing is 100% local. You can verify in DevTools Network tab.

---

## 🙏 Thank You

Thank you for taking the time to test Reflexa AI! We're excited to show how Chrome's Built-in AI APIs can transform everyday reading into a mindful, memorable experience.

**Reflexa AI** - _Pause. Reflect. Remember._

---

**Built with ❤️ for the Google Chrome Built-in AI Challenge**
**October 31, 2025**
