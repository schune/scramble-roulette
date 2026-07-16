import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ProfileStats, PublicProfile, Round, UserProfile } from '../models';
import { StorageService } from './storage.service';
import { ScoreService } from './score.service';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { RoundHistoryService } from './round-history.service';

/**
 * The player's profile and derived stats, unified across guest and signed-in
 * modes.
 *
 *  - **Guest**: a local profile in `localStorage` (editable display name and
 *    base64 avatar) — unchanged from before accounts existed.
 *  - **Signed in**: the `users/{uid}` Firestore document, seeded from the
 *    Google identity on first sign-in (keeping a non-default guest name if one
 *    was set). Display name edits write to the cloud; the avatar is the Google
 *    photo.
 *
 * Stats are derived reactively from {@link RoundHistoryService}, so they follow
 * whichever history (local or cloud) is active.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly storage = inject(StorageService);
  private readonly score = inject(ScoreService);
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);
  private readonly roundHistory = inject(RoundHistoryService);

  /** Guest profile: sign-out fallback and the display-name seed on sign-in. */
  private readonly _localProfile = signal<UserProfile>(this.loadOrCreateLocal());
  /** Signed-in profile from Firestore; null until the first snapshot / guest. */
  private readonly _cloudProfile = signal<UserProfile | null>(null);

  private currentUid: string | null = null;
  private cloudUnsub: (() => void) | null = null;

  /** The active profile: cloud when signed in, else the local guest profile. */
  readonly profile = computed<UserProfile>(() =>
    this.auth.isSignedIn() ? (this._cloudProfile() ?? this.accountFallback()) : this._localProfile(),
  );

  readonly displayName = computed(() => this.profile().displayName);

  /** Avatar image URL/data to render, or null to fall back to initials. */
  readonly avatar = computed<string | null>(() =>
    this.auth.isSignedIn()
      ? this._cloudProfile()?.photoURL ?? this.auth.photoURL() ?? null
      : this._localProfile().avatarDataUrl ?? null,
  );

  readonly initials = computed(() => {
    const parts = this.displayName().trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'G';
  });

  /** Aggregate career stats, derived from the active round history. */
  readonly stats = computed<ProfileStats>(() => this.computeStats(this.roundHistory.history()));
  /** Most recent completed rounds (top 5). */
  readonly recentRounds = computed<Round[]>(() => this.roundHistory.history().slice(0, 5));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user === undefined) {
        return; // auth not resolved yet
      }
      const uid = user?.uid ?? null;
      if (uid === this.currentUid) {
        return;
      }
      this.currentUid = uid;
      this.detachCloud();
      if (uid) {
        this.attachCloud(uid);
      } else {
        this._cloudProfile.set(null); // back to guest
      }
    });

    effect(() => {
      if (!this.currentUid) {
        return;
      }
      this.profile();
      this.stats();
      this.syncPublicProfile();
    });
  }

  /** Upsert the searchable public profile (signed-in users only). */
  syncPublicProfile(options?: { isLive?: boolean }): void {
    const uid = this.currentUid;
    if (!uid) {
      return;
    }

    const p = this.profile();
    const s = this.stats();
    const photoURL = p.photoURL ?? this.auth.photoURL() ?? undefined;
    const doc: PublicProfile = {
      id: uid,
      displayName: p.displayName,
      displayNameLower: p.displayName.trim().toLowerCase(),
      roundsPlayed: s.roundsPlayed,
      bestScoreToPar: s.bestScoreToPar,
      updatedAt: new Date().toISOString(),
      ...(photoURL ? { photoURL } : {}),
      ...(options?.isLive !== undefined ? { isLive: options.isLive } : {}),
    };

    void this.firestore.savePublicProfile(doc).catch(() => {});
  }

  /** Update the display name (ignores blank input). Writes to the active store. */
  setDisplayName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const uid = this.currentUid;
    if (uid) {
      const updated: UserProfile = {
        ...(this._cloudProfile() ?? this.accountFallback()),
        displayName: trimmed,
        updatedAt: new Date().toISOString(),
      };
      this._cloudProfile.set(updated);
      void this.firestore.saveProfile(uid, updated).catch(() => {});
      this.syncPublicProfile();
      this.roundHistory.refreshFeedIdentity();
    } else {
      this.updateLocal((profile) => ({ ...profile, displayName: trimmed }));
    }
  }

  /** Set a base64 avatar (guests only — signed-in users use their Google photo). */
  setAvatar(dataUrl: string): void {
    if (this.auth.isSignedIn()) {
      return;
    }
    this.updateLocal((profile) => ({ ...profile, avatarDataUrl: dataUrl }));
  }

  /** Remove the stored guest avatar (falls back to initials). */
  clearAvatar(): void {
    if (this.auth.isSignedIn()) {
      return;
    }
    this.updateLocal(({ avatarDataUrl: _drop, ...rest }) => rest as UserProfile);
  }

  /** Snapshot of career stats. Prefer the reactive {@link stats} signal in UI. */
  getStats(): ProfileStats {
    return this.computeStats(this.roundHistory.history());
  }

  /** Snapshot of recent rounds. Prefer the reactive {@link recentRounds} signal. */
  getRecentRounds(limit = 5): Round[] {
    return this.roundHistory.history().slice(0, limit);
  }

  /* ---------- Cloud wiring ---------- */

  private attachCloud(uid: string): void {
    this.cloudUnsub = this.firestore.listenProfile(uid, (profile) => {
      if (this.currentUid !== uid) {
        return;
      }
      if (profile) {
        this._cloudProfile.set(profile);
      } else {
        // First sign-in for this account — create the profile document.
        const seeded = this.seedFromAuth(uid);
        this._cloudProfile.set(seeded);
        void this.firestore.saveProfile(uid, seeded).catch(() => {});
      }
    });
  }

  private detachCloud(): void {
    this.cloudUnsub?.();
    this.cloudUnsub = null;
  }

  /** Build a profile from the current Google identity, preferring a non-default
   * guest name the player already set. */
  private seedFromAuth(uid: string): UserProfile {
    const now = new Date().toISOString();
    const guestName = this._localProfile().displayName;
    const displayName =
      this.auth.displayName() ?? (guestName && guestName !== 'Guest' ? guestName : 'Golfer');
    return {
      id: uid,
      uid,
      provider: 'google',
      displayName,
      email: this.auth.email() ?? undefined,
      photoURL: this.auth.photoURL() ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  /** Placeholder profile shown between sign-in and the first cloud snapshot. */
  private accountFallback(): UserProfile {
    return this.seedFromAuth(this.currentUid ?? '');
  }

  /* ---------- Local (guest) store ---------- */

  private updateLocal(mutator: (profile: UserProfile) => UserProfile): void {
    const updated: UserProfile = {
      ...mutator(this._localProfile()),
      updatedAt: new Date().toISOString(),
    };
    this._localProfile.set(updated);
    this.storage.saveProfile(updated);
  }

  private loadOrCreateLocal(): UserProfile {
    const existing = this.storage.getProfile();
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: this.createId(),
      displayName: 'Guest',
      provider: 'guest',
      createdAt: now,
      updatedAt: now,
    };
    this.storage.saveProfile(profile);
    return profile;
  }

  /* ---------- Stats ---------- */

  private computeStats(history: Round[]): ProfileStats {
    if (history.length === 0) {
      return {
        roundsPlayed: 0,
        holesPlayed: 0,
        bestScoreToPar: null,
        averageScoreToPar: null,
      };
    }

    const toPars = history.map((round) => this.score.totalScoreToPar(round));
    const holesPlayed = history.reduce((sum, round) => sum + round.holes.length, 0);
    const averageRaw = toPars.reduce((sum, value) => sum + value, 0) / toPars.length;

    return {
      roundsPlayed: history.length,
      holesPlayed,
      bestScoreToPar: Math.min(...toPars),
      averageScoreToPar: Math.round(averageRaw * 10) / 10,
    };
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
