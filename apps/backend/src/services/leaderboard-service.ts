import { supabase } from '../config/supabase.js';
import { GameType } from '@tokenrush/shared';

type Timeframe = 'all_time' | 'daily' | 'weekly' | 'monthly';
type Metric = 'tokens_earned' | 'games_played' | 'win_rate' | 'biggest_win';

export const getLeaderboard = async (
  gameType: GameType | 'all',
  timeframe: Timeframe = 'all_time',
  metric: Metric = 'tokens_earned',
  limit = 100,
  offset = 0,
) => {
  let query = supabase.rpc('get_leaderboard', {
    p_game_type: gameType,
    p_timeframe: timeframe,
    p_metric: metric,
    p_limit: limit,
    p_offset: offset,
  });

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch leaderboard', error);
    throw new Error('Failed to fetch leaderboard');
  }

  return data || [];
};

export const getUserRank = async (
  userId: string,
  gameType: GameType | 'all',
  timeframe: Timeframe = 'all_time',
  metric: Metric = 'tokens_earned',
) => {
  const { data, error } = await supabase.rpc('get_user_rank', {
    p_user_id: userId,
    p_game_type: gameType,
    p_timeframe: timeframe,
    p_metric: metric,
  });

  if (error) {
    console.error('Failed to get user rank', error);
    throw new Error('Failed to get user rank');
  }

  return data;
};

export const getGlobalStats = async () => {
  const { data, error } = await supabase.rpc('get_global_stats');

  if (error) {
    console.error('Failed to get global stats', error);
    throw new Error('Failed to get global stats');
  }

  return data;
};

export const getUserStats = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_user_stats', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to get user stats', error);
    throw new Error('Failed to get user stats');
  }

  return data;
};
