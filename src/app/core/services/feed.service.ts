import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import { FeedItem, FeedLiveEntry, FeedPostEntry } from '../models';
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

  readonly enabled = computed(() => this.auth.isSignedIn());

  private readonly _live = signal<FeedLiveEntry[]>([]);
  private readonly _posts = signal<FeedPostEntry[]>([]);

  readonly liveRounds = this._live.asReadonly();
  readonly completedPosts = this._posts.asReadonly();
  readonly liveCount = computed(() => this._live().length);

  readonly items = computed<FeedItem[]>(() => {
    const live: FeedItem[] = this._live()
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

  constructor() {
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
}
