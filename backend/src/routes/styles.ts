import { Router } from 'express';
import multer from 'multer';
import { uploadStyleHandler, getStyleHandler, deleteStyleHandler, getProfileHandler } from '../controllers/styles.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 } });

const router = Router();

router.get('/profile', getProfileHandler);
router.get('/current', getStyleHandler);
router.post('/upload', upload.single('file'), uploadStyleHandler);
router.delete('/current', deleteStyleHandler);

export default router;
