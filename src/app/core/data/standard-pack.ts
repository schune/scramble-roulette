import { Card, CardPack } from '../models';

/** Default card pack for new rounds. */
export const STANDARD_PACK_ID = 'standard';

const cards: Card[] = [
  {
    id: 'standard-01',
    name: 'Team Mulligan',
    category: 'Helps',
    text: 'One mulligan for your whole team this hole — not one per player. Any teammate may use it on any shot from tee to green.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-02',
    name: 'Breakfast Ball',
    category: 'Helps',
    text: 'Each player gets one mulligan on their tee shot this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-03',
    name: 'Toe Cheese',
    category: 'Hurts',
    text: "Let's see who's got an athlete's foot — all putts must be kicked. No putters allowed.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-04',
    name: 'Worst Drive Counts',
    category: 'Hurts',
    text: "Your team's worst tee shot must be used.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-05',
    name: 'Scramble Jail',
    category: 'Hurts',
    text: 'The player whose shot is selected may not hit the next shot.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-06',
    name: 'No Putter',
    category: 'Hurts',
    text: 'Your team must putt with any club except a putter this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-07',
    name: 'Driver Putter',
    category: 'Hurts',
    text: 'All putts must be made with a driver.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-08',
    name: 'No Pressure',
    category: 'Hurts',
    text: "{{player}}'s tee shot must be used.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-09',
    name: 'Extra Tee',
    category: 'Helps',
    text: 'Your team hits two rounds of tee shots and picks the best ball before continuing the hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-10',
    name: 'Bag Swap',
    category: 'Hurts',
    text: "You cannot use your own clubs on this hole. Choose from any of your teammates' bags. Lefties are exempt.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-11',
    name: 'Happy Gilmore',
    category: 'Hurts',
    text: '{{player}} must use a Happy Gilmore run-up on their tee shot.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-12',
    name: 'Golden Goose',
    category: 'Helps',
    text: "{{player}} may hit from the front tees on this hole. Don't fuck it up.",
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-13',
    name: 'Mulligan Roulette',
    category: 'Helps',
    text: '{{player}} receives two mulligans on this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-14',
    name: 'Yeet',
    category: 'Helps',
    text: 'One player may pick up and throw the ball once this hole — no stroke added. Choose who throws and when.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-15',
    name: 'Reload',
    category: 'Helps',
    text: 'Everyone receives one mulligan on this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-16',
    name: 'Equal Rights',
    category: 'Helps',
    text: 'Everyone tees off from the front tees on this hole.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-17',
    name: 'Mulligan Bank',
    category: 'Helps',
    text: 'Your team gets three mulligans to use however you want this hole — split them or stack them on one swing.',
    packId: STANDARD_PACK_ID,
  },
  {
    id: 'standard-18',
    name: 'Pin Seeker',
    category: 'Helps',
    text: 'Your team may move the ball up to one club length closer to the hole once this hole.',
    packId: STANDARD_PACK_ID,
  },
];

export const STANDARD_PACK: CardPack = {
  id: STANDARD_PACK_ID,
  name: 'Standard Pack',
  cards,
};
