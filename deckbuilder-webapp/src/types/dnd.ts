import { Card } from './card';

export const DND_ITEM_TYPES = {
  CARD: 'CARD',
} as const;

export type DragSourceZone = 'pool' | 'legend' | 'battlefield' | 'deck' | 'commander';

export interface DragItem {
  type: typeof DND_ITEM_TYPES.CARD;
  card: Card;
  sourceZone: DragSourceZone;
}
