# MTG Removal Plan

## Overview

Remove all Magic: The Gathering references and code from the application to focus exclusively on Riftbound.

## Benefits

- **Simpler codebase** - Less conditional logic
- **Faster development** - No need to maintain two game systems
- **Clearer code** - No MTG/Riftbound switches
- **Smaller bundle** - Remove unused MTG components

## Files to Modify/Remove

### 1. Type Definitions

**`src/types/card.ts`**
- Remove `MTGCard` interface
- Keep only `RiftboundCard` and base `Card`
- Remove MTG-specific fields

**`src/types/deck.ts`**
- Remove `commander` field
- Remove `colorIdentity` field
- Keep only Riftbound fields

**`src/types/filters.ts`**
- Remove `MTG_CARD_TYPES`
- Remove `MTG_RARITIES`
- Remove `MTG_COLORS`
- Keep only Riftbound constants

### 2. Components to Remove

**Delete these files:**
- `src/components/deckbuilder/MTGCommanderBuilder.tsx`
- `src/components/deckbuilder/CommanderSlot.tsx`
- `src/components/deckbuilder/ColorDistributionChart.tsx` (if MTG-only)

### 3. Components to Simplify

**`src/components/deckbuilder/CardFilters.tsx`**
- Remove `gameType` prop (always Riftbound)
- Remove MTG color filter section
- Remove conditional rendering

**`src/components/deckbuilder/VisualCardBrowser.tsx`**
- Remove `gameType` prop
- Remove MTG-specific logic

**`src/components/deckbuilder/DeckZone.tsx`**
- Remove `gameType` prop
- Remove MTG color identity logic
- Keep only Riftbound domain logic

**`src/components/deckbuilder/CardGrid.tsx`**
- Remove MTG-specific rendering

**`src/pages/DeckEditor.tsx`**
- Remove game type detection
- Always use RiftboundBuilder
- Remove MTGCommanderBuilder import

**`src/pages/Dashboard.tsx`**
- Remove game type tabs (all/mtg/riftbound)
- Show only Riftbound decks
- Remove MTG deck creation

### 4. Utilities to Simplify

**`src/utils/cardFiltering.ts`**
- Remove `isMTGCard()` function
- Remove MTG filtering logic
- Simplify to Riftbound-only

**`src/utils/colorIdentityFiltering.ts`**
- **DELETE THIS FILE** - MTG-specific

**`src/utils/deckValidation.ts`**
- Remove MTG validation rules
- Keep only Riftbound validation

### 5. Services

**`src/services/cardImageCache.ts`**
- Remove Scryfall API references
- Keep only Riot API logic

### 6. Configuration

**`.env`**
- Remove `VITE_SCRYFALL_API`
- Keep only Riot API config

**`package.json`**
- Check for MTG-specific dependencies
- Remove if any exist

### 7. Documentation

**Update these files:**
- `README.md` - Remove MTG references
- `docs/USAGE.md` - Riftbound-only instructions
- `docs/API.md` - Remove MTG API docs

## Implementation Steps

### Phase 1: Remove MTG Components (Low Risk)
1. Delete `MTGCommanderBuilder.tsx`
2. Delete `CommanderSlot.tsx`
3. Delete `colorIdentityFiltering.ts`
4. Remove MTG constants from `filters.ts`

### Phase 2: Simplify Shared Components (Medium Risk)
1. Remove `gameType` props from components
2. Remove conditional MTG/Riftbound logic
3. Update component interfaces
4. Test each component

### Phase 3: Update Pages (Medium Risk)
1. Simplify `DeckEditor.tsx`
2. Simplify `Dashboard.tsx`
3. Remove game type selection
4. Test deck creation/editing

### Phase 4: Clean Up Utilities (Low Risk)
1. Simplify `cardFiltering.ts`
2. Simplify `deckValidation.ts`
3. Remove MTG type guards
4. Test filtering and validation

### Phase 5: Update Types (High Risk)
1. Remove `MTGCard` interface
2. Update `Card` type
3. Fix all TypeScript errors
4. Test entire application

### Phase 6: Documentation & Config (Low Risk)
1. Update README
2. Update .env
3. Remove Scryfall references
4. Update docs

## Estimated Impact

**Files to Delete:** ~5-10 files
**Files to Modify:** ~20-30 files
**Lines of Code Removed:** ~1000-2000 lines
**Time Estimate:** 2-4 hours

## Testing Checklist

After removal:
- [ ] Deck creation works
- [ ] Deck editing works
- [ ] Card filtering works
- [ ] Card search works
- [ ] Deck validation works
- [ ] Deck saving works
- [ ] Deck loading works
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All Riftbound features work

## Rollback Plan

If issues arise:
1. Git revert to before MTG removal
2. Create feature branch for removal
3. Test thoroughly before merging

## Decision

**Proceed with MTG removal?**
- ✅ Yes - Simplifies codebase significantly
- ⏳ Requires careful testing
- 💡 Do in phases to minimize risk

Would you like me to start removing MTG references? I recommend starting with Phase 1 (removing MTG-only components) since it's low risk.
