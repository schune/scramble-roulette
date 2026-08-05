import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_TITLE, RouteSeo, SITE_NAME, SITE_URL } from './site-seo.constants';
import { RULES_FAQ_SCHEMA } from './rules-faq.schema';
import { HOME_FAQ_SCHEMA } from './home-faq.schema';

const brand = SITE_NAME;

/** SEO metadata keyed by route path segment (without leading slash). */
export const ROUTE_SEO: Record<string, RouteSeo> = {
  '': {
    title: `Free Golf Bachelor Party Scramble Game — ${brand}`,
    description:
      'The free golf bachelor party scramble game. Two teams draw wild card-driven rules and drinking ' +
      'challenges before every tee shot, play their own scramble round, and compete head-to-head for the lowest score.',
    keywords:
      'golf bachelor party scramble game, bachelor party golf game, free golf bachelor party game, bachelor party golf scramble, golf scramble drinking game, golf scramble game, scramble roulette, golf card game',
    path: '/',
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: brand,
        alternateName: 'Golf Bachelor Party Scramble Game',
        url: SITE_URL,
        applicationCategory: 'GameApplication',
        applicationSubCategory: 'Golf Bachelor Party Game',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        description: DEFAULT_DESCRIPTION,
        keywords:
          'golf bachelor party scramble game, bachelor party golf game, golf scramble drinking game, scramble format golf',
        audience: {
          '@type': 'Audience',
          audienceType: 'Bachelor parties and golf outings',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Free golf bachelor party scramble game',
          'Card-driven dares and drinking challenges each hole',
          'Team vs team golf scramble competition',
          'Live golf scorecard with par and to-par tracking',
          "Follow rival teams' live scores on the feed",
          '9- and 18-hole scramble format support',
        ],
      },
      HOME_FAQ_SCHEMA,
    ],
  },
  rules: {
    title: `Golf Bachelor Party Scramble Rules — ${brand}`,
    description:
      'The official rules for Scramble Roulette, the golf bachelor party scramble game: draw before teeing off, ' +
      'team cards, mulligans, designated driver exemptions, and drinking challenges hole by hole.',
    keywords:
      'golf bachelor party scramble rules, scramble golf rules, golf scramble drinking game rules, scramble roulette rules, how to play scramble golf',
    path: '/rules',
    structuredData: RULES_FAQ_SCHEMA,
  },
  profile: {
    title: `Golf Profile & Stats — ${brand}`,
    description:
      "Track your team's golf scramble stats — rounds played, holes logged, best to par, and clubhouse " +
      'history from every head-to-head Scramble Roulette matchup.',
    keywords: 'golf profile, scramble golf stats, golf round history, golf score tracking',
    path: '/profile',
  },
  feed: {
    title: `Live Golf Feed — ${brand}`,
    description:
      'Scout the competition in real time. See every rival team\'s live scramble round and posted ' +
      'scorecard on Scramble Roulette — track who\'s winning while you\'re on the course.',
    keywords: 'live golf scores, scramble golf feed, golf leaderboard, golf scoreboard, team golf competition',
    path: '/feed',
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
      "Play your team's active golf scramble round — draw cards, enter scores, and race the rival team hole by hole.",
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
