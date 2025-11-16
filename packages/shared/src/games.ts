export enum GameType {
  CRASH_MASTER = 'crash_master',
  MINE_QUEST = 'mine_quest',
  DICE_HERO = 'dice_hero',
  LIMBO_LEAP = 'limbo_leap',
}

export const GAME_TYPES: GameType[] = [
  GameType.CRASH_MASTER,
  GameType.MINE_QUEST,
  GameType.DICE_HERO,
  GameType.LIMBO_LEAP,
];

export type GameResult = 'win' | 'loss' | 'cashout' | 'bust';

export interface GameConfig {
  minBet: number;
  maxBet: number;
  houseEdge: number;
  payoutCap?: number;
}

export interface GameSessionPayload<T extends GameType = GameType> {
  sessionId: string;
  userId: string;
  gameType: T;
  wager: number;
  startedAt: string;
  endedAt: string;
  result: Record<string, unknown>;
  payout: number;
}
