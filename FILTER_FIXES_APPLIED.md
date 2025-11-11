# Filter System Fixes Applied

## Summary

Fixed the right-side filter panel to work correctly with Riot Games API data structure.

## Changes Made

### 1. Updated Filter Constants (`src/types/filters.ts`)

**Card Types** - Now matches Riot API exactly:
```typescript
'Unit'
'Champion Unit'
'Token Unit'
'Spell'
'Signature Spell'
'Gear'
'Basic Rune'
'Battlefield'
'Legend'
```

**Rarities** - Added missing rarities:
```typescript
'Common'
'Uncommon'  // Was missing
'Rare'
'Epic'
'Legendary'
'Showcase'  // New - for alternate art
```

**Domains** - Replaced "Factions" with actual domains:
```typescript
'Fury' (red/orange)
'Calm' (blue)
'Mind' (purple)
'Body' (orange)
'Order' (yellow)
'Colorless' (gray)
```

### 2. Updated Filtering Logic (`src/utils/cardFiltering.ts`)

**Fixed Field Names:**
- `card.type` → `card.card_type` (Riot API field)
- `card.cost` → `card.energy` (Riot API field)
- `card.rank` → `card.rarity` (Riot API field)
- `card.faction` → `card.domain` (Riot API field)
- `card.text` → `card.ability` (Riot API field)

**Improved Domain Filtering:**
- Now handles domains as arrays: `["Fury", "Body"]`
- Now handles domains as strings: `"Fury, Body"`
- Correctly filters cards with multiple domains

**Better Card Detection:**
- Updated `isRiftboundCard()` to check for Riot API fields
- Checks for `domain`, `card_type`, or `energy` fields

### 3. Updated UI (`src/components/deckbuilder/CardFilters.tsx`)

**Domain Filter:**
- Changed label from "Faction" to "Domain"
- Added color coding for each domain
- Uses `RIFTBOUND_DOMAINS` constant

**Visual Improvements:**
- Domain buttons show in their theme colors
- Active filters highlighted with domain color
- Better visual feedback

## How Filters Work Now

### Type Filter
- Filters by `card_type` field from Riot API
- Includes all card types: Unit, Champion Unit, Spell, Gear, etc.
- ✅ Working

### Cost Filter
- Filters by `energy` field from Riot API
- Min/Max range inputs
- ✅ Working

### Rarity Filter
- Filters by `rarity` field from Riot API
- Includes: Common, Uncommon, Rare, Epic, Legendary, Showcase
- ✅ Working

### Domain Filter
- Filters by `domain` field from Riot API
- Handles multiple domains per card
- Shows cards if ANY domain matches
- ✅ Working

### Search Filter
- Searches in `name` field
- Searches in `ability` field (card text)
- Case-insensitive
- ✅ Working

## Testing

### Test Each Filter:

1. **Type Filter:**
   - Click "Unit" → Should show only Unit cards
   - Click "Spell" → Should show only Spell cards
   - Click both → Should show both types

2. **Cost Filter:**
   - Set Min: 3, Max: 5 → Should show cards costing 3-5 energy
   - Set Min: 0, Max: 2 → Should show cheap cards

3. **Rarity Filter:**
   - Click "Common" → Should show common cards
   - Click "Rare" → Should show rare cards
   - Click multiple → Should show all selected rarities

4. **Domain Filter:**
   - Click "Fury" → Should show Fury domain cards
   - Click "Body" → Should show Body domain cards
   - Click both → Should show cards from either domain

5. **Search:**
   - Type "Dragon" → Should show cards with "Dragon" in name
   - Type "draw" → Should show cards with "draw" in ability text

### Combined Filters:

- Select "Unit" + "Fury" → Should show only Fury Units
- Select "Rare" + Cost 5-7 → Should show expensive rare cards
- All filters work together (AND logic)

## Next Steps

1. ✅ Test all filters with real Riot API data
2. ⏳ Remove MTG references from codebase
3. ⏳ Simplify code by removing MTG-specific logic

## Notes

- Filters use AND logic (all selected filters must match)
- Within a filter type, uses OR logic (e.g., "Common OR Rare")
- Empty filters = show all cards
- "Clear All" button resets all filters
