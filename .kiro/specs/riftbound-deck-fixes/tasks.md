# Implementation Plan: Riftbound Deck Builder Fixes

## Phase 1: Update Data Models and Types

- [x] 1. Update Riftbound deck type definitions





  - [x] 1.1 Add `runeDeck: DeckCard[]` field to deck type


  - [x] 1.2 Change `battlefield` to `battlefields: DeckCard[]` (array of 3)


  - [x] 1.3 Add `legendDomain?: string` field to track Legend's domain


  - [x] 1.4 Update RiftboundCard interface to include `card_type` and `domain` fields


  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Create card type helper functions





  - [x] 2.1 Implement `isBasicRune(card)` function


  - [x] 2.2 Implement `isBattlefield(card)` function

  - [x] 2.3 Implement `isLegend(card)` function

  - [x] 2.4 Implement `getMainDeckCards(cards)` filter function

  - [x] 2.5 Implement `getRuneCards(cards)` filter function

  - [x] 2.6 Implement `getBattlefieldCards(cards)` filter function

  - _Requirements: 1.1, 2.2, 4.1_

## Phase 2: Update Card Filtering Logic

- [x] 3. Implement domain-based filtering





  - [x] 3.1 Create `extractLegendDomain(legendCard)` function to get domain from Legend




  - [x] 3.2 Update `filterByRuneColors` to `filterByDomain` using domain field



  - [x] 3.3 Ensure Colorless domain cards are always included

  - [x] 3.4 Update filtering to work with Legend's domain instead of rune colors

  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update card pool filtering in RiftboundBuilder





  - [x] 4.1 Extract Legend's domain when Legend is selected


  - [x] 4.2 Apply domain filtering to available cards

  - [x] 4.3 Update filtered cards when Legend changes



  - [x] 4.4 Show all cards when no Legend is selected





  - _Requirements: 3.1, 3.4, 3.5_

## Phase 3: Separate Rune Deck Management

- [x] 5. Create RuneDeckZone component





  - [x] 5.1 Build component to display rune deck cards




  - [x] 5.2 Add rune count indicator (X/12)

  - [x] 5.3 Implement add rune functionality

  - [x] 5.4 Implement remove rune functionality

  - [x] 5.5 Enforce 12-card limit

  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Update deck store for rune deck





  - [x] 6.1 Add `runeDeck` state to deck store


  - [x] 6.2 Create `addRune` action


  - [x] 6.3 Create `removeRune` action

  - [x] 6.4 Create `updateRuneCount` action

  - _Requirements: 1.1, 1.5_

- [x] 7. Update card addition logic to route runes correctly





  - [x] 7.1 Check if card is Basic Rune when adding


  - [x] 7.2 Route Basic Rune cards to runeDeck instead of main deck


  - [x] 7.3 Update card browser to show rune cards separately


  - _Requirements: 1.1, 1.5_

## Phase 4: Battlefield Selection

- [x] 8. Create BattlefieldSelector component





  - [x] 8.1 Build component with 3 battlefield slots




  - [x] 8.2 Display selected battlefield cards in slots

  - [x] 8.3 Add click handler to open battlefield picker

  - [x] 8.4 Add remove functionality for selected battlefields


  - [x] 8.5 Show battlefield count (X/3)

  - _Requirements: 2.1, 2.2, 2.4_

- [x] 9. Create battlefield picker modal




  - [x] 9.1 Build modal to display available battlefield cards


  - [x] 9.2 Filter card list to show only Battlefield card type

  - [x] 9.3 Handle battlefield selection

  - [x] 9.4 Close modal after selection

  - _Requirements: 2.2, 2.3_

- [x] 10. Update deck store for battlefields





  - [x] 10.1 Change `battlefield` to `battlefields` array in store


  - [x] 10.2 Create `addBattlefield` action

  - [x] 10.3 Create `removeBattlefield` action

  - [x] 10.4 Enforce 3-battlefield limit

  - _Requirements: 2.1, 2.5_

## Phase 5: Update Main Deck Card Counting

- [x] 11. Fix main deck card count calculation





  - [x] 11.1 Update count to exclude Basic Rune cards


  - [x] 11.2 Update count to exclude Battlefield cards

  - [x] 11.3 Update count to exclude Legend card

  - [x] 11.4 Display count as "Deck: X/40"

  - _Requirements: 4.1, 4.2_

- [x] 12. Update deck statistics display





  - [x] 12.1 Show separate counts for Main Deck (40)





  - [x] 12.2 Show separate counts for Rune Deck (12)



  - [x] 12.3 Show separate counts for Battlefields (3)

  - [x] 12.4 Update visual indicators for each zone

  - _Requirements: 4.2, 4.5_

## Phase 6: Update Validation Logic

- [x] 13. Implement updated deck validation






  - [x] 13.1 Validate exactly 1 Legend selected


  - [x] 13.2 Validate exactly 3 Battlefields selected


  - [x] 13.3 Validate exactly 12 Runes selected


  - [x] 13.4 Validate exactly 40 main deck cards


  - [x] 13.5 Update validation error messages

  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 14. Update validation warnings display





  - [x] 14.1 Show all validation errors simultaneously




  - [x] 14.2 Color-code errors by severity



  - [x] 14.3 Update warnings panel styling



  - [x] 14.4 Add success indicators when requirements met
  - _Requirements: 4.3, 4.4, 4.5, 5.5_

## Phase 7: Update UI Layout

- [x] 15. Restructure RiftboundBuilder layout





  - [x] 15.1 Add BattlefieldSelector to layout




  - [x] 15.2 Add RuneDeckZone to layout


  - [x] 15.3 Update deck statistics panel

  - [x] 15.4 Adjust spacing and visual hierarchy


  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Add visual zone indicators






  - [x] 16.1 Add labels for each deck zone


  - [x] 16.2 Add color coding for different zones


  - [x] 16.3 Add borders/backgrounds to distinguish zones


  - [x] 16.4 Update typography for zone headers

  - _Requirements: 6.5_

## Phase 8: Data Migration

- [x] 17. Implement deck migration for existing decks





  - [x] 17.1 Create `migrateRiftboundDeck` function


  - [x] 17.2 Separate existing cards into correct zones by type

  - [x] 17.3 Handle old `battlefield` field (single card)

  - [x] 17.4 Test migration with various deck formats


  - _Requirements: All (backward compatibility)_

- [x] 18. Update deck loading logic



  - [x] 18.1 Detect old deck format



  - [x] 18.2 Apply migration if needed


  - [x] 18.3 Save migrated deck in new format
  - [x] 18.4 Log migration for debugging
  - _Requirements: All (backward compatibility)_

## Phase 9: Update Card Browser

- [x] 19. Add card type filtering to browser



  - [x] 19.1 Add tabs for "Main Deck", "Runes", "Battlefields"





  - [x] 19.2 Filter cards by type based on active tab
  - [x] 19.3 Apply domain filtering to Main Deck tab only


  - [x] 19.4 Update card browser state management


  - _Requirements: 1.2, 2.3, 3.2_

- [x] 20. Update card addition routing






  - [x] 20.1 Route cards to correct zone based on card type

  - [x] 20.2 Show appropriate error messages for full zones

  - [x] 20.3 Update card browser to reflect added cards


  - _Requirements: 1.5, 2.5_

## Phase 10: Fix Deck Tagging

- [x] 21. Update Gitea service for tag commits





  - [x] 21.1 Add optional `commitMessage` parameter to `updateDeck` method


  - [x] 21.2 Use commit message when updating deck file


  - [x] 21.3 Ensure file SHA is retrieved before update


  - [x] 21.4 Handle commit errors gracefully


  - _Requirements: 7.1, 7.2, 7.3, 7.8_

- [x] 22. Fix tag addition in Dashboard





  - [x] 22.1 Update `handleAddTag` to pass commit message


  - [x] 22.2 Add error handling for failed tag additions

  - [x] 22.3 Show success feedback when tag is added

  - [x] 22.4 Prevent duplicate tags

  - _Requirements: 7.1, 7.5, 7.6_

- [x] 23. Fix tag removal in Dashboard






  - [x] 23.1 Update `handleRemoveTag` to pass commit message



  - [x] 23.2 Add error handling for failed tag removals

  - [x] 23.3 Show success feedback when tag is removed


  - [x] 23.4 Update local state after removal

  - _Requirements: 7.2, 7.3_

- [x] 24. Improve tag display






  - [x] 24.1 Ensure tags display correctly in deck list


  - [x] 24.2 Add visual feedback for tag interactions


  - [x] 24.3 Update suggested tags list


  - [x] 24.4 Improve tag modal styling

  - _Requirements: 7.4, 7.7_

## Phase 11: Riot Games API Integration

- [x] 25. Create Riot API service





  - [x] 25.1 Create `RiftboundCardService` class


  - [x] 25.2 Implement `fetchFromAPI` method with authentication

  - [x] 25.3 Implement `transformAPIResponse` to convert API format to app format

  - [x] 25.4 Add error handling for API failures

  - _Requirements: 8.1, 8.2, 8.5, 8.6_

- [x] 26. Implement card caching









  - [x] 26.1 Implement `cacheCards` method using localStorage

  - [x] 26.2 Implement `getCachedCards` with expiry check

  - [x] 26.3 Add cache age calculation method


  - [x] 26.4 Add cache clear functionality

  - [x] 26.5 Set cache duration to 24 hours

  - _Requirements: 8.3, 8.4_

- [x] 27. Add API key configuration





  - [x] 27.1 Add `VITE_RIOT_API_KEY` to environment variables



  - [x] 27.2 Create config file for Riot API settings


  - [x] 27.3 Add validation for API key presence


  - [x] 27.4 Document API key setup in README


  - _Requirements: 8.2_

- [x] 28. Update card loading logic





  - [x] 28.1 Add feature flag for API vs CSV loading


  - [x] 28.2 Implement fallback from API to CSV on error


  - [x] 28.3 Update card loading in RiftboundBuilder


  - [x] 28.4 Add loading states for API fetch


  - _Requirements: 8.1, 8.6_

- [x] 29. Build card refresh UI




  - [x] 29.1 Create CardDataRefreshButton component


  - [x] 29.2 Add refresh button to deck builder header


  - [x] 29.3 Display last update timestamp

  - [x] 29.4 Show loading state during refresh

  - [x] 29.5 Display success/error messages

  - _Requirements: 8.7, 8.8_

- [x] 30. Handle API errors and rate limits


  - [x] 30.1 Handle 429 rate limit responses
  - [x] 30.2 Handle 401/403 authentication errors
  - [x] 30.3 Handle 500+ service errors
  - [x] 30.4 Show user-friendly error messages


  - _Requirements: 8.6_

## Phase 12: Testing and Polish

- [ ]* 31. Write unit tests
  - [ ]* 31.1 Test domain filtering logic
  - [ ]* 31.2 Test card type identification functions
  - [ ]* 31.3 Test validation logic
  - [ ]* 31.4 Test deck migration function
  - [ ]* 31.5 Test tag addition and removal logic
  - [ ]* 31.6 Test API response transformation
  - [ ]* 31.7 Test cache expiry logic
  - _Requirements: All_

- [ ]* 32. Write integration tests
  - [ ]* 32.1 Test Legend selection updates filtering
  - [ ]* 32.2 Test card addition to correct zones
  - [ ]* 32.3 Test battlefield selection workflow
  - [ ]* 32.4 Test rune deck management
  - [ ]* 32.5 Test tag persistence after save
  - [ ]* 32.6 Test API fetch and cache workflow
  - [ ]* 32.7 Test fallback from API to cache
  - _Requirements: All_

- [ ]* 33. Manual testing and bug fixes
  - [ ]* 33.1 Test complete deck building workflow
  - [ ]* 33.2 Test with various Legend domains
  - [ ]* 33.3 Test validation edge cases
  - [ ]* 33.4 Test deck save and reload
  - [ ]* 33.5 Test tag addition, removal, and display
  - [ ]* 33.6 Test card refresh with valid API key
  - [ ]* 33.7 Test error handling with invalid API key
  - [ ]* 33.8 Test offline behavior with cache
  - _Requirements: All_

- [ ]* 34. Update documentation
  - [ ]* 34.1 Document new deck structure
  - [ ]* 34.2 Document domain filtering rules
  - [ ]* 34.3 Add tooltips for deck zones
  - [ ]* 34.4 Document tagging functionality
  - [ ]* 34.5 Document Riot API setup and configuration
  - [ ]* 34.6 Document cache behavior and refresh
  - [ ]* 34.7 Update user guide
  - _Requirements: All_
