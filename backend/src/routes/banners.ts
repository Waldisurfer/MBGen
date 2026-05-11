import { Router } from 'express';
import { listBanners, updateBanner, deleteBanner, getBannerLineage } from '../controllers/banners.controller';

const router = Router();

router.get('/', listBanners);
router.get('/:id/lineage', getBannerLineage);
router.patch('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
