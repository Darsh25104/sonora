import { Router } from 'express';
import { getLikedSongs, getRecentlyPlayed } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/me/liked', getLikedSongs);
router.get('/me/recently-played', getRecentlyPlayed);

export default router;
