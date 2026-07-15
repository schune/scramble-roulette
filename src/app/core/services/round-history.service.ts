import { Injector, Injectable, effect, inject, signal } from '@angular/core';
import { FeedPostEntry, Round } from '../models';
import { StorageService } from './storage.service';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { ScoreService } from './score.service';

/**
 * Single source of truth for completed rounds, exposed as a reactive signal.
 *
 * The backing store follows the auth state:
 *  - **Guest** (signed out): rounds live in `localStorage` via
 *    {@link StorageService}.
 *  - **Signed in**: rounds live in Firestore under `users/{uid}/rounds`, kept
 *    live through an `onSnapshot` subscription (with offline persistence).
 *
 * On sign-in, any guest rounds not already in the cloud are migrated up
 * (idempotent, keyed by `Round.id`) so nothing is lost. Guest `localStorage`
 * is never overwritten with cloud data, so signing out on a shared device
 * reverts cleanly to the local guest history without leaking account rounds.
 */
@Injectable({ providedIn: 'root' })
export class RoundHistoryService {
  private readonly storage = inject(StorageService);
  private readonly firestore = inject(FirestoreService);
  private readonly auth = inject(AuthService);
  private readonly score = inject(ScoreService);
  private readonly injector = inject(Injector);

  private readonly _history = signal<Round[]>([]);
  /** Completed rounds, newest first. */
  readonly history = this._history.asReadonly();

  /** uid of the account currently backing the store, or null for guest. */
  private currentUid: string | null = null;
  /** Tears down the active Firestore subscription (null when guest). */
  private cloudUnsub: (() => void) | null = null;

  constructor() {
    // Seed with the guest history so the app has data before auth resolves.
    this._history.set(this.storage.getRoundHistory());

    effect(() => {
      const user = this.auth.user();
      if (user === undefined) {
        return; // initial auth state not resolved yet — keep the guest seed
      }

      const uid = user?.uid ?? null;
      if (uid === this.currentUid) {
        return; // no transition
      }

      this.currentUid = uid;
      this.detachCloud();

      if (uid) {
        void this.attachCloud(uid);
      } else {
        // Signed out → revert to the guest's local history.
        this._history.set(this.storage.getRoundHistory());
      }
    });
  }

  /** Persist a completed round to the active store (cloud or local). */
  add(round: Round): void {
    const uid = this.auth.uid();
    if (uid) {
      this._history.update((list) => this.upsert(list, round)); // optimistic
      void this.firestore.saveRound(uid, round).catch(() => {
        /* onSnapshot reconciles; persistence retries when back online */
      });
      this.publishFeedPost(uid, round);
    } else {
      this.storage.saveCompletedRound(round);
      this._history.set(this.storage.getRoundHistory());
    }
  }

  /** Remove a round from the active store. */
  remove(id: string): void {
    const uid = this.auth.uid();
    this._history.update((list) => list.filter((r) => r.id !== id)); // optimistic
    if (uid) {
      void this.firestore.deleteRound(uid, id).catch(() => {});
    } else {
      this.storage.removeRoundFromHistory(id);
    }
  }

  /** Clear all rounds from the active store. */
  clear(): void {
    const uid = this.auth.uid();
    const ids = this._history().map((r) => r.id);
    this._history.set([]);
    if (uid) {
      void this.firestore.deleteManyRounds(uid, ids).catch(() => {});
    } else {
      this.storage.clearRoundHistory();
    }
  }

  /* ---------- Cloud wiring ---------- */

  private async attachCloud(uid: string): Promise<void> {
    try {
      // Migrate guest rounds the cloud doesn't have yet (idempotent by id).
      const cloud = await this.firestore.getRounds(uid);
      if (this.currentUid !== uid) {
        return; // auth changed again while awaiting
      }
      const guest = this.storage.getRoundHistory();
      const missing = guest.filter((g) => !cloud.some((c) => c.id === g.id));
      if (missing.length > 0) {
        await this.firestore.saveManyRounds(uid, missing);
        for (const round of missing) {
          this.publishFeedPost(uid, round);
        }
      }

      await this.backfillMissingFeedPosts(uid, cloud);
    } catch {
      // Offline / transient: the live listener below still serves cached data.
    }

    if (this.currentUid !== uid) {
      return;
    }

    this.cloudUnsub = this.firestore.listenRounds(uid, (rounds) => {
      if (this.currentUid === uid) {
        this._history.set(rounds);
      }
    });
  }

  private detachCloud(): void {
    this.cloudUnsub?.();
    this.cloudUnsub = null;
  }

  /** Replace any round sharing this id, then re-sort newest first. */
  private upsert(list: Round[], round: Round): Round[] {
    const next = [round, ...list.filter((r) => r.id !== round.id)];
    return next.sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );
  }

  private publishFeedPost(uid: string, round: Round): void {
    // Lazy lookup avoids a ProfileService <-> RoundHistoryService DI cycle (NG0200).
    const profile = this.injector.get(ProfileService);
    const holesPlayed = round.holes.filter((hole) => hole.score !== undefined).length;
    const post: FeedPostEntry = {
      userId: uid,
      displayName: profile.displayName(),
      ...(profile.avatar() ? { photoURL: profile.avatar()! } : {}),
      roundId: round.id,
      ...(round.courseName ? { courseName: round.courseName } : {}),
      holeCount: round.holeCount,
      holesPlayed,
      playerNames: round.players.map((player) => player.name),
      totalScore: this.score.totalScore(round),
      toPar: this.score.totalScoreToPar(round),
      ...(round.endedEarly ? { endedEarly: true } : {}),
      postedAt: round.completedAt ?? new Date().toISOString(),
    };

    void this.firestore.saveFeedPost(post).catch((err) => {
      console.warn('[RoundHistoryService] Failed to publish feed post', err);
    });
  }

  /** Republish feed posts for recent rounds that may have missed publish (e.g. rules lag). */
  private async backfillMissingFeedPosts(uid: string, rounds: Round[]): Promise<void> {
    if (this.currentUid !== uid) {
      return;
    }

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = rounds.filter((round) => {
      if (round.status !== 'complete') {
        return false;
      }
      const when = new Date(round.completedAt ?? round.createdAt).getTime();
      return when >= cutoff;
    });

    for (const round of recent) {
      if (this.currentUid !== uid) {
        return;
      }
      const exists = await this.firestore.feedPostExists(uid, round.id);
      if (!exists) {
        this.publishFeedPost(uid, round);
      }
    }
  }
}
