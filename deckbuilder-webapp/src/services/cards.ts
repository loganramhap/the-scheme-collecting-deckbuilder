import axios from 'axios';
import type { MTGCard, RiftboundCard } from '../types/card';

const SCRYFALL_API = 'https://api.scryfall.com';

class CardService {
  private riftboundCards: RiftboundCard[] = [];

  async searchMTGCards(query: string): Promise<MTGCard[]> {
    const { data } = await axios.get(`${SCRYFALL_API}/cards/search`, {
      params: { q: query, unique: 'cards' },
    });
    return data.data || [];
  }

  async getMTGCard(id: string): Promise<MTGCard> {
    const { data } = await axios.get(`${SCRYFALL_API}/cards/${id}`);
    return data;
  }

  async getMTGCardByName(name: string): Promise<MTGCard> {
    const { data } = await axios.get(`${SCRYFALL_API}/cards/named`, {
      params: { exact: name },
    });
    return data;
  }

  loadRiftboundCards(cards: RiftboundCard[]) {
    this.riftboundCards = cards;
  }

  searchRiftboundCards(query: string): RiftboundCard[] {
    const lowerQuery = query.toLowerCase();
    return this.riftboundCards.filter(
      card => card.name.toLowerCase().includes(lowerQuery) ||
              card.faction.toLowerCase().includes(lowerQuery)
    );
  }

  getRiftboundCard(id: string): RiftboundCard | undefined {
    return this.riftboundCards.find(card => card.id === id);
  }
}

export const cardService = new CardService();
