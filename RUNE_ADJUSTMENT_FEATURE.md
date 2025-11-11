# Rune Count Adjustment Feature

## What Was Added

Added the ability to adjust rune counts after auto-population using +/- controls.

## How It Works

### Visual Interaction

1. **Hover over a rune card** in the Rune Deck zone
2. **Overlay appears** with +/- controls
3. **Click + to increase** count (up to 12 total runes)
4. **Click - to decrease** count (removes card if count reaches 0)
5. **Current count** displayed in the middle

### Controls

```
┌─────────┐
│  Card   │
│  Image  │
│         │
│   [+]   │  ← Increase count
│    5    │  ← Current count
│   [-]   │  ← Decrease count
└─────────┘
```

### Constraints

- **Total rune limit**: 12 runes maximum
- **+ button disabled** when total reaches 12
- **- button removes card** when count reaches 0
- **Visual feedback**: Buttons change color on hover

## Example Use Cases

### Dual-Domain Legend (Auto-populated 6+6)

1. Legend selected: "Hand of Noxus" (Fury + Body)
2. Auto-populates: 6 Fury runes + 6 Body runes
3. **Adjust to 5+7**:
   - Hover over Fury rune
   - Click - once (6 → 5)
   - Hover over Body rune
   - Click + once (6 → 7)
4. Result: 5 Fury + 7 Body = 12 total ✓

### Single-Domain Legend (Auto-populated 12)

1. Legend selected: Single domain
2. Auto-populates: 12 runes of that domain
3. **Mix with another domain**:
   - Hover over auto-populated rune
   - Click - six times (12 → 6)
   - Click + button to add different rune type
   - Adjust second rune to 6
4. Result: 6 of each type = 12 total ✓

## Technical Details

### New Props

```typescript
interface RuneDeckZoneProps {
  // ... existing props
  onRuneCountChange?: (cardId: string, newCount: number) => void;
}
```

### New State

```typescript
const [hoveredCard, setHoveredCard] = useState<string | null>(null);
```

### New Handlers

```typescript
handleIncrement(cardId, currentCount, e)
  - Increases count by 1
  - Checks total limit (12)
  - Calls onRuneCountChange

handleDecrement(cardId, currentCount, e)
  - Decreases count by 1
  - Removes card if count reaches 0
  - Calls onRuneCountChange or onRuneRemove
```

## UI/UX Features

- **Hover-only controls**: Clean interface, controls only show when needed
- **Visual feedback**: Buttons highlight on hover
- **Disabled state**: + button grays out when at limit
- **Count display**: Always visible badge shows current count
- **Smooth transitions**: Hover effects are smooth and responsive

## Testing

1. ✅ Auto-populate runes by selecting a Legend
2. ✅ Hover over a rune card
3. ✅ Click + to increase count
4. ✅ Click - to decrease count
5. ✅ Verify total stays at or below 12
6. ✅ Verify + button disables at 12 total
7. ✅ Verify - button removes card at count 0

## Future Enhancements

- Add keyboard shortcuts (+ / - keys)
- Add input field for direct count entry
- Add "Reset to Auto" button to restore auto-populated counts
- Add drag-to-reorder runes
