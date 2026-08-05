import { Card, CardPack } from '../models';

export const LUKES_BACHELOR_PACK_ID = 'bachelor';
export const LUKES_BACHELOR_PACK_NAME = 'Bachelor Pack';

export function isLukesBachelorPack(packId: string | undefined): boolean {
  return packId === LUKES_BACHELOR_PACK_ID;
}

const cards: Card[] = [
  {
    id: 'bachelor-01',
    name: 'Bro Has No Game',
    category: 'Hurts',
    text: 'The player with the lowest body count cannot contribute a tee shot. If two people tie, flip a tee.',
    packId: LUKES_BACHELOR_PACK_ID,
    noFirstHole: true,
  },
  {
    id: 'bachelor-02',
    name: 'Frat Star',
    category: 'Neutral',
    text: 'Everyone must finish their drink before the next hole. Optional for the DD.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-03',
    name: 'Toe Cheese',
    category: 'Hurts',
    text: "Let's see who's got an athlete's foot — all putts must be kicked. No putters allowed.",
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-04',
    name: 'Worst Drive Counts',
    category: 'Hurts',
    text: "Your team's worst tee shot must be used.",
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-05',
    name: 'Scramble Jail',
    category: 'Hurts',
    text: 'The player whose shot is selected may not hit the next shot.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-06',
    name: 'Team Building Exercise',
    category: 'Hurts',
    text: 'Every player must contribute at least one shot before the ball can be holed. If you hole out early, add one stroke to the score for each teammate who never got a swing.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-07',
    name: 'Driver Putter',
    category: 'Hurts',
    text: 'All putts must be made with a driver.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-08',
    name: 'No Pressure',
    category: 'Hurts',
    text: "{{player}}'s tee shot must be used.",
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-09',
    name: 'Cancel Me if You Can',
    category: 'Neutral',
    text: 'Say a slur before every shot. No repeats, we both know you have a lot to choose from.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-10',
    name: 'Bag Swap',
    category: 'Hurts',
    text: "You cannot use your own clubs on this hole. Choose from any of your teammates' bags. Lefties are exempt.",
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-11',
    name: 'Happy Gilmore',
    category: 'Hurts',
    text: '{{player}} must use a Happy Gilmore run-up on their tee shot.',
    packId: LUKES_BACHELOR_PACK_ID,
    noFirstHole: true,
  },
  {
    id: 'bachelor-12',
    name: 'Golden Goose',
    category: 'Helps',
    text: "{{player}} may hit from the front tees on this hole. Don't fuck it up.",
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-13',
    name: 'Mulligan Roulette',
    category: 'Helps',
    text: '{{player}} receives two mulligans on this hole.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-14',
    name: 'Yeet',
    category: 'Helps',
    text: 'One player may pick up and throw the ball once this hole — no stroke added. Choose who throws and when.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-15',
    name: 'Reload',
    category: 'Helps',
    text: 'Everyone receives one mulligan on this hole.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-16',
    name: 'Equal Rights',
    category: 'Helps',
    text: 'Everyone tees off from the front tees on this hole.',
    packId: LUKES_BACHELOR_PACK_ID,
  },
  {
    id: 'bachelor-17',
    name: 'Emergency Supplies',
    category: 'Neutral',
    text: 'Every player must retrieve the emergency beer from their bag and shotgun it before anyone tees off.',
    packId: LUKES_BACHELOR_PACK_ID,
    noFirstHole: true,
  },
  {
    id: 'bachelor-18',
    name: 'Fat Chud',
    category: 'Hurts',
    text: 'The heaviest player on the team must do 20 pushups before anyone tees off. If they cannot, add a stroke to your score.',
    packId: LUKES_BACHELOR_PACK_ID,
    noFirstHole: true,
  },
];

export const LUKES_BACHELOR_PACK: CardPack = {
  id: LUKES_BACHELOR_PACK_ID,
  name: LUKES_BACHELOR_PACK_NAME,
  cards,
};
