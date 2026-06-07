import { Injectable } from '@angular/core';
import { Card, CardPack, Player } from '../models';

/** Substituted with a randomly chosen teammate when the card is drawn. */
export const CARD_PLAYER_PLACEHOLDER = '{{player}}';

/** Shown beneath cards where a teammate was picked at random. */
export const RANDOM_PLAYER_HELP_TEXT = 'This player was chosen at random.';
import { STANDARD_PACK, STANDARD_PACK_ID } from '../data/standard-pack';

/**
 * Owns the card packs and the per-round draw engine.
 *
 * Drawing rules (per product plan):
 * - One random card is drawn per hole.
 * - All cards are equal rarity (uniform random selection).
 * - No card repeats within a round.
 * - The deck "resets" each new round — this service is stateless with
 *   respect to the round, so callers simply pass the set of already-used
 *   card ids and a fresh round naturally starts from the full pack.
 */
@Injectable({ providedIn: 'root' })
export class CardDeckService {
  private readonly packs: ReadonlyMap<string, CardPack> = new Map([
    [STANDARD_PACK.id, STANDARD_PACK],
  ]);

  /** The default pack id ("standard"). */
  readonly defaultPackId = STANDARD_PACK_ID;

  /** All available packs. */
  getPacks(): CardPack[] {
    return [...this.packs.values()];
  }

  /** Look up a pack by id, defaulting to the Standard pack. */
  getPack(packId: string = STANDARD_PACK_ID): CardPack {
    return this.packs.get(packId) ?? STANDARD_PACK;
  }

  /** Total number of cards in a pack. */
  packSize(packId: string = STANDARD_PACK_ID): number {
    return this.getPack(packId).cards.length;
  }

  /** Cards in a pack that have not yet been used this round. */
  remainingCards(usedCardIds: Iterable<string>, packId: string = STANDARD_PACK_ID): Card[] {
    const used = new Set(usedCardIds);
    return this.getPack(packId).cards.filter((card) => !used.has(card.id));
  }

  /** Whether every card in the pack has been drawn this round. */
  isExhausted(usedCardIds: Iterable<string>, packId: string = STANDARD_PACK_ID): boolean {
    return this.remainingCards(usedCardIds, packId).length === 0;
  }

  /**
   * Draw one uniformly-random card that has not been used this round.
   * Returns `null` when the pack is exhausted.
   */
  draw(usedCardIds: Iterable<string>, packId: string = STANDARD_PACK_ID): Card | null {
    const remaining = this.remainingCards(usedCardIds, packId);
    if (remaining.length === 0) {
      return null;
    }
    const index = this.randomInt(remaining.length);
    return remaining[index];
  }

  /**
   * Replace `{{player}}` in a card's text with a randomly chosen teammate.
   * The resolved card is stored on the hole so history stays consistent.
   */
  personalize(card: Card, players: readonly Player[]): Card {
    if (!card.text.includes(CARD_PLAYER_PLACEHOLDER) || players.length === 0) {
      return card;
    }
    const player = players[this.randomInt(players.length)];
    return {
      ...card,
      text: card.text.replaceAll(CARD_PLAYER_PLACEHOLDER, player.name),
      helpText: RANDOM_PLAYER_HELP_TEXT,
    };
  }

  /** Crypto-backed when available, falling back to Math.random. */
  private randomInt(maxExclusive: number): number {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const buffer = new Uint32Array(1);
      // Rejection sampling to avoid modulo bias.
      const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
      let value = 0;
      do {
        crypto.getRandomValues(buffer);
        value = buffer[0];
      } while (value >= limit);
      return value % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }
}
