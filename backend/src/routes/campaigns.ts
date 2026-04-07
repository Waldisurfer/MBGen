import { Router } from 'express';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  getUploadUrl,
  parseStrategy,
} from '../controllers/campaigns.controller';

const router = Router();

router.get('/', listCampaigns);
router.get('/upload-url', getUploadUrl);
router.post('/parse-strategy', parseStrategy);
router.get('/:id', getCampaign);
router.post('/', createCampaign);

export default router;
