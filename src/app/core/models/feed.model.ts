import { HoleResult } from './hole-result.model';

/** Hide idle live rounds from the feed after this long without any activity. */
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

/**
 * True when a live entry should be hidden from the global feed because the
 * round has been idle too long. The round stays on the owner's profile — it is
 * only dropped from the shared feed to keep it clean. Idle is measured from the
 * last update (a score, hole change, etc.), so both never-scored and
 * abandoned-mid-round rounds eventually fall off.
 */
export function isStaleLiveFeedEntry(entry: FeedLiveEntry, now = Date.now()): boolean {
  const lastActivity = entry.updatedAt ?? entry.startedAt;
  if (!lastActivity) {
    return false;
  }
  return now - new Date(lastActivity).getTime() >= STALE_LIVE_FEED_MS;
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
