# Icon Library Migration Guide

## Recommendation: Lucide React

**Lucide React** has been installed and is the recommended icon library to replace the existing inline SVG icons in the codebase.

### Why Lucide React?

- ✅ **Perfect style match** - Your current icons match Lucide's design system exactly
- ✅ **Tree-shakeable** - Only imports icons you actually use
- ✅ **TypeScript support** - Full type definitions included
- ✅ **Small bundle size** - Each icon is ~1KB, only imports what you use
- ✅ **Consistent API** - Simple, predictable component interface
- ✅ **Active maintenance** - Regularly updated with new icons
- ✅ **Easy migration** - Minimal code changes required

## Installation

```bash
npm install lucide-react
```

✅ **Already installed** - The package has been added to your dependencies.

## Icon Mapping

Here's a comprehensive mapping of your current icons to Lucide React equivalents:

### LotusNudge Icons (`src/content/components/LotusNudge/icons.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `IconScreen` | `Monitor` | Monitor/screen icon |
| `IconBrain` | `Brain` | Brain icon |
| `IconGear` | `Settings` | Settings/gear icon |

### Dashboard Modal Icons (`src/content/components/DashboardModal/icons.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `IconFlame` | `Flame` | Fire/flame icon |
| `IconDelete` | `Trash2` | Delete/trash icon |

### Quick Settings Modal Icons (`src/content/components/QuickSettingsModal/icons.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `IconSound` | `Volume2` | Sound/volume icon |
| `IconMotion` | `Move` | Motion/move icon |
| `IconProofread` | `FileCheck` | Proofread/file check icon |
| `IconTranslate` | `Languages` | Translate/languages icon |
| `IconBeaker` | `FlaskConical` | Beaker/flask icon |
| `IconClock` | `Clock` | Clock/time icon |
| `IconList` | `List` | List icon |
| `IconDatabase` | `Database` | Database icon |
| `IconMic` | `Mic` | Microphone icon |
| `IconSettings` | `Settings` | Settings icon |

### AI Status Modal Icons (`src/content/components/AIStatusModal/icons.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `IconList` | `List` | List icon |
| `IconPen` | `PenTool` | Pen/edit icon |
| `IconRepeat` | `Repeat` | Repeat icon |
| `IconBookCheck` | `BookCheck` | Book with checkmark |
| `IconGlobe` | `Globe` | Globe icon |
| `IconTranslate` | `Languages` | Translate icon |
| `IconSpark` | `Zap` | Spark/lightning icon |

### More Tools Menu Icons (`src/content/components/MoreToolsMenu/icons.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `VolumeIcon` | `Volume2` | Volume icon |
| `VolumeMuteIcon` | `VolumeX` | Muted volume icon |
| `ReduceMotionIcon` | `Move` | Reduce motion icon |
| `BulletIcon` | `List` | Bullet list icon |
| `ParagraphIcon` | `AlignLeft` | Paragraph icon |
| `HeadlineIcon` | `Heading` | Headline icon |
| `CalmIcon` | `Smile` | Calm/smile icon |
| `ConciseIcon` | `ArrowRight` | Concise/arrow icon |
| `EmpatheticIcon` | `Heart` | Empathetic/heart icon |
| `AcademicIcon` | `GraduationCap` | Academic icon |
| `SparklesIcon` | `Sparkles` | Sparkles icon |
| `EditIcon` | `Edit` | Edit icon |
| `LoadingIcon` | `Loader2` | Loading spinner icon |

### Calm Stats Lite Icons (`src/content/components/CalmStatsLite/icons.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `IconCalendar` | `Calendar` | Calendar icon |
| `IconBook` | `Book` | Book icon |
| `IconHeart` | `Heart` | Heart icon |

### Tone Preset Chips (`src/content/components/TonePresetChips/components/ToneIcon.tsx`)

| Current Icon | Lucide Equivalent | Notes |
|-------------|-------------------|-------|
| `calm` | `Smile` | Calm/smile icon |
| `concise` | `ArrowRight` | Concise/arrow icon |
| `empathetic` | `Heart` | Empathetic/heart icon |
| `academic` | `GraduationCap` | Academic icon |

## Migration Example

### Before (Current Pattern)

```tsx
// src/content/components/LotusNudge/icons.tsx
export const IconScreen = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="4" width="18" height="12" rx="2" ry="2"></rect>
    <line x1="8" y1="20" x2="16" y2="20"></line>
  </svg>
);
```

### After (Lucide React)

```tsx
// src/content/components/LotusNudge/icons.tsx
import { Monitor } from 'lucide-react';

export const IconScreen = (
  <Monitor
    size={18}
    strokeWidth={2}
    aria-hidden
  />
);
```

Or even better, use it directly in components:

```tsx
import { Monitor } from 'lucide-react';

// In your component
<Monitor size={18} strokeWidth={2} className="icon-class" />
```

## Migration Steps

1. **Replace icon imports** - Import Lucide icons instead of defining inline SVGs
2. **Update component usage** - Replace JSX elements with Lucide components
3. **Preserve props** - Map existing props (size, strokeWidth, className, aria-hidden)
4. **Test visually** - Ensure icons render correctly
5. **Remove old files** - Delete the old icon component files after migration

## Lucide React API

### Common Props

- `size` - Number (default: 24) - Size in pixels
- `strokeWidth` - Number (default: 2) - Stroke width
- `className` - String - CSS classes
- `color` - String - Stroke color (defaults to `currentColor`)
- `aria-hidden` - Boolean - Accessibility attribute

### Example Usage

```tsx
import { Settings, Brain, Monitor } from 'lucide-react';

// Small icon
<Settings size={16} />

// Medium icon with custom color
<Brain size={18} color="#6366f1" />

// Large icon with custom stroke
<Monitor size={20} strokeWidth={2.5} />

// With className for styling
<Settings size={18} className="icon-button" />
```

## Benefits After Migration

1. **Reduced code** - No need to maintain inline SVG definitions
2. **Consistency** - All icons from the same design system
3. **Maintainability** - Updates to icons handled by library updates
4. **Type safety** - TypeScript autocomplete for icon names
5. **Smaller bundle** - Only imports what you use (tree-shaking)
6. **Accessibility** - Built-in accessibility support

## Migration Checklist

- [ ] Install lucide-react (✅ Done)
- [ ] Create migration plan for each icon file
- [ ] Update LotusNudge icons
- [ ] Update Dashboard Modal icons
- [ ] Update Quick Settings Modal icons
- [ ] Update AI Status Modal icons
- [ ] Update More Tools Menu icons
- [ ] Update Calm Stats Lite icons
- [ ] Update Tone Preset Chips icons
- [ ] Test all icon displays
- [ ] Remove old icon component files
- [ ] Update documentation

## Additional Resources

- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)
- [Lucide Icon Search](https://lucide.dev/icons)
- [Lucide GitHub](https://github.com/lucide-icons/lucide)

