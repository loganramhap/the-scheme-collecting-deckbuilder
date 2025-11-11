/**
 * Script to download Riftbound card images locally and convert to WebP
 * Run with: node scripts/download-card-images.js
 * 
 * Requirements:
 *   npm install sharp
 * 
 * Options:
 *   --force    Re-download all images even if they exist
 *   --limit N  Only download first N images (for testing)
 *   --quality N  WebP quality (1-100, default: 85)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Try to load sharp for WebP conversion
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp module not found. Install it with: npm install sharp');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const forceDownload = args.includes('--force');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : null;
const qualityIndex = args.indexOf('--quality');
const webpQuality = qualityIndex >= 0 ? parseInt(args[qualityIndex + 1]) : 85;

// Read the card data
const cardsPath = path.join(__dirname, '../data/riftbound-cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

// Create images directory
const imagesDir = path.join(__dirname, '../deckbuilder-webapp/public/images/riftbound');
fs.mkdirSync(imagesDir, { recursive: true });

function downloadImage(url, filepath, retries = 3) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        // Handle redirects
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath, retries).then(resolve).catch(reject);
        } else {
          reject(new Error('Redirect without location header'));
        }
      } else {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      
      // Retry on error
      if (retries > 0) {
        console.log(`  Retrying... (${retries} attempts left)`);
        setTimeout(() => {
          downloadImage(url, filepath, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(err);
      }
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function convertToWebP(inputPath, outputPath, quality = 85) {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);
    
    // Delete original file
    fs.unlinkSync(inputPath);
    
    return true;
  } catch (error) {
    console.error(`    WebP conversion failed: ${error.message}`);
    return false;
  }
}

async function downloadAllImages() {
  const totalCards = limit ? Math.min(limit, cards.length) : cards.length;
  console.log(`Found ${cards.length} cards${limit ? ` (limiting to ${limit})` : ''}`);
  console.log(`Force download: ${forceDownload}`);
  console.log(`WebP quality: ${webpQuality}`);
  console.log(`Images directory: ${imagesDir}\n`);
  
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  const failedCards = [];
  
  for (let i = 0; i < totalCards; i++) {
    const card = cards[i];
    
    if (!card.image_url) {
      console.log(`[${i + 1}/${totalCards}] Skipping ${card.name} - no image URL`);
      skipped++;
      continue;
    }
    
    // Skip if URL is already local
    if (card.image_url.startsWith('/images/')) {
      console.log(`[${i + 1}/${totalCards}] Skipping ${card.name} - already using local path`);
      skipped++;
      continue;
    }
    
    try {
      // Create a safe filename from card ID (remove invalid characters)
      const safeId = card.id.replace(/[\/\\:*?"<>|]/g, '-');
      const webpFilename = `${safeId}.webp`;
      const webpPath = path.join(imagesDir, webpFilename);
      
      // Skip if already downloaded (unless force flag is set)
      if (!forceDownload && fs.existsSync(webpPath)) {
        console.log(`[${i + 1}/${totalCards}] Skipping ${card.name} - already exists`);
        skipped++;
        
        // Update card to use local path
        card.image_url = `/images/riftbound/${webpFilename}`;
        continue;
      }
      
      console.log(`[${i + 1}/${totalCards}] Downloading ${card.name}...`);
      console.log(`  URL: ${card.image_url}`);
      
      // Download to temporary file first
      const urlPath = new URL(card.image_url).pathname;
      const ext = path.extname(urlPath) || '.png';
      const tempFilename = `${safeId}_temp${ext}`;
      const tempPath = path.join(imagesDir, tempFilename);
      
      await downloadImage(card.image_url, tempPath);
      
      // Verify file was created and has content
      const tempStats = fs.statSync(tempPath);
      if (tempStats.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      console.log(`  ✓ Downloaded (${(tempStats.size / 1024).toFixed(1)} KB)`);
      console.log(`  Converting to WebP...`);
      
      // Convert to WebP
      const converted = await convertToWebP(tempPath, webpPath, webpQuality);
      
      if (!converted) {
        // If conversion failed, keep original
        fs.renameSync(tempPath, path.join(imagesDir, `${safeId}${ext}`));
        card.image_url = `/images/riftbound/${safeId}${ext}`;
        console.log(`  ⚠ Kept original format`);
      } else {
        // Check WebP file size
        const webpStats = fs.statSync(webpPath);
        const savings = ((1 - webpStats.size / tempStats.size) * 100).toFixed(1);
        
        // Update card to use local WebP path
        card.image_url = `/images/riftbound/${webpFilename}`;
        
        console.log(`  ✓ Converted to WebP (${(webpStats.size / 1024).toFixed(1)} KB, ${savings}% smaller)`);
      }
      
      downloaded++;
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
      failed++;
      failedCards.push({ name: card.name, url: card.image_url, error: error.message });
    }
  }
  
  // Save updated card data
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log(`\n✓ Updated ${cardsPath} with local image paths`);
  
  // Also update the webapp's public data
  const webappPath = path.join(__dirname, '../deckbuilder-webapp/public/data/riftbound-cards.json');
  fs.mkdirSync(path.dirname(webappPath), { recursive: true });
  fs.writeFileSync(webappPath, JSON.stringify(cards, null, 2));
  console.log(`✓ Updated ${webappPath} with local image paths`);
  
  console.log('\n=== Summary ===');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${totalCards}`);
  
  if (failedCards.length > 0) {
    console.log('\n=== Failed Downloads ===');
    failedCards.forEach(({ name, url, error }) => {
      console.log(`${name}: ${error}`);
      console.log(`  URL: ${url}`);
    });
  }
  
  console.log('\n✓ Done!');
}

downloadAllImages().catch(console.error);
