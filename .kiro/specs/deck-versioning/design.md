# Design Document: Deck Versioning and History

## Overview

This design document outlines the technical implementation for deck versioning and history features. The system leverages Gitea's Git-based version control to provide players with commit history, branching, merging, and diff viewing capabilities for their decks.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Deck Editor UI                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Save Button  │  │ History Btn  │  │ Branch Menu  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Version Control Service Layer                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  commitDeck()  │  getHistory()  │  createBranch()   │  │
│  │  compareDeck() │  mergeBranch() │  switchBranch()   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gitea API Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /repos/{owner}/{repo}/contents/{path}          │  │
│  │  GET  /repos/{owner}/{repo}/commits                  │  │
│  │  GET  /repos/{owner}/{repo}/git/trees/{sha}          │  │
│  │  POST /repos/{owner}/{repo}/branches                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gitea Repository                         │
│                    (Git Backend)                            │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

```
src/
├── components/
│   └── versioning/
│       ├── CommitMessageModal.tsx      # Prompt for commit messages
│       ├── HistoryPanel.tsx            # Display commit history
│       ├── DiffViewer.tsx              # Show deck differences
│       ├── BranchSelector.tsx          # Branch dropdown menu
│       ├── VersionTimeline.tsx         # Visual timeline
│       ├── MergeConflictResolver.tsx   # Handle merge conflicts
│       └── CommitTemplates.tsx         # Message templates
├── services/
│   ├── versionControl.ts               # Version control operations
│   └── deckDiff.ts                     # Deck comparison logic
├── hooks/
│   ├── useCommitHistory.ts             # Fetch and manage history
│   ├── useBranches.ts                  # Branch management
│   └── useDeckDiff.ts                  # Diff calculation
└── types/
    └── versioning.ts                   # Type definitions
```

## Data Models

### Commit

```typescript
interface DeckCommit {
  sha: string;                    // Git commit SHA
  message: string;                // Commit message
  author: {
    name: string;
    email: string;
    date: string;                 // ISO 8601 timestamp
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  parents: string[];              // Parent commit SHAs
  isAutoSave: boolean;            // Auto-save vs manual save
  changesSummary?: {              // Parsed from commit message
    cardsAdded: number;
    cardsRemoved: number;
    cardsModified: number;
  };
}
```

### Branch

```typescript
interface DeckBranch {
  name: string;                   // Branch name
  commit: {
    sha: string;
    message: string;
    date: string;
  };
  protected: boolean;             // Is this the main branch?
}
```

### Deck Diff

```typescript
interface DeckDiff {
  added: DeckCard[];              // Cards added
  removed: DeckCard[];            // Cards removed
  modified: Array<{               // Cards with quantity changes
    card: DeckCard;
    oldCount: number;
    newCount: number;
  }>;
  specialSlots: {                 // Changes to commander/legend/etc
    commander?: {
      old: DeckCard | null;
      new: DeckCard | null;
    };
    legend?: {
      old: DeckCard | null;
      new: DeckCard | null;
    };
    battlefield?: {
      old: DeckCard | null;
      new: DeckCard | null;
    };
  };
}
```

### Commit Message Template

```typescript
interface CommitTemplate {
  id: string;
  label: string;
  template: string;               // Template with placeholders
  category: 'testing' | 'optimization' | 'meta' | 'custom';
}
```

### Card Change Annotation

```typescript
interface CardChangeAnnotation {
  cardId: string;                 // ID of the changed card
  cardName: string;               // Name for display
  changeType: 'added' | 'removed' | 'modified';
  reason?: string;                // User's reason for the change (max 200 chars)
  oldCount?: number;              // Previous quantity (for modified)
  newCount?: number;              // New quantity (for modified)
}

interface AnnotatedCommit extends DeckCommit {
  cardAnnotations?: CardChangeAnnotation[];
}
```

### Annotation Template

```typescript
interface AnnotationTemplate {
  id: string;
  label: string;
  reason: string;
  category: 'testing' | 'meta' | 'performance' | 'synergy' | 'cost';
}
```

## Components and Interfaces

### 1. CommitMessageModal

**Purpose:** Prompt user for commit message and per-card annotations when saving

**Props:**
```typescript
interface CommitMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string, annotations: CardChangeAnnotation[]) => Promise<void>;
  suggestedMessage?: string;      // Auto-generated suggestion
  templates: CommitTemplate[];
  recentMessages: string[];       // Last 5 custom messages
  deckDiff: DeckDiff;            // Changes to annotate
}
```

**Features:**
- Text area for commit message (1-500 chars)
- Template selector dropdown
- Recent messages quick-select
- Character counter
- **Card changes list with annotation inputs**
- **Annotation templates dropdown per card**
- **Bulk annotation for multiple cards**
- Preview of detected changes
- Commit/Cancel buttons

### 2. HistoryPanel

**Purpose:** Display chronological list of commits

**Props:**
```typescript
interface HistoryPanelProps {
  owner: string;
  repo: string;
  branch: string;
  onCompare: (sha1: string, sha2: string) => void;
  onRestore: (sha: string) => void;
}
```

**Features:**
- Infinite scroll for commit list
- Each commit shows: avatar, message, timestamp, SHA (short)
- Auto-save commits have distinct styling
- Click to view details
- Select two commits to compare
- "Restore" button for each commit

### 3. DiffViewer

**Purpose:** Visual comparison of two deck versions

**Props:**
```typescript
interface DiffViewerProps {
  oldDeck: Deck;
  newDeck: Deck;
  oldCommit: AnnotatedCommit;
  newCommit: AnnotatedCommit;
}
```

**Features:**
- Side-by-side or unified view toggle
- Green highlighting for additions
- Red highlighting for removals
- Yellow highlighting for modifications
- **Card annotations displayed as tooltips or inline text**
- **Annotation indicators (icon) for cards with reasons**
- Card images for visual reference
- Summary statistics at top

### 4. BranchSelector

**Purpose:** Dropdown to switch between branches

**Props:**
```typescript
interface BranchSelectorProps {
  currentBranch: string;
  branches: DeckBranch[];
  onSwitch: (branchName: string) => Promise<void>;
  onCreateBranch: () => void;
  hasUnsavedChanges: boolean;
}
```

**Features:**
- Dropdown showing all branches
- Current branch highlighted
- "Create new branch" option
- Warning dialog if unsaved changes
- Branch icons (main vs feature branches)

### 5. VersionTimeline

**Purpose:** Visual timeline of deck evolution

**Props:**
```typescript
interface VersionTimelineProps {
  commits: DeckCommit[];
  branches: DeckBranch[];
  currentCommit: string;
  onSelectCommit: (sha: string) => void;
}
```

**Features:**
- SVG-based timeline visualization
- Nodes for each commit
- Lines connecting commits
- Branch divergence visualization
- Merge commits with special icon
- Hover for commit details
- Click to navigate to version

### 6. MergeConflictResolver

**Purpose:** Resolve conflicts when merging branches

**Props:**
```typescript
interface MergeConflictResolverProps {
  conflicts: DeckDiff;
  sourceBranch: string;
  targetBranch: string;
  onResolve: (resolution: Deck) => Promise<void>;
  onCancel: () => void;
}
```

**Features:**
- List of conflicting cards
- "Keep source" / "Keep target" / "Keep both" options
- Preview of final deck
- Validation warnings
- Merge commit message input

### 7. CardChangeAnnotator

**Purpose:** Allow users to annotate individual card changes

**Props:**
```typescript
interface CardChangeAnnotatorProps {
  changes: CardChangeAnnotation[];
  onAnnotationsChange: (annotations: CardChangeAnnotation[]) => void;
  annotationTemplates: AnnotationTemplate[];
}
```

**Features:**
- List of added/removed/modified cards
- Text input for each card's reason (200 char limit)
- Template dropdown for quick reasons
- Bulk annotation controls
- Character counter per annotation
- Card images for visual reference

## Services

### versionControl.ts

```typescript
class VersionControlService {
  /**
   * Commit current deck state with message and optional card annotations
   */
  async commitDeck(
    owner: string,
    repo: string,
    branch: string,
    deck: Deck,
    message: string,
    isAutoSave: boolean = false,
    cardAnnotations?: CardChangeAnnotation[]
  ): Promise<AnnotatedCommit>;

  /**
   * Get commit history for a branch
   */
  async getCommitHistory(
    owner: string,
    repo: string,
    branch: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<DeckCommit[]>;

  /**
   * Get deck state at specific commit
   */
  async getDeckAtCommit(
    owner: string,
    repo: string,
    sha: string
  ): Promise<Deck>;

  /**
   * Create a new branch
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromSha?: string
  ): Promise<DeckBranch>;

  /**
   * List all branches
   */
  async listBranches(
    owner: string,
    repo: string
  ): Promise<DeckBranch[]>;

  /**
   * Switch to a different branch
   */
  async switchBranch(
    owner: string,
    repo: string,
    branchName: string
  ): Promise<Deck>;

  /**
   * Merge source branch into target branch
   */
  async mergeBranch(
    owner: string,
    repo: string,
    sourceBranch: string,
    targetBranch: string,
    message: string
  ): Promise<DeckCommit>;

  /**
   * Generate auto-save commit message
   */
  generateAutoSaveMessage(diff: DeckDiff): string;
}
```

### deckDiff.ts

```typescript
class DeckDiffService {
  /**
   * Calculate differences between two decks
   */
  calculateDiff(oldDeck: Deck, newDeck: Deck): DeckDiff;

  /**
   * Detect merge conflicts between two deck versions
   */
  detectConflicts(
    baseDeck: Deck,
    sourceDeck: Deck,
    targetDeck: Deck
  ): DeckDiff;

  /**
   * Apply a diff to a deck
   */
  applyDiff(deck: Deck, diff: DeckDiff): Deck;

  /**
   * Generate human-readable summary of changes
   */
  summarizeChanges(diff: DeckDiff): string;
}
```

## UI/UX Flow

### Saving with Commit Message

1. User makes changes to deck
2. User clicks "Save" button
3. System detects changes and calculates diff
4. CommitMessageModal opens with:
   - Suggested message based on changes
   - Template options
   - Recent messages
5. User enters/selects message
6. User clicks "Commit"
7. System saves to Gitea with commit message
8. Success notification shown

### Viewing History

1. User clicks "History" button in deck editor
2. HistoryPanel slides in from right side
3. System loads commit history from Gitea
4. Commits displayed in reverse chronological order
5. User can:
   - Scroll through history
   - Click commit to view details
   - Select two commits to compare
   - Click "Restore" to revert to version

### Comparing Versions

1. User selects two commits in HistoryPanel
2. User clicks "Compare" button
3. DiffViewer modal opens
4. System loads both deck versions
5. System calculates diff
6. Changes displayed with color coding:
   - Green: Added cards
   - Red: Removed cards
   - Yellow: Modified quantities
7. User can toggle between side-by-side and unified view

### Creating a Branch

1. User clicks branch selector dropdown
2. User clicks "Create new branch"
3. Modal prompts for branch name
4. System validates name (no spaces, special chars)
5. System creates branch in Gitea
6. System switches to new branch
7. User can now make changes independently

### Merging Branches

1. User switches to feature branch
2. User clicks "Merge into main" button
3. System checks for conflicts
4. If conflicts exist:
   - MergeConflictResolver opens
   - User resolves each conflict
   - User provides merge commit message
5. If no conflicts:
   - User provides merge commit message
   - System performs merge
6. Success notification shown
7. User switched back to main branch

## Error Handling

### Commit Failures
- **Network error**: Retry with exponential backoff
- **Conflict**: Fetch latest, show diff, allow user to resolve
- **Invalid message**: Show validation error inline

### Branch Operations
- **Branch exists**: Show error, suggest alternative name
- **Unsaved changes**: Warn user, offer to save first
- **Merge conflict**: Open conflict resolver

### History Loading
- **Network error**: Show retry button
- **Empty history**: Show "No commits yet" message
- **Pagination error**: Load previous page, show error toast

## Testing Strategy

### Unit Tests
- `deckDiff.ts`: Test diff calculation with various deck changes
- `versionControl.ts`: Mock Gitea API, test all operations
- Commit message generation logic
- Branch name validation

### Integration Tests
- Full save flow with commit message
- History loading and pagination
- Branch creation and switching
- Merge with and without conflicts

### E2E Tests
- User saves deck with custom message
- User views history and restores old version
- User creates branch, makes changes, merges back
- User compares two versions and sees correct diff

## Performance Considerations

### Caching
- Cache commit history (invalidate on new commits)
- Cache branch list (invalidate on branch operations)
- Cache deck versions (LRU cache, max 10 versions)

### Lazy Loading
- Load commit history in pages (20 per page)
- Load deck content only when viewing/comparing
- Defer timeline rendering until panel opened

### Optimization
- Debounce auto-save (30 seconds)
- Batch multiple rapid changes into single commit
- Use Web Workers for diff calculation on large decks
- Compress deck JSON before sending to Gitea

## Security Considerations

- Validate all user input (commit messages, branch names)
- Sanitize commit messages to prevent XSS
- Verify user has write access before allowing commits
- Rate limit commit operations (max 1 per second)
- Validate deck JSON structure before committing

## Migration Strategy

### Existing Decks
- Existing decks have commit history from previous saves
- No migration needed - history already exists in Gitea
- Add UI to access existing history

### New Features
- Roll out commit message prompts gradually
- Start with optional messages, make required later
- Provide default messages for users who skip

## Future Enhancements

- **Tags**: Mark important versions (e.g., "Tournament Ready")
- **Annotations**: Add notes to specific commits
- **Deck Comparison**: Compare with other users' decks
- **Rebase**: Rewrite commit history
- **Cherry-pick**: Apply specific commits to other branches
- **Stash**: Temporarily save work in progress
