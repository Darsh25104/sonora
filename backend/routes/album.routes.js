import { Router } from 'express';
import {
  listAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from '../controllers/album.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { coverUpload, assertImageSize } from '../middleware/upload.js';

const router = Router();

router.get('/', listAlbums);
router.get('/:id', getAlbum);

router.post('/', requireAuth, requireAdmin, coverUpload, assertImageSize, createAlbum);
router.put('/:id', requireAuth, requireAdmin, coverUpload, assertImageSize, updateAlbum);
router.delete('/:id', requireAuth, requireAdmin, deleteAlbum);

export default router;
