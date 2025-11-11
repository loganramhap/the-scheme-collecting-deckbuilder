/**
 * Script to convert Riftbound card data from Google Sheets CSV export to JSON
 * 
 * Instructions:
 * 1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1qzhPO27wyNwKvK2istAIPgkjvs67mSpdUTXM1Quwc8Y/edit?gid=590133021#gid=590133021
 * 2. Go to File > Download > Comma Separated Values (.csv)
 * 3. Save the CSV file as 'data/riftbound-cards.csv'
 * 4. Run: node scripts/convert-google-sheet.js
 */

const fs = require('fs');
const path = require('path');

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const cards = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parser (may need adjustment based on actual format)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    const card = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        card[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
      }
    });
    
    if (card.name || card.card_name) {
      cards.push(card);
    }
  }
  
  return cards;
}

function convertToCardFormat(rawCards) {
  return rawCards.map((raw, index) => {
    // Map CSV columns to card format
    // CSV columns: Game, Set, Card Number, Card Name, Energy, Might, Domain, Card Type, Tags, Ability, Rarity, Artist, Image URL
    const name = raw.card_name || raw['card name'] || raw.name || '';
    const cardNumber = raw.card_number || raw['card number'] || raw.number || undefined;
    const cardType = raw.card_type || raw['card type'] || raw.type || '';
    const normalizedType = cardType.toLowerCase().trim();
    const energy = raw.energy ? parseInt(raw.energy) : undefined;
    const might = raw.might ? parseInt(raw.might) : undefined;
    const domain = raw.domain || raw.color || undefined;
    const ability = raw.ability || raw.text || undefined;
    const imageUrl = raw.image_url || raw['image url'] || raw.image || undefined;
    
    return {
      // Unique identifier
      id: raw.id || cardNumber || `card-${index}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      
      // Original CSV fields
      game: raw.game || 'Riftbound',
      set: raw.set || undefined,
      card_number: cardNumber,
      name: name,
      energy: energy,
      might: might,
      domain: domain,
      card_type: cardType,
      tags: raw.tags || undefined,
      ability: ability,
      rarity: raw.rarity || undefined,
      artist: raw.artist || undefined,
      image_url: imageUrl,
      
      // Normalized fields for filtering/compatibility
      type: normalizedType,
      cost: energy,
      attack: might,
      color: domain,
      text: ability,
    };
  }).filter(card => card.name); // Remove empty entries
}

function main() {
  const csvPath = path.join(__dirname, '../data/riftbound-cards.csv');
  const outputPath = path.join(__dirname, '../data/riftbound-cards.json');
  const webappPath = path.join(__dirname, '../deckbuilder-webapp/public/data/riftbound-cards.json');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`\nCSV file not found: ${csvPath}`);
    console.error('\nPlease follow these steps:');
    console.error('1. Open: https://docs.google.com/spreadsheets/d/1qzhPO27wyNwKvK2istAIPgkjvs67mSpdUTXM1Quwc8Y/edit?gid=590133021#gid=590133021');
    console.error('2. File > Download > Comma Separated Values (.csv)');
    console.error('3. Save as: data/riftbound-cards.csv');
    console.error('4. Run this script again\n');
    process.exit(1);
  }
  
  console.log('Reading CSV file...');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  
  console.log('Parsing CSV...');
  const rawCards = parseCSV(csvText);
  console.log(`Found ${rawCards.length} rows`);
  
  console.log('Converting to card format...');
  const cards = convertToCardFormat(rawCards);
  console.log(`Converted ${cards.length} cards`);
  
  // Save to data directory
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
  console.log(`Saved to: ${outputPath}`);
  
  // Copy to webapp public directory
  fs.mkdirSync(path.dirname(webappPath), { recursive: true });
  fs.writeFileSync(webappPath, JSON.stringify(cards, null, 2));
  console.log(`Copied to: ${webappPath}`);
  
  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Total cards: ${cards.length}`);
  
  const types = {};
  cards.forEach(card => {
    types[card.type] = (types[card.type] || 0) + 1;
  });
  
  console.log('\nCards by type:');
  Object.entries(types).sort().forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\nSample cards:');
  console.log(JSON.stringify(cards.slice(0, 3), null, 2));
  
  console.log('\n✓ Done! Cards are ready to use in the webapp.');
}

main();
