export interface UserProfile {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  referralCode: string;
  referredBy?: string;
  balance: number;
  lifetimeEarned: number;
  streakCount: number;
  lastLoginAt: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username?: string;
  avatarUrl?: string;
  balance: number;
  lifetimeEarned: number;
  rank: number;
}
