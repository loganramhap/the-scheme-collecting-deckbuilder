# Versioning Components

This directory contains components for deck versioning and commit management features.

## Components

### CommitMessageModal

A modal dialog for entering commit messages when saving deck changes.

**Features:**
- Text area for commit message input (1-500 characters)
- Character counter with validation
- Template selector with categorized quick templates
- Recent messages quick-select buttons
- Preview of detected changes
- Placeholder detection and validation
- Keyboard shortcuts (Ctrl+Enter to commit, Escape to close)

**Props:**
```typescript
interface CommitMessageModalProps {
  isOpen: boolean;              // Controls modal visibility
  onClose: () => void;          // Called when modal is closed
  onCommit: (message: string) => Promise<void>; // Called when user commits
  suggestedMessage?: string;    // Auto-generated suggestion
  diff?: DeckDiff;             // Deck changes to preview
  recentMessages?: string[];    // Last 5 custom messages
}
```

**Usage:**
```tsx
import { CommitMessageModal } from './components/versioning';

<CommitMessageModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onCommit={async (message) => {
    await saveDeck(message);
  }}
  suggestedMessage="Added 2 cards, removed 1 card"
  diff={calculatedDiff}
  recentMessages={recentMessages}
/>
```

**Requirements Satisfied:**
- 1.1: Prompts user for commit message when saving
- 1.2: Validates message length (1-500 chars)
- 1.3: Provides suggested templates
- 9.4: Shows preview of detected changes

### CommitTemplates

Displays categorized commit message templates as selectable buttons.

**Props:**
```typescript
interface CommitTemplatesProps {
  onSelectTemplate: (template: CommitTemplate) => void;
  selectedTemplateId?: string;
}
```

**Categories:**
- Testing: "Testing new card", "Testing card swap", etc.
- Optimization: "Mana curve adjustment", "Removed underperforming cards", etc.
- Meta: "Meta adaptation", "Adding counter to meta deck", etc.
- General: "Initial deck creation", "Major revision", etc.

### RecentMessages

Displays recent commit messages as quick-select buttons.

**Props:**
```typescript
interface RecentMessagesProps {
  messages: string[];
  onSelectMessage: (message: string) => void;
}
```

**Storage:**
Recent messages are stored in localStorage under the key `deckbuilder:recentCommitMessages`.
Maximum of 5 recent messages are kept.

## Services

### deckDiffService

Service for calculating differences between deck versions.

**Methods:**
- `calculateDiff(oldDeck, newDeck)`: Calculate changes between two decks
- `summarizeChanges(diff)`: Generate human-readable summary
- `detectConflicts(baseDeck, sourceDeck, targetDeck)`: Detect merge conflicts
- `applyDiff(deck, diff)`: Apply changes to a deck

## Utilities

### commitMessageUtils

Utility functions for commit message handling.

**Functions:**
- `validateCommitMessage(message)`: Validate message length
- `extractPlaceholders(template)`: Extract placeholder names
- `replacePlaceholders(template, values)`: Replace placeholders with values
- `hasUnfilledPlaceholders(message)`: Check for unfilled placeholders
- `getPlaceholderPrompt(name)`: Get user-friendly prompt for placeholder
- `formatTemplatePreview(template)`: Format template for display

## Constants

### commitTemplates

Default commit message templates organized by category.

**Constants:**
- `DEFAULT_COMMIT_TEMPLATES`: Array of predefined templates
- `MAX_RECENT_MESSAGES`: Maximum recent messages to store (5)
- `RECENT_MESSAGES_STORAGE_KEY`: LocalStorage key
- `COMMIT_MESSAGE_MIN_LENGTH`: Minimum message length (1)
- `COMMIT_MESSAGE_MAX_LENGTH`: Maximum message length (500)

## Integration Guide

### 1. Manual Save Flow

```tsx
const handleSave = () => {
  // Calculate diff
  const diff = deckDiffService.calculateDiff(previousDeck, currentDeck);
  
  // Open modal
  setIsModalOpen(true);
  setDiff(diff);
};

const handleCommit = async (message: string) => {
  await giteaService.saveDeck(owner, repo, deckName, currentDeck, message);
  
  // Save to recent messages
  const recent = [message, ...recentMessages.slice(0, 4)];
  localStorage.setItem('deckbuilder:recentCommitMessages', JSON.stringify(recent));
  
  setIsModalOpen(false);
};
```

### 2. Auto-Save Flow

```tsx
const handleAutoSave = async () => {
  const diff = deckDiffService.calculateDiff(previousDeck, currentDeck);
  const message = `Auto-save: ${deckDiffService.summarizeChanges(diff)}`;
  
  await giteaService.saveDeck(owner, repo, deckName, currentDeck, message, true);
};
```

### 3. Keyboard Shortcuts

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## See Also

- [CommitMessageModal.example.tsx](./CommitMessageModal.example.tsx) - Usage examples
- [Design Document](../../../.kiro/specs/deck-versioning/design.md)
- [Requirements Document](../../../.kiro/specs/deck-versioning/requirements.md)


### HistoryPanel

A sliding panel component that displays commit history from the right side of the screen.

**Features:**
- Sliding panel UI that appears from right side with smooth animation
- Displays commit list with avatar, message, timestamp, and SHA
- Auto-save commits styled differently with yellow background and badge
- Infinite scroll for pagination (loads 20 commits at a time)
- Select up to 2 commits for comparison
- "Compare" button appears when two commits are selected
- "Restore" button for each commit
- Loading states with spinner
- Error handling with retry button
- Backdrop overlay that closes panel on click

**Props:**
```typescript
interface HistoryPanelProps {
  isOpen: boolean;              // Controls panel visibility
  onClose: () => void;          // Called when panel is closed
  owner: string;                // Repository owner
  repo: string;                 // Repository name
  branch?: string;              // Branch name (defaults to 'main')
  onCompare?: (sha1: string, sha2: string) => void; // Called when comparing commits
  onRestore?: (sha: string) => void; // Called when restoring a commit
}
```

**Usage:**
```tsx
import { HistoryPanel } from './components/versioning';

const [isHistoryOpen, setIsHistoryOpen] = useState(false);

<HistoryPanel
  isOpen={isHistoryOpen}
  onClose={() => setIsHistoryOpen(false)}
  owner="username"
  repo="my-deck"
  branch="main"
  onCompare={(sha1, sha2) => {
    // Open DiffViewer modal
    setCompareCommits([sha1, sha2]);
    setIsDiffViewerOpen(true);
  }}
  onRestore={(sha) => {
    // Show confirmation dialog
    if (confirm('Restore this version?')) {
      restoreDeckVersion(sha);
    }
  }}
/>
```

**Features Detail:**

1. **Commit Display:**
   - Avatar generated from author email (colored circle with initial)
   - Commit message (truncated if too long)
   - Author name, relative timestamp, and short SHA
   - Change statistics (cards added/removed/modified) with color coding

2. **Auto-save Styling:**
   - Yellow background (#fefce8)
   - "Auto-save" badge in amber color
   - Distinct hover state

3. **Selection:**
   - Click commit to select/deselect
   - Selected commits have blue border and background
   - Maximum 2 commits can be selected
   - Selecting a third commit replaces the oldest selection

4. **Infinite Scroll:**
   - Uses Intersection Observer API
   - Loads more commits when scrolling near bottom
   - Shows loading spinner while fetching
   - Stops loading when no more commits available

5. **Responsive:**
   - Panel width: 450px (max 90vw on mobile)
   - Smooth slide-in animation
   - Custom scrollbar styling

**Requirements Satisfied:**
- 2.1: Provides History button integration point
- 2.2: Displays chronological list of commits
- 2.3: Shows timestamp, message, author, SHA for each commit
- 2.4: Allows scrolling through entire history
- 8.5: Distinguishes auto-save from manual commits

**See Also:**
- [HistoryPanel.example.tsx](./HistoryPanel.example.tsx) - Usage examples
- [useCommitHistory hook](../../hooks/useCommitHistory.ts) - Data fetching hook

### BranchSelector

A dropdown component for switching between Git branches in the deck editor.

**Features:**
- Dropdown menu UI with smooth animations
- Displays current branch with highlighting and "Current" badge
- Lists all available branches from Gitea
- Branch icons: 🏠 for main/master branches, 🌿 for feature branches
- "Create new branch" option at bottom of dropdown
- Confirmation dialog when switching with unsaved changes
- Loading states with spinner
- Error handling with retry button
- Click outside or press Escape to close dropdown

**Props:**
```typescript
interface BranchSelectorProps {
  owner: string;                // Repository owner
  repo: string;                 // Repository name
  currentBranch: string;        // Currently active branch
  onSwitch: (branchName: string) => Promise<void>; // Called when switching branches
  onCreateBranch: () => void;   // Called when "Create new branch" is clicked
  hasUnsavedChanges: boolean;   // Whether there are unsaved changes
}
```

**Usage:**
```tsx
import { BranchSelector } from './components/versioning';

const [currentBranch, setCurrentBranch] = useState('main');
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

<BranchSelector
  owner="username"
  repo="my-deck"
  currentBranch={currentBranch}
  onSwitch={async (branchName) => {
    // Load deck from new branch
    const newDeck = await versionControlService.switchBranch(
      owner,
      repo,
      branchName
    );
    setDeck(newDeck);
    setCurrentBranch(branchName);
    setHasUnsavedChanges(false);
  }}
  onCreateBranch={() => {
    // Open create branch modal
    setIsCreateBranchModalOpen(true);
  }}
  hasUnsavedChanges={hasUnsavedChanges}
/>
```

**Features Detail:**

1. **Branch Display:**
   - Current branch shown in button with icon and name
   - Dropdown arrow indicates open/closed state
   - Current branch highlighted in list with blue background
   - Main/master branches have bold font weight

2. **Branch Icons:**
   - 🏠 (house) for main/master branches
   - 🌿 (herb) for feature branches
   - Icons help quickly identify branch type

3. **Unsaved Changes Warning:**
   - Modal dialog appears when switching with unsaved changes
   - Clear warning message about discarding changes
   - "Cancel" and "Switch Branch" buttons
   - Prevents accidental data loss

4. **Loading States:**
   - Spinner shown while fetching branches
   - Button disabled during branch switch operation
   - "Switching..." text during operation

5. **Error Handling:**
   - Error toast appears below dropdown on switch failure
   - Retry button for failed branch list fetch
   - Errors don't close the dropdown

6. **Accessibility:**
   - Proper ARIA attributes (aria-haspopup, aria-expanded)
   - Keyboard navigation (Escape to close)
   - Focus management

**Requirements Satisfied:**
- 6.1: Displays current branch name in editor
- 6.2: Provides branch selector dropdown
- 6.3: Warns about unsaved changes when switching

**Integration with useBranches Hook:**
The component uses the `useBranches` hook to fetch and cache branch data:
- Automatic caching with 5-minute TTL
- Cache invalidation on branch operations
- Refresh method to force reload

**See Also:**
- [BranchSelector.example.tsx](./BranchSelector.example.tsx) - Usage examples
- [useBranches hook](../../hooks/useBranches.ts) - Branch data fetching hook
- [versionControl service](../../services/versionControl.ts) - Branch switching logic

### BranchCreationModal

A modal dialog for creating new Git branches with validation.

**Features:**
- Modal UI with backdrop overlay
- Branch name input with real-time validation
- Validates Git naming conventions (no spaces, special characters)
- Checks for duplicate branch names (case-insensitive)
- Character limit validation (max 100 characters)
- Input hints showing naming rules
- Error messages for validation failures
- Loading state during branch creation
- Keyboard shortcuts (Escape to close)
- Auto-focus on input field

**Props:**
```typescript
interface BranchCreationModalProps {
  isOpen: boolean;              // Controls modal visibility
  onClose: () => void;          // Called when modal is closed
  onCreateBranch: (branchName: string) => Promise<void>; // Called when creating branch
  existingBranches: string[];   // List of existing branch names
  currentBranch: string;        // Current branch (used as source)
}
```

**Usage:**
```tsx
import { BranchCreationModal } from './components/versioning';

const [isModalOpen, setIsModalOpen] = useState(false);
const { branches } = useBranches({ owner, repo });

<BranchCreationModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onCreateBranch={async (branchName) => {
    // Create branch in Gitea
    await giteaService.createBranchFromRef(owner, repo, branchName, currentBranch);
    
    // Refresh branch list
    await refreshBranches();
    
    // Switch to new branch
    await switchBranch(branchName);
    
    // Close modal
    setIsModalOpen(false);
  }}
  existingBranches={branches.map(b => b.name)}
  currentBranch={currentBranch}
/>
```

**Validation Rules:**

1. **Required:**
   - Branch name cannot be empty

2. **Length:**
   - Maximum 100 characters

3. **No Spaces:**
   - Branch name cannot contain whitespace

4. **Invalid Characters:**
   - Cannot contain: `~`, `^`, `:`, `\`, `?`, `*`, `[`, `]`, `@`, `{`, `}`

5. **Start/End Rules:**
   - Cannot start with dot (`.`) or hyphen (`-`)
   - Cannot end with dot (`.`) or slash (`/`)

6. **Special Patterns:**
   - Cannot contain consecutive dots (`..`)
   - Cannot contain double slashes (`//`)

7. **Uniqueness:**
   - Branch name must not already exist (case-insensitive check)

**Error Messages:**
- Clear, actionable error messages for each validation rule
- Errors shown in red box below input field
- Real-time validation as user types
- Separate error display for creation failures

**Features Detail:**

1. **Input Field:**
   - Placeholder text with examples: "e.g., aggro-variant, budget-version"
   - Auto-focus when modal opens
   - Red border when validation fails
   - Disabled during creation

2. **Validation Display:**
   - Warning icon (⚠) with error message
   - Red background (#fef2f2) for visibility
   - Appears immediately as user types

3. **Input Hints:**
   - Gray text below input showing naming rules
   - Helps users understand requirements upfront

4. **Modal Actions:**
   - "Cancel" button (secondary style)
   - "Create Branch" button (primary style, blue)
   - Create button disabled when validation fails
   - Loading spinner and "Creating..." text during operation

5. **Error Handling:**
   - Creation errors shown in separate red box
   - Close icon (✕) to dismiss error
   - Errors don't close modal, allowing retry

**Requirements Satisfied:**
- 5.1: Provides "Create Branch" button
- 5.2: Prompts user for branch name
- 5.3: Validates branch name follows Git conventions
- 5.4: Creates Git branch in Gitea repository
- 5.5: Allows switching between branches

**Integration with BranchSelector:**
The BranchCreationModal is integrated into BranchSelector:
- Clicking "Create new branch" opens the modal
- After creation, branch list is refreshed
- Automatically switches to newly created branch
- Modal closes on successful creation

**See Also:**
- [BranchCreationModal.example.tsx](./BranchCreationModal.example.tsx) - Usage examples
- [BranchSelector component](./BranchSelector.tsx) - Integration example
- [gitea service](../../services/gitea.ts) - Branch creation API

### MergeConflictResolver

A modal component for resolving merge conflicts when merging Git branches.

**Features:**
- Modal UI for conflict resolution workflow
- Displays list of all conflicting cards with visual indicators
- "Keep source" / "Keep target" / "Keep both" resolution options for each conflict
- Preview of final merged deck state with statistics
- Validation warnings and errors for the merged deck
- Merge commit message input with character counter
- Handles card additions, removals, modifications, and special slot conflicts
- Visual distinction between conflict types (added, removed, modified, special slots)
- Card images for visual reference
- Real-time preview updates as resolutions change

**Props:**
```typescript
interface MergeConflictResolverProps {
  isOpen: boolean;              // Controls modal visibility
  onClose: () => void;          // Called when modal is closed
  conflicts: DeckDiff;          // Detected conflicts between branches
  sourceBranch: string;         // Source branch name (being merged from)
  targetBranch: string;         // Target branch name (being merged into)
  sourceDeck: Deck;            // Full source deck
  targetDeck: Deck;            // Full target deck
  onResolve: (resolvedDeck: Deck, mergeMessage: string) => Promise<void>; // Called when merge is resolved
}
```

**Usage:**
```tsx
import { MergeConflictResolver } from './components/versioning';
import { deckDiffService } from './services/deckDiff';

// Detect conflicts between branches
const baseDeck = await getDeckAtCommit(commonAncestorSha);
const sourceDeck = await getDeckAtCommit(sourceBranchSha);
const targetDeck = await getDeckAtCommit(targetBranchSha);

const conflicts = deckDiffService.detectConflicts(
  baseDeck,
  sourceDeck,
  targetDeck
);

// Show resolver if conflicts exist
if (hasConflicts(conflicts)) {
  <MergeConflictResolver
    isOpen={true}
    onClose={() => setShowResolver(false)}
    conflicts={conflicts}
    sourceBranch="feature/new-cards"
    targetBranch="main"
    sourceDeck={sourceDeck}
    targetDeck={targetDeck}
    onResolve={async (resolvedDeck, mergeMessage) => {
      // Save resolved deck to target branch
      await saveDeck(targetBranch, resolvedDeck);
      
      // Create merge commit
      await createMergeCommit(sourceBranch, targetBranch, mergeMessage);
      
      // Update UI
      setCurrentDeck(resolvedDeck);
      setShowResolver(false);
    }}
  />
}
```

**Conflict Types:**

1. **Added Cards:**
   - Card exists in source branch but not in target
   - Options: Keep source (add card), Keep target (don't add), Keep both (add card)

2. **Removed Cards:**
   - Card exists in target branch but not in source
   - Options: Keep source (remove card), Keep target (keep card)

3. **Modified Cards:**
   - Card exists in both branches with different counts
   - Options: Keep source (use source count), Keep target (use target count), Keep both (use higher count)

4. **Special Slots:**
   - Commander, Legend, or Battlefield changed in both branches
   - Options: Keep source (use source card), Keep target (use target card)

**Features Detail:**

1. **Conflict Display:**
   - Each conflict shown in a card with colored border
   - Yellow border for card conflicts
   - Purple border for special slot conflicts
   - Card images for visual identification
   - Conflict type badge (added/removed/modified/special slot)
   - Clear description of the conflict

2. **Resolution Options:**
   - Three buttons per conflict (or two for special slots)
   - Active selection highlighted with blue background
   - Clear labels and descriptions for each option
   - Default selections pre-populated (source for most conflicts)

3. **Preview Section:**
   - Shows total card count of merged deck
   - Displays special slots (commander, legend, battlefield)
   - Updates in real-time as resolutions change
   - Blue background to distinguish from conflicts

4. **Validation:**
   - Runs deck validation on preview deck
   - Shows errors in red box with warning icon
   - Shows warnings in yellow box
   - Prevents merge completion if validation fails
   - Validates deck size, required slots, card limits, etc.

5. **Merge Message:**
   - Text area for commit message (max 500 characters)
   - Character counter below input
   - Default message: "Merge {source} into {target}"
   - Required field (cannot be empty)

6. **Action Buttons:**
   - Cancel button (gray, closes modal)
   - Complete Merge button (blue, primary action)
   - Merge button disabled if validation fails or message empty
   - Loading state during merge operation

**Resolution Logic:**

The component builds the resolved deck by:
1. Starting with target deck as base
2. Applying each resolution choice:
   - **Keep source:** Use source branch version
   - **Keep target:** Use target branch version
   - **Keep both:** For additions, include the card; for modifications, use higher count
3. Updating special slots based on resolutions
4. Validating the final deck

**Requirements Satisfied:**
- 7.3: Highlights conflicting cards and allows manual resolution
- 7.4: Prompts for merge commit message

**Integration with deckDiffService:**
The component relies on `deckDiffService.detectConflicts()` to identify conflicts:
- Compares base deck (common ancestor) with both branch versions
- Detects cards changed in both branches
- Identifies special slot conflicts
- Returns DeckDiff object with all conflicts

**See Also:**
- [MergeConflictResolver.example.tsx](./MergeConflictResolver.example.tsx) - Usage examples
- [deckDiff service](../../services/deckDiff.ts) - Conflict detection logic
- [deckValidation utility](../../utils/deckValidation.ts) - Deck validation rules
