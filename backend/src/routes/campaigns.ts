import { Router } from 'express';
import multer from 'multer';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  getUploadUrl,
  uploadInspiration,
  parseStrategy,
} from '../controllers/campaigns.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', listCampaigns);
router.get('/upload-url', getUploadUrl);
router.post('/upload', upload.single('file'), uploadInspiration);
router.post('/parse-strategy', parseStrategy);
router.get('/:id', getCampaign);
router.post('/', createCampaign);

export default router;
