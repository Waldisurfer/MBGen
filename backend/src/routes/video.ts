import { Router } from 'express';
import {
  generateVideoHandler,
  issueVideoSSEToken,
  videoStatusSSE,
  instructVideoHandler,
  getVideoModelsHandler,
} from '../controllers/video.controller';
import { generationLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/models', getVideoModelsHandler);
router.post('/generate', generationLimiter, generateVideoHandler);
router.get('/sse-token/:generationId', issueVideoSSEToken);
router.get('/status/:generationId', videoStatusSSE);
router.post('/instruct', generationLimiter, instructVideoHandler);

export default router;
