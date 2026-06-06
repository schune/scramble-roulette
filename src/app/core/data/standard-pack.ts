import { Card, CardPack } from '../models';

/** Id for the first/default card pack. */
export const STANDARD_PACK_ID = 'standard';

/**
 * The "Standard" pack. All cards are equal rarity; category is cosmetic.
 * Card data is kept here so packs can be swapped/extended without touching
 * service logic.
 */
const cards: Card[] = [
  {
    id: 'standard-01',
    name: 'Bro Has No Game',
    category: 'Punishment',
    text: 'The player with the lowest body count cannot contribute a shot on this hole. If two people tie, flip a tee.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-02',
    name: 'The Beer Hole',
    category: 'Drinking',
    text: 'Everyone must finish their drink before the next hole. Optional for the DD.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-03',
    name: 'Beer Cart Mulligan',
    category: 'Strategy',
    text: 'The highest handicap player receives one mulligan on this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-04',
    name: 'Worst Drive Counts',
    category: 'Team Chaos',
    text: 'Your worst drive must be used.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-05',
    name: 'Scramble Jail',
    category: 'Strategy',
    text: 'The player whose shot is selected may not hit the next shot.',
    flavor: "No carrying the squad today, Tiger.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-06',
    name: 'Team Building Exercise',
    category: 'Strategy',
    text: 'Every player must contribute one shot before the ball can be holed.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-07',
    name: 'Driver Putter',
    category: 'Random',
    text: 'All putts must be made with a driver.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-08',
    name: 'Wheelman',
    category: 'Team Chaos',
    text: "Stand in a circle and toss a tee. Whoever the tee points to must have his drive used.",
    flavor: "Pray he's loose.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-09',
    name: 'Chirp Check',
    category: 'Random',
    text: 'Everyone must roast another player before teeing off. No repeat chirps.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-10',
    name: 'Bag Swap',
    category: 'Random',
    text: "You cannot use your own clubs on this hole. Choose from any of your teammates' bags.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-11',
    name: 'Happy Gilmore',
    category: 'Punishment',
    text: 'Stand in a circle and toss a tee. Whoever it points to must use a Happy Gilmore run-up on their tee shot.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-12',
    name: 'Hero Ball',
    category: 'Strategy',
    text: "Whoever's drive is selected must also hit the approach shot.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-13',
    name: 'Mulligan Roulette',
    category: 'Strategy',
    text: 'Stand in a circle and toss a tee. Whoever it points to receives two mulligans on this hole.',
    flavor: 'Use them wisely.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-14',
    name: 'The Closer',
    category: 'Strategy',
    text: 'Stand in a circle and toss a tee. Whoever the tee points to is the only player who may putt on this hole.',
    flavor: "We're all counting on you.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-15',
    name: 'Reload',
    category: 'Strategy',
    text: 'Everyone receives one mulligan on this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-16',
    name: 'Equal Rights',
    category: 'Random',
    text: 'Everyone tees off from the front tees on this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-17',
    name: 'Emergency Supplies',
    category: 'Drinking',
    text: 'Every player must retrieve the emergency beer from his bag and shotgun it before anyone tees off.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-18',
    name: 'Hit the Gym',
    category: 'Punishment',
    text: 'The heaviest player on the team must do 20 pushups before anyone tees off. If they cannot, add a stroke to your score.',
    packId: STANDARD_PACK_ID,
  },
];

export const STANDARD_PACK: CardPack = {
  id: STANDARD_PACK_ID,
  name: 'Standard',
  cards,
};
