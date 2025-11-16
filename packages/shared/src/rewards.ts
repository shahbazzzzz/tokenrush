import type { GameType } from './games.js';

export interface DailyRewardConfig {
  day: number;
  amount: number;
}

export interface ReferralRewardConfig {
  inviterBonus: number;
  inviteeBonus: number;
}

export interface AchievementReward {
  achievementId: string;
  amount: number;
}

export interface GameRewardResult {
  sessionId: string;
  userId: string;
  gameType: GameType;
  wager: number;
  payout: number;
  tokenDelta: number;
}
