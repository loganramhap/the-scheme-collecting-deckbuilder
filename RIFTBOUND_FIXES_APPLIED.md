# Riftbound Builder Fixes Applied

## Summary

Fixed three critical issues with the Riftbound deck builder:

1. ✅ **Multi-Domain Support** - Legends can now have multiple domains (e.g., "Fury, Body")
2. ✅ **Auto-Populate Runes** - Runes automatically populate when a Legend is selected
3. ⏳ **Filter System** - Still needs Riot API field mapping (see below)

## Changes Made

### 1. Domain Filtering (`src/utils/domainFiltering.ts`)

**Added:**
- `extractLegendDomains()` - Returns array of domains instead of single string
- `filterByDomains()` - Filters cards by multiple domains
- `isCardLegalForDomains()` - Checks legality against multiple domains

**Kept for backward compatibility:**
- `extractLegendDomain()` - Marked as deprecated
- `filterByDomain()` - Marked as deprecated
- `isCardLegalForDomain()` - Marked as deprecated

**Key Logic:**
```typescript
// Legends can have domains as:
// - Array: ["Fury", "Body"]
// - String: "Fury, Body"
// - Single: "Fury"

// Cards are legal if they match ANY of the Legend's domains
// Colorless cards are always legal
```

### 2. Rune Auto-Population (`src/components/deckbuilder/RiftboundBuilder.tsx`)

**Added `autoPopulateRunes()` function:**
- Clears existing runes when Legend changes
- For single-domain Legends: adds 12 runes of that domain
- For dual-domain Legends: adds 6 runes of each domain (12 total)
- Finds runes by matching domain field or card name

**Updated `handleLegendSelect()`:**
- Now calls `autoPopulateRunes()` after setting Legend
- Extracts domains from the selected Legend card

### 3. Component Updates

**RiftboundBuilder.tsx:**
- Changed `legendDomain` (string) → `legendDomains` (array)
- Updated UI to show "Fury + Body Domains" for multi-domain Legends
- Passes `legendDomains` to child components

**VisualCardBrowser.tsx:**
- Changed prop from `legendDomain` → `legendDomains`
- Uses `filterByDomains()` instead of `filterByDomain()`

**DeckZone.tsx:**
- Changed prop from `legendDomain` → `legendDomains`
- Uses `isCardLegalForDomains()` for drag-and-drop validation

## Testing

### Test Case 1: Single-Domain Legend
1. Select a Legend with one domain (e.g., "Fury")
2. ✅ Rune deck should auto-populate with 12 Fury runes
3. ✅ Card browser should show Fury + Colorless cards only

### Test Case 2: Dual-Domain Legend
1. Select "Hand of Noxus" (Fury + another domain)
2. ✅ Rune deck should auto-populate with 6 runes of each domain (12 total)
3. ✅ Card browser should show cards from BOTH domains + Colorless
4. ✅ UI should display "Fury + Body Domains" (or similar)

### Test Case 3: Rune Display
1. After Legend selection, check Rune Deck zone
2. ✅ Should show 12/12 runes
3. ✅ Should display rune cards with correct images

## Remaining Issues

### Filter System Not Working

**Problem:** Right-side filter panel doesn't filter cards correctly

**Root Cause:** Filter constants don't match Riot API data structure

**Still Needs:**
1. Update `RIFTBOUND_CARD_TYPES` to match API (e.g., "Champion Unit", "Signature Spell")
2. Update `RIFTBOUND_RARITIES` to match API (e.g., "Showcase")
3. Update filter logic to use correct field names from Riot API
4. Test with actual Riot API data

**Files to Update:**
- `src/types/filters.ts` - Update constants
- `src/utils/cardFiltering.ts` - Update filtering logic
- `src/components/deckbuilder/CardFilters.tsx` - Verify field mappings

## Next Steps

1. **Test the fixes:**
   - Select various Legends and verify runes auto-populate
   - Verify multi-domain filtering works
   - Check that card counts are correct

2. **Fix remaining filter issues:**
   - Get actual Riot API response to see exact field names
   - Update filter constants to match
   - Test each filter type (Type, Rarity, Cost, Search)

3. **Optional enhancements:**
   - Add visual feedback when runes auto-populate
   - Allow manual rune adjustment after auto-population
   - Add "Reset Runes" button to re-populate

## API Key Reminder

Don't forget to add your Riot API key to `.env`:

```
VITE_RIOT_API_KEY=RGAPI-your-key-here
VITE_USE_RIOT_API=true
```

Get your key from: https://developer.riotgames.com/
