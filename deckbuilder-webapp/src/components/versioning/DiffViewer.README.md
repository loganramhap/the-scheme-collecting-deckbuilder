# DiffViewer Component

## Overview

The `DiffViewer` component provides a visual comparison between two deck versions, showing all changes including added, removed, and modified cards, as well as special slot changes (commander, legend, battlefield).

## Features

### ✅ Implemented Features

1. **Modal UI** - Clean modal interface for displaying diffs
2. **Side-by-Side View** - Compare old and new versions in parallel columns
3. **Unified View** - See all changes in a single list
4. **View Toggle** - Switch between side-by-side and unified views
5. **Color-Coded Changes**:
   - 🟢 Green highlighting for added cards
   - 🔴 Red highlighting for removed cards
   - 🟡 Yellow highlighting for modified cards
6. **Card Images** - Visual reference with card images
7. **Summary Statistics** - Quick overview of total changes at the top
8. **Special Slot Highlighting** - Dedicated section for commander/legend/battlefield changes

## Usage

```tsx
import { DiffViewer } from './components/versioning';

<DiffViewer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  oldDeck={oldDeckVersion}
  newDeck={newDeckVersion}
  oldCommit={oldCommitInfo}
  newCommit={newCommitInfo}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Callback when modal is closed |
| `oldDeck` | `Deck` | The older deck version |
| `newDeck` | `Deck` | The newer deck version |
| `oldCommit` | `DeckCommit` | Commit info for old version |
| `newCommit` | `DeckCommit` | Commit info for new version |

## Components

### Main Components

- **DiffViewer** - Main modal component
- **SideBySideView** - Side-by-side comparison layout
- **UnifiedView** - Unified list layout
- **CardDiffItem** - Individual card change display
- **SpecialSlotDiff** - Special slot change display

### View Modes

#### Side-by-Side View
Shows old and new versions in parallel columns, making it easy to see what was removed from the old version and what was added to the new version.

#### Unified View
Shows all changes in a single list with color coding to indicate the type of change.

## Styling

The component uses inline styles with a color scheme that matches the application:

- **Added**: Green background (#dcfce7) with green border (#86efac)
- **Removed**: Red background (#fee2e2) with red border (#fca5a5)
- **Modified**: Yellow background (#fef3c7) with yellow border (#fcd34d)

## Requirements Satisfied

This component satisfies the following requirements from the design document:

- **3.2**: Display a diff view showing cards added in green
- **3.3**: Display a diff view showing cards removed in red
- **3.4**: Display a diff view showing cards with changed quantities in yellow
- **3.5**: Highlight changes to special slots (commander, legend, battlefield)
- **3.6**: Allow comparison of any version against the current working version

## Integration

The DiffViewer integrates with:

1. **deckDiffService** - Calculates differences between deck versions
2. **HistoryPanel** - Triggered when user selects two commits to compare
3. **versionControl service** - Loads deck versions from Gitea

## Example

See `DiffViewer.example.tsx` for a complete working example.
