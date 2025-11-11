# Riftbound Card Image Download

This script downloads all Riftbound card images locally for better performance and offline access.

## Usage

### Basic Download
```bash
node scripts/download-card-images.js
```

This will:
- Download all card images from the URLs in `data/riftbound-cards.json`
- Save them to `deckbuilder-webapp/public/images/riftbound/`
- Update the JSON files to use local paths (`/images/riftbound/card-id.png`)
- Skip images that already exist

### Options

**Force re-download all images:**
```bash
node scripts/download-card-images.js --force
```

**Test with limited downloads:**
```bash
node scripts/download-card-images.js --limit 10
```

**Combine options:**
```bash
node scripts/download-card-images.js --force --limit 5
```

## What It Does

1. **Reads card data** from `data/riftbound-cards.json`
2. **Creates directory** `deckbuilder-webapp/public/images/riftbound/`
3. **Downloads each image** with:
   - Automatic retry on failure (3 attempts)
   - Redirect following
   - 30-second timeout per image
   - 200ms delay between downloads
4. **Updates JSON files** to reference local paths
5. **Shows summary** of downloaded, skipped, and failed images

## Output

The script will show progress for each card:
```
[1/298] Downloading Blazing Scorcher...
  URL: https://cmsassets.rgpub.io/...
  ✓ Saved to card-0-blazing-scorcher.png (45.2 KB)

[2/298] Skipping Brazen Buccaneer - already exists
```

Final summary:
```
=== Summary ===
Downloaded: 250
Skipped: 45
Failed: 3
Total: 298
```

## Troubleshooting

### Images fail to download
- Check your internet connection
- The Riot CDN might be rate-limiting - try again later
- Use `--limit 10` to test with fewer images first

### "Timeout" errors
- The CDN might be slow - the script will retry automatically
- If many timeouts occur, try running the script again (it will skip already downloaded images)

### "HTTP 403" or "HTTP 404" errors
- Some image URLs in the CSV might be invalid
- Check the failed downloads list at the end
- You may need to manually update those URLs in the CSV

## After Download

Once images are downloaded:
1. The webapp will load images from local files instead of the CDN
2. Much faster loading times
3. Works offline
4. No CORS issues

## File Structure

```
deckbuilder-webapp/
└── public/
    └── images/
        └── riftbound/
            ├── card-0-blazing-scorcher.png
            ├── card-1-brazen-buccaneer.png
            ├── card-2-chemtech-enforcer.png
            └── ...
```

## Re-running

If you need to re-download images:
- Use `--force` to overwrite existing files
- Or manually delete the `deckbuilder-webapp/public/images/riftbound/` directory first
