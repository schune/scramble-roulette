export interface OfficialRule {
  title: string;
  copy: string;
}

/** Card id for Mulligan Roulette — shows an in-round link to mulligan rules. */
export const MULLIGAN_ROULETTE_CARD_ID = 'standard-13';

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
    copy: 'If a player elects to use a mulligan, the original shot is immediately void. The mulligan becomes the only playable ball.',
  },
  {
    title: 'Rule #5: Designated Driver Exemption',
    copy: 'The designated driver may be exempt from drinking challenges. Another player must drink in his place. The designated driver chooses the substitute.',
  },
];

export const MULLIGAN_RULE = OFFICIAL_GOLF_RULES[3];
