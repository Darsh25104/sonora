import { Router } from 'express';
import { getStats } from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin); // role check for the whole /api/admin namespace

router.get('/stats', getStats);

export default router;
