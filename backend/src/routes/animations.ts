import { Router } from 'express';
import {
  generateAnimationHandler,
  instructAnimationHandler,
} from '../controllers/animations.controller';
import { generationLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/generate', generationLimiter, generateAnimationHandler);
router.post('/instruct', generationLimiter, instructAnimationHandler);

export default router;
