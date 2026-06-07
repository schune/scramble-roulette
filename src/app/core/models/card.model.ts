/**
 * Card primitives for the party-game "roulette" mechanic.
 * One card is drawn per hole and the team must follow its instruction.
 */

/** Thematic grouping for a card. Purely cosmetic — all cards are equal rarity. */
export type CardCategory = 'Helps' | 'Hurts' | 'Neutral';

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
  /** Optional muted help line, e.g. when a teammate was chosen at random. */
  helpText?: string;
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
