# Requirements Document: Riftbound Deck Builder Fixes

## Introduction

This spec addresses critical bugs in the Riftbound deck builder that prevent proper deck construction according to Riftbound game rules. The current implementation incorrectly includes runes in the main 40-card deck count, doesn't provide a separate rune deck interface, lacks battlefield selection (3 required), and fails to filter cards based on the selected Legend's domain colors.

## Glossary

- **Main Deck**: The 40-card deck used during gameplay (excludes Legend, Runes, and Battlefields)
- **Rune Deck**: A separate 12-card deck consisting only of Basic Rune cards
- **Battlefield Cards**: Special location cards where units are played; exactly 3 must be selected per deck
- **Legend**: The player's chosen legend card that determines legal card domains
- **Domain**: The color/type system in Riftbound (Fury, Calm, Mind, Body, Order, Colorless)
- **Basic Rune**: Cards with Card Type "Basic Rune" that go in the Rune Deck
- **Card Legality**: Cards are legal in a deck if their Domain matches the Legend's Domain

## Requirements

### Requirement 1: Separate Rune Deck Management

**User Story:** As a Riftbound player, I want runes to be managed in a separate 12-card deck, so that they don't count toward my 40-card main deck limit.

#### Acceptance Criteria

1. THE System SHALL exclude cards with Card Type "Basic Rune" from the main deck card count
2. THE System SHALL provide a dedicated Rune Deck zone in the UI
3. THE System SHALL enforce a 12-card limit for the Rune Deck
4. THE System SHALL display the Rune Deck count separately (e.g., "Runes: 8/12")
5. WHEN a user adds a Basic Rune card, THE System SHALL add it to the Rune Deck, not the Main Deck

### Requirement 2: Battlefield Card Selection

**User Story:** As a Riftbound player, I want to select exactly 3 battlefield cards for my deck, so that I can build legal Riftbound decks.

#### Acceptance Criteria

1. THE System SHALL provide a dedicated Battlefield selection zone in the UI
2. THE System SHALL allow selection of exactly 3 cards with Card Type "Battlefield"
3. THE System SHALL display available Battlefield cards separately from other card types
4. THE System SHALL show the Battlefield count (e.g., "Battlefields: 2/3")
5. WHEN 3 Battlefields are selected, THE System SHALL prevent adding more Battlefield cards

### Requirement 3: Domain-Based Card Filtering

**User Story:** As a Riftbound player, I want the card pool to show only cards legal for my Legend's domain, so that I don't accidentally add illegal cards to my deck.

#### Acceptance Criteria

1. WHEN a Legend is selected, THE System SHALL extract the Legend's Domain from the card data
2. THE System SHALL filter the available card pool to show only cards matching the Legend's Domain
3. THE System SHALL show Colorless domain cards regardless of the Legend's Domain
4. THE System SHALL update the filtered card pool immediately when the Legend changes
5. WHERE no Legend is selected, THE System SHALL display all Riftbound cards

### Requirement 4: Correct Main Deck Card Count

**User Story:** As a Riftbound player, I want the deck counter to show only my main deck cards (40), so that I know when my deck is complete.

#### Acceptance Criteria

1. THE System SHALL count only non-Rune, non-Battlefield, non-Legend cards toward the 40-card limit
2. THE System SHALL display the main deck count as "Deck: X/40"
3. THE System SHALL show a validation error if the main deck has fewer than 40 cards
4. THE System SHALL show a validation error if the main deck has more than 40 cards
5. THE System SHALL show a success indicator when the main deck has exactly 40 cards

### Requirement 5: Updated Deck Validation

**User Story:** As a Riftbound player, I want clear validation messages for all deck requirements, so that I know what's missing before I can play.

#### Acceptance Criteria

1. THE System SHALL validate that exactly 1 Legend is selected
2. THE System SHALL validate that exactly 3 Battlefields are selected
3. THE System SHALL validate that exactly 12 Runes are selected
4. THE System SHALL validate that exactly 40 main deck cards are selected
5. THE System SHALL display all validation errors simultaneously in a warnings panel

### Requirement 6: UI Layout for Multiple Deck Zones

**User Story:** As a Riftbound player, I want a clear visual layout showing all my deck zones, so that I can easily manage each part of my deck.

#### Acceptance Criteria

1. THE System SHALL display the Legend slot prominently at the top
2. THE System SHALL display the Battlefield selection zone (3 slots)
3. THE System SHALL display the Rune Deck zone with count indicator
4. THE System SHALL display the Main Deck zone (40 cards) separately
5. THE System SHALL visually distinguish each zone with labels and styling

### Requirement 7: Deck Tagging Functionality

**User Story:** As a deck builder, I want to add and remove tags on my decks, so that I can organize and categorize my deck collection.

#### Acceptance Criteria

1. WHEN a user adds a tag to a deck, THE System SHALL save the tag to the deck metadata
2. WHEN a user removes a tag from a deck, THE System SHALL remove the tag from the deck metadata
3. THE System SHALL persist deck tags when saving to Gitea
4. THE System SHALL display deck tags on the deck list view
5. THE System SHALL allow adding multiple tags to a single deck
6. THE System SHALL prevent duplicate tags on the same deck
7. THE System SHALL provide suggested tags for common categories
8. WHEN deck metadata is updated, THE System SHALL commit changes to Gitea

### Requirement 8: Riot Games API Integration

**User Story:** As a Riftbound player, I want the card database to automatically update from Riot's official API, so that I always have access to the latest cards without manual updates.

#### Acceptance Criteria

1. THE System SHALL fetch card data from the Riot Games Riftbound Content API
2. THE System SHALL require a valid Riot API key for authentication
3. THE System SHALL cache card data locally to minimize API calls
4. THE System SHALL refresh card data periodically (e.g., daily or on user request)
5. THE System SHALL parse the API response and transform it into the application's card format
6. THE System SHALL handle API errors gracefully with fallback to cached data
7. THE System SHALL display the last update timestamp for card data
8. THE System SHALL allow manual refresh of card data via a UI button

## Success Criteria

- Runes are correctly excluded from the 40-card main deck count
- Players can select exactly 3 Battlefield cards
- Card filtering works based on Legend's Domain
- All deck zones are clearly visible and functional
- Validation accurately reflects Riftbound deck construction rules
- Existing decks continue to work (backward compatibility)
