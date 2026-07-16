/**
 * Public Firebase Web SDK configuration for the `scramble-roulette` project.
 *
 * These values are safe to commit: a Firebase web config contains public
 * project identifiers, not secrets. Access is governed by Firebase Auth and
 * Firestore security rules, not by hiding these keys. Retrieved via
 * `firebase apps:sdkconfig WEB`.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAXvP8a2zgVJ5XxsHrh9os_AXz4vi4ftYQ',
  authDomain: 'scramble-roulette.firebaseapp.com',
  projectId: 'scramble-roulette',
  storageBucket: 'scramble-roulette.firebasestorage.app',
  messagingSenderId: '862385883052',
  appId: '1:862385883052:web:9f93f366af1a34dbb81c09',
} as const;

const DEFAULT_AUTH_DOMAIN = firebaseConfig.authDomain;

/**
 * Hosts served from this Firebase project where auth must stay same-site.
 * Safari 16.1+ blocks redirect sign-in when authDomain differs from the app URL.
 */
const SAME_SITE_AUTH_HOSTS = new Set([
  'scrambleroulette.com',
  'www.scrambleroulette.com',
  'scramble-roulette.web.app',
  'scramble-roulette.firebaseapp.com',
]);

/** Match authDomain to the page host so Safari redirect sign-in can complete. */
export function resolveAuthDomain(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_AUTH_DOMAIN;
  }

  const host = window.location.hostname;
  return SAME_SITE_AUTH_HOSTS.has(host) ? host : DEFAULT_AUTH_DOMAIN;
}
