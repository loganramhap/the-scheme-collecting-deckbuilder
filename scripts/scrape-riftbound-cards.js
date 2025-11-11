/**
 * Script to scrape Riftbound card data from the official Riot card gallery
 * Run with: node scripts/scrape-riftbound-cards.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CARD_GALLERY_URL = 'https://riftbound.leagueoflegends.com/en-us/card-gallery/';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function parseCardData(html) {
  const cards = [];
  
  // This is a basic parser - we'll need to adjust based on the actual HTML structure
  // Look for card data in script tags or data attributes
  
  // Try to find JSON data embedded in the page
  const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s) ||
                    html.match(/window\.__CARD_DATA__\s*=\s*({.+?});/s) ||
                    html.match(/"cards"\s*:\s*(\[.+?\])/s);
  
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      console.log('Found JSON data:', Object.keys(data));
      
      // Extract cards from the data structure
      if (Array.isArray(data)) {
        return data;
      } else if (data.cards) {
        return data.cards;
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  }
  
  // Fallback: parse HTML structure
  // Look for card elements with data attributes
  const cardPattern = /<div[^>]*class="[^"]*card[^"]*"[^>]*>(.*?)<\/div>/gis;
  const matches = html.matchAll(cardPattern);
  
  for (const match of matches) {
    const cardHtml = match[0];
    
    // Extract card attributes
    const nameMatch = cardHtml.match(/data-name="([^"]+)"/i) || 
                     cardHtml.match(/<h[^>]*>([^<]+)<\/h/i);
    const typeMatch = cardHtml.match(/data-type="([^"]+)"/i) ||
                     cardHtml.match(/class="[^"]*type[^"]*">([^<]+)</i);
    const imageMatch = cardHtml.match(/src="([^"]+)"/i);
    const idMatch = cardHtml.match(/data-id="([^"]+)"/i);
    
    if (nameMatch) {
      cards.push({
        id: idMatch ? idMatch[1] : nameMatch[1].toLowerCase().replace(/\s+/g, '-'),
        name: nameMatch[1],
        type: typeMatch ? typeMatch[1].toLowerCase() : 'unknown',
        image_url: imageMatch ? imageMatch[1] : null,
      });
    }
  }
  
  return cards;
}

async function main() {
  console.log('Fetching Riftbound card gallery...');
  
  try {
    const html = await fetchPage(CARD_GALLERY_URL);
    console.log(`Fetched ${html.length} bytes of HTML`);
    
    // Save raw HTML for inspection
    const htmlPath = path.join(__dirname, '../data/riftbound-gallery.html');
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, html);
    console.log(`Saved raw HTML to ${htmlPath}`);
    
    const cards = parseCardData(html);
    console.log(`Parsed ${cards.length} cards`);
    
    if (cards.length === 0) {
      console.log('\nNo cards found. The page structure may have changed.');
      console.log('Please inspect the saved HTML file and update the parser.');
      console.log('\nSample of HTML (first 2000 chars):');
      console.log(html.substring(0, 2000));
      return;
    }
    
    // Save card data
    const outputPath = path.join(__dirname, '../data/riftbound-cards.json');
    fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
    console.log(`Saved ${cards.length} cards to ${outputPath}`);
    
    // Print sample
    console.log('\nSample cards:');
    console.log(JSON.stringify(cards.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
