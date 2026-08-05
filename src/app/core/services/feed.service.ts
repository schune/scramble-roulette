import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import {
  FeedItem,
  FeedLiveEntry,
  FeedPostEntry,
  HoleCount,
  isStaleLiveFeedEntry,
  Player,
  Round,
} from '../models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

/**
 * Global clubhouse feed — all live rounds and recently posted scorecards.
 *
 * Requires sign-in to read (Firestore rules). Guests see an empty feed until
 * they authenticate.
 */
@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);

  private readonly _live = signal<FeedLiveEntry[]>([]);
  private readonly _posts = signal<FeedPostEntry[]>([]);
  /** Ticks every minute so stale live entries drop off without a Firestore write. */
  private readonly _now = signal(Date.now());

  private readonly visibleLive = computed(() => {
    const now = this._now();
    return this._live().filter((entry) => !isStaleLiveFeedEntry(entry, now));
  });

  readonly liveRounds = this.visibleLive;
  readonly completedPosts = this._posts.asReadonly();

  readonly items = computed<FeedItem[]>(() => {
    const live: FeedItem[] = this.visibleLive()
      .map((entry) => ({ kind: 'live' as const, id: entry.userId, entry }))
      .sort(
        (a, b) =>
          new Date(b.entry.updatedAt).getTime() - new Date(a.entry.updatedAt).getTime(),
      );

    const completed: FeedItem[] = this._posts()
      .map((entry) => ({
        kind: 'completed' as const,
        id: `${entry.userId}_${entry.roundId}`,
        entry,
      }))
      .sort(
        (a, b) =>
          new Date(b.entry.postedAt).getTime() - new Date(a.entry.postedAt).getTime(),
      );

    return [...live, ...completed];
  });

  private currentUid: string | null = null;
  private liveUnsub: Unsubscribe | null = null;
  private postsUnsub: Unsubscribe | null = null;
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.staleCheckTimer = setInterval(() => this._now.set(Date.now()), 60_000);
    }

    effect(() => {
      const uid = this.auth.uid();
      if (uid === this.currentUid) {
        return;
      }
      this.currentUid = uid;
      this.detach();
      if (uid) {
        this.attach(uid);
      }
    });
  }

  private attach(uid: string): void {
    this.liveUnsub = this.firestore.listenFeedLive((entries) => {
      if (this.currentUid !== uid) {
        return;
      }
      this._live.set(entries);
    });

    this.postsUnsub = this.firestore.listenFeedPosts((entries) => {
      if (this.currentUid !== uid) {
        return;
      }
      this._posts.set(entries);
    });
  }

  private detach(): void {
    this.liveUnsub?.();
    this.liveUnsub = null;
    this.postsUnsub?.();
    this.postsUnsub = null;
    this._live.set([]);
    this._posts.set([]);
  }

  /** Resolve a feed-backed round for the scorecard (live or posted). */
  getFeedRound(userId: string, roundId: string): Round | null {
    const live = this._live().find(
      (entry) => entry.userId === userId && entry.roundId === roundId,
    );
    if (live) {
      return this.roundFromLive(live);
    }

    const post = this._posts().find(
      (entry) => entry.userId === userId && entry.roundId === roundId,
    );
    if (post) {
      return this.roundFromPost(post);
    }

    return null;
  }

  /** Fetch a feed-backed round from Firestore when it is not in the listener cache. */
  async fetchFeedRound(userId: string, roundId: string): Promise<Round | null> {
    const cached = this.getFeedRound(userId, roundId);
    if (cached) {
      return cached;
    }

    const live = await this.firestore.getFeedLive(userId);
    if (live?.roundId === roundId) {
      return this.roundFromLive(live);
    }

    const post = await this.firestore.getFeedPost(userId, roundId);
    if (post) {
      return this.roundFromPost(post);
    }

    return this.firestore.getRound(userId, roundId);
  }

  private roundFromLive(entry: FeedLiveEntry): Round {
    return {
      id: entry.roundId,
      createdAt: entry.startedAt ?? entry.updatedAt,
      holeCount: entry.holeCount as HoleCount,
      status: 'in-progress',
      players: this.playersFromNames(entry.playerNames),
      holes: entry.holes ?? [],
      currentHole: entry.currentHole,
      packId: entry.holes?.[0]?.card.packId ?? 'standard',
      ...(entry.courseName ? { courseName: entry.courseName } : {}),
    };
  }

  private roundFromPost(entry: FeedPostEntry): Round {
    return {
      id: entry.roundId,
      createdAt: entry.postedAt,
      holeCount: entry.holeCount as HoleCount,
      status: 'complete',
      players: this.playersFromNames(entry.playerNames),
      holes: entry.holes ?? [],
      currentHole: entry.holesPlayed,
      packId: entry.holes?.[0]?.card.packId ?? 'standard',
      completedAt: entry.postedAt,
      ...(entry.courseName ? { courseName: entry.courseName } : {}),
      ...(entry.endedEarly ? { endedEarly: true } : {}),
    };
  }

  private playersFromNames(names: string[]): Player[] {
    return names.map((name, index) => ({
      id: `feed-player-${index}`,
      name,
    }));
  }
}
