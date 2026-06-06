/**
 * Card primitives for the party-game "roulette" mechanic.
 * One card is drawn per hole and the team must follow its instruction.
 */

/** Thematic grouping for a card. Purely cosmetic — all cards are equal rarity. */
export type CardCategory = 'Punishment' | 'Drinking' | 'Strategy' | 'Team Chaos' | 'Random';

/**
 * A single party card.
 */
export interface Card {
  id: string;
  /** Display name, e.g. "The Beer Hole". */
  name: string;
  category: CardCategory;
  /** The instruction the team must follow on this hole. */
  text: string;
  /** Optional flavor line shown beneath the instruction. */
  flavor?: string;
  /** Id of the pack this card belongs to. */
  packId: string;
}

/**
 * A named collection of cards (e.g. the "Standard" pack).
 */
export interface CardPack {
  id: string;
  name: string;
  cards: Card[];
}
