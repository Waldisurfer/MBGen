import { Router, Request, Response, NextFunction } from 'express';
import {
  listUsersHandler,
  resetUserSpendHandler,
  setUserRoleHandler,
  setUserStatusHandler,
  listGenerationsHandler,
} from '../controllers/admin.controller';

function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

const router = Router();
router.use(adminOnly);

router.get('/users', listUsersHandler);
router.post('/users/:id/reset-spend', resetUserSpendHandler);
router.post('/users/:id/role', setUserRoleHandler);
router.post('/users/:id/status', setUserStatusHandler);
router.get('/generations', listGenerationsHandler);

export default router;
