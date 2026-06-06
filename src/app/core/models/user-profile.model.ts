/**
 * The local player profile. Persisted to localStorage for now; designed so a
 * future Firebase Auth/Firestore profile can populate the same shape.
 */
export interface UserProfile {
  id: string;
  displayName: string;
  /** Base64 data URL for a locally-stored avatar image (optional). */
  avatarDataUrl?: string;
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
  favoriteCategory: string | null;
}
