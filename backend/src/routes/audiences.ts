import { Router } from 'express';
import { listAudiences, createAudience, updateAudience, deleteAudience, markAudienceUsed } from '../controllers/audiences.controller';

const router = Router();

router.get('/', listAudiences);
router.post('/', createAudience);
router.put('/:id', updateAudience);
router.delete('/:id', deleteAudience);
router.post('/:id/use', markAudienceUsed);

export default router;
