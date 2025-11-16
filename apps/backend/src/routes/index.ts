import { Router } from 'express';
import { authRouter } from './auth.js';
import { userRouter } from './users.js';
import { gamesRouter } from './games.js';
import { leaderboardRouter } from './leaderboard.js';
import { rewardsRouter } from './rewards.js';

export const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/games', gamesRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/rewards', rewardsRouter);
