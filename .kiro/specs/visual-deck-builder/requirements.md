# Visual Deck Builder Requirements

## Introduction

This specification defines a visual, game-specific deck building experience that provides dedicated UI for different card types and intelligent filtering based on game rules. The focus is on Riftbound (with dedicated slots for Legend, Battlefield, Deck, and Runes) and Magic: The Gathering (with Commander-specific features).

## Glossary

- **DeckBuilder**: The visual interface for constructing and editing decks
- **Legend Slot**: Riftbound-specific slot for the player's legend card
- **Battlefield Slot**: Riftbound-specific slot for the battlefield card
- **Rune Colors**: Riftbound color system that determines card availability
- **Card Pool**: The filtered set of cards available for selection based on deck constraints
- **Visual Card Grid**: Grid display showing card images for selection
- **Deck Zones**: Separate areas for different card types (main deck, sideboard, commander, etc.)

## Requirements

### Requirement 1: Riftbound Dedicated Deck Builder

**User Story:** As a Riftbound player, I want dedicated slots for Legend, Battlefield, Deck, and Runes, so that I can build decks according to Riftbound's structure.

#### Acceptance Criteria

1. WHEN the DeckBuilder loads a Riftbound deck, THE DeckBuilder SHALL display four distinct zones: Legend slot, Battlefield slot, Deck zone, and Rune zone
2. WHEN a user selects a Legend card, THE DeckBuilder SHALL update the available card pool based on the Legend's rune colors
3. WHEN a user selects a Battlefield card, THE DeckBuilder SHALL place it in the dedicated Battlefield slot
4. WHEN a user adds cards to the Deck zone, THE DeckBuilder SHALL enforce the 30-40 card limit
5. WHERE a Legend has specific rune colors, THE DeckBuilder SHALL filter the card pool to show only cards matching those rune colors

### Requirement 2: Visual Card Selection Interface

**User Story:** As a deck builder, I want to see card images in a grid layout, so that I can visually browse and select cards for my deck.

#### Acceptance Criteria

1. WHEN the card search returns results, THE DeckBuilder SHALL display cards as a grid of card images
2. WHEN a user hovers over a card image, THE DeckBuilder SHALL show an enlarged preview of the card
3. WHEN a user clicks a card image, THE DeckBuilder SHALL add the card to the appropriate deck zone
4. THE DeckBuilder SHALL display card images at a minimum resolution of 200x280 pixels
5. WHILE loading card images, THE DeckBuilder SHALL show loading placeholders to indicate progress

### Requirement 3: Rune Color Filtering

**User Story:** As a Riftbound player, I want the deck builder to automatically filter cards based on my Legend's rune colors, so that I only see legal cards for my deck.

#### Acceptance Criteria

1. WHEN a Legend is selected, THE DeckBuilder SHALL extract the Legend's rune colors
2. WHEN displaying the card pool, THE DeckBuilder SHALL show only cards that match the Legend's rune colors
3. WHEN no Legend is selected, THE DeckBuilder SHALL display all Riftbound cards
4. THE DeckBuilder SHALL display a visual indicator showing which rune colors are active
5. WHERE a card requires multiple rune colors, THE DeckBuilder SHALL show the card only if all required colors are available

### Requirement 4: MTG Commander Visual Builder

**User Story:** As a Magic: The Gathering Commander player, I want a dedicated Commander slot with color identity filtering, so that I can build legal Commander decks visually.

#### Acceptance Criteria

1. WHEN the DeckBuilder loads an MTG Commander deck, THE DeckBuilder SHALL display a dedicated Commander zone
2. WHEN a Commander is selected, THE DeckBuilder SHALL extract the Commander's color identity
3. WHEN displaying the card pool, THE DeckBuilder SHALL filter cards to match the Commander's color identity
4. THE DeckBuilder SHALL display mana symbols as visual indicators for the Commander's colors
5. THE DeckBuilder SHALL enforce the 100-card singleton rule for Commander decks

### Requirement 5: Drag and Drop Card Management

**User Story:** As a deck builder, I want to drag and drop cards between zones, so that I can intuitively organize my deck.

#### Acceptance Criteria

1. WHEN a user drags a card from the card pool, THE DeckBuilder SHALL allow dropping it into valid deck zones
2. WHEN a user drags a card between deck zones, THE DeckBuilder SHALL move the card to the new zone
3. WHEN a user drags a card to an invalid zone, THE DeckBuilder SHALL show a visual indicator that the drop is not allowed
4. WHEN a card is dropped, THE DeckBuilder SHALL update the deck state and mark it as modified
5. THE DeckBuilder SHALL provide visual feedback during drag operations showing valid drop targets

### Requirement 6: Card Count and Deck Statistics

**User Story:** As a deck builder, I want to see real-time statistics about my deck, so that I can ensure it meets format requirements.

#### Acceptance Criteria

1. WHEN cards are added or removed, THE DeckBuilder SHALL update the total card count in real-time
2. THE DeckBuilder SHALL display a visual progress indicator showing deck completion (e.g., 35/40 cards for Riftbound)
3. WHERE format rules are violated, THE DeckBuilder SHALL highlight the violation with a warning message
4. THE DeckBuilder SHALL display color distribution for MTG decks as a visual pie chart or bar graph
5. THE DeckBuilder SHALL show rune color distribution for Riftbound decks

### Requirement 7: Card Image Caching

**User Story:** As a deck builder, I want card images to load quickly, so that I can browse cards without delays.

#### Acceptance Criteria

1. WHEN a card image is loaded, THE DeckBuilder SHALL cache the image in browser storage
2. WHEN a previously viewed card is displayed again, THE DeckBuilder SHALL load the image from cache
3. THE DeckBuilder SHALL implement lazy loading for card images to improve initial page load time
4. WHERE network connectivity is slow, THE DeckBuilder SHALL show low-resolution placeholders until full images load
5. THE DeckBuilder SHALL limit cache size to 50MB and evict oldest images when limit is reached

### Requirement 8: Quick Add Interface

**User Story:** As a deck builder, I want to quickly add multiple copies of a card, so that I can build decks efficiently.

#### Acceptance Criteria

1. WHEN a user clicks a card, THE DeckBuilder SHALL show a quick-add interface with +/- buttons
2. WHEN a user clicks the + button, THE DeckBuilder SHALL increment the card count by 1
3. WHEN a user clicks the - button, THE DeckBuilder SHALL decrement the card count by 1
4. THE DeckBuilder SHALL display the current count of each card in the deck
5. WHERE format rules limit card copies, THE DeckBuilder SHALL disable the + button when the limit is reached

### Requirement 9: Card Filtering and Search

**User Story:** As a deck builder, I want to filter cards by type, cost, and other attributes, so that I can find specific cards quickly.

#### Acceptance Criteria

1. THE DeckBuilder SHALL provide filter controls for card type, mana cost/rune cost, and rarity
2. WHEN filters are applied, THE DeckBuilder SHALL update the card grid to show only matching cards
3. THE DeckBuilder SHALL display the number of cards matching current filters
4. WHEN a search query is entered, THE DeckBuilder SHALL filter cards by name in real-time
5. THE DeckBuilder SHALL allow combining multiple filters simultaneously

### Requirement 10: Auto-Save and Version Control

**User Story:** As a deck builder, I want my changes to be automatically saved with version history, so that I never lose my work.

#### Acceptance Criteria

1. WHEN a card is added or removed, THE DeckBuilder SHALL mark the deck as having unsaved changes
2. WHEN 30 seconds elapse with unsaved changes, THE DeckBuilder SHALL automatically commit changes to Gitea
3. THE DeckBuilder SHALL display a visual indicator showing save status (saved, saving, unsaved)
4. WHEN an auto-save occurs, THE DeckBuilder SHALL create a commit with a descriptive message
5. THE DeckBuilder SHALL allow users to manually save with a custom commit message

## Success Criteria

- Users can build Riftbound decks using dedicated Legend, Battlefield, Deck, and Rune zones
- Card filtering automatically updates based on Legend/Commander selection
- All card interactions are visual with drag-and-drop support
- Deck statistics update in real-time
- Card images load quickly with caching
- Changes are automatically saved to Git with version history
- The interface is intuitive for users unfamiliar with Git or version control
