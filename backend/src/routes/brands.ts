import { Router } from 'express';
import { listBrands, createBrand, updateBrand, deleteBrand, markBrandUsed } from '../controllers/brands.controller';

const router = Router();

router.get('/', listBrands);
router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);
router.post('/:id/use', markBrandUsed);

export default router;
