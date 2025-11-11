/**
 * Script to download Riftbound card images locally
 * Run with: node scripts/download-card-images.js
 * 
 * Options:
 *   --force    Re-download all images even if they exist
 *   --limit N  Only download first N images (for testing)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const forceDownload = args.includes('--force');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : null;

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

async function downloadAllImages() {
  const totalCards = limit ? Math.min(limit, cards.length) : cards.length;
  console.log(`Found ${cards.length} cards${limit ? ` (limiting to ${limit})` : ''}`);
  console.log(`Force download: ${forceDownload}`);
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
      // Determine file extension from URL
      const urlPath = new URL(card.image_url).pathname;
      const ext = path.extname(urlPath) || '.png';
      
      // Create a safe filename from card ID (remove invalid characters)
      const safeId = card.id.replace(/[\/\\:*?"<>|]/g, '-');
      const filename = `${safeId}${ext}`;
      const filepath = path.join(imagesDir, filename);
      
      // Skip if already downloaded (unless force flag is set)
      if (!forceDownload && fs.existsSync(filepath)) {
        console.log(`[${i + 1}/${totalCards}] Skipping ${card.name} - already exists`);
        skipped++;
        
        // Update card to use local path
        card.image_url = `/images/riftbound/${filename}`;
        continue;
      }
      
      console.log(`[${i + 1}/${totalCards}] Downloading ${card.name}...`);
      console.log(`  URL: ${card.image_url}`);
      
      await downloadImage(card.image_url, filepath);
      
      // Verify file was created and has content
      const stats = fs.statSync(filepath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Update card to use local path
      card.image_url = `/images/riftbound/${filename}`;
      
      downloaded++;
      console.log(`  ✓ Saved to ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      
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
