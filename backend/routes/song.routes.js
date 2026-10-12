import { Router } from 'express';
import {
  listSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
  likeSong,
  unlikeSong,
  recordPlay,
} from '../controllers/song.controller.js';
import { streamSong } from '../controllers/stream.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { songUpload, assertImageSize } from '../middleware/upload.js';

const router = Router();

router.get('/', listSongs);
router.get('/:id/stream', streamSong); // must be declared before "/:id"
router.get('/:id', getSong);

router.post('/', requireAuth, requireAdmin, songUpload, assertImageSize, createSong);
router.put('/:id', requireAuth, songUpload, assertImageSize, updateSong); // owner or admin (checked in controller)
router.delete('/:id', requireAuth, deleteSong);

router.post('/:id/like', requireAuth, likeSong);
router.delete('/:id/like', requireAuth, unlikeSong);
router.post('/:id/play', requireAuth, recordPlay);

export default router;
