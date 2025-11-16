export type AchievementCondition = 
  | { type: 'games_played'; count: number }
  | { type: 'games_won'; count: number }
  | { type: 'tokens_earned'; amount: number }
  | { type: 'multiplier_reached'; multiplier: number }
  | { type: 'referrals'; count: number };

export type RewardType = 'tokens' | 'badge' | 'special';

export interface AchievementDefinition {
  id: string;
  title: string;
  name?: string; // Alias for title for backward compatibility
  description: string;
  icon: string;
  active: boolean;
  rewardType: RewardType;
  rewardAmount?: number;
  condition: AchievementCondition;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}
