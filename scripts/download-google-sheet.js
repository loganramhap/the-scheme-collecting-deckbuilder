/**
 * Script to download Riftbound card data directly from Google Sheets
 * Run with: node scripts/download-google-sheet.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Google Sheet ID and GID from the URL
const SHEET_ID = '1qzhPO27wyNwKvK2istAIPgkjvs67mSpdUTXM1Quwc8Y';
const GID = '590133021';

// CSV export URL
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      
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

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const cards = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const card = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        card[header] = values[index];
      }
    });
    
    cards.push(card);
  }
  
  return cards;
}

function convertToCardFormat(rawCards) {
  return rawCards.map((raw, index) => {
    // Map field names based on common Google Sheet column names
    // Adjust these based on the actual column names in the sheet
    const name = raw.Name || raw.name || raw['Card Name'] || raw.card_name || '';
    if (!name) return null;
    
    const type = (raw.Type || raw.type || raw['Card Type'] || '').toLowerCase();
    
    return {
      id: `card-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: name,
      type: type,
      subtype: raw.Subtype || raw.subtype || raw['Sub Type'] || undefined,
      cost: raw.Cost || raw.cost ? parseInt(raw.Cost || raw.cost) : undefined,
      attack: raw.Attack || raw.attack || raw.ATK ? parseInt(raw.Attack || raw.attack || raw.ATK) : undefined,
      health: raw.Health || raw.health || raw.HP ? parseInt(raw.Health || raw.health || raw.HP) : undefined,
      rarity: raw.Rarity || raw.rarity ? (raw.Rarity || raw.rarity).toLowerCase() : undefined,
      color: raw.Color || raw.color || raw.Faction || raw.faction || undefined,
      text: raw.Text || raw.text || raw.Ability || raw.ability || raw.Effect || undefined,
      flavor: raw.Flavor || raw.flavor || raw['Flavor Text'] || undefined,
      image_url: raw.Image || raw.image || raw['Image URL'] || raw.image_url || undefined,
      set: raw.Set || raw.set || raw.Expansion || 'base',
    };
  }).filter(card => card !== null);
}

async function main() {
  console.log('Downloading Riftbound cards from Google Sheets...');
  console.log(`URL: ${CSV_URL}\n`);
  
  try {
    const csvText = await downloadFile(CSV_URL);
    console.log(`Downloaded ${csvText.length} bytes`);
    
    // Save raw CSV
    const csvPath = path.join(__dirname, '../data/riftbound-cards.csv');
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, csvText);
    console.log(`Saved raw CSV to: ${csvPath}`);
    
    // Parse CSV
    console.log('\nParsing CSV...');
    const rawCards = parseCSV(csvText);
    console.log(`Found ${rawCards.length} rows`);
    
    if (rawCards.length > 0) {
      console.log('\nColumn headers found:');
      console.log(Object.keys(rawCards[0]).join(', '));
    }
    
    // Convert to card format
    console.log('\nConverting to card format...');
    const cards = convertToCardFormat(rawCards);
    console.log(`Converted ${cards.length} cards`);
    
    // Save JSON
    const jsonPath = path.join(__dirname, '../data/riftbound-cards.json');
    fs.writeFileSync(jsonPath, JSON.stringify(cards, null, 2));
    console.log(`Saved JSON to: ${jsonPath}`);
    
    // Copy to webapp
    const webappPath = path.join(__dirname, '../deckbuilder-webapp/public/data/riftbound-cards.json');
    fs.mkdirSync(path.dirname(webappPath), { recursive: true });
    fs.writeFileSync(webappPath, JSON.stringify(cards, null, 2));
    console.log(`Copied to webapp: ${webappPath}`);
    
    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total cards: ${cards.length}`);
    
    const types = {};
    cards.forEach(card => {
      types[card.type || 'unknown'] = (types[card.type || 'unknown'] || 0) + 1;
    });
    
    console.log('\nCards by type:');
    Object.entries(types).sort().forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nSample cards:');
    console.log(JSON.stringify(cards.slice(0, 3), null, 2));
    
    console.log('\n✓ Done! Cards are ready to use in the webapp.');
    
  } catch (error) {
    console.error('\nError:', error.message);
    console.error('\nIf the download fails, you can manually:');
    console.error('1. Open: https://docs.google.com/spreadsheets/d/1qzhPO27wyNwKvK2istAIPgkjvs67mSpdUTXM1Quwc8Y/edit?gid=590133021#gid=590133021');
    console.error('2. File > Download > Comma Separated Values (.csv)');
    console.error('3. Save as: data/riftbound-cards.csv');
    console.error('4. Run: node scripts/convert-google-sheet.js');
    process.exit(1);
  }
}

main();
