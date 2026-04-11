import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', issues: err.flatten() });
    return;
  }

  logger.error({ err }, '[Error] Unhandled exception');
  const status: number =
    typeof err.status === 'number'
      ? err.status
      : typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;
  const message: string = err.message ?? 'Internal server error';
  res.status(status).json({ error: message });
};
