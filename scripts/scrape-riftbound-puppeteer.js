/**
 * Script to scrape Riftbound card data using Puppeteer
 * Install: npm install puppeteer
 * Run with: node scripts/scrape-riftbound-puppeteer.js
 */

const fs = require('fs');
const path = require('path');

async function scrapeWithPuppeteer() {
  let browser;
  try {
    const puppeteer = require('puppeteer');
    
    console.log('Launching browser...');
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log('Navigating to card gallery...');
    await page.goto('https://riftbound.leagueoflegends.com/en-us/card-gallery/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Waiting for cards to load...');
    await page.waitForTimeout(3000);
    
    // Extract card data from the page
    const cards = await page.evaluate(() => {
      const cardElements = document.querySelectorAll('[class*="card"], [data-card], .card-item, [class*="Card"]');
      const results = [];
      
      cardElements.forEach((el) => {
        // Try to extract card information
        const name = el.querySelector('[class*="name"], [class*="title"], h3, h4')?.textContent?.trim();
        const type = el.querySelector('[class*="type"], [class*="category"]')?.textContent?.trim();
        const image = el.querySelector('img')?.src;
        const id = el.getAttribute('data-id') || el.getAttribute('id');
        
        if (name) {
          results.push({
            id: id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            name: name,
            type: type || 'unknown',
            image_url: image || null,
          });
        }
      });
      
      return results;
    });
    
    console.log(`Found ${cards.length} cards`);
    
    // Save the data
    const outputPath = path.join(__dirname, '../data/riftbound-cards.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
    
    console.log(`Saved to ${outputPath}`);
    console.log('\nSample cards:');
    console.log(JSON.stringify(cards.slice(0, 3), null, 2));
    
    await browser.close();
    return cards;
    
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function main() {
  try {
    await scrapeWithPuppeteer();
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\nPuppeteer not installed. Install it with:');
      console.error('  npm install puppeteer\n');
      console.error('Or use the manual approach in scrape-riftbound-cards.js');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

main();
