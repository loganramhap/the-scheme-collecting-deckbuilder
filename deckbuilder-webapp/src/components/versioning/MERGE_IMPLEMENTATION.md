# Branch Merging Implementation

This document describes the branch merging functionality implemented for the deck versioning system.

## Overview

The branch merging feature allows users to merge changes from a feature branch back into the main branch, with support for conflict detection and resolution.

## Components

### 1. VersionControlService (Enhanced)

**File:** `src/services/versionControl.ts`

Added three new methods:

- **`mergeBranch()`**: Performs a merge between two branches, detecting conflicts automatically
- **`completeMerge()`**: Completes a merge after conflicts have been resolved
- **`previewMerge()`**: Previews what changes would be applied by a merge without committing

### 2. MergePreviewDialog

**File:** `src/components/versioning/MergePreviewDialog.tsx`

A dialog component that shows:
- Branch names being merged (source → target)
- Summary of changes (added, removed, modified cards)
- Detailed list of changes
- Merge commit message input
- Conflict warnings if detected

### 3. BranchSelector (Enhanced)

**File:** `src/components/versioning/BranchSelector.tsx`

Added merge functionality:
- "Merge into main" button for feature branches
- Integration with MergePreviewDialog
- Integration with MergeConflictResolver
- Automatic branch switching after successful merge
- Error handling and user feedback

## User Flow

### No Conflicts

1. User clicks "Merge into main" from branch selector
2. System previews the merge and calculates diff
3. MergePreviewDialog shows changes
4. User enters merge commit message
5. User confirms merge
6. System performs merge and switches to target branch

### With Conflicts

1. User clicks "Merge into main" from branch selector
2. System detects conflicts during preview
3. MergeConflictResolver opens showing conflicts
4. User resolves each conflict (keep source/target/both)
5. User enters merge commit message
6. User confirms merge
7. System completes merge with resolved deck and switches to target branch

## API Methods

### versionControlService.mergeBranch()

```typescript
async mergeBranch(
  owner: string,
  repo: string,
  sourceBranch: string,
  targetBranch: string,
  message: string,
  deckPath?: string
): Promise<{
  commit: DeckCommit;
  conflicts: DeckDiff | null;
  mergedDeck: Deck;
}>
```

### versionControlService.previewMerge()

```typescript
async previewMerge(
  owner: string,
  repo: string,
  sourceBranch: string,
  targetBranch: string,
  deckPath?: string
): Promise<{
  diff: DeckDiff;
  conflicts: DeckDiff | null;
  sourceDeck: Deck;
  targetDeck: Deck;
}>
```

### versionControlService.completeMerge()

```typescript
async completeMerge(
  owner: string,
  repo: string,
  targetBranch: string,
  resolvedDeck: Deck,
  message: string,
  deckPath?: string
): Promise<DeckCommit>
```

## Requirements Satisfied

- **7.1**: Provide "Merge Branch" option for non-main branches ✓
- **7.2**: Show preview of changes before merge ✓
- **7.3**: Detect and highlight conflicts ✓
- **7.4**: Allow manual conflict resolution ✓
- **7.5**: Create merge commit with user message ✓

## Integration

To use the merge functionality in a deck editor:

```typescript
<BranchSelector
  owner={owner}
  repo={repo}
  currentBranch={currentBranch}
  onSwitch={handleBranchSwitch}
  onMergeComplete={async (targetBranch) => {
    // Handle post-merge actions
    await loadDeckFromBranch(targetBranch);
  }}
  hasUnsavedChanges={isDirty}
/>
```

## Notes

- Merges always target the "main" branch (can be extended to support custom targets)
- Conflicts are detected using a three-way merge algorithm
- The system uses retry logic with exponential backoff for network resilience
- All merge operations are atomic - they either complete fully or fail without partial changes
