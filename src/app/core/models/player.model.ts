/**
 * A participant in a scramble round.
 */
export interface Player {
  id: string;
  name: string;
  /** Golf handicap index, if known. */
  handicap?: number;
  /** Hex color used for the player's chip/avatar in the UI. */
  color?: string;
  /** Optional short initials used as an avatar fallback. */
  initials?: string;
}
