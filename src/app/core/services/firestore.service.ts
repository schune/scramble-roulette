import { Injectable, inject } from '@angular/core';
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Round, UserProfile } from '../models';

/**
 * The single place the app touches Cloud Firestore. Keeping every
 * `firebase/firestore` import here means the persistence backend can be
 * changed without rippling through domain services.
 *
 * Layout (see `firestore.rules`, owner-only):
 *   users/{uid}                  → profile document
 *   users/{uid}/rounds/{roundId} → one completed round per doc, keyed by the
 *                                  existing Round.id so uploads are idempotent.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly db = inject(FIRESTORE);

  private userDocRef(uid: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid);
  }

  private roundsColRef(uid: string): CollectionReference<DocumentData> {
    return collection(this.db, 'users', uid, 'rounds');
  }

  private roundDocRef(uid: string, roundId: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid, 'rounds', roundId);
  }

  /* ---------- Profile ---------- */

  async getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(this.userDocRef(uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  /** Merge-write the profile. Never persists the base64 `avatarDataUrl`
   * (signed-in users use their Google `photoURL`; base64 would bloat the doc). */
  async saveProfile(uid: string, profile: UserProfile): Promise<void> {
    const { avatarDataUrl: _drop, ...doc } = profile;
    await setDoc(this.userDocRef(uid), doc, { merge: true });
  }

  listenProfile(uid: string, next: (profile: UserProfile | null) => void): Unsubscribe {
    return onSnapshot(this.userDocRef(uid), (snap) =>
      next(snap.exists() ? (snap.data() as UserProfile) : null),
    );
  }

  /* ---------- Rounds ---------- */

  async getRounds(uid: string): Promise<Round[]> {
    const snap = await getDocs(this.roundsColRef(uid));
    return this.sortNewestFirst(snap.docs.map((d) => d.data() as Round));
  }

  async saveRound(uid: string, round: Round): Promise<void> {
    await setDoc(this.roundDocRef(uid, round.id), round);
  }

  /** Upload many rounds in one atomic batch (used for guest-data migration). */
  async saveManyRounds(uid: string, rounds: Round[]): Promise<void> {
    if (rounds.length === 0) {
      return;
    }
    const batch = writeBatch(this.db);
    for (const round of rounds) {
      batch.set(this.roundDocRef(uid, round.id), round);
    }
    await batch.commit();
  }

  async deleteRound(uid: string, roundId: string): Promise<void> {
    await deleteDoc(this.roundDocRef(uid, roundId));
  }

  /** Delete many rounds by id in one atomic batch. */
  async deleteManyRounds(uid: string, roundIds: string[]): Promise<void> {
    if (roundIds.length === 0) {
      return;
    }
    const batch = writeBatch(this.db);
    for (const id of roundIds) {
      batch.delete(this.roundDocRef(uid, id));
    }
    await batch.commit();
  }

  listenRounds(uid: string, next: (rounds: Round[]) => void): Unsubscribe {
    return onSnapshot(this.roundsColRef(uid), (snap) =>
      next(this.sortNewestFirst(snap.docs.map((d) => d.data() as Round))),
    );
  }

  /* ---------- Helpers ---------- */

  private sortNewestFirst(rounds: Round[]): Round[] {
    return [...rounds].sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );
  }
}
