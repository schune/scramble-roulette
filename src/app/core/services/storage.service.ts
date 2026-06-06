import { Injectable } from '@angular/core';
import { Round, UserProfile } from '../models';

/** Centralized localStorage keys (prefixed on write/read). */
export const STORAGE_KEYS = {
  activeRound: 'active-round',
  roundHistory: 'round-history',
  profile: 'profile',
  soundMuted: 'sound-muted',
} as const;

/**
 * Thin, type-safe wrapper around the browser's localStorage and the single
 * place all persistence flows through.
 *
 * Centralizing here means swapping to another backend later (e.g. Firebase
 * via a FirestoreRoundService) only touches this service. JSON
 * (de)serialization and environments without `localStorage` are handled
 * gracefully so the app never crashes on storage errors.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'scramble-roulette:';

  private get available(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  /* ---------- Generic primitives ---------- */

  /** Read and parse a value, returning `fallback` when missing or invalid. */
  read<T>(key: string, fallback: T): T {
    if (!this.available) {
      return fallback;
    }
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** Serialize and persist a value. */
  write<T>(key: string, value: T): void {
    if (!this.available) {
      return;
    }
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Quota errors or serialization issues are non-fatal.
    }
  }

  /** Remove a single key. */
  remove(key: string): void {
    if (!this.available) {
      return;
    }
    localStorage.removeItem(this.prefix + key);
  }

  /* ---------- Active round ---------- */

  getActiveRound(): Round | null {
    return this.read<Round | null>(STORAGE_KEYS.activeRound, null);
  }

  saveActiveRound(round: Round): void {
    this.write(STORAGE_KEYS.activeRound, round);
  }

  clearActiveRound(): void {
    this.remove(STORAGE_KEYS.activeRound);
  }

  /* ---------- Completed round history ----------
   * A future FirestoreRoundService can mirror this API to move history to
   * the cloud without changing callers.
   */

  /** All completed rounds, newest first. */
  getRoundHistory(): Round[] {
    return this.read<Round[]>(STORAGE_KEYS.roundHistory, []);
  }

  /** Persist a completed round to the front of the history list. */
  saveCompletedRound(round: Round): void {
    const history = this.getRoundHistory().filter((r) => r.id !== round.id);
    this.write(STORAGE_KEYS.roundHistory, [round, ...history]);
  }

  /** Remove a single round from history by id. */
  removeRoundFromHistory(id: string): void {
    const history = this.getRoundHistory().filter((r) => r.id !== id);
    this.write(STORAGE_KEYS.roundHistory, history);
  }

  /** Clear all saved round history. */
  clearRoundHistory(): void {
    this.remove(STORAGE_KEYS.roundHistory);
  }

  /* ---------- Profile ---------- */

  getProfile(): UserProfile | null {
    return this.read<UserProfile | null>(STORAGE_KEYS.profile, null);
  }

  saveProfile(profile: UserProfile): void {
    this.write(STORAGE_KEYS.profile, profile);
  }

  /* ---------- Settings ---------- */

  getSoundMuted(): boolean {
    return this.read<boolean>(STORAGE_KEYS.soundMuted, false);
  }

  saveSoundMuted(muted: boolean): void {
    this.write(STORAGE_KEYS.soundMuted, muted);
  }
}
