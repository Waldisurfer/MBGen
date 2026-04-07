import { Router } from 'express';
import { generateCopyHandler, instructCopyHandler } from '../controllers/copy.controller';
import { generationLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/generate', generationLimiter, generateCopyHandler);
router.post('/instruct', generationLimiter, instructCopyHandler);

export default router;
