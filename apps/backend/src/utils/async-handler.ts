import type { NextFunction, Request, Response } from 'express';

type Handler<TRequest extends Request = Request, TResponse extends Response = Response> = (
  req: TRequest,
  res: TResponse,
  next: NextFunction,
) => Promise<unknown> | unknown;

export const asyncHandler = <TRequest extends Request = Request, TResponse extends Response = Response>(
  handler: Handler<TRequest, TResponse>,
) =>
  (req: TRequest, res: TResponse, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
