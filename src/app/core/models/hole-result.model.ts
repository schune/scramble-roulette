import { Card } from './card.model';

/**
 * The recorded outcome of a single hole within a round.
 *
 * A card is always drawn for the hole first; par/score and the derived
 * scoring fields are filled in when the team completes the hole.
 */
export interface HoleResult {
  /** 1-based hole number. */
  holeNumber: number;
  /** The card drawn for this hole. */
  card: Card;
  /** Par for the hole, entered by the team. */
  par?: number;
  /** Strokes taken by the team, entered by the team. */
  score?: number;
  /** Strokes relative to par (score - par); negative is under par. */
  scoreToPar?: number;
  /** Human label, e.g. "Birdie", "Triple Bogey+". */
  resultLabel?: string;
  /** ISO timestamp for when the hole was completed. */
  completedAt?: string;
}
