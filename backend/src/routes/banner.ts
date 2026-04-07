import { Router } from 'express';
import { generationLimiter } from '../middleware/rateLimiter';
import { suggestBannerContent } from '../controllers/banner.controller';

const router = Router();
router.post('/suggest', generationLimiter, suggestBannerContent);
export default router;
