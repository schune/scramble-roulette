import { HoleResult } from './hole-result.model';

/** Hide idle live rounds from the feed after this long without any activity. */
export const STALE_LIVE_FEED_MS = 6 * 60 * 60 * 1000;

/** Remove or republish live feed entries after this long. */
export const OLD_LIVE_FEED_MS = 7 * 24 * 60 * 60 * 1000;

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

function feedLiveLastActivity(entry: FeedLiveEntry): string | undefined {
  return entry.updatedAt ?? entry.startedAt;
}

/** Holes with both par and score recorded on a live feed entry. */
export function feedLiveScoredHoleCount(entry: FeedLiveEntry): number {
  return (entry.holes ?? []).filter(
    (hole) => hole.score !== undefined && hole.par !== undefined,
  ).length;
}

/** True when the team has reached the final hole of their round (e.g. 18/18). */
export function isLiveOnFinalHole(entry: FeedLiveEntry): boolean {
  return entry.currentHole >= entry.holeCount;
}

/** True when a live entry has sat untouched for longer than {@link STALE_LIVE_FEED_MS}. */
export function isStaleLiveFeedEntry(entry: FeedLiveEntry, now = Date.now()): boolean {
  const lastActivity = feedLiveLastActivity(entry);
  if (!lastActivity) {
    return false;
  }
  return now - new Date(lastActivity).getTime() >= STALE_LIVE_FEED_MS;
}

/** True when a live entry is older than {@link OLD_LIVE_FEED_MS} and due for cleanup. */
export function isOldLiveFeedEntry(entry: FeedLiveEntry, now = Date.now()): boolean {
  const lastActivity = feedLiveLastActivity(entry);
  if (!lastActivity) {
    return false;
  }
  return now - new Date(lastActivity).getTime() >= OLD_LIVE_FEED_MS;
}

/** Hide idle or week-old live entries from the shared feed UI. */
export function isHiddenLiveFeedEntry(entry: FeedLiveEntry, now = Date.now()): boolean {
  return isStaleLiveFeedEntry(entry, now) || isOldLiveFeedEntry(entry, now);
}

/** Build a posted scorecard from a stale live entry on the final hole. */
export function feedPostFromLiveEntry(entry: FeedLiveEntry): FeedPostEntry {
  const holesPlayed = feedLiveScoredHoleCount(entry);
  return {
    userId: entry.userId,
    displayName: entry.displayName,
    ...(entry.photoURL ? { photoURL: entry.photoURL } : {}),
    roundId: entry.roundId,
    ...(entry.courseName ? { courseName: entry.courseName } : {}),
    holeCount: entry.holeCount,
    holesPlayed,
    playerNames: entry.playerNames,
    totalScore: entry.totalScore,
    toPar: entry.toPar,
    ...(isLiveOnFinalHole(entry) && holesPlayed < entry.holeCount ? { endedEarly: true } : {}),
    postedAt: entry.updatedAt ?? entry.startedAt ?? new Date().toISOString(),
    holes: entry.holes,
  };
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
