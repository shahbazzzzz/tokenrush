import { supabase } from '../config/supabase.js';
import { GameType, type GameResult, TokenSource } from '@tokenrush/shared';
import { addTokens } from './token-service.js';

type GameConfig = {
  minBet: number;
  maxBet: number;
  houseEdge: number;
};

const GAME_CONFIGS: Record<GameType, GameConfig> = {
  [GameType.CRASH_MASTER]: {
    minBet: 10,
    maxBet: 1000,
    houseEdge: 0.03,
  },
  [GameType.MINE_QUEST]: {
    minBet: 5,
    maxBet: 1000,
    houseEdge: 0.05,
  },
  [GameType.DICE_HERO]: {
    minBet: 1,
    maxBet: 1000,
    houseEdge: 0.02,
  },
  [GameType.LIMBO_LEAP]: {
    minBet: 20,
    maxBet: 1000,
    houseEdge: 0.04,
  },
};

export const createGameSession = async (
  userId: string,
  gameType: GameType,
  betAmount: number,
  gameData: Record<string, any>,
): Promise<{ sessionId: string }> => {
  const config = GAME_CONFIGS[gameType];

  if (betAmount < config.minBet || betAmount > config.maxBet) {
    throw new Error(`Bet amount must be between ${config.minBet} and ${config.maxBet}`);
  }

  const { data: session, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      game_type: gameType,
      bet_amount: betAmount,
      game_data: gameData,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create game session', error);
    throw new Error('Failed to create game session');
  }

  // Deduct bet amount from user's balance
  await addTokens(userId, -betAmount, TokenSource.GameBet, {
    gameType,
    sessionId: session.id,
  });

  return { sessionId: session.id };
};

export const finalizeGameSession = async (
  sessionId: string,
  result: GameResult,
  winAmount: number,
  gameData: Record<string, any>,
): Promise<void> => {
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .update({
      status: 'completed',
      result,
      win_amount: winAmount,
      ended_at: new Date().toISOString(),
      game_data: gameData,
    })
    .eq('id', sessionId)
    .select('user_id, game_type, bet_amount')
    .single();

  if (sessionError) {
    console.error('Failed to finalize game session', sessionError);
    throw new Error('Failed to finalize game session');
  }

  // Add winnings to user's balance if they won
  if (winAmount > 0) {
    await addTokens(session.user_id, winAmount, TokenSource.GameWin, {
      gameType: session.game_type,
      sessionId,
      betAmount: session.bet_amount,
    });
  }
};

// Game-specific logic
export const playCrashGame = async (
  userId: string,
  betAmount: number,
  cashOutAt: number,
): Promise<{ sessionId: string; multiplier: number; winAmount: number }> => {
  const session = await createGameSession(userId, GameType.CRASH_MASTER, betAmount, {
    cashOutAt,
  });

  const multiplier = Number((Math.random() * 10 + 1).toFixed(2));
  const crashedAt = Number((Math.random() * multiplier).toFixed(2));
  const didCashOut = multiplier >= cashOutAt;
  const winAmount = didCashOut ? Math.round(betAmount * cashOutAt) : 0;

  await finalizeGameSession(
    session.sessionId,
    didCashOut ? 'win' : 'loss',
    winAmount,
    { multiplier, crashedAt, cashOutAt },
  );

  return { sessionId: session.sessionId, multiplier, winAmount };
};

export const playMineQuest = async (
  userId: string,
  betAmount: number,
  gridSize: number,
  mines: number,
  picks: number,
): Promise<{ sessionId: string; cleared: number; winAmount: number }> => {
  const session = await createGameSession(userId, GameType.MINE_QUEST, betAmount, {
    gridSize,
    mines,
    picks,
  });

  const safeTiles = gridSize * gridSize - mines;
  const cleared = Math.min(picks, safeTiles);
  const successChance = safeTiles / (gridSize * gridSize);
  const winMultiplier = Number((1 + cleared * successChance).toFixed(2));
  const winAmount = Math.round(betAmount * winMultiplier);

  await finalizeGameSession(
    session.sessionId,
    cleared === picks ? 'win' : 'loss',
    winAmount,
    { gridSize, mines, picks, cleared, winMultiplier },
  );

  return { sessionId: session.sessionId, cleared, winAmount };
};

export const playDiceHero = async (
  userId: string,
  betAmount: number,
  chosenNumber: number,
): Promise<{ sessionId: string; rolled: number; winAmount: number }> => {
  if (chosenNumber < 1 || chosenNumber > 6) {
    throw new Error('Chosen number must be between 1 and 6');
  }

  const session = await createGameSession(userId, GameType.DICE_HERO, betAmount, {
    chosenNumber,
  });

  const rolled = Math.floor(Math.random() * 6) + 1;
  const didWin = rolled === chosenNumber;
  const winAmount = didWin ? betAmount * 5 : 0;

  await finalizeGameSession(
    session.sessionId,
    didWin ? 'win' : 'loss',
    winAmount,
    { chosenNumber, rolled },
  );

  return { sessionId: session.sessionId, rolled, winAmount };
};

export const playLimboLeap = async (
  userId: string,
  betAmount: number,
  targetMultiplier: number,
): Promise<{ sessionId: string; multiplier: number; winAmount: number }> => {
  if (targetMultiplier < 1.2) {
    throw new Error('Target multiplier must be at least 1.2x');
  }

  const session = await createGameSession(userId, GameType.LIMBO_LEAP, betAmount, {
    targetMultiplier,
  });

  const multiplier = Number((Math.random() * 10 + 1).toFixed(2));
  const didWin = multiplier >= targetMultiplier;
  const winAmount = didWin ? Math.round(betAmount * targetMultiplier) : 0;

  await finalizeGameSession(
    session.sessionId,
    didWin ? 'win' : 'loss',
    winAmount,
    { multiplier, targetMultiplier },
  );

  return { sessionId: session.sessionId, multiplier, winAmount };
};

export const getGameHistory = async (
  userId: string,
  gameType?: GameType,
  limit = 50,
  offset = 0,
) => {
  let query = supabase
    .from('game_sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (gameType) {
    query = query.eq('game_type', gameType);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Failed to fetch game history', error);
    throw new Error('Failed to fetch game history');
  }

  return { data, count };
};
