import { Router } from 'express';
import {
  generateImageHandler,
  imageStatusHandler,
  instructImageHandler,
  generatePromptHandler,
  quickStatusHandler,
  getImageModelsHandler,
} from '../controllers/images.controller';
import { generationLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/models', getImageModelsHandler);
router.post('/generate', generationLimiter, generateImageHandler);
router.get('/status/:predictionId', imageStatusHandler);
router.post('/instruct', generationLimiter, instructImageHandler);
router.post('/generate-prompt', generationLimiter, generatePromptHandler);
router.get('/quick-status/:predictionId', quickStatusHandler);

export default router;
