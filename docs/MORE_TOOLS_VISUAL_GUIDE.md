# More Tools Menu - Visual Design Guide

## Layout Structure

```
┌─────────────────────────────────────┐
│  More Tools Menu                    │
├─────────────────────────────────────┤
│                                     │
│  TOOLS                              │
│  ┌──────────┬──────────┐           │
│  │   🎵     │   🌐     │           │
│  │  Mute    │ Translate│           │
│  └──────────┴──────────┘           │
│                                     │
│  ─────────────────────────          │
│                                     │
│  FORMAT (Summary Screen Only)       │
│  ┌──────┬──────┬──────────┐        │
│  │  •   │  ¶   │    ⚡    │        │
│  │Bullet│Para  │Headline+ │        │
│  └──────┴──────┴──────────┘        │
│                                     │
│  ─────────────────────────          │
│                                     │
│  REWRITE TONE (Reflection + Content)│
│  ┌──────┬──────┬──────┬──────┐     │
│  │ 😌   │  →   │  💙  │  🎓  │     │
│  │Calm  │Concis│Empath│Academ│     │
│  └──────┴──────┴──────┴──────┘     │
│                                     │
│  ─────────────────────────          │
│                                     │
│  POLISH (Reflection + Content)      │
│  ┌─────────────────────────────┐   │
│  │ ✏️  Proofread               │   │
│  │     Check grammar & spelling│   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Design Tokens

### Colors

- Background: `rgba(15, 23, 42, 0.98)` with backdrop blur
- Border: `rgba(255, 255, 255, 0.15)`
- Tile Background: `rgba(255, 255, 255, 0.04)`
- Tile Hover: `rgba(255, 255, 255, 0.08)`
- Selected: `rgba(14, 165, 233, 0.15)` with accent border
- Text: `var(--color-calm-200)`

### Spacing

- Menu Padding: `12px`
- Section Gap: `16px`
- Grid Gap: `8px`
- Tile Padding: `14px 8px`

### Typography

- Section Title: `10px`, `700 weight`, `0.8px letter-spacing`
- Tile Label: `12px`, `600 weight`
- Icon Size: `20px`

### Dimensions

- Menu Width: `320px` (min) to `400px` (max)
- Menu Max Height: `70vh`
- Tile Min Width: `90px`
- Border Radius: `var(--radius-sm)` (8px)

## Icon System

### Universal Tools

- 🎵 Ambient Sound (Unmuted)
- 🔇 Ambient Sound (Muted)
- 🌐 Translate
- ⏳ Loading State

### Format Options

- • Bullets
- ¶ Paragraph
- ⚡ Headline

### Tone Presets

- 😌 Calm
- → Concise
- 💙 Empathetic
- 🎓 Academic

### Actions

- ✨ Generate Draft
- ✏️ Proofread
- ✓ Selected/Check

## Interaction States

### Tile States

1. **Default**: Subtle background, light border
2. **Hover**: Elevated background, accent border, slight lift
3. **Active**: No lift, pressed state
4. **Selected**: Accent background, accent border
5. **Disabled**: 50% opacity, no pointer events

### Animations

- Pop-in: `200ms cubic-bezier(0.2, 0.8, 0.2, 1)`
- Hover lift: `translateY(-1px)`
- Spinner: `1s linear infinite rotation`

## Responsive Behavior

### Grid Auto-fit

```css
grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
```

This ensures:

- Tiles automatically wrap to new rows
- Equal width distribution
- Minimum 90px per tile
- Maximum available space utilization

### Overflow Handling

- Vertical scroll when content exceeds `70vh`
- Custom thin scrollbar (6px width)
- Smooth scrolling behavior
- Maintains backdrop blur during scroll

## Accessibility

### ARIA Attributes

- `role="menu"` on dropdown
- `role="menuitem"` on each option
- `aria-label` on trigger button
- `aria-expanded` state on trigger
- `aria-haspopup="true"` on trigger

### Keyboard Navigation

- Tab: Navigate between tiles
- Enter/Space: Activate tile
- Escape: Close menu
- Arrow keys: Navigate within menu

### Screen Reader Support

- Clear labels for all icons
- State announcements (muted/unmuted, translating)
- Disabled state properly announced

## Usage Guidelines

### When to Show Universal Tools

- **Always**: Ambient Sound and Translate are available in all screens
- Provides consistent access to core functionality
- Users don't need to navigate away to access these features

### When to Show Format Options

- **Summary Screen Only**: Format selection is contextual to summary display
- Grid layout makes it easy to see all options at once

### When to Show Tone Presets

- **Reflection Screen + Content**: Only when user has written something
- Grid layout allows quick tone selection
- Visual feedback for selected tone

### When to Show Proofread

- **Reflection Screen + Content**: Only when proofreader is available
- Full-width option for important action
- Clear description of functionality
