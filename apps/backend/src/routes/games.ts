import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  playCrashGame,
  playMineQuest,
  playDiceHero,
  playLimboLeap,
  getGameHistory,
} from '../services/game-service.js';
import { GameType } from '@tokenrush/shared';

const router = Router();

const betSchema = z.object({
  betAmount: z.coerce.number().min(1).max(10_000),
});

const crashSchema = betSchema.extend({
  cashOutAt: z.coerce.number().min(1.1).max(100),
});

const mineQuestSchema = betSchema.extend({
  gridSize: z.coerce.number().int().min(3).max(8).default(5),
  mines: z.coerce.number().int().min(1).max(20).default(5),
  picks: z.coerce.number().int().min(1).max(20).default(5),
});

const diceHeroSchema = betSchema.extend({
  chosenNumber: z.coerce.number().int().min(1).max(6),
});

const limboSchema = betSchema.extend({
  targetMultiplier: z.coerce.number().min(1.2).max(50),
});

const historySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  gameType: z.nativeEnum(GameType).optional(),
});

router.use(authMiddleware);

router.post(
  '/crash',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { betAmount, cashOutAt } = crashSchema.parse(req.body);

    const result = await playCrashGame(userId, betAmount, cashOutAt);
    res.json(result);
  }),
);

router.post(
  '/minequest',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { betAmount, gridSize, mines, picks } = mineQuestSchema.parse(req.body);

    const result = await playMineQuest(userId, betAmount, gridSize, mines, picks);
    res.json(result);
  }),
);

router.post(
  '/dicehero',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { betAmount, chosenNumber } = diceHeroSchema.parse(req.body);

    const result = await playDiceHero(userId, betAmount, chosenNumber);
    res.json(result);
  }),
);

router.post(
  '/limboleap',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { betAmount, targetMultiplier } = limboSchema.parse(req.body);

    const result = await playLimboLeap(userId, betAmount, targetMultiplier);
    res.json(result);
  }),
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const params = historySchema.parse(req.query);

    const history = await getGameHistory(userId, params.gameType, params.limit, params.offset);
    res.json(history);
  }),
);

export { router as gamesRouter };
