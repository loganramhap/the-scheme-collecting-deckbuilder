# Annotation Display Implementation in DiffViewer

## Overview

This document describes the implementation of card annotation display in the DiffViewer component, fulfilling Requirement 11.5 from the deck versioning specification.

## Features Implemented

### 1. Annotation Icons (Task 36.1)

Cards with annotations now display a 📝 icon next to the card name. The icon:
- Only appears when a card has an annotation with a reason
- Is color-coded by annotation category
- Has a circular background with the category color
- Scales slightly on hover for better interactivity

### 2. Tooltip on Hover (Task 36.2)

The annotation icon includes a native HTML `title` attribute that displays the full annotation reason when the user hovers over the icon. This provides quick access to the annotation without cluttering the interface.

### 3. Inline Annotation Display (Task 36.3)

A toggle button has been added to the view controls that allows users to show/hide inline annotations:
- Button label: "📝 Show Annotations" / "📝 Hide Annotations"
- When enabled, annotations appear below the card name and count
- Inline annotations are styled with:
  - Italic text
  - Light background
  - Left border colored by category
  - Proper padding and spacing

### 4. Category-Based Color Coding (Task 36.4)

Annotations are color-coded based on their category:

| Category | Color | Hex Code |
|----------|-------|----------|
| Testing | Blue | #3b82f6 |
| Meta | Purple | #8b5cf6 |
| Performance | Red | #ef4444 |
| Synergy | Green | #10b981 |
| Cost | Amber | #f59e0b |
| Custom/Other | Gray | #6b7280 |

The category is automatically determined from the annotation reason text using keyword matching in the `getAnnotationCategory()` helper function.

## Technical Details

### Type Changes

The DiffViewer now accepts `AnnotatedCommit` instead of `DeckCommit` for both old and new commits, allowing access to the `cardAnnotations` array.

### Component Props

The following props were added to internal components:
- `annotations: CardChangeAnnotation[]` - Array of annotations from the commit
- `showInlineAnnotations: boolean` - Toggle state for inline display
- `annotation?: CardChangeAnnotation` - Individual card's annotation
- `showInlineAnnotation?: boolean` - Whether to show inline for this card

### Helper Functions

1. **`getAnnotationCategory(reason: string): string`**
   - Analyzes the annotation reason text
   - Returns the category based on keyword matching
   - Used for color-coding

2. **`getCategoryColor(category?: string): string`**
   - Maps category names to hex color codes
   - Returns appropriate color for styling

3. **`findAnnotation(cardId: string, cardName: string): CardChangeAnnotation | undefined`**
   - Searches the annotations array for a matching card
   - Matches by either card ID or card name

## Usage

When comparing two deck versions with annotations:

1. The DiffViewer automatically displays annotation icons for cards that have reasons
2. Hover over any 📝 icon to see the full annotation text in a tooltip
3. Click the "📝 Show Annotations" button to display all annotations inline
4. The color of each annotation indicates its category (testing, meta, performance, etc.)

## Integration

The DiffViewer is used in:
- HistoryPanel when comparing two commits
- Any other location where deck version comparison is needed

Annotations are stored in commits via the VersionControlService and parsed when loading commit history.
