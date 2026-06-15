/** Canonical production URL — used for meta tags, sitemap, and structured data. */
export const SITE_URL = 'https://scrambleroulette.com';

export const SITE_NAME = 'Scramble Roulette';

export const DEFAULT_TITLE =
  'Scramble Roulette — Golf Scramble Card Game for Your Foursome';

export const DEFAULT_DESCRIPTION =
  'Scramble Roulette is a free golf scramble game that adds card-driven chaos to every hole. ' +
  'Draw cards before you tee off, track your scramble scorecard, and turn any golf outing into a party.';

export const DEFAULT_KEYWORDS = [
  'scramble roulette',
  'scramble golf game',
  'golf scramble',
  'golf scramble game',
  'scramble format golf',
  'golf card game',
  'golf party game',
  'scramble golf rules',
  'golf foursome game',
  'golf scorecard app',
].join(', ');

export const TWITTER_HANDLE = '@scrambleroulette';

export interface RouteSeo {
  title: string;
  description: string;
  keywords?: string;
  /** Path only, e.g. `/rules` — canonical is built from SITE_URL + path. */
  path: string;
  robots?: string;
  /** Optional JSON-LD object(s) merged into the page head on navigation. */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}
