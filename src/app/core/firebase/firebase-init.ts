import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  UserCredential,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getRedirectResult,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import { firebaseConfig, resolveAuthDomain } from './firebase.config';

const REDIRECT_PENDING_KEY = 'sr.auth.redirectPending';

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let redirectResultPromise: Promise<UserCredential | null> | undefined;

/**
 * Bootstrap Firebase Auth before Angular so iOS Safari can read redirect state
 * immediately on return from Google (before the router or Firestore touch storage).
 */
export function bootstrapFirebaseAuth(): {
  app: FirebaseApp;
  auth: Auth;
  redirectResult: Promise<UserCredential | null>;
} {
  if (!firebaseApp || !firebaseAuth || !redirectResultPromise) {
    firebaseApp = initializeApp({
      ...firebaseConfig,
      authDomain: resolveAuthDomain(),
    });
    firebaseAuth = initializeAuth(firebaseApp, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    redirectResultPromise = getRedirectResult(firebaseAuth);
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    redirectResult: redirectResultPromise,
  };
}

export function getFirebaseApp(): FirebaseApp {
  return bootstrapFirebaseAuth().app;
}

export function getFirebaseAuth(): Auth {
  return bootstrapFirebaseAuth().auth;
}

export function getRedirectResultPromise(): Promise<UserCredential | null> {
  return bootstrapFirebaseAuth().redirectResult;
}

export function markRedirectPending(): void {
  try {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
  } catch {
    // Private browsing — redirect may still work via IndexedDB.
  }
}

export function clearRedirectPending(): void {
  try {
    sessionStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    // Ignore.
  }
}

export function hadPendingRedirect(): boolean {
  try {
    return sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}
