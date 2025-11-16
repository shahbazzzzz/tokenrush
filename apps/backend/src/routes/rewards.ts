import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { claimDailyBonus } from '../services/token-service.js';
import {
  claimAdReward,
  getAchievementDefinitions,
  getReferralStats,
} from '../services/rewards-service.js';

const router = Router();

const adRewardSchema = z.object({
  provider: z.string().min(2).max(50),
  rewardAmount: z.coerce.number().int().min(1).max(10_000),
  referenceId: z.string().max(128).optional(),
});

router.use(authMiddleware);

router.get(
  '/achievements',
  asyncHandler(async (_req, res) => {
    res.json(getAchievementDefinitions());
  }),
);

router.post(
  '/daily/claim',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const result = await claimDailyBonus(userId);
    res.json(result);
  }),
);

router.get(
  '/referrals',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const stats = await getReferralStats(userId);
    res.json(stats);
  }),
);

router.post(
  '/ads/claim',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { provider, rewardAmount, referenceId } = adRewardSchema.parse(req.body);

    const result = await claimAdReward(userId, provider, rewardAmount, referenceId);
    res.json(result);
  }),
);

export { router as rewardsRouter };
