/**
 * Manual tests for deck migration functionality
 * 
 * To run these tests:
 * 1. Import this file in your application
 * 2. Call runMigrationTests() in the console or during development
 * 3. Check console output for test results
 */

import { Deck } from '../types/deck';
import { RiftboundCard } from '../types/card';
import { migrateRiftboundDeck, needsMigration } from './deckMigration';

// Mock card data for testing
const mockCards: RiftboundCard[] = [
  {
    id: 'legend-001',
    name: 'Test Legend',
    card_type: 'Legend',
    domain: 'Fury',
    type: 'legend',
    energy: 0,
  },
  {
    id: 'battlefield-001',
    name: 'Test Battlefield 1',
    card_type: 'Battlefield',
    domain: 'Colorless',
    type: 'battlefield',
    energy: 0,
  },
  {
    id: 'battlefield-002',
    name: 'Test Battlefield 2',
    card_type: 'Battlefield',
    domain: 'Colorless',
    type: 'battlefield',
    energy: 0,
  },
  {
    id: 'battlefield-003',
    name: 'Test Battlefield 3',
    card_type: 'Battlefield',
    domain: 'Colorless',
    type: 'battlefield',
    energy: 0,
  },
  {
    id: 'rune-001',
    name: 'Fury Rune',
    card_type: 'Basic Rune',
    domain: 'Fury',
    type: 'rune',
    energy: 0,
  },
  {
    id: 'rune-002',
    name: 'Calm Rune',
    card_type: 'Basic Rune',
    domain: 'Calm',
    type: 'rune',
    energy: 0,
  },
  {
    id: 'unit-001',
    name: 'Test Unit',
    card_type: 'Unit',
    domain: 'Fury',
    type: 'unit',
    energy: 3,
    might: 3,
  },
  {
    id: 'spell-001',
    name: 'Test Spell',
    card_type: 'Spell',
    domain: 'Fury',
    type: 'spell',
    energy: 2,
  },
];

/**
 * Test 1: Migrate deck with old battlefield field (single card)
 */
function testOldBattlefieldField(): boolean {
  console.log('Test 1: Old battlefield field migration');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'unit-001', count: 4 },
      { id: 'spell-001', count: 2 },
    ],
    battlefield: { id: 'battlefield-001', count: 1 },
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.migrated === true &&
    result.deck.battlefields?.length === 1 &&
    result.deck.battlefields[0].id === 'battlefield-001' &&
    result.deck.battlefield === undefined &&
    result.changes.length > 0;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Test 2: Migrate deck with runes in main deck
 */
function testRunesInMainDeck(): boolean {
  console.log('Test 2: Runes in main deck migration');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'unit-001', count: 4 },
      { id: 'rune-001', count: 6 },
      { id: 'rune-002', count: 6 },
      { id: 'spell-001', count: 2 },
    ],
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.migrated === true &&
    result.deck.runeDeck?.length === 2 &&
    result.deck.cards.length === 2 &&
    result.deck.cards.every(c => c.id !== 'rune-001' && c.id !== 'rune-002');

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Main deck cards:', result.deck.cards.length);
  console.log('  Rune deck cards:', result.deck.runeDeck?.length);
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Test 3: Migrate deck with battlefields in main deck
 */
function testBattlefieldsInMainDeck(): boolean {
  console.log('Test 3: Battlefields in main deck migration');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'unit-001', count: 4 },
      { id: 'battlefield-001', count: 1 },
      { id: 'battlefield-002', count: 1 },
      { id: 'battlefield-003', count: 1 },
      { id: 'spell-001', count: 2 },
    ],
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.migrated === true &&
    result.deck.battlefields?.length === 3 &&
    result.deck.cards.length === 2;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Main deck cards:', result.deck.cards.length);
  console.log('  Battlefields:', result.deck.battlefields?.length);
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Test 4: Migrate deck with legend in main deck
 */
function testLegendInMainDeck(): boolean {
  console.log('Test 4: Legend in main deck migration');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'legend-001', count: 1 },
      { id: 'unit-001', count: 4 },
      { id: 'spell-001', count: 2 },
    ],
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.migrated === true &&
    result.deck.legend?.id === 'legend-001' &&
    result.deck.cards.length === 2 &&
    !result.deck.cards.some(c => c.id === 'legend-001');

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Legend:', result.deck.legend?.id);
  console.log('  Main deck cards:', result.deck.cards.length);
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Test 5: Migrate complete old format deck
 */
function testCompleteOldFormatDeck(): boolean {
  console.log('Test 5: Complete old format deck migration');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'legend-001', count: 1 },
      { id: 'battlefield-001', count: 1 },
      { id: 'battlefield-002', count: 1 },
      { id: 'unit-001', count: 40 },
      { id: 'rune-001', count: 6 },
      { id: 'rune-002', count: 6 },
    ],
    battlefield: { id: 'battlefield-003', count: 1 },
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.migrated === true &&
    result.deck.legend?.id === 'legend-001' &&
    result.deck.battlefields?.length === 3 &&
    result.deck.runeDeck?.length === 2 &&
    result.deck.cards.length === 1 &&
    result.deck.battlefield === undefined;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Legend:', result.deck.legend?.id);
  console.log('  Battlefields:', result.deck.battlefields?.length);
  console.log('  Rune deck:', result.deck.runeDeck?.length);
  console.log('  Main deck:', result.deck.cards.length);
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Test 6: Don't migrate already migrated deck
 */
function testAlreadyMigratedDeck(): boolean {
  console.log('Test 6: Already migrated deck (no changes)');
  
  const newDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    legend: { id: 'legend-001', count: 1 },
    battlefields: [
      { id: 'battlefield-001', count: 1 },
      { id: 'battlefield-002', count: 1 },
      { id: 'battlefield-003', count: 1 },
    ],
    runeDeck: [
      { id: 'rune-001', count: 6 },
      { id: 'rune-002', count: 6 },
    ],
    cards: [
      { id: 'unit-001', count: 40 },
    ],
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(newDeck, mockCards);
  
  const passed = 
    result.migrated === false &&
    result.changes.length === 0;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Migrated:', result.migrated);
  console.log('  Changes:', result.changes.length);
  return passed;
}

/**
 * Test 7: Don't migrate non-Riftbound deck
 */
function testNonRiftboundDeck(): boolean {
  console.log('Test 7: Non-Riftbound deck (no changes)');
  
  const mtgDeck: Deck = {
    game: 'mtg',
    format: 'commander',
    name: 'Test MTG Deck',
    cards: [
      { id: 'card-001', count: 1 },
    ],
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(mtgDeck, mockCards);
  
  const passed = 
    result.migrated === false &&
    result.changes.length === 0;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Migrated:', result.migrated);
  return passed;
}

/**
 * Test 8: Handle unknown cards gracefully
 */
function testUnknownCards(): boolean {
  console.log('Test 8: Unknown cards handling');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'unknown-card', count: 4 },
      { id: 'unit-001', count: 2 },
    ],
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.deck.cards.length === 2 &&
    result.deck.cards.some(c => c.id === 'unknown-card') &&
    result.changes.some(c => c.includes('not found'));

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Cards kept in main deck:', result.deck.cards.length);
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Test 9: needsMigration function
 */
function testNeedsMigrationFunction(): boolean {
  console.log('Test 9: needsMigration function');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [{ id: 'unit-001', count: 4 }],
    battlefield: { id: 'battlefield-001', count: 1 },
    metadata: { author: 'test', created: '2024-01-01' },
  };

  const newDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [{ id: 'unit-001', count: 4 }],
    battlefields: [{ id: 'battlefield-001', count: 1 }],
    runeDeck: [],
    metadata: { author: 'test', created: '2024-01-01' },
  };

  const passed = 
    needsMigration(oldDeck) === true &&
    needsMigration(newDeck) === false;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Old deck needs migration:', needsMigration(oldDeck));
  console.log('  New deck needs migration:', needsMigration(newDeck));
  return passed;
}

/**
 * Test 10: Handle more than 3 battlefields
 */
function testExcessBattlefields(): boolean {
  console.log('Test 10: Excess battlefields handling');
  
  const oldDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'Test Deck',
    cards: [
      { id: 'battlefield-001', count: 1 },
      { id: 'battlefield-002', count: 1 },
      { id: 'battlefield-003', count: 1 },
      { id: 'unit-001', count: 4 },
    ],
    battlefield: { id: 'battlefield-001', count: 1 }, // This would be the 4th
    metadata: {
      author: 'test',
      created: '2024-01-01',
    },
  };

  const result = migrateRiftboundDeck(oldDeck, mockCards);
  
  const passed = 
    result.deck.battlefields?.length === 3 &&
    result.changes.some(c => c.includes('already have 3'));

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Battlefields:', result.deck.battlefields?.length);
  console.log('  Changes:', result.changes);
  return passed;
}

/**
 * Run all migration tests
 */
export function runMigrationTests(): void {
  console.log('=== Running Deck Migration Tests ===\n');
  
  const tests = [
    testOldBattlefieldField,
    testRunesInMainDeck,
    testBattlefieldsInMainDeck,
    testLegendInMainDeck,
    testCompleteOldFormatDeck,
    testAlreadyMigratedDeck,
    testNonRiftboundDeck,
    testUnknownCards,
    testNeedsMigrationFunction,
    testExcessBattlefields,
  ];

  const results = tests.map(test => {
    try {
      const passed = test();
      console.log('');
      return passed;
    } catch (error) {
      console.error('  ERROR:', error);
      console.log('');
      return false;
    }
  });

  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).runMigrationTests = runMigrationTests;
  console.log('Migration tests loaded. Run window.runMigrationTests() to execute.');
}
