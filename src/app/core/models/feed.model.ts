import { HoleResult } from './hole-result.model';

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
  /** Per-hole cards and scores for the live scorecard view. */
  holes?: HoleResult[];
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
  /** Per-hole cards and scores for the posted scorecard view. */
  holes?: HoleResult[];
}

/** Unified feed row for the UI. */
export type FeedItem =
  | { kind: 'live'; id: string; entry: FeedLiveEntry }
  | { kind: 'completed'; id: string; entry: FeedPostEntry };
