/** In-progress round broadcast to the global feed (`feedLive/{userId}`). */
export interface FeedLiveEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  roundId: string;
  courseName?: string;
  holeCount: number;
  currentHole: number;
  playerNames: string[];
  totalScore: number;
  toPar: number;
  updatedAt: string;
}

/** Completed round posted to the global feed (`feedPosts/{userId}_{roundId}`). */
export interface FeedPostEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  roundId: string;
  courseName?: string;
  holeCount: number;
  holesPlayed: number;
  playerNames: string[];
  totalScore: number;
  toPar: number;
  endedEarly?: boolean;
  postedAt: string;
}

/** Unified feed row for the UI. */
export type FeedItem =
  | { kind: 'live'; id: string; entry: FeedLiveEntry }
  | { kind: 'completed'; id: string; entry: FeedPostEntry };
