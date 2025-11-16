import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { TokenSource } from '@tokenrush/shared';

export const addTokens = async (
  userId: string,
  amount: number,
  source: TokenSource,
  metadata: Record<string, any> = {},
): Promise<{ newBalance: number }> => {
  if (amount === 0) {
    return { newBalance: await getUserBalance(userId) };
  }

  const { data, error } = await supabase.rpc('update_user_tokens', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error('Failed to update user tokens', error);
    throw new Error('Failed to update user tokens');
  }

  // Record the transaction
  await recordTokenTransaction(userId, amount, source, metadata);

  return { newBalance: data };
};

export const getUserBalance = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('users')
    .select('token_balance')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to get user balance', error);
    throw new Error('Failed to get user balance');
  }

  return data.token_balance || 0;
};

const recordTokenTransaction = async (
  userId: string,
  amount: number,
  source: TokenSource,
  metadata: Record<string, any> = {},
): Promise<void> => {
  const { error } = await supabase.from('token_transactions').insert({
    id: uuidv4(),
    user_id: userId,
    amount,
    source,
    metadata,
  });

  if (error) {
    console.error('Failed to record token transaction', error);
    // Don't throw here as the tokens were already updated
    // Log to error tracking service
  }
};

export const getTransactionHistory = async (
  userId: string,
  limit = 50,
  offset = 0,
  source?: TokenSource,
) => {
  let query = supabase
    .from('token_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (source) {
    query = query.eq('source', source);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch transaction history', error);
    throw new Error('Failed to fetch transaction history');
  }

  return { data, count };
};

// Daily bonus logic
export const claimDailyBonus = async (
  userId: string,
): Promise<{ amount: number; streakDays: number }> => {
  const { data, error } = await supabase.rpc('claim_daily_bonus', {
    p_user_id: userId,
  });

  if (error || !data) {
    console.error('Failed to claim daily bonus', error);
    throw new Error('Failed to claim daily bonus');
  }

  const amount = Number(data.amount ?? 0);
  const streakDays = Number(data.streak_days ?? 1);

  if (amount > 0) {
    await addTokens(userId, amount, TokenSource.DailyBonus, {
      streakDays,
    });
  }

  return { amount, streakDays };
};
