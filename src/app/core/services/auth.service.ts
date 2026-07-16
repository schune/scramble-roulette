import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebase/firebase.providers';

/** Friendly, UI-facing sign-in failure reasons. */
export type AuthErrorReason =
  | 'popup-closed'
  | 'popup-blocked'
  | 'unauthorized-domain'
  | 'storage-blocked'
  | 'network'
  | 'unknown';

export type SignInResult =
  | { ok: true; redirecting?: boolean }
  | { ok: false; reason: AuthErrorReason };

/**
 * Map a sign-in failure to a user-facing message. `'popup-closed'` is a
 * deliberate user cancellation — callers should skip messaging it.
 */
export function describeSignInError(reason: AuthErrorReason): string {
  switch (reason) {
    case 'popup-closed':
      return 'Sign-in was cancelled.';
    case 'popup-blocked':
      return 'Your browser blocked the sign-in window. Trying a full-page redirect instead.';
    case 'unauthorized-domain':
      return 'This domain isn’t authorized for sign-in yet.';
    case 'storage-blocked':
      return 'Safari is blocking sign-in storage. Turn off Private Browsing or allow site data, then try again.';
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

  /** Resolves once redirect handling and the initial auth state are ready. */
  readonly authReady: Promise<void>;

  constructor() {
    this.authReady = this.initAuth();
  }

  /** Open Google sign-in. Safari uses redirect; other browsers try popup first. */
  async signInWithGoogle(): Promise<SignInResult> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await setPersistence(this.auth, browserLocalPersistence);
    } catch {
      // Continue — persistence may already be set or blocked in private browsing.
    }

    if (this.prefersRedirect()) {
      return this.signInWithRedirectFlow(provider);
    }

    try {
      await signInWithPopup(this.auth, provider);
      return { ok: true };
    } catch (err: unknown) {
      const reason = this.classify(err);
      if (reason === 'popup-blocked' || reason === 'popup-closed') {
        return this.signInWithRedirectFlow(provider);
      }
      return { ok: false, reason };
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  private async initAuth(): Promise<void> {
    try {
      await getRedirectResult(this.auth);
    } catch (err: unknown) {
      console.warn('[AuthService] Redirect sign-in failed', err);
    }

    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        this._user.set(user);
        unsubscribe();
        resolve();
      });
    });
  }

  private async signInWithRedirectFlow(
    provider: GoogleAuthProvider,
  ): Promise<SignInResult> {
    try {
      await signInWithRedirect(this.auth, provider);
      return { ok: true, redirecting: true };
    } catch (err: unknown) {
      return { ok: false, reason: this.classify(err) };
    }
  }

  private prefersRedirect(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod|Android/i.test(ua)) {
      return true;
    }

    // Desktop Safari blocks popups and third-party auth cookies aggressively.
    return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/i.test(ua);
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
      case 'auth/popup-blocked':
        return 'popup-blocked';
      case 'auth/unauthorized-domain':
        return 'unauthorized-domain';
      case 'auth/network-request-failed':
        return 'network';
      case 'auth/web-storage-unsupported':
        return 'storage-blocked';
      default:
        return 'unknown';
    }
  }
}
