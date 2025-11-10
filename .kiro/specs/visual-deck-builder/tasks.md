# Visual Deck Builder Implementation Plan

- [x] 1. Setup and Dependencies




  - Install required npm packages (react-window, react-dnd, idb)
  - Create base component structure
  - _Requirements: All_

- [x] 1.1 Install dependencies


  - Add react-window, react-dnd, react-dnd-html5-backend, idb to package.json
  - Install and verify packages work
  - _Requirements: All_

- [x] 1.2 Create component directory structure


  - Create src/components/deckbuilder/ folder
  - Create placeholder files for main components
  - _Requirements: All_

- [x] 2. Implement Card Image Caching System





  - Create CardImageCache class using IndexedDB
  - Implement get/set/evict methods
  - Add cache size management (50MB limit)
  - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.1 Create CardImageCache service


  - Implement IndexedDB wrapper using idb library
  - Add methods for storing and retrieving card images
  - Implement LRU eviction when cache exceeds 50MB
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.2 Create useCardImage hook


  - Hook that loads images from cache or network
  - Returns loading state and image URL
  - Automatically caches fetched images
  - _Requirements: 2.4, 7.1, 7.2_

- [x] 3. Build Visual Card Browser Components





  - Create CardGrid with virtual scrolling
  - Implement card image display with lazy loading
  - Add hover preview functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Create CardGrid component


  - Use react-window for virtual scrolling
  - Display cards in responsive grid layout
  - Show loading skeletons while images load
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 3.2 Implement CardImage component


  - Display card image with fallback
  - Use useCardImage hook for loading
  - Add fade-in animation when loaded
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 3.3 Add CardPreview hover component


  - Show enlarged card image on hover
  - Position preview next to cursor
  - Include card details overlay
  - _Requirements: 2.2_

- [x] 3.4 Create QuickAddControls component


  - Add +/- buttons overlay on card images
  - Show current count in deck
  - Disable + button when limit reached
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Implement Card Filtering System





  - Create CardFilters component with dropdowns
  - Implement filter logic for type, cost, rarity
  - Add real-time search functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4.1 Create CardFilters UI component


  - Add dropdown filters for type, cost, rarity
  - Add search input with debouncing
  - Display active filter count
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 4.2 Implement filtering logic


  - Create filterCards utility function
  - Support multiple simultaneous filters
  - Optimize with memoization
  - _Requirements: 9.2, 9.4, 9.5_

- [x] 5. Build Riftbound-Specific Components





  - Create RiftboundBuilder layout
  - Implement Legend, Battlefield, Deck, Rune zones
  - Add rune color filtering logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Create RiftboundBuilder component


  - Layout with four distinct zones
  - Render Legend slot, Battlefield slot, Deck zone, Rune indicator
  - Pass deck state to child components
  - _Requirements: 1.1_

- [x] 5.2 Implement LegendSlot component


  - Display selected legend card image
  - Allow clicking to select new legend
  - Extract rune colors from legend
  - _Requirements: 1.2, 3.2_

- [x] 5.3 Implement BattlefieldSlot component


  - Display selected battlefield card
  - Allow selection from filtered card pool
  - _Requirements: 1.3_


- [x] 5.4 Create RuneIndicator component

  - Display active rune colors as colored circles
  - Show which colors are available
  - Visual feedback for color restrictions
  - _Requirements: 3.4_

- [x] 5.5 Implement rune color filtering


  - Extract rune colors from legend card
  - Filter card pool based on active colors
  - Update card browser when legend changes
  - _Requirements: 1.2, 3.1, 3.2, 3.5_


- [x] 5.6 Add Riftbound deck validation

  - Enforce 30-40 card limit
  - Check rune color legality
  - Display validation warnings
  - _Requirements: 1.4, 3.3_

- [x] 6. Build MTG Commander Components




  - Create MTGCommanderBuilder layout
  - Implement Commander slot
  - Add color identity filtering
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.1 Create MTGCommanderBuilder component


  - Layout with Commander zone and main deck
  - Display color identity indicator
  - Pass filtered cards to card browser
  - _Requirements: 4.1_

- [x] 6.2 Implement CommanderSlot component


  - Display commander card with image
  - Extract color identity from commander
  - Allow commander selection
  - _Requirements: 4.2_

- [x] 6.3 Create ColorIdentityIndicator component


  - Display mana symbols for commander colors
  - Visual representation of color restrictions
  - _Requirements: 4.4_

- [x] 6.4 Implement color identity filtering


  - Filter cards by commander's color identity
  - Update card pool when commander changes
  - Handle colorless and multi-color cards
  - _Requirements: 4.2, 4.3_

- [x] 6.5 Add Commander format validation


  - Enforce 100-card limit
  - Check singleton rule (1 copy per card except basics)
  - Validate color identity compliance
  - _Requirements: 4.5_

- [x] 7. Implement Drag and Drop Functionality




  - Setup react-dnd context
  - Make cards draggable from card pool
  - Create drop zones for deck areas
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7.1 Setup DnD context and providers


  - Wrap DeckEditor with DndProvider
  - Configure HTML5 backend
  - _Requirements: 5.1_

- [x] 7.2 Make cards draggable


  - Add useDrag hook to card components
  - Define drag item type and data
  - Show drag preview
  - _Requirements: 5.1, 5.5_

- [x] 7.3 Create drop zones


  - Add useDrop to Legend, Battlefield, Deck zones
  - Validate drop targets based on card type
  - Visual feedback for valid/invalid drops
  - _Requirements: 5.2, 5.3_

- [x] 7.4 Handle drop events


  - Update deck state when card is dropped
  - Move cards between zones
  - Mark deck as modified
  - _Requirements: 5.4_

- [x] 8. Build Deck Statistics Display





  - Create real-time card count display
  - Add progress indicators for deck completion
  - Implement color/rune distribution charts
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8.1 Create DeckStatistics component


  - Display total card count with format requirements
  - Show progress bar for deck completion
  - List validation warnings
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 8.2 Implement color distribution chart


  - Calculate mana/rune color percentages
  - Display as visual bar chart or pie chart
  - Update in real-time as cards change
  - _Requirements: 6.4, 6.5_

- [x] 9. Implement Auto-Save System





  - Create useAutoSave hook with debouncing
  - Add save status indicator
  - Implement manual save with commit message
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9.1 Create useAutoSave hook


  - Detect deck changes and mark as dirty
  - Debounce saves for 30 seconds
  - Commit to Gitea with auto-generated message
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 9.2 Add SaveStatusIndicator component


  - Show "Saved", "Saving...", or "Unsaved changes"
  - Display last saved timestamp
  - Visual indicator (icon or color)
  - _Requirements: 10.3_

- [x] 9.3 Add manual save button


  - Allow user to trigger immediate save
  - Prompt for custom commit message
  - Override auto-save timer
  - _Requirements: 10.5_

- [x] 10. Integrate with Existing DeckEditor




  - Replace current card list with visual builder
  - Maintain backward compatibility with deck.json format
  - Update routing and navigation
  - _Requirements: All_

- [x] 10.1 Update DeckEditor page


  - Detect game type and render appropriate builder
  - Pass deck data to GameSpecificBuilder
  - Handle deck updates from visual builder
  - _Requirements: All_

- [x] 10.2 Update deck.json schema


  - Add legend, battlefield, commander fields
  - Add runeColors and colorIdentity arrays
  - Ensure backward compatibility
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [x] 10.3 Update deck store


  - Add actions for zone-specific updates
  - Handle legend/commander selection
  - Trigger auto-save on changes
  - _Requirements: All_

- [x] 11. Polish and Optimization





  - Add loading states and error handling
  - Optimize performance for large card pools
  - Improve mobile responsiveness
  - _Requirements: All_

- [x] 11.1 Add loading and error states


  - Show skeletons while loading
  - Display error messages for failed operations
  - Retry failed image loads
  - _Requirements: 2.4, 2.5_

- [x] 11.2 Performance optimization


  - Implement memoization for expensive operations
  - Use React.memo for card components
  - Optimize re-renders with useCallback
  - _Requirements: All_


- [x] 11.3 Mobile responsiveness

  - Adjust grid columns for mobile screens
  - Make drag-and-drop work on touch devices
  - Optimize image sizes for mobile
  - _Requirements: All_

- [x] 11.4 Add keyboard shortcuts


  - Ctrl+S to manually save
  - Arrow keys to navigate card grid
  - Enter to add selected card
  - Escape to close modals/previews
  - Tab through filters
  - _Requirements: All_

- [ ]* 11.5 Accessibility improvements

  - Add ARIA labels to all interactive elements
  - Ensure screen reader compatibility
  - Add focus indicators
  - _Requirements: All_
