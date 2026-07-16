import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getFirebaseApp, getFirebaseAuth } from './firebase-init';

/** The initialized Firebase app instance. */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
/** Firebase Authentication instance. */
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
/** Cloud Firestore instance (with offline persistence enabled). */
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');

function isIosDevice(): boolean {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Initializes Firebase once at bootstrap and exposes Auth + Firestore through
 * DI tokens so the rest of the app never imports the SDK directly (keeping the
 * modular Firebase surface confined to {@link AuthService} and
 * {@link FirestoreService}).
 *
 * Firestore is created with IndexedDB-backed persistent local cache, which
 * gives signed-in users offline reads/writes on the course — this is separate
 * from the guest `localStorage` store, so account data never leaks into the
 * shared guest cache.
 */
export function provideFirebase(): EnvironmentProviders {
  const app = getFirebaseApp();
  const auth = getFirebaseAuth();
  const firestore = initializeFirestore(app, {
    // Round/profile objects carry optional fields; drop `undefined` rather
    // than reject the write.
    ignoreUndefinedProperties: true,
    // iOS Safari can lose auth redirect state when Firestore grabs IndexedDB first.
    localCache: isIosDevice()
      ? persistentLocalCache()
      : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  return makeEnvironmentProviders([
    { provide: FIREBASE_APP, useValue: app },
    { provide: FIREBASE_AUTH, useValue: auth },
    { provide: FIRESTORE, useValue: firestore },
  ]);
}
