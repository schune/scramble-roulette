import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import {
  FollowingEdge,
  FollowingLiveRound,
  LiveRoundSnapshot,
  PublicProfile,
} from '../models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { ProfileService } from './profile.service';

/**
 * Browse, search, follow users, and listen to followed players' live rounds.
 *
 * Requires sign-in — guests see empty state and sign-in prompts in the UI.
 */
@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);
  private readonly profile = inject(ProfileService);

  readonly enabled = computed(() => this.auth.isSignedIn());

  private readonly _following = signal<FollowingEdge[]>([]);
  private readonly _searchResults = signal<PublicProfile[]>([]);
  private readonly _searching = signal(false);
  private readonly _followingLive = signal<FollowingLiveRound[]>([]);
  private readonly _suggestedPool = signal<PublicProfile[]>([]);
  private readonly _loadingSuggested = signal(false);

  readonly following = this._following.asReadonly();
  readonly searchResults = this._searchResults.asReadonly();
  readonly searching = this._searching.asReadonly();
  readonly followingLiveRounds = this._followingLive.asReadonly();
  readonly loadingSuggested = this._loadingSuggested.asReadonly();
  readonly followingCount = computed(() => this._following().length);
  readonly suggestedPlayers = computed(() => {
    const uid = this.auth.uid();
    const followingIds = new Set(this._following().map((edge) => edge.followeeId));
    return this._suggestedPool()
      .filter((profile) => profile.id !== uid && !followingIds.has(profile.id))
      .slice(0, 3);
  });

  private currentUid: string | null = null;
  private followingUnsub: Unsubscribe | null = null;
  private readonly liveUnsubs = new Map<string, Unsubscribe>();
  private readonly liveSnapshots = new Map<string, LiveRoundSnapshot>();

  constructor() {
    effect(() => {
      const uid = this.auth.uid();
      if (uid === this.currentUid) {
        return;
      }
      this.currentUid = uid;
      this.detach();
      if (uid) {
        this.attachFollowing(uid);
        void this.loadSuggestedPlayers();
      }
    });

    effect(() => {
      const edges = this._following();
      this.syncLiveListeners(edges);
    });
  }

  isFollowing(followeeId: string): boolean {
    return this._following().some((edge) => edge.followeeId === followeeId);
  }

  async search(term: string): Promise<void> {
    const trimmed = term.trim();
    if (!trimmed || !this.auth.isSignedIn()) {
      this._searchResults.set([]);
      return;
    }

    this._searching.set(true);
    try {
      const results = await this.firestore.searchPublicProfiles(trimmed);
      const uid = this.auth.uid();
      this._searchResults.set(uid ? results.filter((p) => p.id !== uid) : results);
    } catch {
      this._searchResults.set([]);
    } finally {
      this._searching.set(false);
    }
  }

  clearSearch(): void {
    this._searchResults.set([]);
  }

  async loadSuggestedPlayers(): Promise<void> {
    if (!this.auth.isSignedIn()) {
      this._suggestedPool.set([]);
      return;
    }

    this._loadingSuggested.set(true);
    try {
      const profiles = await this.firestore.listRecentPublicProfiles();
      this._suggestedPool.set(profiles);
    } catch {
      this._suggestedPool.set([]);
    } finally {
      this._loadingSuggested.set(false);
    }
  }

  async follow(followee: PublicProfile): Promise<void> {
    const uid = this.auth.uid();
    if (!uid || followee.id === uid || this.isFollowing(followee.id)) {
      return;
    }

    const followerProfile = {
      displayName: this.profile.displayName(),
      photoURL: this.profile.avatar() ?? undefined,
    };
    await this.firestore.follow(uid, followee, followerProfile);
  }

  async unfollow(followeeId: string): Promise<void> {
    const uid = this.auth.uid();
    if (!uid) {
      return;
    }
    await this.firestore.unfollow(uid, followeeId);
  }

  private attachFollowing(uid: string): void {
    this.followingUnsub = this.firestore.listenFollowing(uid, (edges) => {
      if (this.currentUid !== uid) {
        return;
      }
      this._following.set(edges);
    });
  }

  private detach(): void {
    this.followingUnsub?.();
    this.followingUnsub = null;
    this._following.set([]);
    this._searchResults.set([]);
    this._suggestedPool.set([]);
    this._loadingSuggested.set(false);
    this.clearLiveListeners();
    this._followingLive.set([]);
  }

  private syncLiveListeners(edges: FollowingEdge[]): void {
    const wanted = new Set(edges.map((e) => e.followeeId));

    for (const [followeeId, unsub] of this.liveUnsubs) {
      if (!wanted.has(followeeId)) {
        unsub();
        this.liveUnsubs.delete(followeeId);
        this.liveSnapshots.delete(followeeId);
      }
    }

    for (const edge of edges) {
      if (this.liveUnsubs.has(edge.followeeId)) {
        continue;
      }
      const unsub = this.firestore.listenLiveRound(edge.followeeId, (snapshot) => {
        if (snapshot) {
          this.liveSnapshots.set(edge.followeeId, snapshot);
        } else {
          this.liveSnapshots.delete(edge.followeeId);
        }
        this.rebuildLiveList();
      });
      this.liveUnsubs.set(edge.followeeId, unsub);
    }

    this.rebuildLiveList();
  }

  private clearLiveListeners(): void {
    for (const unsub of this.liveUnsubs.values()) {
      unsub();
    }
    this.liveUnsubs.clear();
    this.liveSnapshots.clear();
  }

  private rebuildLiveList(): void {
    const edges = this._following();
    const live: FollowingLiveRound[] = [];
    for (const edge of edges) {
      const snapshot = this.liveSnapshots.get(edge.followeeId);
      if (!snapshot) {
        continue;
      }
      live.push({
        userId: edge.followeeId,
        displayName: edge.displayName,
        ...(edge.photoURL ? { photoURL: edge.photoURL } : {}),
        snapshot,
      });
    }
    live.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this._followingLive.set(live);
  }
}
