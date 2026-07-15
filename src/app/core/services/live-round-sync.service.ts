import { Injectable, effect, inject } from '@angular/core';
import { LiveRoundSnapshot, Round, FeedLiveEntry, FeedPostEntry } from '../models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { ProfileService } from './profile.service';
import { RoundStateService } from './round-state.service';
import { ScoreService } from './score.service';

/**
 * Publishes the active round to Firestore so followers can see live scores.
 *
 * Debounced writes avoid hammering Firestore on every keystroke; the doc is
 * cleared when the round ends or the user signs out.
 */
@Injectable({ providedIn: 'root' })
export class LiveRoundSyncService {
  private readonly auth = inject(AuthService);
  private readonly roundState = inject(RoundStateService);
  private readonly score = inject(ScoreService);
  private readonly firestore = inject(FirestoreService);
  private readonly profile = inject(ProfileService);

  private publishTimer: ReturnType<typeof setTimeout> | null = null;
  private lastUid: string | null = null;

  constructor() {
    effect(() => {
      const uid = this.auth.uid();
      const round = this.roundState.activeRound();

      if (this.publishTimer) {
        clearTimeout(this.publishTimer);
        this.publishTimer = null;
      }

      if (!uid) {
        if (this.lastUid) {
          void this.clear(this.lastUid);
          this.lastUid = null;
        }
        return;
      }

      if (uid !== this.lastUid && this.lastUid) {
        void this.clear(this.lastUid);
      }
      this.lastUid = uid;

      if (!round) {
        void this.clear(uid);
        return;
      }

      this.publishTimer = setTimeout(() => {
        void this.publish(uid, round);
      }, 800);
    });
  }

  private async publish(uid: string, round: Round): Promise<void> {
    const snapshot: LiveRoundSnapshot = {
      roundId: round.id,
      ...(round.courseName ? { courseName: round.courseName } : {}),
      holeCount: round.holeCount,
      currentHole: round.currentHole,
      playerNames: round.players.map((player) => player.name),
      totalScore: this.score.totalScore(round),
      toPar: this.score.totalScoreToPar(round),
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.firestore.saveLiveRound(uid, snapshot);
      await this.firestore.saveFeedLive(this.buildFeedLive(uid, round, snapshot));
      this.profile.syncPublicProfile({ isLive: true });
    } catch {
      // Non-fatal — local play continues even if sync fails.
    }
  }

  private async clear(uid: string): Promise<void> {
    try {
      await this.firestore.clearLiveRound(uid);
      await this.firestore.clearFeedLive(uid);
      this.profile.syncPublicProfile({ isLive: false });
    } catch {
      // Ignore cleanup failures.
    }
  }

  private buildFeedLive(uid: string, round: Round, snapshot: LiveRoundSnapshot): FeedLiveEntry {
    return {
      userId: uid,
      displayName: this.profile.displayName(),
      ...(this.profile.avatar() ? { photoURL: this.profile.avatar()! } : {}),
      roundId: snapshot.roundId,
      ...(snapshot.courseName ? { courseName: snapshot.courseName } : {}),
      holeCount: snapshot.holeCount,
      currentHole: snapshot.currentHole,
      playerNames: snapshot.playerNames,
      totalScore: snapshot.totalScore,
      toPar: snapshot.toPar,
      updatedAt: snapshot.updatedAt,
    };
  }
}
