import { Router } from 'express';
import authRoutes from './auth.routes.js';
import songRoutes from './song.routes.js';
import albumRoutes from './album.routes.js';
import playlistRoutes from './playlist.routes.js';
import searchRoutes from './search.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/songs', songRoutes);
router.use('/albums', albumRoutes);
router.use('/playlists', playlistRoutes);
router.use('/search', searchRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
