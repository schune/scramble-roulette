import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_TITLE, RouteSeo, SITE_NAME, SITE_URL } from './site-seo.constants';
import { RULES_FAQ_SCHEMA } from './rules-faq.schema';

const brand = SITE_NAME;

/** SEO metadata keyed by route path segment (without leading slash). */
export const ROUTE_SEO: Record<string, RouteSeo> = {
  '': {
    title: `${brand} — Free Golf Scramble Card Game`,
    description:
      'Start a golf scramble round in seconds. Add your foursome, draw a card before every tee shot, ' +
      'and let Scramble Roulette decide the rules for each hole of your scramble format golf outing.',
    keywords:
      'scramble golf game, golf scramble, scramble roulette, golf card game, scramble format golf, golf foursome, free golf game',
    path: '/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: brand,
      url: SITE_URL,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      description: DEFAULT_DESCRIPTION,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Golf scramble card draws before each hole',
        'Live golf scorecard with par and to-par tracking',
        '9- and 18-hole scramble format support',
        'Round history for your golf foursome',
      ],
    },
  },
  rules: {
    title: `Official Golf Scramble Rules — ${brand}`,
    description:
      'Read the official Scramble Roulette rules for your golf scramble game: draw before teeing off, ' +
      'team cards, mulligans, designated driver exemptions, and how to play this scramble format golf card game.',
    keywords:
      'scramble golf rules, golf scramble rules, scramble roulette rules, how to play scramble golf, golf card game rules',
    path: '/rules',
    structuredData: RULES_FAQ_SCHEMA,
  },
  profile: {
    title: `Golf Profile & Stats — ${brand}`,
    description:
      'Track your golf scramble stats — rounds played, holes logged, best to par, and clubhouse history ' +
      'from every Scramble Roulette outing with your foursome.',
    keywords: 'golf profile, scramble golf stats, golf round history, golf score tracking',
    path: '/profile',
  },
  'previous-rounds': {
    title: `Golf Scramble Round History — ${brand}`,
    description:
      'Revisit past golf scramble rounds — every hole, card draw, score, and champion moment from your ' +
      'Scramble Roulette history on the course.',
    keywords: 'golf round history, scramble golf history, past golf rounds, golf scorecard archive',
    path: '/previous-rounds',
  },
  scorecard: {
    title: `Golf Scramble Scorecard — ${brand}`,
    description:
      'View your live or completed golf scramble scorecard — hole-by-hole scores, par, to par, and the ' +
      'card that changed the round.',
    keywords: 'golf scorecard, scramble scorecard, golf scramble scoring',
    path: '/scorecard',
    robots: 'noindex, nofollow',
  },
  round: {
    title: `Live Golf Scramble Round — ${brand}`,
    description:
      'Play your active golf scramble round — draw cards, enter scores, and keep the foursome honest hole by hole.',
    keywords: 'live golf scramble, golf card game, scramble roulette round',
    path: '/round',
    robots: 'noindex, nofollow',
  },
};

export function seoForPath(urlPath: string): RouteSeo {
  const normalized = urlPath.split('?')[0];
  const segment = normalized.replace(/^\//, '');
  const canonicalPath = segment === '' ? '/' : `/${segment}`;

  if (segment === 'new-round' || segment === 'dashboard') {
    return ROUTE_SEO[''];
  }

  return (
    ROUTE_SEO[segment] ?? {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      path: canonicalPath,
    }
  );
}
