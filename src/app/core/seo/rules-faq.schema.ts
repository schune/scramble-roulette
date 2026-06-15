/** FAQ structured data for the official rules page. */
export const RULES_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Rule #1: Draw Before Teeing Off',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'One card shall be drawn before the first shot on every hole. Once drawn, the card remains in effect for the duration of that hole and must be followed.',
      },
    },
    {
      '@type': 'Question',
      name: 'Rule #2: Team by Default',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Unless a card specifically references a single player, the card applies to the entire team.',
      },
    },
    {
      '@type': 'Question',
      name: 'Rule #3: Designated Driver Exemption',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The designated driver may be exempt from drinking challenges. Another player must drink in his place. The designated driver chooses the substitute.',
      },
    },
    {
      '@type': 'Question',
      name: 'Rule #4: Mulligan Commitment',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If a player elects to use a mulligan, the original shot is immediately void. The mulligan becomes the only playable ball.',
      },
    },
    {
      '@type': 'Question',
      name: 'Rule #5: Delayed Consumption',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If a drinking challenge cannot be immediately completed (ranger nearby, clubhouse proximity, etc.), it shall be completed at the first available opportunity.',
      },
    },
  ],
};
