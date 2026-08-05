/** Canonical production URL — used for meta tags, sitemap, and structured data. */
export const SITE_URL = 'https://scrambleroulette.com';

export const SITE_NAME = 'Scramble Roulette';

export const DEFAULT_TITLE =
  'Scramble Roulette — Free Golf Bachelor Party Scramble Game';

export const DEFAULT_DESCRIPTION =
  'Scramble Roulette is a free golf bachelor party scramble game. Two teams draw wild card-driven ' +
  'rules and drinking challenges before every hole, play their own scramble round, and compete for the lowest score.';

export const DEFAULT_KEYWORDS = [
  'golf bachelor party scramble game',
  'bachelor party golf game',
  'free golf bachelor party game',
  'bachelor party golf scramble',
  'golf scramble drinking game',
  'golf bachelor party games',
  'scramble roulette',
  'golf scramble game',
  'scramble format golf',
  'golf card game',
  'golf party game',
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
