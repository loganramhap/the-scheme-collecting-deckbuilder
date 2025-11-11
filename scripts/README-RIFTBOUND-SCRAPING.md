# Riftbound Card Data Loading

This directory contains scripts to load Riftbound card data from a community Google Sheet.

## Option 1: Download from Google Sheets (Recommended)

Simply run:
```bash
node scripts/download-google-sheet.js
```

This will:
- Download the CSV data from the Google Sheet
- Parse and convert it to JSON format
- Save to `data/riftbound-cards.json`
- Copy to `deckbuilder-webapp/public/data/riftbound-cards.json`

**Source:** https://docs.google.com/spreadsheets/d/1qzhPO27wyNwKvK2istAIPgkjvs67mSpdUTXM1Quwc8Y/edit?gid=590133021#gid=590133021

## Option 2: Manual CSV Download

If the automated download doesn't work:

1. Open the Google Sheet (link above)
2. Go to File > Download > Comma Separated Values (.csv)
3. Save as `data/riftbound-cards.csv`
4. Run: `node scripts/convert-google-sheet.js`

## Option 3: Manual Data Entry

You can manually enter card data following the template in `data/riftbound-cards-template.json`

## Data Format

The card data should follow this structure:

```json
[
  {
    "id": "unique-card-id",
    "name": "Card Name",
    "type": "unit|spell|rune|battlefield|legend",
    "subtype": "warrior|mage|etc",
    "cost": 3,
    "attack": 2,
    "health": 3,
    "rarity": "common|rare|epic|legendary",
    "color": "red|blue|green|etc",
    "text": "Card ability text",
    "flavor": "Flavor text",
    "image_url": "https://...",
    "set": "base"
  }
]
```

## After Loading

The scripts automatically copy the data to `deckbuilder-webapp/public/data/riftbound-cards.json`.

The webapp will automatically load it when building Riftbound decks.

## Troubleshooting

### No cards found
- The page structure may have changed
- Check `data/riftbound-gallery.html` to see the actual HTML
- Update the selectors in the scraping script

### CORS errors
- The scraping scripts run in Node.js, not the browser, so CORS shouldn't be an issue
- If you see CORS errors in the webapp, make sure the JSON file is in the `public/data/` directory

### Rate limiting
- Add delays between requests if scraping multiple pages
- Consider caching the data locally
