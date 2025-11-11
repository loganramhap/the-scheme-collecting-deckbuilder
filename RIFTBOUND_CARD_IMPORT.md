# Riftbound Card Import Guide

## Quick Steps

1. **Download the CSV from Google Sheets**
   - Open: https://docs.google.com/spreadsheets/d/1qzhPO27wyNwKvK2istAIPgkjvs67mSpdUTXM1Quwc8Y/edit?gid=590133021#gid=590133021
   - File > Download > Comma Separated Values (.csv)
   - Save as `data/riftbound-cards.csv` in your project root

2. **Run the conversion script**
   ```bash
   node scripts/convert-google-sheet.js
   ```

3. **Done!** The script will:
   - Parse the CSV file
   - Convert it to JSON format
   - Save to `data/riftbound-cards.json`
   - Copy to `deckbuilder-webapp/public/data/riftbound-cards.json`
   - Show you a summary of the imported cards

## What the Script Does

The conversion script (`scripts/convert-google-sheet.js`) will:
- Read the CSV headers and map them to our card format
- Handle common field name variations (name/card_name, type/card_type, etc.)
- Convert numeric fields (cost, attack, health)
- Generate unique IDs for each card
- Filter out empty rows
- Provide a summary by card type

## Expected CSV Columns

The script will look for these columns (case-insensitive):
- **name** or **card_name** - Card name (required)
- **type** or **card_type** - Card type (unit, spell, rune, battlefield, legend)
- **subtype** or **sub_type** - Card subtype (warrior, mage, etc.)
- **cost** - Mana/resource cost
- **attack** or **atk** - Attack value
- **health** or **hp** - Health value
- **rarity** - Card rarity (common, rare, epic, legendary)
- **color** or **faction** - Card color/faction
- **text** or **ability** or **effect** - Card text/ability
- **flavor** or **flavor_text** - Flavor text
- **image_url** or **image** - Image URL
- **set** or **expansion** - Card set

## Troubleshooting

### Script can't find CSV file
Make sure you saved it to the correct location: `data/riftbound-cards.csv`

### Column names don't match
If the Google Sheet uses different column names, you may need to adjust the mapping in `scripts/convert-google-sheet.js`. Look for the `convertToCardFormat` function.

### Missing data
Check the summary output - it will show you how many cards were imported and break them down by type.

## After Import

Once imported, the cards will be automatically loaded by the webapp when you:
1. Create a new Riftbound deck
2. Open the deck editor
3. Start adding cards

The validation system will enforce:
- 40 cards (excluding legend, runes, battlefields)
- Exactly 1 legend
- Exactly 12 runes
- Exactly 3 battlefields
- Maximum 3 copies of any card
