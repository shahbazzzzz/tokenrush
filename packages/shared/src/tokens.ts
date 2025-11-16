export enum TokenSource {
  GameBet = 'game_bet',
  GameWin = 'game_win',
  GameLoss = 'game_loss',
  DailyBonus = 'daily_bonus',
  Achievement = 'achievement',
  Referral = 'referral',
  AdReward = 'ad_reward',
  Withdrawal = 'withdrawal',
  ManualAdjustment = 'manual_adjustment',
}

export interface TokenTransaction {
  id: string;
  userId: string;
  source: TokenSource;
  amount: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WalletSummary {
  balance: number;
  lifetimeEarned: number;
}
