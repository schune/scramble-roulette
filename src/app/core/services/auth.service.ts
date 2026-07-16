import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebase/firebase.providers';

/** Friendly, UI-facing sign-in failure reasons. */
export type AuthErrorReason = 'popup-closed' | 'unauthorized-domain' | 'network' | 'unknown';

export type SignInResult = { ok: true } | { ok: false; reason: AuthErrorReason };

/**
 * Map a sign-in failure to a user-facing message. `'popup-closed'` is a
 * deliberate user cancellation — callers should skip messaging it.
 */
export function describeSignInError(reason: AuthErrorReason): string {
  switch (reason) {
    case 'unauthorized-domain':
      return 'This domain isn’t authorized for sign-in yet.';
    case 'network':
      return 'Network error — check your connection and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

/**
 * Wraps Firebase Authentication behind Angular signals. The signed-in user is
 * exposed as a signal so OnPush components update automatically (this app is
 * zoneless — signal writes drive change detection without zone.js).
 *
 * Sign-in is optional throughout the app: a `null` user simply means guest
 * mode. `undefined` is the brief window before Firebase reports the initial
 * state, used to avoid flashing the wrong signed-in/out UI on load.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);

  /** `undefined` = resolving · `null` = guest · `User` = signed in. */
  private readonly _user = signal<User | null | undefined>(undefined);

  readonly user = this._user.asReadonly();
  readonly isResolving = computed(() => this._user() === undefined);
  readonly isSignedIn = computed(() => !!this._user());
  readonly uid = computed(() => this._user()?.uid ?? null);
  readonly displayName = computed(() => this._user()?.displayName ?? null);
  readonly email = computed(() => this._user()?.email ?? null);
  readonly photoURL = computed(() => this._user()?.photoURL ?? null);

  /** Resolves once the initial auth state has been determined. */
  readonly authReady: Promise<void>;

  constructor() {
    let markReady!: () => void;
    this.authReady = new Promise<void>((resolve) => (markReady = resolve));
    let settled = false;

    onAuthStateChanged(this.auth, (user) => {
      this._user.set(user);
      if (!settled) {
        settled = true;
        markReady();
      }
    });

    void this.completeRedirectSignIn();
  }

  /** Open Google sign-in. Uses redirect on mobile where popups are often blocked. */
  async signInWithGoogle(): Promise<SignInResult> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      if (this.prefersRedirect()) {
        await signInWithRedirect(this.auth, provider);
        return { ok: true };
      }
      await signInWithPopup(this.auth, provider);
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, reason: this.classify(err) };
    }
  }

  private async completeRedirectSignIn(): Promise<void> {
    try {
      await getRedirectResult(this.auth);
    } catch {
      // Redirect failures surface on the next explicit sign-in attempt.
    }
  }

  private prefersRedirect(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  private classify(err: unknown): AuthErrorReason {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
      case 'auth/user-cancelled':
        return 'popup-closed';
      case 'auth/unauthorized-domain':
        return 'unauthorized-domain';
      case 'auth/network-request-failed':
        return 'network';
      default:
        return 'unknown';
    }
  }
}
