/**
 * FAQ structured data for the home page. Mirrors the visible FAQ rendered in
 * `new-round.html` — the questions and answers must stay in sync so the markup
 * stays valid per Google's structured-data guidelines.
 */
export const HOME_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Scramble Roulette a good bachelor party golf game?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Scramble Roulette is a free golf bachelor party scramble game built for the occasion — the deck is loaded with dares, drinking challenges, and card-driven rules that turn an ordinary golf scramble into the highlight of the trip.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Scramble Roulette free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Scramble Roulette is completely free to play. There are no downloads and no account is required — just open the site on one phone per team and start drawing cards.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do you play the golf scramble card game?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Set up your team, pick 9 or 18 holes, and draw one card before every tee shot. The card sets the rules for that hole. Play scramble format golf, enter par and score, and the lowest team total wins the matchup.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many players do you need for Scramble Roulette?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each team needs at least two players and a classic foursome is perfect. Two teams play their own rounds and compete head-to-head, and you can track the rival team\u2019s live scores on the feed.',
      },
    },
  ],
};
