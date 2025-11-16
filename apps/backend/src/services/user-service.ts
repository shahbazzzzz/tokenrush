import type { UserProfile } from '@tokenrush/shared';
import { supabase } from '../config/supabase.js';

export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to get user by id', error);
    return null;
  }

  return data as unknown as UserProfile;
};
