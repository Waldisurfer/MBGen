import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[Error]', err);
  const status: number =
    typeof err.status === 'number'
      ? err.status
      : typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;
  const message: string = err.message ?? 'Internal server error';
  res.status(status).json({ error: message });
};
