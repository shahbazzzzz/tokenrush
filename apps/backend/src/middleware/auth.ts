import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/http-error.js';
import { env } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    telegramId: number;
    username?: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw unauthorized('Missing authorization header');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Invalid authorization header');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = payload;
    next();
  } catch (error) {
    console.error('Failed to verify JWT', error);
    throw unauthorized('Invalid token');
  }
};
