import { Injectable, computed, inject, signal } from '@angular/core';
import { ProfileStats, Round, UserProfile } from '../models';
import { StorageService } from './storage.service';
import { ScoreService } from './score.service';

/**
 * Manages the local player profile and derives profile stats from saved
 * round history. Persisted to localStorage; shaped so a future Firebase
 * Auth/Firestore profile can drop in behind the same surface.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly storage = inject(StorageService);
  private readonly score = inject(ScoreService);

  private readonly _profile = signal<UserProfile>(this.loadOrCreate());

  readonly profile = this._profile.asReadonly();
  readonly displayName = computed(() => this._profile().displayName);
  readonly avatar = computed(() => this._profile().avatarDataUrl ?? null);
  readonly initials = computed(() => {
    const parts = this._profile().displayName.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'G';
  });

  /** Update the display name (ignores blank input). */
  setDisplayName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    this.update((profile) => ({ ...profile, displayName: trimmed }));
  }

  /** Set the avatar from a base64 data URL. */
  setAvatar(dataUrl: string): void {
    this.update((profile) => ({ ...profile, avatarDataUrl: dataUrl }));
  }

  /** Remove the stored avatar (falls back to initials). */
  clearAvatar(): void {
    this.update(({ avatarDataUrl, ...rest }) => rest as UserProfile);
  }

  /** Compute aggregate stats from completed round history. */
  getStats(): ProfileStats {
    const history = this.storage.getRoundHistory();
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

  /** Most recent completed rounds. */
  getRecentRounds(limit = 5): Round[] {
    return this.storage.getRoundHistory().slice(0, limit);
  }

  private update(mutator: (profile: UserProfile) => UserProfile): void {
    const updated: UserProfile = {
      ...mutator(this._profile()),
      updatedAt: new Date().toISOString(),
    };
    this._profile.set(updated);
    this.storage.saveProfile(updated);
  }

  private loadOrCreate(): UserProfile {
    const existing = this.storage.getProfile();
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: this.createId(),
      displayName: 'Guest',
      createdAt: now,
      updatedAt: now,
    };
    this.storage.saveProfile(profile);
    return profile;
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
