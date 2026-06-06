/**
 * Future-ready social models. These are intentionally NOT wired to any
 * backend yet — they define the shape that a later Firebase/Firestore
 * implementation (and the SocialService) will populate.
 */

/** A shareable, public-facing slice of a profile. */
export interface PublicProfile {
  id: string;
  displayName: string;
  avatarDataUrl?: string;
  roundsPlayed: number;
  bestScoreToPar: number | null;
}

/** A directed follow relationship (follower -> followee). */
export interface Follow {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
}
