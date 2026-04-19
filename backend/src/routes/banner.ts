import { Router } from 'express';
import { generationLimiter } from '../middleware/rateLimiter';
import { suggestBannerContent, generateBannerVariations, createBanners } from '../controllers/banner.controller';

const router = Router();
router.post('/suggest',  generationLimiter, suggestBannerContent);
router.post('/generate', generationLimiter, generateBannerVariations);
router.post('/create',   generationLimiter, createBanners);
export default router;
