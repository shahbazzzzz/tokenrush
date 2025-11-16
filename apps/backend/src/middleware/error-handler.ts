import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  const error = err as Error;
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
};
