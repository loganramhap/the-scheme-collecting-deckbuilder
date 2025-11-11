# CardChangeAnnotator Component

## Overview

The `CardChangeAnnotator` component allows users to add optional reasons for individual card changes when committing deck modifications. This component is designed to be integrated into the `CommitMessageModal` to provide detailed, per-card annotations.

## Features

### ✅ Implemented (Task 32)

1. **Display list of changed cards** (32.1)
   - Shows added, removed, and modified cards grouped by change type
   - Color-coded sections (green for added, red for removed, yellow for modified)
   - Displays card count for each change type

2. **Text input for each card's reason** (32.2)
   - Individual textarea for each card
   - 200 character limit per annotation
   - Optional - users can leave annotations empty

3. **Template dropdown with quick reasons** (32.3)
   - Pre-defined templates organized by category:
     - Testing (e.g., "Testing this card", "Testing as replacement")
     - Meta (e.g., "Adapting to meta shift", "Counter to popular deck")
     - Performance (e.g., "Card underperformed in testing")
     - Synergy (e.g., "Part of combo strategy", "Better fits deck theme")
     - Cost (e.g., "Mana curve adjustment", "Budget optimization")
   - Expandable template section per card (click + button)

4. **Bulk annotation for multiple cards** (32.4)
   - Select multiple cards via checkboxes
   - Apply the same reason to all selected cards at once
   - Bulk template selection
   - Clear selection button

5. **Character counter per annotation** (32.5)
   - Real-time character count display
   - Shows "X / 200 characters" for each card
   - Enforces 200 character limit

6. **Display card images for visual reference** (32.6)
   - 40x56px thumbnail for each card
   - Lazy loading for performance
   - Fallback for cards without images

## Usage

### Basic Integration

```tsx
import { CardChangeAnnotator } from './components/versioning/CardChangeAnnotator';
import type { CardChangeAnnotation, DeckDiff } from './types/versioning';

function MyComponent() {
  const [annotations, setAnnotations] = useState<CardChangeAnnotation[]>([]);
  const diff: DeckDiff = {
    added: [...],
    removed: [...],
    modified: [...]
  };

  return (
    <CardChangeAnnotator
      diff={diff}
      annotations={annotations}
      onAnnotationsChange={setAnnotations}
    />
  );
}
```

### Integration with CommitMessageModal

To integrate the `CardChangeAnnotator` into the `CommitMessageModal`, follow these steps:

1. **Update CommitMessageModal Props**:

```tsx
interface CommitMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string, annotations: CardChangeAnnotation[]) => Promise<void>;
  suggestedMessage?: string;
  diff?: DeckDiff;
  recentMessages?: string[];
}
```

2. **Add State for Annotations**:

```tsx
const [annotations, setAnnotations] = useState<CardChangeAnnotation[]>([]);
```

3. **Add CardChangeAnnotator to Modal**:

```tsx
{/* After the message input, before action buttons */}
{diff && (
  <CardChangeAnnotator
    diff={diff}
    annotations={annotations}
    onAnnotationsChange={setAnnotations}
  />
)}
```

4. **Update Commit Handler**:

```tsx
const handleCommit = async () => {
  // ... validation ...
  
  await onCommit(message.trim(), annotations);
};
```

## Props

### CardChangeAnnotatorProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `diff` | `DeckDiff` | Yes | The deck differences containing added, removed, and modified cards |
| `annotations` | `CardChangeAnnotation[]` | Yes | Current annotations state |
| `onAnnotationsChange` | `(annotations: CardChangeAnnotation[]) => void` | Yes | Callback when annotations change |

## Data Structures

### CardChangeAnnotation

```typescript
interface CardChangeAnnotation {
  cardId: string;           // ID of the changed card
  cardName: string;         // Name for display
  changeType: 'added' | 'removed' | 'modified';
  reason?: string;          // User's reason (max 200 chars)
  oldCount?: number;        // Previous quantity (for modified)
  newCount?: number;        // New quantity (for modified)
}
```

### AnnotationTemplate

```typescript
interface AnnotationTemplate {
  id: string;
  label: string;
  reason: string;
  category: 'testing' | 'meta' | 'performance' | 'synergy' | 'cost';
}
```

## Annotation Templates

Default templates are defined in `src/constants/annotationTemplates.ts`:

- **Testing**: Testing this card, Testing as replacement
- **Meta**: Adapting to meta shift, Counter to popular deck
- **Performance**: Card underperformed in testing, Card performed well in testing, Improving win rate
- **Synergy**: Part of combo strategy, Better fits deck theme, Tribal synergy
- **Cost**: Mana curve adjustment, Budget optimization, More cost-efficient option

## User Workflow

### Individual Card Annotation

1. User sees list of changed cards grouped by type
2. User clicks the "+" button on a card to expand templates
3. User either:
   - Selects a template (auto-fills the reason)
   - Types a custom reason directly
4. Character counter updates in real-time
5. Reason is limited to 200 characters

### Bulk Annotation

1. User clicks "Show Bulk Annotate" button
2. Bulk annotation panel appears
3. User selects multiple cards via checkboxes
4. User either:
   - Clicks a template to fill the bulk reason field
   - Types a custom reason
5. User clicks "Apply to X cards" button
6. Selected cards are updated with the same reason
7. Selection is cleared

## Styling

The component uses inline styles for:
- Consistent appearance across the application
- Easy customization
- No external CSS dependencies

Key style features:
- Color-coded change types (green/red/yellow)
- Hover effects on interactive elements
- Focus states for accessibility
- Responsive layout
- Card thumbnails with proper aspect ratio

## Accessibility

- Semantic HTML structure
- Proper label associations
- Keyboard navigation support
- Focus indicators
- Alt text for card images

## Performance Considerations

- Lazy loading for card images
- Efficient state updates (only changed annotations)
- Memoization opportunities for large card lists
- Character limit enforcement at input level

## Future Enhancements (Not in Task 32)

These features are planned for later tasks:

- **Task 33**: Create annotation templates with localStorage support
- **Task 34**: Full integration with CommitMessageModal
- **Task 35**: Update version control service to store annotations
- **Task 36**: Display annotations in DiffViewer
- **Task 37**: Display annotations in HistoryPanel

## Requirements Mapping

This component satisfies the following requirements:

- **11.1**: Display list of added and removed cards when saving
- **11.2**: Provide optional text input for each changed card
- **11.3**: Allow annotations up to 200 characters per card
- **11.7**: Provide quick reason templates
- **11.8**: Allow bulk annotation for multiple cards

## Testing

To test the component:

1. Create a deck diff with added, removed, and modified cards
2. Render the component with the diff
3. Verify all cards are displayed correctly
4. Test individual annotation input
5. Test template selection
6. Test bulk annotation workflow
7. Verify character limits are enforced
8. Check that card images load correctly

## Example Test Data

```typescript
const testDiff: DeckDiff = {
  added: [
    { id: 'card1', name: 'Lightning Bolt', count: 4, image_url: '...' },
    { id: 'card2', name: 'Counterspell', count: 2, image_url: '...' },
  ],
  removed: [
    { id: 'card3', name: 'Shock', count: 4, image_url: '...' },
  ],
  modified: [
    {
      card: { id: 'card4', name: 'Island', count: 20, image_url: '...' },
      oldCount: 18,
      newCount: 20,
    },
  ],
  specialSlots: {},
};
```

## Notes

- Annotations are optional - users can commit without adding reasons
- The component automatically initializes annotations from the diff
- Empty reasons are stored but not displayed in the UI
- The component is designed to work with any card game format (MTG, Riftbound, etc.)
