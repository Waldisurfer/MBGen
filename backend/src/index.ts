import { config } from 'dotenv';
import { resolve, dirname } from 'path';
// Explicit path works regardless of working directory (root vs workspace)
const envPath = resolve(dirname(require.resolve('../package.json')), '.env');
config({ path: envPath });

import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV ?? 'development' });
}

import { logger } from './lib/logger';
logger.debug({ envPath }, '[ENV] loaded dotenv');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import campaignsRouter from './routes/campaigns';
import copyRouter from './routes/copy';
import imagesRouter from './routes/images';
import videoRouter from './routes/video';
import animationsRouter from './routes/animations';
import historyRouter from './routes/history';
import bannerRouter from './routes/banner';
import adminRouter from './routes/admin';
import stylesRouter from './routes/styles';
import brandsRouter from './routes/brands';
import audiencesRouter from './routes/audiences';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

app.set('trust proxy', 1); // Render (and most PaaS) sit behind a reverse proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.FRONTEND_URL ?? 'http://localhost:5174';
      if (!origin || origin === allowed || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({ logger }));
app.use(rateLimiter);

// Auth required on all /api routes except /api/health
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  return authMiddleware(req, res, next);
});

app.use('/api/campaigns', campaignsRouter);
app.use('/api/copy', copyRouter);
app.use('/api/images', imagesRouter);
app.use('/api/video', videoRouter);
app.use('/api/animations', animationsRouter);
app.use('/api/history', historyRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/styles', stylesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/audiences', audiencesRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      anthropic:      !!process.env.ANTHROPIC_API_KEY,
      replicate:      !!process.env.REPLICATE_API_KEY,
      googleAiStudio: !!process.env.GOOGLE_GENAI_API_KEY,
      googleVertexAi: !!(process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_APPLICATION_CREDENTIALS),
      r2:             !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_PUBLIC_URL
      ),
      database:       !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-DB-PASSWORD]')),
    },
  });
});

app.use(errorHandler);

const port = parseInt(process.env.PORT ?? '3001', 10);
app.listen(port, () => {
  logger.info({ port }, '[Backend] Server started');
});

export default app;
