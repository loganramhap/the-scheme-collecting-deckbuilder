# Requirements Document

## Introduction

This spec defines the requirements for implementing deck versioning and history features in the deckbuilder application. The system will leverage Gitea's version control capabilities to allow players to track changes, understand their deck evolution, create branches for testing variants, and view the complete history of their deck modifications.

## Glossary

- **Deck History**: The complete timeline of changes made to a deck, stored as Git commits in Gitea
- **Commit Message**: A user-provided description explaining why a change was made to the deck
- **Deck Version**: A specific state of a deck at a point in time, identified by a Git commit SHA
- **Deck Branch**: An alternative version of a deck that diverges from the main timeline
- **Diff View**: A visual comparison showing what changed between two deck versions
- **Version Browser**: The UI component that displays the deck's commit history

## Requirements

### Requirement 1: Commit Messages for Changes

**User Story:** As a deck builder, I want to provide a reason when I save changes to my deck, so that I can remember why I made specific modifications later.

#### Acceptance Criteria

1. WHEN the user saves a deck with changes, THE System SHALL prompt the user to enter a commit message
2. THE System SHALL allow commit messages between 1 and 500 characters in length
3. THE System SHALL provide suggested commit message templates based on the type of changes detected
4. WHEN the user provides a commit message, THE System SHALL include it in the Git commit to Gitea
5. THE System SHALL display the commit message in the deck history view

### Requirement 2: Deck History Viewing

**User Story:** As a deck builder, I want to view the complete history of changes to my deck, so that I can understand how my deck has evolved over time.

#### Acceptance Criteria

1. THE System SHALL provide a "History" button in the deck editor interface
2. WHEN the user clicks the History button, THE System SHALL display a chronological list of all commits
3. THE System SHALL display for each commit: timestamp, commit message, author, and commit SHA
4. THE System SHALL allow the user to scroll through the entire commit history
5. THE System SHALL load commit history from the Gitea repository API

### Requirement 3: Version Comparison (Diff View)

**User Story:** As a deck builder, I want to compare two versions of my deck, so that I can see exactly what cards were added, removed, or changed.

#### Acceptance Criteria

1. WHEN viewing deck history, THE System SHALL allow the user to select two versions to compare
2. THE System SHALL display a diff view showing cards added in green
3. THE System SHALL display a diff view showing cards removed in red
4. THE System SHALL display a diff view showing cards with changed quantities in yellow
5. THE System SHALL highlight changes to special slots (commander, legend, battlefield)
6. THE System SHALL allow the user to compare any version against the current working version

### Requirement 4: Version Restoration

**User Story:** As a deck builder, I want to restore my deck to a previous version, so that I can undo unwanted changes or return to a known good state.

#### Acceptance Criteria

1. WHEN viewing a historical version, THE System SHALL provide a "Restore this version" button
2. WHEN the user clicks restore, THE System SHALL prompt for confirmation with a warning message
3. WHEN confirmed, THE System SHALL load the historical deck state into the editor
4. THE System SHALL mark the current deck as modified (dirty state)
5. WHEN the user saves after restoration, THE System SHALL create a new commit with a message indicating the restoration

### Requirement 5: Branch Creation for Variants

**User Story:** As a deck builder, I want to create branches of my deck to test different card choices, so that I can experiment without affecting my main deck.

#### Acceptance Criteria

1. THE System SHALL provide a "Create Branch" button in the deck editor
2. WHEN creating a branch, THE System SHALL prompt the user for a branch name
3. THE System SHALL validate that the branch name is unique and follows Git naming conventions
4. WHEN a branch is created, THE System SHALL create a Git branch in the Gitea repository
5. THE System SHALL allow the user to switch between branches using a branch selector dropdown

### Requirement 6: Branch Switching

**User Story:** As a deck builder, I want to switch between different branches of my deck, so that I can work on multiple variants simultaneously.

#### Acceptance Criteria

1. THE System SHALL display the current branch name in the deck editor header
2. THE System SHALL provide a branch selector dropdown showing all available branches
3. WHEN the user switches branches, THE System SHALL warn if there are unsaved changes
4. WHEN switching branches, THE System SHALL load the deck state from the selected branch
5. THE System SHALL update the editor to reflect the branch's deck configuration

### Requirement 7: Branch Merging

**User Story:** As a deck builder, I want to merge changes from a variant branch back into my main deck, so that I can incorporate successful experiments.

#### Acceptance Criteria

1. THE System SHALL provide a "Merge Branch" option when viewing a non-main branch
2. WHEN merging, THE System SHALL show a preview of changes that will be applied
3. WHEN conflicts exist, THE System SHALL highlight conflicting cards and allow manual resolution
4. WHEN merge is confirmed, THE System SHALL create a merge commit in the main branch
5. THE System SHALL prompt for a merge commit message explaining the merge

### Requirement 8: Auto-save with Commit Messages

**User Story:** As a deck builder, I want my auto-saved changes to include meaningful commit messages, so that my history remains useful even with automatic saves.

#### Acceptance Criteria

1. WHEN auto-save triggers, THE System SHALL generate a commit message based on detected changes
2. THE System SHALL use the format "Auto-save: [summary of changes]" for auto-generated messages
3. THE System SHALL include details like "Added 2 cards, removed 1 card" in auto-save messages
4. THE System SHALL allow the user to edit auto-save commit messages retroactively
5. THE System SHALL distinguish auto-save commits from manual saves in the history view

### Requirement 9: Commit Message Templates

**User Story:** As a deck builder, I want suggested commit message templates, so that I can quickly describe common types of changes.

#### Acceptance Criteria

1. THE System SHALL provide commit message templates such as "Testing new card: [card name]"
2. THE System SHALL provide templates like "Removed underperforming cards", "Mana curve adjustment", "Meta adaptation"
3. WHEN the user selects a template, THE System SHALL populate the commit message field
4. THE System SHALL allow the user to edit template messages before committing
5. THE System SHALL remember the user's 5 most recently used custom messages

### Requirement 10: Visual Timeline

**User Story:** As a deck builder, I want to see a visual timeline of my deck's evolution, so that I can quickly navigate to important milestones.

#### Acceptance Criteria

1. THE System SHALL display a visual timeline with commits as nodes
2. THE System SHALL show branches as diverging lines in the timeline
3. THE System SHALL allow clicking on timeline nodes to view that version
4. THE System SHALL highlight merge commits with a special icon
5. THE System SHALL display the timeline in reverse chronological order (newest first)

### Requirement 11: Per-Card Change Annotations

**User Story:** As a deck builder, I want to add specific reasons for each card I add or remove, so that I can remember my exact reasoning for individual card changes.

#### Acceptance Criteria

1. WHEN saving a deck with changes, THE System SHALL display a list of added and removed cards
2. THE System SHALL provide an optional text input for each changed card to add a reason
3. THE System SHALL allow annotations up to 200 characters per card
4. THE System SHALL store card annotations as part of the commit metadata
5. THE System SHALL display card annotations in the diff viewer
6. THE System SHALL display card annotations in the commit history details
7. THE System SHALL provide quick reason templates like "Testing", "Meta shift", "Underperforming"
8. THE System SHALL allow bulk annotation for multiple cards with the same reason
