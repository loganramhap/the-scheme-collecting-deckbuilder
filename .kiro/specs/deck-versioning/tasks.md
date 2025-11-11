# Implementation Plan: Deck Versioning and History

## Phase 1: Core Infrastructure

- [x] 1. Set up type definitions and interfaces





  - [x] 1.1 Create `src/types/versioning.ts` with DeckCommit, DeckBranch, DeckDiff, and CommitTemplate interfaces


  - [x] 1.2 Add versioning-related types to existing Gitea service types



  - [x] 1.3 Export all types from main types index

  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [x] 2. Implement DeckDiffService





  - [x] 2.1 Create `src/services/deckDiff.ts` with calculateDiff method


  - [x] 2.2 Implement detectConflicts method for merge conflict detection

  - [x] 2.3 Implement applyDiff method to apply changes to a deck

  - [x] 2.4 Implement summarizeChanges method for human-readable summaries

  - _Requirements: 3.1, 3.2, 3.3, 7.3_

- [x] 3. Extend Gitea service with version control methods





  - [x] 3.1 Add getCommitHistory method to fetch commit list from Gitea API



  - [x] 3.2 Add getDeckAtCommit method to retrieve deck state at specific SHA


  - [x] 3.3 Add createBranch method to create new Git branches

  - [x] 3.4 Add listBranches method to fetch all branches


  - [x] 3.5 Add mergeBranch method for branch merging


  - _Requirements: 2.5, 5.4, 6.5, 7.4_

- [x] 4. Create VersionControlService





  - [x] 4.1 Create `src/services/versionControl.ts` with commitDeck method


  - [x] 4.2 Implement generateAutoSaveMessage for auto-save commits



  - [x] 4.3 Implement switchBranch method with deck loading


  - [x] 4.4 Add error handling and retry logic for all operations

  - _Requirements: 1.4, 6.4, 8.2_

## Phase 2: Commit Message System

- [x] 5. Create commit message templates





  - [x] 5.1 Define default commit message templates in constants file


  - [x] 5.2 Create CommitTemplates component to display template options


  - [x] 5.3 Implement template selection and placeholder replacement


  - [x] 5.4 Add localStorage for storing user's recent custom messages


  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 6. Build CommitMessageModal component





  - [x] 6.1 Create modal UI with text area for commit message



  - [x] 6.2 Add template selector dropdown

  - [x] 6.3 Display recent messages as quick-select buttons


  - [x] 6.4 Add character counter (1-500 chars) with validation




  - [x] 6.5 Show preview of detected changes




  - [x] 6.6 Implement commit and cancel actions

  - _Requirements: 1.1, 1.2, 1.3, 9.4_

- [x] 7. Integrate commit messages into save flow





  - [x] 7.1 Update ManualSaveButton to trigger CommitMessageModal



  - [x] 7.2 Calculate deck diff before showing modal

  - [x] 7.3 Generate suggested commit message from diff


  - [x] 7.4 Pass commit message to Gitea service on save

  - [x] 7.5 Show success notification with commit SHA


  - _Requirements: 1.4, 1.5_

- [x] 8. Update auto-save to include commit messages





  - [x] 8.1 Modify useAutoSave hook to generate commit messages


  - [x] 8.2 Format auto-save messages as "Auto-save: [summary]"



  - [x] 8.3 Include change details in auto-save messages


  - [x] 8.4 Mark auto-save commits with metadata flag

  - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Phase 3: History Viewing

- [x] 9. Create useCommitHistory hook





  - [x] 9.1 Implement hook to fetch commit history from Gitea



  - [x] 9.2 Add pagination support (20 commits per page)


  - [x] 9.3 Implement infinite scroll loading


  - [x] 9.4 Add caching with invalidation on new commits


  - [x] 9.5 Handle loading states and errors

  - _Requirements: 2.5_

- [x] 10. Build HistoryPanel component





  - [x] 10.1 Create sliding panel UI that appears from right side


  - [x] 10.2 Display commit list with avatar, message, timestamp, SHA

  - [x] 10.3 Style auto-save commits differently from manual commits


  - [x] 10.4 Implement infinite scroll for pagination

  - [x] 10.5 Add "Compare" button when two commits selected



  - [x] 10.6 Add "Restore" button for each commit





  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.5_

- [x] 11. Add History button to deck editor
  - [x] 11.1 Add History button to DeckEditor header
  - [x] 11.2 Toggle HistoryPanel visibility on click
  - [x] 11.3 Show badge with commit count

  - [x] 11.4 Add keyboard shortcut (Ctrl+H) to open history
  - _Requirements: 2.1_

## Phase 4: Version Comparison

- [x] 12. Create useDeckDiff hook





  - [x] 12.1 Implement hook to calculate diff between two deck versions



  - [x] 12.2 Load both deck versions from Gitea

  - [x] 12.3 Use DeckDiffService to calculate differences

  - [x] 12.4 Handle loading states and errors

  - _Requirements: 3.1_

- [x] 13. Build DiffViewer component



  - [x] 13.1 Create modal UI for displaying diffs



  - [x] 13.2 Implement side-by-side view layout

  - [x] 13.3 Implement unified view layout



  - [x] 13.4 Add view toggle button
  - [x] 13.5 Style added cards with green highlighting




  - [x] 13.6 Style removed cards with red highlighting


  - [x] 13.7 Style modified cards with yellow highlighting
  - [x] 13.8 Display card images for visual reference
  - [x] 13.9 Show summary statistics at top

  - [x] 13.10 Highlight special slot changes (commander/legend/battlefield)


  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 14. Integrate diff viewing into history








  - [x] 14.1 Add compare mode to HistoryPanel

  - [x] 14.2 Allow selecting two commits for comparison

  - [x] 14.3 Open DiffViewer when compare button clicked


  - [x] 14.4 Add "Compare with current" quick action

  - _Requirements: 3.1, 3.6_

## Phase 5: Version Restoration

- [x] 15. Implement version restoration






  - [x] 15.1 Add restore functionality to VersionControlService

  - [x] 15.2 Create confirmation dialog for restoration


  - [x] 15.3 Load historical deck state into editor


  - [x] 15.4 Mark deck as modified (dirty state)


  - [x] 15.5 Generate restoration commit message on save


  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
- [x] 16. Add restore UI to history panel








- [x] 16. Add restore UI to history panel

  - [x] 16.1 Add "Restore" button to each commit in history

  - [x] 16.2 Show warning dialog before restoration

  - [x] 16.3 Display diff preview in confirmation dialog

  - [x] 16.4 Handle restoration success/failure

  - _Requirements: 4.1, 4.2_

## Phase 6: Branch Management

- [x] 17. Create useBranches hook




  - [x] 17.1 Implement hook to fetch branch list from Gitea


  - [x] 17.2 Add caching with invalidation on branch operations

  - [x] 17.3 Handle loading states and errors

  - _Requirements: 5.4, 6.5_

- [x] 18. Build BranchSelector component





  - [x] 18.1 Create dropdown menu UI







  - [x] 18.2 Display current branch with highlighting




  - [x] 18.3 List all available branches











  - [x] 18.4 Add "Create new branch" option





  - [x] 18.5 Add branch icons (main vs feature)



-

  - [x] 18.6 Implement branch switching with confirmation




  - _Requirements: 6.1, 6.2, 6.3_

- [x] 19. Implement branch creation





  - [x] 19.1 Create branch creation modal


  - [x] 19.2 Add branch name input with validation

  - [x] 19.3 Validate name follows Git conventions (no spaces, special chars)

  - [x] 19.4 Check for duplicate branch names

  - [x] 19.5 Create branch in Gitea on confirmation


  - [x] 19.6 Switch to new branch after creation

  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 20. Implement branch switching





  - [x] 20.1 Add unsaved changes warning dialog


  - [x] 20.2 Load deck state from selected branch


  - [x] 20.3 Update editor UI to reflect branch


  - [x] 20.4 Update browser URL with branch parameter


  - [x] 20.5 Show success notification


  - _Requirements: 6.3, 6.4, 6.5_

- [x] 21. Add branch indicator to deck editor





  - [x] 21.1 Display current branch name in header





  - [x] 21.2 Add branch selector dropdown to header

  - [x] 21.3 Style main branch differently from feature branches

  - _Requirements: 6.1, 6.2_

## Phase 7: Branch Merging

- [x] 22. Build MergeConflictResolver component





  - [x] 22.1 Create modal UI for conflict resolution



  - [x] 22.2 Display list of conflicting cards



  - [x] 22.3 Add "Keep source" / "Keep target" / "Keep both" options

  - [x] 22.4 Show preview of final deck state


  - [x] 22.5 Display validation warnings


  - [x] 22.6 Add merge commit message input

  - _Requirements: 7.3, 7.4_

- [x] 23. Implement branch merging





  - [x] 23.1 Add merge functionality to VersionControlService


  - [x] 23.2 Detect merge conflicts using DeckDiffService

  - [x] 23.3 Show preview of changes before merge


  - [x] 23.4 Open MergeConflictResolver if conflicts exist


  - [x] 23.5 Perform merge in Gitea on confirmation

  - [x] 23.6 Create merge commit with user message

  - [x] 23.7 Switch to target branch after merge

  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 24. Add merge UI to branch selector





  - [x] 24.1 Add "Merge into main" option for feature branches





  - [x] 24.2 Show merge preview dialog



  - [x] 24.3 Handle merge success/failure


  - [x] 24.4 Show success notification with merge commit SHA

  - _Requirements: 7.1, 7.2_

## Phase 8: Visual Timeline

- [x] 25. Build VersionTimeline component



  - [x] 25.1 Create SVG-based timeline visualization



  - [x] 25.2 Render nodes for each commit



  - [x] 25.3 Draw lines connecting commits
  - [x] 25.4 Visualize branch divergence

  - [x] 25.5 Add special icon for merge commits


  - [x] 25.6 Implement hover tooltips for commit details
  - [x] 25.7 Add click handler to navigate to version
  - [x] 25.8 Highlight current commit

  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 26. Integrate timeline into history panel






  - [x] 26.1 Add timeline view toggle to HistoryPanel


  - [x] 26.2 Switch between list and timeline views

  - [x] 26.3 Sync selection between views


  - _Requirements: 10.1_

## Phase 9: Polish and Optimization

- [x] 27. Implement caching strategy





  - [x] 27.1 Add commit history cache with invalidation


  - [x] 27.2 Add branch list cache with invalidation


  - [x] 27.3 Implement LRU cache for deck versions (max 10)


  - [x] 27.4 Add cache clearing on logout


  - _Requirements: All_

- [x] 28. Add loading states and error handling





  - [x] 28.1 Add loading spinners to all async operations



  - [x] 28.2 Implement error toast notifications




  - [x] 28.3 Add retry buttons for failed operations

  - [x] 28.4 Handle network errors gracefully

  - _Requirements: All_

- [x] 29. Optimize performance




  - [x] 29.1 Implement pagination for commit history




  - [x] 29.2 Lazy load deck content only when needed


  - [x] 29.3 Defer timeline rendering until panel opened
  - [x] 29.4 Use Web Workers for diff calculation on large decks


  - [x] 29.5 Debounce auto-save to 30 seconds


  - _Requirements: All_

- [x] 30. Add keyboard shortcuts





  - [x] 30.1 Ctrl+H to open history panel





  - [x] 30.2 Ctrl+S to save with commit message

  - [x] 30.3 Escape to close modals



  - [x] 30.4 Arrow keys to navigate commit list

  - _Requirements: All_

## Phase 10: Per-Card Annotations

- [x] 31. Create annotation data structures








  - [x] 31.1 Add CardChangeAnnotation interface to types/versioning.ts

  - [x] 31.2 Add AnnotatedCommit interface extending DeckCommit




  - [x] 31.3 Add AnnotationTemplate interface for quick reasons


  - [x] 31.4 Export new types from types/index.ts

  - _Requirements: 11.4, 11.7_

- [x] 32. Build CardChangeAnnotator component





  - [x] 32.1 Create component to display list of changed cards


  - [x] 32.2 Add text input for each card's reason (200 char limit)

  - [x] 32.3 Add template dropdown with quick reasons

  - [x] 32.4 Implement bulk annotation for multiple cards

  - [x] 32.5 Add character counter per annotation

  - [x] 32.6 Display card images for visual reference

  - _Requirements: 11.1, 11.2, 11.3, 11.7, 11.8_

- [x] 33. Create annotation templates
  - [x] 33.1 Define default annotation templates (Testing, Meta shift, etc.)
  - [x] 33.2 Store templates in constants file
  - [x] 33.3 Allow custom templates in localStorage

  - _Requirements: 11.7_

- [x] 34. Update CommitMessageModal for annotations





  - [x] 34.1 Add CardChangeAnnotator to modal


  - [x] 34.2 Pass deckDiff prop to show changes

  - [x] 34.3 Collect annotations on commit

  - [x] 34.4 Update onCommit callback to include annotations

  - [x] 34.5 Show annotation summary in commit preview

  - _Requirements: 11.1, 11.2, 11.3_
-

- [x] 35. Update version control service for annotations

  - [x] 35.1 Modify commitDeck to accept annotations parameter
  - [x] 35.2 Store annotations in commit metadata/message
  - [x] 35.3 Parse annotations when loading commit history
  - [x] 35.4 Update commit message format to include annotations

  - _Requirements: 11.4_

- [x] 36. Update DiffViewer to show annotations




  - [x] 36.1 Display annotation icons for cards with reasons


  - [x] 36.2 Show annotations as tooltips on hover

  - [x] 36.3 Add inline annotation display option

  - [x] 36.4 Style annotations with different colors by category

  - _Requirements: 11.5_

- [x] 37. Update HistoryPanel to show annotations





  - [x] 37.1 Add annotation indicators to commit list


  - [x] 37.2 Show annotation count in commit summary


  - [x] 37.3 Display annotations in commit details view


  - [x] 37.4 Add filter to show only annotated commits


  - _Requirements: 11.6_

## Phase 11: Testing and Documentation

- [ ]* 38. Write unit tests
  - [ ]* 38.1 Test DeckDiffService.calculateDiff with various scenarios
  - [ ]* 38.2 Test VersionControlService methods with mocked Gitea API
  - [ ]* 38.3 Test commit message generation logic
  - [ ]* 38.4 Test branch name validation
  - [ ]* 38.5 Test annotation parsing and formatting
  - _Requirements: All_

- [ ]* 39. Write integration tests
  - [ ]* 39.1 Test full save flow with commit message and annotations
  - [ ]* 39.2 Test history loading and pagination
  - [ ]* 39.3 Test branch creation and switching
  - [ ]* 39.4 Test merge with and without conflicts
  - [ ]* 39.5 Test annotation display in diff viewer
  - _Requirements: All_

- [ ]* 40. Write E2E tests
  - [ ]* 40.1 Test user saves deck with custom message and card annotations
  - [ ]* 40.2 Test user views history and sees annotations
  - [ ]* 40.3 Test user creates branch, makes changes, merges back
  - [ ]* 40.4 Test user compares two versions and sees annotations
  - [ ]* 40.5 Test bulk annotation workflow
  - _Requirements: All_

- [ ]* 41. Create user documentation
  - [ ]* 41.1 Write guide for commit messages and annotations
  - [ ]* 41.2 Write guide for viewing history with annotations
  - [ ]* 41.3 Write guide for branching and merging
  - [ ]* 41.4 Add tooltips and help text in UI
  - [ ]* 41.5 Document annotation best practices
  - _Requirements: All_
