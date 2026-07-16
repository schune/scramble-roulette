export interface OfficialRule {
  title: string;
  copy: string;
}

/** Cards that grant mulligans — show an in-round link to Rule #4. */
export const MULLIGAN_CARD_IDS = new Set([
  'standard-03', // Sandbagger's Mulligan
  'standard-13', // Mulligan Roulette
  'standard-15', // Reload
]);

export function isMulliganCard(cardId: string): boolean {
  return MULLIGAN_CARD_IDS.has(cardId);
}

export const OFFICIAL_GOLF_RULES: OfficialRule[] = [
  {
    title: 'Rule #1: Draw Before Teeing Off',
    copy: 'One card shall be drawn before the first shot on every hole. Once drawn, the card remains in effect for the duration of that hole and must be followed.',
  },
  {
    title: 'Rule #2: Team by Default',
    copy: 'Unless a card specifically references a single player, the card applies to the entire team.',
  },
  {
    title: 'Rule #3: Delayed Consumption',
    copy: 'If a drinking challenge cannot be immediately completed (ranger nearby, clubhouse proximity, etc.), it shall be completed at the first available opportunity.',
  },
  {
    title: 'Rule #4: Mulligan Commitment',
    copy: 'If a player elects to use a mulligan, the original shot is void the moment that choice is made — before the next shot is hit. The mulligan becomes the only playable ball.',
  },
  {
    title: 'Rule #5: Designated Driver Exemption',
    copy: 'The designated driver may be exempt from drinking challenges. Another player must drink in his place. The designated driver chooses the substitute.',
  },
  {
    title: 'Rule #6: Official Rulings',
    copy: 'If there are any questions about the rules, contact Luke or anyone in his group for an official ruling.',
  },
];

export const MULLIGAN_RULE = OFFICIAL_GOLF_RULES[3];
