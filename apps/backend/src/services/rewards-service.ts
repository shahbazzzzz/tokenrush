import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { addTokens } from './token-service.js';
import { TokenSource, type AchievementDefinition, type RewardType } from '@tokenrush/shared';

// Achievement definitions
const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_win',
    title: 'First Win',
    name: 'First Win',
    description: 'Win your first game',
    icon: '🏆',
    active: true,
    rewardType: 'tokens',
    rewardAmount: 100,
    condition: { type: 'games_won', count: 1 },
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    name: 'High Roller',
    description: 'Win a game with a 10x multiplier or higher',
    icon: '🎲',
    active: true,
    rewardType: 'tokens',
    rewardAmount: 500,
    condition: { type: 'multiplier_reached', multiplier: 10 },
  },
  // Add more achievements as needed
];

export const getAchievementDefinitions = () => ACHIEVEMENTS;

export const checkAndGrantAchievement = async (
  userId: string,
  achievementId: string,
): Promise<{ granted: boolean; reward?: number }> => {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) {
    return { granted: false };
  }

  // Check if already granted
  const { data: existing, error: checkError } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .maybeSingle();

  if (checkError || existing) {
    return { granted: false };
  }

  // Record achievement
  const { error: grantError } = await supabase.from('user_achievements').insert({
    id: uuidv4(),
    user_id: userId,
    achievement_id: achievementId,
    granted_at: new Date().toISOString(),
  });

  if (grantError) {
    console.error('Failed to grant achievement', grantError);
    return { granted: false };
  }

  // Grant reward
  if (achievement.rewardType === 'tokens' && achievement.rewardAmount) {
    await addTokens(userId, achievement.rewardAmount, TokenSource.Achievement, {
      achievementId,
    });
  }

  return { granted: true, reward: achievement.rewardAmount };
};

export const getUserAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to get user achievements', error);
    throw new Error('Failed to get user achievements');
  }

  return data;
};

export const processReferral = async (userId: string, referralCode: string) => {
  // Get referrer by code
  const { data: referrer, error: refError } = await supabase
    .from('users')
    .select('id, telegram_username')
    .eq('referral_code', referralCode)
    .single();

  if (refError || !referrer) {
    throw new Error('Invalid referral code');
  }

  if (referrer.id === userId) {
    throw new Error('Cannot refer yourself');
  }

  // Check if already referred
  const { data: existing, error: checkError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_user_id', userId)
    .maybeSingle();

  if (checkError || existing) {
    throw new Error('Already used a referral code');
  }

  // Create referral record
  const { error: createError } = await supabase.from('referrals').insert({
    id: uuidv4(),
    referrer_id: referrer.id,
    referred_user_id: userId,
    referral_code: referralCode,
  });

  if (createError) {
    console.error('Failed to create referral', createError);
    throw new Error('Failed to process referral');
  }

  // Grant rewards (both referrer and referred user)
  const rewardAmount = 100; // Example reward amount
  await Promise.all([
    addTokens(referrer.id, rewardAmount, TokenSource.Referral, {
      referredUserId: userId,
      type: 'referrer',
    }),
    addTokens(userId, rewardAmount, TokenSource.Referral, {
      referrerId: referrer.id,
      type: 'referred',
    }),
  ]);

  return { success: true, rewardAmount };
};

export const getReferralStats = async (userId: string) => {
  const { count: totalReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId);

  const { data: activeReferrals } = await supabase
    .from('referrals')
    .select('*, users:referred_user_id(telegram_username, created_at)')
    .eq('referrer_id', userId);

  return {
    totalReferrals: totalReferrals || 0,
    activeReferrals: activeReferrals || [],
  };
};

export const claimAdReward = async (
  userId: string,
  provider: string,
  rewardAmount: number,
  referenceId?: string,
) => {
  if (rewardAmount <= 0) {
    throw new Error('Reward amount must be greater than zero');
  }

  const { error } = await supabase.from('ad_rewards').insert({
    id: uuidv4(),
    user_id: userId,
    provider,
    reward_amount: rewardAmount,
    reference_id: referenceId,
  });

  if (error) {
    console.error('Failed to record ad reward', error);
    throw new Error('Failed to claim ad reward');
  }

  await addTokens(userId, rewardAmount, TokenSource.AdReward, {
    provider,
    referenceId,
  });

  return { success: true, rewardAmount };
};
