import express from 'express';
import axios from 'axios';

const router = express.Router();
const SCRYFALL_API = 'https://api.scryfall.com';

// Validate MTG deck
router.post('/mtg', async (req, res) => {
  const { deck } = req.body;
  const errors = [];
  const warnings = [];

  try {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);

    // Format-specific validation
    if (deck.format === 'commander' && totalCards !== 100) {
      errors.push(`Commander decks must have exactly 100 cards. Current: ${totalCards}`);
    } else if ((deck.format === 'standard' || deck.format === 'modern') && totalCards < 60) {
      errors.push(`${deck.format} decks must have at least 60 cards. Current: ${totalCards}`);
    }

    // Check card legality (sample - full implementation would check all cards)
    for (const deckCard of deck.cards.slice(0, 5)) {
      try {
        const { data: card } = await axios.get(`${SCRYFALL_API}/cards/${deckCard.id}`);
        const legality = card.legalities[deck.format];

        if (legality === 'banned') {
          errors.push(`${card.name} is banned in ${deck.format}`);
        } else if (legality === 'not_legal') {
          errors.push(`${card.name} is not legal in ${deck.format}`);
        }
      } catch (error) {
        warnings.push(`Could not validate card: ${deckCard.id}`);
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      warnings,
    });
  } catch (error) {
    console.error('Validation failed:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Validate Riftbound deck
router.post('/riftbound', async (req, res) => {
  const { deck } = req.body;
  const errors = [];
  const warnings = [];

  const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);

  // Riftbound decks are exactly 40 cards (not including legend, 12 rune cards, and 3 battlefields)
  if (totalCards !== 40) {
    errors.push(`Riftbound decks must have exactly 40 cards. Current: ${totalCards}`);
  }

  if (!deck.legend) {
    warnings.push('No Legend selected');
  }

  if (!deck.battlefield) {
    warnings.push('No Battlefield selected');
  }

  res.json({
    valid: errors.length === 0,
    errors,
    warnings,
  });
});

export default router;
