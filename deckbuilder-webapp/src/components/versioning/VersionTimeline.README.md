# VersionTimeline Component

Visual timeline component that displays commit history as an SVG-based graph with nodes and connecting lines.

## Features

- ✅ SVG-based timeline visualization
- ✅ Nodes for each commit with branch-specific colors
- ✅ Lines connecting commits in chronological order
- ✅ Branch divergence visualization with horizontal spacing
- ✅ Special diamond icon for merge commits (multiple parents)
- ✅ Hover tooltips showing detailed commit information
- ✅ Click handler to navigate to specific versions
- ✅ Current commit highlighting with ring indicator
- ✅ Auto-save badge display in tooltips
- ✅ Change statistics (added/removed/modified cards)

## Requirements Implemented

Based on Requirements 10.1, 10.2, 10.3, 10.4, 10.5:

- **10.1**: Display visual timeline with commits as nodes
- **10.2**: Show branches as diverging lines in the timeline
- **10.3**: Allow clicking on timeline nodes to view that version
- **10.4**: Highlight merge commits with a special icon
- **10.5**: Display timeline in reverse chronological order (newest first)

## Usage

```tsx
import { VersionTimeline } from './components/versioning';
import type { DeckCommit, DeckBranch } from './types/versioning';

function MyComponent() {
  const commits: DeckCommit[] = [...]; // Your commit data
  const branches: DeckBranch[] = [...]; // Your branch data
  
  const handleSelectCommit = (sha: string) => {
    console.log('Selected commit:', sha);
    // Navigate to version or show details
  };

  return (
    <VersionTimeline
      commits={commits}
      branches={branches}
      currentCommit="abc123def456"
      onSelectCommit={handleSelectCommit}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `commits` | `DeckCommit[]` | Yes | Array of commits to display in timeline |
| `branches` | `DeckBranch[]` | No | Array of branches for divergence visualization |
| `currentCommit` | `string` | No | SHA of current commit to highlight |
| `onSelectCommit` | `(sha: string) => void` | No | Callback when a commit node is clicked |

## Visual Layout

The timeline uses the following layout constants:

- **NODE_RADIUS**: 8px - Size of commit nodes
- **NODE_SPACING_Y**: 80px - Vertical spacing between commits
- **BRANCH_SPACING_X**: 60px - Horizontal spacing for branch divergence
- **PADDING**: 40px - Padding around the SVG canvas

## Branch Colors

- **Main branch**: Blue (#3b82f6)
- **Feature branches**: Generated HSL colors based on branch name hash

## Tooltip Information

When hovering over a commit node, the tooltip displays:

1. Short SHA (first 7 characters)
2. Auto-save badge (if applicable)
3. Commit message
4. Author name and timestamp
5. Change statistics (cards added/removed/modified)

## Merge Commit Detection

Commits with multiple parents are automatically detected and displayed with a diamond icon overlay on the node.

## Current Commit Highlighting

The current commit (specified by `currentCommit` prop) is highlighted with:
- Filled circle (instead of hollow)
- Outer ring with branch color
- Increased visual prominence

## Empty State

When no commits are provided, displays a centered message: "No commits to display"

## Styling

The component includes inline styles for:
- SVG rendering and node interactions
- Tooltip positioning and appearance
- Scrollbar customization
- Hover effects and animations

## Accessibility

- Clickable nodes have `cursor: pointer` styling
- Tooltips are positioned to avoid overlapping with nodes
- Color contrast meets WCAG guidelines
- Semantic SVG structure with proper grouping

## Performance Considerations

- Layout calculation is memoized using `useMemo`
- Only recalculates when commits or branches change
- Efficient SVG rendering with minimal DOM updates
- Tooltip rendering is conditional (only when hovering)

## Example

See `VersionTimeline.example.tsx` for a complete working example with mock data.
