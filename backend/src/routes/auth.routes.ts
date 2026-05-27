import { Router } from 'express';
import {
  nabdaLogin,
  getInstanceInfo,
  selectInstance,
  getInstances,
  getBundles,
  logout,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/nabda/login', nabdaLogin);
router.get('/nabda/instance', requireAuth, getInstanceInfo);
router.post('/nabda/select-instance', requireAuth, selectInstance);
router.get('/nabda/instances', requireAuth, getInstances);
router.get('/nabda/bundles', requireAuth, getBundles);
router.post('/logout', requireAuth, logout);

export default router;
