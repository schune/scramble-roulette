/** A searchable, public-facing slice of a user profile. */
export interface PublicProfile {
  id: string;
  displayName: string;
  displayNameLower: string;
  photoURL?: string;
  roundsPlayed: number;
  bestScoreToPar: number | null;
  /** True when the player has an in-progress round broadcast to followers. */
  isLive?: boolean;
  updatedAt: string;
}

/** Stored under users/{followerId}/following/{followeeId}. */
export interface FollowingEdge {
  followeeId: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

/** Stored under users/{followeeId}/followers/{followerId}. */
export interface FollowerEdge {
  followerId: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

/** Lightweight live scoreboard followers can read during a round. */
export interface LiveRoundSnapshot {
  roundId: string;
  courseName?: string;
  holeCount: number;
  currentHole: number;
  playerNames: string[];
  totalScore: number;
  toPar: number;
  updatedAt: string;
}

/** Live round plus the followee identity for UI rendering. */
export interface FollowingLiveRound {
  userId: string;
  displayName: string;
  photoURL?: string;
  snapshot: LiveRoundSnapshot;
}
