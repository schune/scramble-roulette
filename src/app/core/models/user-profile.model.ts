/**
 * The player profile. For guests it's persisted to localStorage; for signed-in
 * users it's backed by the `users/{uid}` Firestore document. The same shape
 * serves both — the optional account fields are populated from Firebase Auth.
 */
export interface UserProfile {
  id: string;
  displayName: string;
  /** Base64 data URL for a locally-stored avatar image (guests only). */
  avatarDataUrl?: string;
  /** Firebase Auth uid when this profile is backed by a signed-in account. */
  uid?: string;
  email?: string;
  /** Remote avatar URL from the auth provider (e.g. Google). */
  photoURL?: string;
  /** How the profile is backed. Absent/`'guest'` means a local profile. */
  provider?: 'google' | 'guest';
  createdAt: string;
  updatedAt: string;
}

/**
 * Derived, read-only stats computed from saved round history.
 * Not persisted — recomputed on demand.
 */
export interface ProfileStats {
  roundsPlayed: number;
  holesPlayed: number;
  bestScoreToPar: number | null;
  averageScoreToPar: number | null;
}
