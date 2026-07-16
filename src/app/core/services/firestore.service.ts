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
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.providers';
import {
  FollowerEdge,
  FollowingEdge,
  FeedLiveEntry,
  FeedPostEntry,
  LiveRoundSnapshot,
  PublicProfile,
  Round,
  UserProfile,
} from '../models';

/** Doc id for the singleton live-round broadcast. */
export const LIVE_ROUND_DOC_ID = 'current';

/**
 * The single place the app touches Cloud Firestore.
 *
 * Layout:
 *   publicProfiles/{uid}              → searchable public profile
 *   users/{uid}                     → private profile
 *   users/{uid}/rounds/{roundId}    → completed rounds
 *   users/{uid}/following/{id}      → outbound follow edges
 *   users/{uid}/followers/{id}      → inbound follow edges
 *   users/{uid}/liveRound/current   → in-progress scoreboard for followers
 *   feedLive/{uid}                  → global live round feed entry
 *   feedPosts/{uid}_{roundId}       → completed round posted to feed
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly db = inject(FIRESTORE);

  private userDocRef(uid: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid);
  }

  private publicProfileDocRef(uid: string): DocumentReference<DocumentData> {
    return doc(this.db, 'publicProfiles', uid);
  }

  private roundsColRef(uid: string): CollectionReference<DocumentData> {
    return collection(this.db, 'users', uid, 'rounds');
  }

  private roundDocRef(uid: string, roundId: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid, 'rounds', roundId);
  }

  private followingColRef(uid: string): CollectionReference<DocumentData> {
    return collection(this.db, 'users', uid, 'following');
  }

  private followingDocRef(uid: string, followeeId: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid, 'following', followeeId);
  }

  private followersDocRef(uid: string, followerId: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid, 'followers', followerId);
  }

  private liveRoundDocRef(uid: string): DocumentReference<DocumentData> {
    return doc(this.db, 'users', uid, 'liveRound', LIVE_ROUND_DOC_ID);
  }

  private feedLiveDocRef(uid: string): DocumentReference<DocumentData> {
    return doc(this.db, 'feedLive', uid);
  }

  private feedLiveColRef(): CollectionReference<DocumentData> {
    return collection(this.db, 'feedLive');
  }

  private feedPostsColRef(): CollectionReference<DocumentData> {
    return collection(this.db, 'feedPosts');
  }

  private feedPostDocRef(userId: string, roundId: string): DocumentReference<DocumentData> {
    return doc(this.db, 'feedPosts', `${userId}_${roundId}`);
  }

  private publicProfilesColRef(): CollectionReference<DocumentData> {
    return collection(this.db, 'publicProfiles');
  }

  /* ---------- Profile ---------- */

  async getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(this.userDocRef(uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  async saveProfile(uid: string, profile: UserProfile): Promise<void> {
    const { avatarDataUrl: _drop, ...docData } = profile;
    await setDoc(this.userDocRef(uid), docData, { merge: true });
  }

  listenProfile(uid: string, next: (profile: UserProfile | null) => void): Unsubscribe {
    return onSnapshot(this.userDocRef(uid), (snap) =>
      next(snap.exists() ? (snap.data() as UserProfile) : null),
    );
  }

  /* ---------- Public profiles ---------- */

  async getPublicProfile(uid: string): Promise<PublicProfile | null> {
    const snap = await getDoc(this.publicProfileDocRef(uid));
    return snap.exists() ? (snap.data() as PublicProfile) : null;
  }

  async savePublicProfile(profile: PublicProfile): Promise<void> {
    await setDoc(this.publicProfileDocRef(profile.id), profile, { merge: true });
  }

  async searchPublicProfiles(term: string, max = 20): Promise<PublicProfile[]> {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }
    const end = trimmed + '\uf8ff';
    const q = query(
      this.publicProfilesColRef(),
      where('displayNameLower', '>=', trimmed),
      where('displayNameLower', '<=', end),
      orderBy('displayNameLower'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PublicProfile);
  }

  /** Recently active signed-in players for follow suggestions. */
  async listRecentPublicProfiles(max = 15): Promise<PublicProfile[]> {
    const q = query(
      this.publicProfilesColRef(),
      orderBy('updatedAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PublicProfile);
  }

  /* ---------- Following ---------- */

  async getFollowing(uid: string): Promise<FollowingEdge[]> {
    const snap = await getDocs(this.followingColRef(uid));
    return snap.docs.map((d) => d.data() as FollowingEdge);
  }

  listenFollowing(uid: string, next: (edges: FollowingEdge[]) => void): Unsubscribe {
    return onSnapshot(this.followingColRef(uid), (snap) =>
      next(snap.docs.map((d) => d.data() as FollowingEdge)),
    );
  }

  async follow(
    followerId: string,
    followee: PublicProfile,
    followerProfile: Pick<PublicProfile, 'displayName' | 'photoURL'>,
  ): Promise<void> {
    if (followerId === followee.id) {
      return;
    }
    const now = new Date().toISOString();
    const batch = writeBatch(this.db);
    const following: FollowingEdge = {
      followeeId: followee.id,
      displayName: followee.displayName,
      ...(followee.photoURL ? { photoURL: followee.photoURL } : {}),
      createdAt: now,
    };
    const follower: FollowerEdge = {
      followerId,
      displayName: followerProfile.displayName,
      ...(followerProfile.photoURL ? { photoURL: followerProfile.photoURL } : {}),
      createdAt: now,
    };
    batch.set(this.followingDocRef(followerId, followee.id), following);
    batch.set(this.followersDocRef(followee.id, followerId), follower);
    await batch.commit();
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    const batch = writeBatch(this.db);
    batch.delete(this.followingDocRef(followerId, followeeId));
    batch.delete(this.followersDocRef(followeeId, followerId));
    await batch.commit();
  }

  /* ---------- Live round ---------- */

  async saveLiveRound(uid: string, snapshot: LiveRoundSnapshot): Promise<void> {
    await setDoc(this.liveRoundDocRef(uid), snapshot);
  }

  async clearLiveRound(uid: string): Promise<void> {
    await deleteDoc(this.liveRoundDocRef(uid));
  }

  listenLiveRound(uid: string, next: (snapshot: LiveRoundSnapshot | null) => void): Unsubscribe {
    return onSnapshot(this.liveRoundDocRef(uid), (snap) =>
      next(snap.exists() ? (snap.data() as LiveRoundSnapshot) : null),
    );
  }

  /* ---------- Global feed ---------- */

  async saveFeedLive(entry: FeedLiveEntry): Promise<void> {
    await setDoc(this.feedLiveDocRef(entry.userId), entry);
  }

  async clearFeedLive(uid: string): Promise<void> {
    await deleteDoc(this.feedLiveDocRef(uid));
  }

  listenFeedLive(next: (entries: FeedLiveEntry[]) => void): Unsubscribe {
    return onSnapshot(
      this.feedLiveColRef(),
      (snap) => next(snap.docs.map((d) => d.data() as FeedLiveEntry)),
      (err) => console.warn('[FirestoreService] feedLive listener error', err),
    );
  }

  async saveFeedPost(entry: FeedPostEntry): Promise<void> {
    await setDoc(this.feedPostDocRef(entry.userId, entry.roundId), entry);
  }

  async deleteFeedPost(userId: string, roundId: string): Promise<void> {
    await deleteDoc(this.feedPostDocRef(userId, roundId));
  }

  async patchFeedLiveIdentity(
    uid: string,
    displayName: string,
    photoURL?: string,
  ): Promise<void> {
    const ref = this.feedLiveDocRef(uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return;
    }
    await setDoc(
      ref,
      {
        displayName,
        ...(photoURL ? { photoURL } : {}),
      },
      { merge: true },
    );
  }

  async feedPostExists(userId: string, roundId: string): Promise<boolean> {
    const snap = await getDoc(this.feedPostDocRef(userId, roundId));
    return snap.exists();
  }

  async getFeedPost(userId: string, roundId: string): Promise<FeedPostEntry | null> {
    const snap = await getDoc(this.feedPostDocRef(userId, roundId));
    return snap.exists() ? (snap.data() as FeedPostEntry) : null;
  }

  async getFeedLive(userId: string): Promise<FeedLiveEntry | null> {
    const snap = await getDoc(this.feedLiveDocRef(userId));
    return snap.exists() ? (snap.data() as FeedLiveEntry) : null;
  }

  async getRound(uid: string, roundId: string): Promise<Round | null> {
    const snap = await getDoc(this.roundDocRef(uid, roundId));
    return snap.exists() ? (snap.data() as Round) : null;
  }

  listenFeedPosts(next: (entries: FeedPostEntry[]) => void, max = 50): Unsubscribe {
    const q = query(this.feedPostsColRef(), orderBy('postedAt', 'desc'), limit(max));
    return onSnapshot(
      q,
      (snap) => next(snap.docs.map((d) => d.data() as FeedPostEntry)),
      (err) => console.warn('[FirestoreService] feedPosts listener error', err),
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

  private sortNewestFirst(rounds: Round[]): Round[] {
    return [...rounds].sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );
  }
}
