import { config } from 'dotenv';
import { resolve, dirname } from 'path';
// Explicit path works regardless of working directory (root vs workspace)
const envPath = resolve(dirname(require.resolve('../package.json')), '.env');
config({ path: envPath });
const _k = process.env.ANTHROPIC_API_KEY ?? '';
console.log('[ENV] .env path:', envPath);
console.log('[ENV] ANTHROPIC_API_KEY length:', _k.length, '| first 14:', JSON.stringify(_k.slice(0, 14)), '| last 4:', JSON.stringify(_k.slice(-4)));
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import campaignsRouter from './routes/campaigns';
import copyRouter from './routes/copy';
import imagesRouter from './routes/images';
import videoRouter from './routes/video';
import animationsRouter from './routes/animations';
import historyRouter from './routes/history';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5174',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

app.use('/api/campaigns', campaignsRouter);
app.use('/api/copy', copyRouter);
app.use('/api/images', imagesRouter);
app.use('/api/video', videoRouter);
app.use('/api/animations', animationsRouter);
app.use('/api/history', historyRouter);

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
      database:       !!process.env.DATABASE_URL,
    },
  });
});

app.use(errorHandler);

const port = parseInt(process.env.PORT ?? '3001', 10);
app.listen(port, () => {
  console.log(`[Backend] Running on http://localhost:${port}`);
});

export default app;
