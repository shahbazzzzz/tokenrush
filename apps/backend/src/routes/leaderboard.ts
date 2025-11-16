import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getLeaderboard, getUserRank, getGlobalStats, getUserStats } from '../services/leaderboard-service.js';
import { GameType } from '@tokenrush/shared';

const router = Router();

const timeframeEnum = z.enum(['all_time', 'daily', 'weekly', 'monthly']);
const metricEnum = z.enum(['tokens_earned', 'games_played', 'win_rate', 'biggest_win']);

const leaderboardQuerySchema = z.object({
  gameType: z.union([z.nativeEnum(GameType), z.literal('all')]).default('all'),
  timeframe: timeframeEnum.default('all_time'),
  metric: metricEnum.default('tokens_earned'),
  limit: z.coerce.number().min(1).max(200).default(100),
  offset: z.coerce.number().min(0).default(0),
});

const rankQuerySchema = z.object({
  gameType: z.union([z.nativeEnum(GameType), z.literal('all')]).default('all'),
  timeframe: timeframeEnum.default('all_time'),
  metric: metricEnum.default('tokens_earned'),
});

router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = leaderboardQuerySchema.parse(req.query);
    const data = await getLeaderboard(params.gameType, params.timeframe, params.metric, params.limit, params.offset);
    res.json(data);
  }),
);

router.get(
  '/rank',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const params = rankQuerySchema.parse(req.query);
    const data = await getUserRank(userId, params.gameType, params.timeframe, params.metric);
    res.json(data);
  }),
);

router.get(
  '/stats/global',
  asyncHandler(async (_req, res) => {
    const stats = await getGlobalStats();
    res.json(stats);
  }),
);

router.get(
  '/stats/me',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const stats = await getUserStats(userId);
    res.json(stats);
  }),
);

export { router as leaderboardRouter };
