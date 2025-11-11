# Riftbound Card Image Download

This script downloads all Riftbound card images locally and converts them to WebP format for optimal performance.

## Installation

First, install the required dependency:
```bash
npm install sharp
```

## Usage

### Basic Download
```bash
node scripts/download-card-images.js
```

This will:
- Download all card images from the URLs in `data/riftbound-cards.json`
- Convert them to WebP format (typically 25-35% smaller)
- Save them to `deckbuilder-webapp/public/images/riftbound/`
- Update the JSON files to use local paths (`/images/riftbound/card-id.webp`)
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

**Adjust WebP quality (1-100, default: 85):**
```bash
node scripts/download-card-images.js --quality 90
```

**Combine options:**
```bash
node scripts/download-card-images.js --force --limit 5 --quality 80
```

## What It Does

1. **Reads card data** from `data/riftbound-cards.json`
2. **Creates directory** `deckbuilder-webapp/public/images/riftbound/`
3. **Downloads each image** with:
   - Automatic retry on failure (3 attempts)
   - Redirect following
   - 30-second timeout per image
   - 200ms delay between downloads
4. **Converts to WebP** format for optimal file size
5. **Updates JSON files** to reference local WebP paths
6. **Shows summary** with file size savings

## Output

The script will show progress for each card:
```
[1/298] Downloading Blazing Scorcher...
  URL: https://cmsassets.rgpub.io/...
  ✓ Downloaded (45.2 KB)
  Converting to WebP...
  ✓ Converted to WebP (31.4 KB, 30.5% smaller)

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
            ├── card-0-blazing-scorcher.webp
            ├── card-1-brazen-buccaneer.webp
            ├── card-2-chemtech-enforcer.webp
            └── ...
```

## WebP Benefits

- **Smaller file sizes**: Typically 25-35% smaller than PNG
- **Faster loading**: Less bandwidth, quicker page loads
- **Better quality**: Better compression than JPEG at same file size
- **Wide support**: All modern browsers support WebP

## Re-running

If you need to re-download images:
- Use `--force` to overwrite existing files
- Or manually delete the `deckbuilder-webapp/public/images/riftbound/` directory first
