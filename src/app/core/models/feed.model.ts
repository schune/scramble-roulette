import { HoleResult } from './hole-result.model';

/** Hide unscored live rounds from the feed after this long. */
export const STALE_LIVE_FEED_MS = 6 * 60 * 60 * 1000;

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
  /** When the round started (ISO). Used to expire idle live feed entries. */
  startedAt?: string;
  updatedAt: string;
  /** Per-hole cards and scores for the live scorecard view. */
  holes?: HoleResult[];
}

/** Holes with both par and score recorded on a live feed entry. */
export function feedLiveScoredHoleCount(entry: FeedLiveEntry): number {
  return (entry.holes ?? []).filter(
    (hole) => hole.score !== undefined && hole.par !== undefined,
  ).length;
}

/** True when a live entry should be hidden from the global feed (round still active locally). */
export function isStaleLiveFeedEntry(entry: FeedLiveEntry, now = Date.now()): boolean {
  if (feedLiveScoredHoleCount(entry) > 0) {
    return false;
  }

  const startedAt = entry.startedAt ?? entry.updatedAt;
  return now - new Date(startedAt).getTime() >= STALE_LIVE_FEED_MS;
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
