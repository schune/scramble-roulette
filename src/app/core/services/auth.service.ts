import { Injectable, computed, inject, signal, WritableSignal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import {
  clearRedirectPending,
  getRedirectResultPromise,
  hadPendingRedirect,
  markRedirectPending,
} from '../firebase/firebase-init';
import { FIREBASE_AUTH } from '../firebase/firebase.providers';

/** Friendly, UI-facing sign-in failure reasons. */
export type AuthErrorReason =
  | 'popup-closed'
  | 'popup-blocked'
  | 'unauthorized-domain'
  | 'storage-blocked'
  | 'redirect-incomplete'
  | 'in-app-browser'
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
    case 'redirect-incomplete':
      return 'Google sign-in didn’t finish. Open the site in Safari (not an in-app browser), turn off Private Browsing, and try again.';
    case 'in-app-browser':
      return 'Sign-in doesn’t work inside this app’s browser. Tap the menu (⋯) and choose “Open in Safari” or “Open in Browser”.';
    case 'network':
      return 'Network error — check your connection and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

/** Surface a failed redirect sign-in once auth has finished booting. */
export function bindRedirectAuthError(
  auth: AuthService,
  authError: WritableSignal<string | null>,
): void {
  void auth.authReady.then(() => {
    const reason = auth.redirectError();
    if (reason && reason !== 'popup-closed') {
      authError.set(describeSignInError(reason));
    }
  });
}

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|GSA\/|Snapchat/i.test(ua);
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
  private readonly _redirectError = signal<AuthErrorReason | null>(null);

  readonly user = this._user.asReadonly();
  readonly isResolving = computed(() => this._user() === undefined);
  readonly isSignedIn = computed(() => !!this._user());
  readonly uid = computed(() => this._user()?.uid ?? null);
  readonly displayName = computed(() => this._user()?.displayName ?? null);
  readonly email = computed(() => this._user()?.email ?? null);
  readonly photoURL = computed(() => this._user()?.photoURL ?? null);
  readonly redirectError = this._redirectError.asReadonly();

  /** Resolves once redirect handling and the initial auth state are ready. */
  readonly authReady: Promise<void>;

  constructor() {
    this.authReady = this.initAuth();

    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          void this.retryRedirectResult();
        }
      });
    }
  }

  /** Open Google sign-in. Mobile Safari uses redirect; desktop tries popup first. */
  async signInWithGoogle(): Promise<SignInResult> {
    this._redirectError.set(null);

    if (isInAppBrowser()) {
      return { ok: false, reason: 'in-app-browser' };
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (this.prefersRedirect()) {
      return this.signInWithRedirectFlow(provider);
    }

    try {
      const credential = await signInWithPopup(this.auth, provider);
      this._user.set(credential.user);
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
    clearRedirectPending();
    await signOut(this.auth);
  }

  private async initAuth(): Promise<void> {
    const pendingRedirect = hadPendingRedirect();

    try {
      const result = await getRedirectResultPromise();
      if (result?.user) {
        this._user.set(result.user);
        clearRedirectPending();
      } else if (pendingRedirect) {
        this._redirectError.set('redirect-incomplete');
        clearRedirectPending();
      }
    } catch (err: unknown) {
      const reason = this.classify(err);
      this._redirectError.set(reason);
      clearRedirectPending();
      console.warn('[AuthService] Redirect sign-in failed', err);
    }

    await new Promise<void>((resolve) => {
      let ready = false;
      onAuthStateChanged(this.auth, (user) => {
        this._user.set(user);
        if (!ready) {
          ready = true;
          resolve();
        }
      });
    });

    if (!this.isSignedIn() && pendingRedirect && !this._redirectError()) {
      this._redirectError.set('redirect-incomplete');
      clearRedirectPending();
    }
  }

  private async retryRedirectResult(): Promise<void> {
    if (this.isSignedIn()) {
      return;
    }

    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        this._user.set(result.user);
        clearRedirectPending();
        this._redirectError.set(null);
      }
    } catch (err: unknown) {
      const reason = this.classify(err);
      this._redirectError.set(reason);
      console.warn('[AuthService] Redirect retry failed', err);
    }
  }

  private async signInWithRedirectFlow(
    provider: GoogleAuthProvider,
  ): Promise<SignInResult> {
    try {
      markRedirectPending();
      await signInWithRedirect(this.auth, provider);
      return { ok: true, redirecting: true };
    } catch (err: unknown) {
      clearRedirectPending();
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
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : '';

    if (/missing initial state/i.test(message)) {
      return 'redirect-incomplete';
    }

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
