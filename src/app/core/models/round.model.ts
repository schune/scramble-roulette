import { HoleResult } from './hole-result.model';
import { Player } from './player.model';

/**
 * Lifecycle status of a round.
 */
export type RoundStatus = 'setup' | 'in-progress' | 'complete';

/**
 * Supported scramble formats.
 */
export type HoleCount = 9 | 18;

/**
 * A full scramble round: who played, the format, and the per-hole results.
 */
export interface Round {
  id: string;
  /** ISO timestamp for when the round was created. */
  createdAt: string;
  /** Number of holes being played (9 or 18). */
  holeCount: HoleCount;
  status: RoundStatus;
  players: Player[];
  holes: HoleResult[];
  /** 1-based index of the hole currently in play. */
  currentHole: number;
  /** Id of the card pack used for this round. */
  packId: string;
  /** ISO timestamp for when the round was completed, if finished. */
  completedAt?: string;
  /** Optional display name for the round (e.g. "Saturday Skins"). */
  name?: string;
  /** Optional course being played. */
  courseName?: string;
  /** True when the round was ended before all holes were played. */
  endedEarly?: boolean;
}
