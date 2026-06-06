import { Injectable } from '@angular/core';
import { Follow, PublicProfile } from '../models';

/**
 * Placeholder for future social/following features.
 *
 * Intentionally NOT backed by any network/backend yet. The method shapes
 * mirror what a future Firebase/Firestore implementation will provide, so
 * the UI can be wired against this surface today and swapped later.
 */
@Injectable({ providedIn: 'root' })
export class SocialService {
  /** Feature flag for "coming soon" UI. */
  readonly enabled = false;

  /** Profiles the user follows (empty until a backend exists). */
  getFollowing(): PublicProfile[] {
    return [];
  }

  /** Suggested profiles to follow (empty until a backend exists). */
  getSuggested(): PublicProfile[] {
    return [];
  }

  /** Follow a profile. No-op placeholder. */
  follow(_followeeId: string): Follow | null {
    return null;
  }

  /** Unfollow a profile. No-op placeholder. */
  unfollow(_followeeId: string): void {
    // Implemented once a backend is available.
  }
}
